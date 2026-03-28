import { useRef, useEffect } from 'react'

// Google brand palette
const COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

const COUNT        = 700
const REPEL_RADIUS = 150   // px — cursor influence zone
const FRICTION     = 0.88  // extra-velocity decay per frame (1 = no decay)

// ─── spawn one particle anywhere in the radial field ─────────────────────────
function makeParticle(W, H) {
  const cx     = W / 2
  const cy     = H / 2
  const angle  = Math.random() * Math.PI * 2
  // sqrt weighting → uniform area coverage so corners are populated
  const maxR   = Math.hypot(cx, cy)
  const r      = Math.sqrt(Math.random()) * maxR

  return {
    x:     cx + Math.cos(angle) * r,
    y:     cy + Math.sin(angle) * r,
    angle,                                      // outward heading from center
    speed: 0.18 + Math.random() * 0.32,         // ambient drift speed (px/frame)
    evx:   0,                                   // extra velocity x (from repulsion)
    evy:   0,                                   // extra velocity y
    color: COLORS[Math.floor(Math.random() * 4)],
    len:   5  + Math.random() * 9,              // dash length
    thick: 1.4 + Math.random() * 1.4,          // dash thickness
    opacity: Math.random(),                     // stagger initial fade-in
  }
}

// ─── respawn near center with fresh heading ───────────────────────────────────
function respawn(p, W, H) {
  const cx    = W / 2
  const cy    = H / 2
  const angle = Math.random() * Math.PI * 2
  const r     = Math.random() * 60           // spawn within 60px of center

  p.x       = cx + Math.cos(angle) * r
  p.y       = cy + Math.sin(angle) * r
  p.angle   = Math.atan2(p.y - cy, p.x - cx)
  p.speed   = 0.18 + Math.random() * 0.32
  p.evx     = 0
  p.evy     = 0
  p.opacity = 0
}

// ─── component ───────────────────────────────────────────────────────────────
export default function HeroCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cvs = canvasRef.current
    const ctx = cvs.getContext('2d')

    let W, H
    let particles = []
    let mouse     = { x: -9999, y: -9999 }
    let raf

    function init() {
      W = cvs.width  = window.innerWidth
      H = cvs.height = window.innerHeight
      particles = Array.from({ length: COUNT }, () => makeParticle(W, H))
    }

    function frame() {
      ctx.clearRect(0, 0, W, H)

      for (const p of particles) {
        // ── ambient outward velocity ──────────────────────────────────────
        const ax = Math.cos(p.angle) * p.speed
        const ay = Math.sin(p.angle) * p.speed

        // ── cursor repulsion ──────────────────────────────────────────────
        const dx   = p.x - mouse.x
        const dy   = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < REPEL_RADIUS && dist > 1) {
          // quadratic falloff → strong near cursor, zero at boundary
          const t  = 1 - dist / REPEL_RADIUS
          const f  = t * t * 9           // max ~9 px/frame at cursor centre
          p.evx += (dx / dist) * f
          p.evy += (dy / dist) * f
        }

        // ── decay extra velocity (friction) ───────────────────────────────
        p.evx *= FRICTION
        p.evy *= FRICTION

        // ── integrate position ────────────────────────────────────────────
        p.x += ax + p.evx
        p.y += ay + p.evy

        // ── opacity fade-in ───────────────────────────────────────────────
        if (p.opacity < 1) p.opacity = Math.min(1, p.opacity + 0.007)

        // ── off-screen → respawn ──────────────────────────────────────────
        if (p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) {
          respawn(p, W, H)
        }

        // ── draw dash oriented along direction of travel ──────────────────
        const tvx = ax + p.evx               // total velocity this frame
        const tvy = ay + p.evy
        const drawAngle = Math.atan2(tvy, tvx)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(drawAngle)               // rect long-axis now points along velocity
        ctx.globalAlpha = p.opacity
        ctx.fillStyle   = p.color
        // horizontal rect: (-len/2, -thick/2, len, thick) → points along x → rotate
        ctx.fillRect(-p.len / 2, -p.thick / 2, p.len, p.thick)
        ctx.restore()
      }

      raf = requestAnimationFrame(frame)
    }

    init()
    frame()

    const onResize = () => { init() }
    const onMove   = (e) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onLeave  = ()  => { mouse.x = -9999; mouse.y = -9999 }

    window.addEventListener('resize',     onResize)
    window.addEventListener('mousemove',  onMove,  { passive: true })
    window.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize',     onResize)
      window.removeEventListener('mousemove',  onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        width:         '100%',
        height:        '100%',
        zIndex:        -1,
        pointerEvents: 'none',
        display:       'block',
      }}
    />
  )
}
