"""
Placify AI - Authentication Module
JWT auth with refresh sessions, password login/register, and OAuth providers.
"""

import hashlib
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlencode

import bcrypt
import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, field_validator

try:
    from .database import get_db
except ImportError:
    from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("PLACIFY_SECRET_KEY", "placify-ai-secret-key-change-this-in-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
OAUTH_STATE_EXPIRE_MINUTES = int(os.getenv("OAUTH_STATE_EXPIRE_MINUTES", "10"))
REFRESH_COOKIE_NAME = "placify_refresh_token"
OAUTH_STATE_COOKIE_NAME = "placify_oauth_state"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")
EMAIL_PATTERN = re.compile(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$", re.IGNORECASE)

security = HTTPBearer(auto_error=False)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def as_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValueError("Enter a valid email address")
    return email


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_token(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def is_secure_cookie() -> bool:
    secure_flag = os.getenv("COOKIE_SECURE")
    if secure_flag is not None:
        return secure_flag.strip().lower() in {"1", "true", "yes", "on"}
    return FRONTEND_URL.startswith("https://") or BACKEND_URL.startswith("https://")


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def build_redirect_uri(provider: str) -> str:
    custom = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    if custom:
        return custom
    return f"{BACKEND_URL}/api/auth/oauth/{provider}/callback"


def create_access_token(user_id: str, session_id: str) -> str:
    expire = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "sid": session_id,
        "type": "access",
        "exp": expire,
        "iat": now_utc(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_oauth_state(provider: str) -> str:
    payload = {
        "provider": provider,
        "nonce": secrets.token_urlsafe(12),
        "exp": now_utc() + timedelta(minutes=OAUTH_STATE_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_oauth_state(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state") from exc
    return payload


def parse_refresh_token(refresh_token: str) -> tuple[str, str]:
    if not refresh_token or "." not in refresh_token:
        raise HTTPException(status_code=401, detail="Invalid session")
    session_id, secret = refresh_token.split(".", 1)
    if not session_id or not secret:
        raise HTTPException(status_code=401, detail="Invalid session")
    return session_id, secret


def get_provider_config(provider: str) -> dict:
    if provider == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise HTTPException(status_code=503, detail="Google authentication is not configured")
        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
            "scopes": ["openid", "email", "profile"],
        }

    if provider == "github":
        client_id = os.getenv("GITHUB_CLIENT_ID")
        client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise HTTPException(status_code=503, detail="GitHub authentication is not configured")
        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "authorize_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "userinfo_url": "https://api.github.com/user",
            "emails_url": "https://api.github.com/user/emails",
            "scopes": ["read:user", "user:email"],
        }

    raise HTTPException(status_code=404, detail="Unsupported OAuth provider")


def fetch_google_profile(code: str, state: str) -> dict:
    config = get_provider_config("google")
    redirect_uri = build_redirect_uri("google")

    try:
        with httpx.Client(timeout=20.0) as client:
            token_res = client.post(
                config["token_url"],
                data={
                    "code": code,
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if token_res.status_code >= 400:
                raise HTTPException(status_code=400, detail="Google sign-in failed during token exchange")

            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="Google sign-in failed: missing access token")

            profile_res = client.get(
                config["userinfo_url"],
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if profile_res.status_code >= 400:
                raise HTTPException(status_code=400, detail="Google sign-in failed while loading profile")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Google sign-in failed due to a network error") from exc

    profile = profile_res.json()
    email = profile.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not provide an email address")
    if profile.get("email_verified") is False:
        raise HTTPException(status_code=400, detail="Google account email is not verified")

    return {
        "provider": "google",
        "provider_user_id": str(profile.get("sub")),
        "email": normalize_email(email),
        "name": profile.get("name") or email.split("@")[0],
        "username": profile.get("given_name") or profile.get("name") or email.split("@")[0],
        "avatar_url": profile.get("picture"),
        "raw_profile": profile,
    }


def fetch_github_profile(code: str, state: str) -> dict:
    config = get_provider_config("github")
    redirect_uri = build_redirect_uri("github")

    try:
        with httpx.Client(timeout=20.0, headers={"Accept": "application/json", "User-Agent": "Placify-AI"}) as client:
            token_res = client.post(
                config["token_url"],
                data={
                    "code": code,
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "redirect_uri": redirect_uri,
                    "state": state,
                },
            )
            if token_res.status_code >= 400:
                raise HTTPException(status_code=400, detail="GitHub sign-in failed during token exchange")

            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="GitHub sign-in failed: missing access token")

            headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json", "User-Agent": "Placify-AI"}
            profile_res = client.get(config["userinfo_url"], headers=headers)
            if profile_res.status_code >= 400:
                raise HTTPException(status_code=400, detail="GitHub sign-in failed while loading profile")
            profile = profile_res.json()

            emails_res = client.get(config["emails_url"], headers=headers)
            emails = emails_res.json() if emails_res.status_code < 400 else []
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="GitHub sign-in failed due to a network error") from exc

    email = profile.get("email")
    if not email:
        primary_verified = next((item.get("email") for item in emails if item.get("primary") and item.get("verified")), None)
        verified = next((item.get("email") for item in emails if item.get("verified")), None)
        email = primary_verified or verified

    if not email:
        raise HTTPException(status_code=400, detail="GitHub account must expose at least one verified email address")

    return {
        "provider": "github",
        "provider_user_id": str(profile.get("id")),
        "email": normalize_email(email),
        "name": profile.get("name") or profile.get("login") or email.split("@")[0],
        "username": profile.get("login") or email.split("@")[0],
        "avatar_url": profile.get("avatar_url"),
        "raw_profile": profile,
    }


def fetch_oauth_profile(provider: str, code: str, state: str) -> dict:
    if provider == "google":
        return fetch_google_profile(code, state)
    if provider == "github":
        return fetch_github_profile(code, state)
    raise HTTPException(status_code=404, detail="Unsupported OAuth provider")


def serialize_user(user: dict) -> dict:
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "avatar_url": user.get("avatar_url"),
    }


def create_session(user_id: str, request: Request, auth_source: str) -> tuple[str, str]:
    db = get_db()
    session_id = str(uuid.uuid4())
    refresh_secret = secrets.token_urlsafe(48)
    current_time = now_utc()

    db.sessions.insert_one({
        "_id": session_id,
        "user_id": user_id,
        "refresh_token_hash": hash_token(refresh_secret),
        "auth_source": auth_source,
        "ip_address": get_client_ip(request),
        "user_agent": request.headers.get("user-agent", "unknown"),
        "created_at": current_time,
        "updated_at": current_time,
        "last_used_at": current_time,
        "expires_at": current_time + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "revoked_at": None,
    })

    return session_id, f"{session_id}.{refresh_secret}"


def load_session_from_refresh_token(refresh_token: str) -> dict:
    session_id, refresh_secret = parse_refresh_token(refresh_token)
    db = get_db()
    session = db.sessions.find_one({"_id": session_id})

    if not session:
        raise HTTPException(status_code=401, detail="Session not found")
    if session.get("revoked_at") is not None:
        raise HTTPException(status_code=401, detail="Session has been revoked")
    if as_utc_datetime(session["expires_at"]) <= now_utc():
        raise HTTPException(status_code=401, detail="Session has expired")
    if hash_token(refresh_secret) != session.get("refresh_token_hash"):
        raise HTTPException(status_code=401, detail="Invalid session token")

    return session


def rotate_session(session: dict, request: Request) -> str:
    db = get_db()
    new_secret = secrets.token_urlsafe(48)
    current_time = now_utc()

    db.sessions.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "refresh_token_hash": hash_token(new_secret),
                "updated_at": current_time,
                "last_used_at": current_time,
                "expires_at": current_time + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
                "ip_address": get_client_ip(request),
                "user_agent": request.headers.get("user-agent", "unknown"),
            }
        },
    )

    return f"{session['_id']}.{new_secret}"


def revoke_session_by_id(session_id: str) -> None:
    db = get_db()
    db.sessions.update_one(
        {"_id": session_id, "revoked_at": None},
        {"$set": {"revoked_at": now_utc(), "updated_at": now_utc()}},
    )


def revoke_session_from_cookie(refresh_token: str | None) -> None:
    if not refresh_token:
        return
    try:
        session_id, _ = parse_refresh_token(refresh_token)
    except HTTPException:
        return
    revoke_session_by_id(session_id)


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_secure_cookie(),
        samesite="lax",
        max_age=max_age,
        path="/api/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth",
        httponly=True,
        secure=is_secure_cookie(),
        samesite="lax",
    )


def set_oauth_state_cookie(response: Response, state: str) -> None:
    response.set_cookie(
        key=OAUTH_STATE_COOKIE_NAME,
        value=state,
        httponly=True,
        secure=is_secure_cookie(),
        samesite="lax",
        max_age=OAUTH_STATE_EXPIRE_MINUTES * 60,
        path="/api/auth",
    )


def clear_oauth_state_cookie(response: Response) -> None:
    response.delete_cookie(
        key=OAUTH_STATE_COOKIE_NAME,
        path="/api/auth",
        httponly=True,
        secure=is_secure_cookie(),
        samesite="lax",
    )


def upsert_password_user(name: str, email: str, password: str) -> dict:
    db = get_db()

    if db.users.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    current_time = now_utc()
    user_doc = {
        "_id": user_id,
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "avatar_url": None,
        "auth_methods": ["password"],
        "oauth_accounts": {},
        "created_at": current_time,
        "updated_at": current_time,
        "last_login_at": current_time,
    }
    db.users.insert_one(user_doc)
    return user_doc


def update_last_login(user_id: str) -> None:
    db = get_db()
    db.users.update_one(
        {"_id": user_id},
        {"$set": {"last_login_at": now_utc(), "updated_at": now_utc()}},
    )


def upsert_oauth_user(profile: dict) -> dict:
    db = get_db()
    provider = profile["provider"]
    account_key = f"oauth_accounts.{provider}.provider_user_id"
    user = db.users.find_one({account_key: profile["provider_user_id"]})

    if not user:
        user = db.users.find_one({"email": profile["email"]})

    current_time = now_utc()
    account_data = {
        "provider_user_id": profile["provider_user_id"],
        "email": profile["email"],
        "name": profile["name"],
        "username": profile["username"],
        "avatar_url": profile.get("avatar_url"),
        "linked_at": current_time if not user else user.get("oauth_accounts", {}).get(provider, {}).get("linked_at", current_time),
        "last_login_at": current_time,
    }

    if user:
        updates = {
            "$set": {
                "name": user.get("name") or profile["name"],
                "email": profile["email"],
                "avatar_url": profile.get("avatar_url") or user.get("avatar_url"),
                f"oauth_accounts.{provider}": account_data,
                "updated_at": current_time,
                "last_login_at": current_time,
            },
            "$addToSet": {"auth_methods": provider},
        }
        db.users.update_one({"_id": user["_id"]}, updates)
        return db.users.find_one({"_id": user["_id"]})

    user_doc = {
        "_id": str(uuid.uuid4()),
        "name": profile["name"],
        "email": profile["email"],
        "password_hash": None,
        "avatar_url": profile.get("avatar_url"),
        "auth_methods": [provider],
        "oauth_accounts": {provider: account_data},
        "created_at": current_time,
        "updated_at": current_time,
        "last_login_at": current_time,
    }
    db.users.insert_one(user_doc)
    return user_doc


def get_user_by_id(user_id: str) -> dict:
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise ValueError("Name must be at least 2 characters")
        return name

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class OAuthStartResponse(BaseModel):
    url: str


class AuthStatusResponse(BaseModel):
    ok: bool = True


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and verify the current user from the JWT bearer token."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        session_id = payload.get("sid")
        token_type = payload.get("type")
        if user_id is None or session_id is None or token_type != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    db = get_db()
    session = db.sessions.find_one({"_id": session_id})
    if session is None or session.get("revoked_at") is not None or as_utc_datetime(session["expires_at"]) <= now_utc():
        raise HTTPException(status_code=401, detail="Session is no longer valid")

    user = get_user_by_id(user_id)
    return serialize_user(user)


def build_auth_response(user: dict, session_id: str) -> TokenResponse:
    access_token = create_access_token(user["_id"], session_id)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**serialize_user(user)),
    )


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, request: Request, response: Response):
    user = upsert_password_user(req.name, req.email, req.password)
    session_id, refresh_token = create_session(user["_id"], request, "password")
    set_refresh_cookie(response, refresh_token)
    return build_auth_response(user, session_id)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, response: Response):
    db = get_db()
    user = db.users.find_one({"email": req.email})

    if not user or not verify_password(req.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    update_last_login(user["_id"])
    user = get_user_by_id(user["_id"])
    session_id, refresh_token = create_session(user["_id"], request, "password")
    set_refresh_cookie(response, refresh_token)
    return build_auth_response(user, session_id)


@router.post("/refresh", response_model=TokenResponse)
def refresh_session(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No active session")

    session = load_session_from_refresh_token(refresh_token)
    user = get_user_by_id(session["user_id"])
    rotated_token = rotate_session(session, request)
    set_refresh_cookie(response, rotated_token)
    return build_auth_response(user, session["_id"])


@router.post("/logout", response_model=AuthStatusResponse)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    revoke_session_from_cookie(refresh_token)
    clear_refresh_cookie(response)
    return AuthStatusResponse()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.get("/oauth/{provider}/start", response_model=OAuthStartResponse)
def start_oauth(provider: str, response: Response):
    config = get_provider_config(provider)
    state = create_oauth_state(provider)
    params = {
        "client_id": config["client_id"],
        "redirect_uri": build_redirect_uri(provider),
        "response_type": "code",
        "scope": " ".join(config["scopes"]),
        "state": state,
    }
    if provider == "google":
        params["prompt"] = "select_account"
    if provider == "github":
        params["allow_signup"] = "true"

    clear_oauth_state_cookie(response)
    set_oauth_state_cookie(response, state)
    return OAuthStartResponse(url=f"{config['authorize_url']}?{urlencode(params)}")


def oauth_error_redirect(message: str) -> RedirectResponse:
    response = RedirectResponse(f"{FRONTEND_URL}/login?authError={quote(message)}", status_code=302)
    clear_oauth_state_cookie(response)
    clear_refresh_cookie(response)
    return response


@router.get("/oauth/{provider}/callback")
def oauth_callback(
    provider: str,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    request: Request = None,
    oauth_state_cookie: str | None = Cookie(default=None, alias=OAUTH_STATE_COOKIE_NAME),
):
    if not code or not state or not oauth_state_cookie:
        return oauth_error_redirect("OAuth sign-in was cancelled")

    response = RedirectResponse(f"{FRONTEND_URL}/auth/callback", status_code=302)
    clear_oauth_state_cookie(response)

    try:
        cookie_payload = decode_oauth_state(oauth_state_cookie)
        query_payload = decode_oauth_state(state)
        if oauth_state_cookie != state:
            raise HTTPException(status_code=400, detail="OAuth state mismatch")
        if cookie_payload.get("provider") != provider or query_payload.get("provider") != provider:
            raise HTTPException(status_code=400, detail="OAuth state provider mismatch")

        profile = fetch_oauth_profile(provider, code, state)
        user = upsert_oauth_user(profile)
        session_id, refresh_token = create_session(user["_id"], request, provider)
        set_refresh_cookie(response, refresh_token)
        return response
    except HTTPException as exc:
        return oauth_error_redirect(exc.detail)
    except Exception:
        return oauth_error_redirect("OAuth sign-in failed unexpectedly")
