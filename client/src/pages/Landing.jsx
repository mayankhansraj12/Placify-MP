import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import logo from '../assets/logo.png'
import HeroCanvas from '../components/HeroCanvas'

export default function Landing() {
  const containerRef = useRef(null)
  const lenisRef = useRef(null)
  const rafRef = useRef(null)

  const LINE1 = 'Know Your Placement Readiness'
  const LINE2 = 'Before the Drive'
  const FULL_TEXT = LINE1 + '\n' + LINE2

  const [displayed,    setDisplayed]    = useState('')
  const [typingDone,   setTypingDone]   = useState(false)
  // 'typing' → 'blinking' → 'burst' → 'done'
  const [cursorPhase,  setCursorPhase]  = useState('typing')
  const [blinkOn,      setBlinkOn]      = useState(true)
  const [burstOrigin,  setBurstOrigin]  = useState(null)
  const cursorRef      = useRef(null)
  const burstCanvasRef = useRef(null)

  const GCOLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

  // Typewriter — on finish enter blinking phase instead of immediate done
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(FULL_TEXT.slice(0, i))
      if (i >= FULL_TEXT.length) {
        clearInterval(id)
        setCursorPhase('blinking')
      }
    }, 55)
    return () => clearInterval(id)
  }, [])

  // Blink 4 times (8 half-cycles at 260 ms each), capture burst origin, then burst
  useEffect(() => {
    if (cursorPhase !== 'blinking') return
    if (cursorRef.current) {
      const r = cursorRef.current.getBoundingClientRect()
      setBurstOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    let ticks = 0
    const id = setInterval(() => {
      ticks++
      setBlinkOn(v => !v)
      if (ticks >= 8) { clearInterval(id); setCursorPhase('burst') }
    }, 260)
    return () => clearInterval(id)
  }, [cursorPhase])

  // Particle burst from cursor position
  useEffect(() => {
    if (cursorPhase !== 'burst' || !burstOrigin) return
    const cvs = burstCanvasRef.current
    cvs.width  = window.innerWidth
    cvs.height = window.innerHeight
    const ctx  = cvs.getContext('2d')

    const particles = Array.from({ length: 260 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 7
      return {
        x: burstOrigin.x, y: burstOrigin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: 1,
        decay: 0.014 + Math.random() * 0.022,
        r: 0.4 + Math.random() * 0.9,
        color: GCOLORS[Math.floor(Math.random() * 4)],
      }
    })

    let raf
    const animate = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      let alive = false
      for (const p of particles) {
        p.x  += p.vx; p.y += p.vy
        p.vy += 0.12; p.vx *= 0.97; p.vy *= 0.97
        p.life -= p.decay
        if (p.life <= 0) continue
        alive = true
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.globalAlpha = p.life
        ctx.fillStyle   = p.color
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur  = 0
      if (alive) raf = requestAnimationFrame(animate)
      else { ctx.clearRect(0, 0, cvs.width, cvs.height); setCursorPhase('done') }
    }
    animate()
    return () => cancelAnimationFrame(raf)
  }, [cursorPhase, burstOrigin])

  // Logo reveals after burst is fully done
  useEffect(() => {
    if (cursorPhase === 'done') setTypingDone(true)
  }, [cursorPhase])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafRef.current)
      lenis.destroy()
    }
  }, [])

  const scrollToFeatures = (e) => {
    e.preventDefault()
    lenisRef.current?.scrollTo('#features', { offset: -80, duration: 1.4 })
  }

  return (
    <div ref={containerRef} className="relative min-h-screen font-body text-[#111111] overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Particle field — fixed behind all content */}
      <HeroCanvas />

      {/* Cursor burst canvas — fixed overlay, only active during burst */}
      <canvas
        ref={burstCanvasRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          zIndex: 9999,
          pointerEvents: 'none',
          display: cursorPhase === 'burst' ? 'block' : 'none',
        }}
      />

      {/* Navbar — full-width flat */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-sm border-b border-[#111111]/5">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
            <img src={logo} alt="Placify AI" className="h-6 w-auto" />
            <span className="text-sm font-bold text-[#111111] tracking-tight">Placify AI</span>
          </Link>

          {/* Nav links — center */}
          <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
            <a href="#features" onClick={scrollToFeatures} className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 cursor-pointer no-underline">Features</a>
            <a href="#" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Pricing</a>
            <Link to="/dashboard" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Dashboard</Link>
            <Link to="/analyze"   className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Analyze</Link>
            <a href="#" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Blog</a>
          </div>

          {/* Auth — right */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <Link to="/login" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Sign In</Link>
            <Link to="/register" className="flex items-center gap-1.5 bg-[#111111] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#222222] transition-colors duration-150 no-underline">
              Get Started <span className="text-base leading-none">↗</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pb-20 z-10">
        {/* Atmospheric Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-20 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent"></div>
        
        {/* ── Typewriter Hero ── */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          {/* Logo — slides up after typing is done */}
          <div
            className={`flex items-center gap-4 mb-10 transition-all duration-700 ease-out ${
              typingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <img src={logo} alt="Placify AI" className="h-14 w-auto" />
            <span className="text-3xl font-bold text-[#111111] tracking-tight">Placify AI</span>
          </div>


          {/* Typewriter text — ghost span sets stable dimensions; typed text overlays from the exact left edge */}
          {(() => {
            const hasNewline = displayed.includes('\n')
            const line1Typed = hasNewline ? LINE1 : displayed
            const line2Typed = hasNewline ? displayed.slice(LINE1.length + 1) : ''
            const textStyle = {
              fontFamily: '"Funnel Sans", sans-serif',
              fontSize: 'clamp(2rem, 6vw, 5.5rem)',
              fontWeight: 200,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              color: '#111111',
            }
            const colorIdx  = displayed.length % 4
            const c1        = GCOLORS[colorIdx]
            const c2        = GCOLORS[(colorIdx + 1) % 4]
            const showCursor = cursorPhase === 'typing' ||
                               (cursorPhase === 'blinking' && blinkOn)
            const cursor = showCursor ? (
              <span
                ref={cursorRef}
                style={{
                  display:       'inline-block',
                  width:         '3px',
                  height:        '0.88em',
                  background:    `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`,
                  marginLeft:    '4px',
                  verticalAlign: 'middle',
                  borderRadius:  '1px',
                  boxShadow:     `0 0 8px ${c1}, 0 0 18px ${c1}99, 0 0 32px ${c2}55`,
                }}
              />
            ) : null
            return (
              <div style={{ ...textStyle, textAlign: 'center' }}>
                <div>
                  <div style={{ display: 'inline-block', position: 'relative' }}>
                    <span style={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>{LINE1}</span>
                    <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
                      {line1Typed}{cursorPhase !== 'burst' && cursorPhase !== 'done' && !hasNewline && cursor}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'inline-block', position: 'relative' }}>
                    <span style={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>{LINE2}</span>
                    <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
                      {line2Typed}{cursorPhase !== 'burst' && cursorPhase !== 'done' && hasNewline && cursor}
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}
        </section>

        {/* Stats Row */}
        <section className="container mx-auto px-6 mb-40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 p-10 rounded-3xl text-center transition-transform hover:-translate-y-2">
              <div className="text-4xl font-headline font-black text-[#111111] mb-2">15K+</div>
              <div className="text-xs font-headline font-bold uppercase tracking-widest text-[#111111]/60">Students</div>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 p-10 rounded-3xl text-center transition-transform hover:-translate-y-2">
              <div className="text-4xl font-headline font-black text-[#111111] mb-2">92%</div>
              <div className="text-xs font-headline font-bold uppercase tracking-widest text-[#111111]/60">Accuracy</div>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl border border-primary/10 p-10 rounded-3xl text-center transition-transform hover:-translate-y-2">
              <div className="text-4xl font-headline font-black text-[#111111] mb-2">₹8.5M+</div>
              <div className="text-xs font-headline font-bold uppercase tracking-widest text-[#111111]/60">Avg Package</div>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 p-10 rounded-3xl text-center transition-transform hover:-translate-y-2">
              <div className="text-4xl font-headline font-black text-[#111111] mb-2">450+</div>
              <div className="text-xs font-headline font-bold uppercase tracking-widest text-[#111111]/60">Hiring Partners</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 space-y-32">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-[#111111] leading-tight">Editorial-Grade Behavioral Mapping</h2>
              <p className="text-[#111111]/70 text-lg leading-relaxed font-body">Our proprietary AI analyzes over 200 behavioral markers to map your core competencies against top-tier corporate requirements, ensuring a perfect cultural fit.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-headline font-bold uppercase tracking-wider text-[#111111]">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                  Sentiment Analysis Engine
                </li>
                <li className="flex items-center gap-3 text-sm font-headline font-bold uppercase tracking-wider text-[#111111]">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                  Bias-Free Benchmarking
                </li>
              </ul>
            </div>
            {/* Feature 1 Visual */}
            <div className="flex-1 relative">
              <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 aspect-square rounded-[4rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.08)] group">
                <div className="w-64 h-64 bg-gradient-to-br from-primary-container to-secondary-container rounded-full blur-[80px] opacity-30 absolute animate-pulse z-10 pointer-events-none"></div>
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop"
                  alt="Professional behavioral analysis session"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/30 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Feature 2: Asymmetric Flip */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-20">
            {/* Feature 2 Visual */}
            <div className="flex-1 relative">
              <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 aspect-[4/3] rounded-[4rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.08)] group">
                <div className="w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-[100px] opacity-40 absolute z-10 pointer-events-none"></div>
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop"
                  alt="Salary analytics and placement data dashboard"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/30 via-transparent to-transparent"></div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-[#111111] leading-tight">Predictive Package Calibration</h2>
              <p className="text-[#111111]/70 text-lg leading-relaxed font-body">Don't settle for estimates. Our market-tuned algorithms compare real-time hiring data to predict your salary potential in the current fiscal year.</p>
              <div className="p-6 rounded-3xl bg-secondary-container/20 border border-secondary-container/15">
                <div className="text-xs font-headline font-black uppercase tracking-widest text-[#111111]/80 mb-1">Target Achievement</div>
                <div className="text-3xl font-headline font-black text-[#111111]">₹12.4 Lakhs <span className="text-sm font-medium text-[#111111]/50">/ per annum</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA / Massive Glass Card */}
        <section className="container mx-auto px-6 mt-40">
          <div className="bg-white/40 backdrop-blur-3xl border border-outline-variant/15 p-12 md:p-24 rounded-[4rem] relative overflow-hidden text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-12">
              <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter text-[#111111]">Ready for the Next Chapter?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">▶</div>
                    <span className="font-headline font-bold uppercase tracking-widest text-xs">Predictive Interviews</span>
                  </div>
                  <p className="text-[#111111]/70 font-body">Simulate high-pressure boardroom scenarios with AI interviewers trained on actual corporate archives.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-secondary">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">★</div>
                    <span className="font-headline font-bold uppercase tracking-widest text-xs">Verified Identity</span>
                  </div>
                  <p className="text-[#111111]/70 font-body">Your scores are cryptographically signed and verified, giving hiring managers immediate trust in your data.</p>
                </div>
              </div>
              <div className="pt-8 relative z-20">
                <Link to="/analyze" className="inline-block px-12 py-6 bg-primary text-white font-headline font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:scale-105 hover:shadow-blue transition-all active:scale-95 pointer-events-auto">
                  Start Your Placement Analysis
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] text-on-surface-variant font-body tracking-tight text-sm z-20 relative">
        <div className="w-full py-16 px-12 grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Placify AI" className="h-8 w-auto brightness-0 invert" />
              <span className="text-lg font-bold text-white tracking-tighter">Placify AI</span>
            </div>
            <p className="text-on-surface-variant max-w-xs leading-relaxed">Redefining career readiness through ethereal intelligence and editorial-grade data mapping.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-medium uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-2">
              <li><Link className="hover:text-primary-container transition-colors duration-200" to="/features">Features</Link></li>
              <li><Link className="hover:text-primary-container transition-colors duration-200" to="/api">API</Link></li>
              <li><Link className="hover:text-primary-container transition-colors duration-200" to="/support">Support</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-medium uppercase text-xs tracking-widest">Legal</h4>
            <ul className="space-y-2">
              <li><Link className="hover:text-primary-container transition-colors duration-200" to="/privacy">Privacy</Link></li>
              <li><Link className="hover:text-primary-container transition-colors duration-200" to="/terms">Terms</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-medium uppercase text-xs tracking-widest">Subscribe</h4>
            <div className="relative">
              <input className="w-full bg-white/5 border-none rounded-full px-6 py-3 text-white/80 focus:ring-2 focus:ring-primary-container/50 outline-none placeholder:text-white/30" placeholder="Email address" type="email" />
              <button className="absolute right-2 top-2 px-3 py-1.5 text-primary-container hover:text-white font-bold">→</button>
            </div>
          </div>
        </div>
        <div className="w-full py-8 px-12 border-t border-white/10 text-center">
          <p>© 2026 Placify AI. All rights reserved. Prices in ₹.</p>
        </div>
      </footer>
    </div>
  )
}
