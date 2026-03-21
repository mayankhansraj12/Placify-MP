"""
Placify AI - Database Module
MongoDB Atlas connection using PyMongo.
"""

import os

from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """Return the MongoDB database instance (lazy singleton)."""
    global _client, _db
    if _db is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError(
                "MONGODB_URI environment variable is not set. "
                "Add it to server/.env or export it before starting the server."
            )
        _client = MongoClient(uri)
        db_name = os.getenv("MONGODB_DB_NAME", "placify")
        _db = _client[db_name]
    return _db


def init_db() -> None:
    """Verify the MongoDB connection and create indexes."""
    db = get_db()

    # users: unique index on email for fast lookup + duplicate prevention
    db.users.create_index([("email", ASCENDING)], unique=True)

    # analyses: index on user_id (most common query) and created_at (sorting)
    db.analyses.create_index([("user_id", ASCENDING)])
    db.analyses.create_index([("created_at", ASCENDING)])

    print("[ok] MongoDB connected and indexes verified.")
