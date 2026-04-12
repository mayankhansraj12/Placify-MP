import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'
import HeroCanvas from '../components/HeroCanvas'
import BounceCards from '../components/BounceCards'
import imageforcard1 from '../assets/imageforcard1.png';
import imageforcard2 from '../assets/imageforcard2.png';
import imageforcard3 from '../assets/imageforcard3.png';
import imageforcard4 from '../assets/imageforcard4.png';

// ─── shared animation variants ───────────────────────────────────────────────
const fadeUp   = { hidden: { opacity: 0, y: 48 }, visible: { opacity: 1, y: 0 } }
const fadeLeft = { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } }
const fadeRight= { hidden: { opacity: 0, x:  60 }, visible: { opacity: 1, x: 0 } }
const VP       = { once: true, margin: '-80px' }

const FEATURE_CARDS = [
  {
    metric: 'CV → Features',
    title: 'Resume Intelligence',
    desc: 'Extracts skills, projects, and ATS signals using NLP — converted into structured features for prediction.',
    tag: 'Parsed in seconds',
    img: imageforcard1
    //img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80&fit=crop'
  },
  {
    metric: '3 ML Models',
    title: 'Role, Tier & Salary',
    desc: 'Random Forest models predict your role, company tier, and salary using real feature inputs.',
    tag: 'Prediction engine',
    img: imageforcard2
    //img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80&fit=crop'
  },
  {
    metric: 'Skill Gap Score',
    title: 'Know What’s Missing',
    desc: 'Compares your profile against industry benchmarks across DSA, Web, ML, and more.',
    tag: 'Prioritized gaps',
    img: imageforcard3
    //img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&q=80&fit=crop'
  },
  {
    metric: 'Execution Plan',
    title: 'Fix It Fast',
    desc: 'Clear next steps — coding targets, projects, and interview prep tailored to your gaps.',
    tag: 'Actionable roadmap',
    img: imageforcard4
    //img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=700&q=80&fit=crop'
  }
]

export default function Landing() {
  const containerRef = useRef(null)
  const lenisRef     = useRef(null)
  const rafRef       = useRef(null)

  const LINE1      = 'Know Your Placement Readiness'
  const LINE2      = 'Before the Drive'
  const FULL_TEXT  = LINE1 + '\n' + LINE2

  const [displayed,   setDisplayed]   = useState('')
  const [typingDone,  setTypingDone]  = useState(false)
  const [cursorPhase, setCursorPhase] = useState('typing')
  const [blinkOn,     setBlinkOn]     = useState(true)
  const [burstOrigin, setBurstOrigin] = useState(null)
  const cursorRef      = useRef(null)
  const burstCanvasRef = useRef(null)
  const heroWrapRef    = useRef(null)
  const heroTextRef    = useRef(null)

  const GCOLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

  // ── scroll-driven bg via framer-motion ────────────────────────────────────
  const { scrollY } = useScroll()
  const bgColor = useTransform(
    scrollY,
    [0, typeof window !== 'undefined' ? window.innerHeight : 800],
    ['#ffffff', '#000000'],
  )
  const [tickColors] = useState(() => {
    const c = ['#EA4335', '#34A853', '#4285F4', '#FBBC04']
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]]
    }
    return c.slice(0, 3)
  })
  const [cardScale, setCardScale] = useState(
    typeof window !== 'undefined' ? Math.min(1, (window.innerWidth - 32) / 720) : 1
  )
  useEffect(() => {
    const update = () => setCardScale(Math.min(1, (window.innerWidth - 32) / 720))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── typewriter ────────────────────────────────────────────────────────────
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(FULL_TEXT.slice(0, i))
      if (i >= FULL_TEXT.length) { clearInterval(id); setCursorPhase('blinking') }
    }, 65)
    return () => clearInterval(id)
  }, [])

  // ── blink 4× then burst ───────────────────────────────────────────────────
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

  // ── canvas burst ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (cursorPhase !== 'burst' || !burstOrigin) return
    const cvs  = burstCanvasRef.current
    cvs.width  = window.innerWidth
    cvs.height = window.innerHeight
    const ctx  = cvs.getContext('2d')

    const particles = Array.from({ length: 340 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.3 + Math.random() * 1.8
      return {
        x: burstOrigin.x, y: burstOrigin.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.002 + Math.random() * 0.003,
        r: 0.4 + Math.random() * 0.8,
        color: GCOLORS[Math.floor(Math.random() * 4)],
      }
    })

    let raf
    const animate = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      let alive = false
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        p.vx *= 0.99; p.vy *= 0.99
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
      if (alive) raf = requestAnimationFrame(animate)
      else { ctx.clearRect(0, 0, cvs.width, cvs.height); setCursorPhase('done') }
    }
    animate()
    return () => cancelAnimationFrame(raf)
  }, [cursorPhase, burstOrigin])

  useEffect(() => {
    if (cursorPhase !== 'burst') return
    const t = setTimeout(() => setTypingDone(true), 200)
    return () => clearTimeout(t)
  }, [cursorPhase])

  // ── lenis smooth scroll ───────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis
    function raf(time) { lenis.raf(time); rafRef.current = requestAnimationFrame(raf) }
    rafRef.current = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(rafRef.current); lenis.destroy() }
  }, [])

  // ── hero text auto-fit — max size, shrink only if touching edges ─────────
  useEffect(() => {
    const fit = () => {
      const wrap = heroWrapRef.current
      const text = heroTextRef.current
      if (!wrap || !text) return
      text.style.fontSize = '20vw'
      const wrapW = wrap.getBoundingClientRect().width
      const textW = text.scrollWidth
      if (textW > wrapW) {
        text.style.fontSize = `${(wrapW / textW) * 20 * 0.97}vw`
      }
    }
    const id = setTimeout(fit, 0)
    window.addEventListener('resize', fit)
    return () => { clearTimeout(id); window.removeEventListener('resize', fit) }
  }, [])

  const scrollToFeatures = (e) => {
    e.preventDefault()
    lenisRef.current?.scrollTo('#features', { offset: -80, duration: 1.4 })
  }

  // ── typewriter cursor ─────────────────────────────────────────────────────
  const hasNewline  = displayed.includes('\n')
  const line1Typed  = hasNewline ? LINE1 : displayed
  const line2Typed  = hasNewline ? displayed.slice(LINE1.length + 1) : ''
  const showCursor  = cursorPhase === 'typing' || (cursorPhase === 'blinking' && blinkOn)
  const cursor = showCursor ? (
    <span ref={cursorRef} style={{
      display: 'inline-block', width: '6px', height: '0.88em',
      background: 'linear-gradient(180deg, #888 0%, #222 20%, #000 50%, #1a1a1a 80%, #555 100%)',
      boxShadow: '0 0 3px rgba(255,255,255,0.18)',
      marginLeft: '4px', verticalAlign: 'middle', borderRadius: '1px',
    }} />
  ) : null

  return (
    <div ref={containerRef} className="relative min-h-screen font-body text-[#111111] overflow-x-clip selection:bg-primary-container selection:text-on-primary-container">

      {/* ── scroll-driven background (framer-motion) ── */}
      <motion.div style={{ backgroundColor: bgColor, position: 'fixed', inset: 0, zIndex: -2 }} />

      <HeroCanvas />

      {/* burst canvas */}
      <canvas ref={burstCanvasRef} style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 9999, pointerEvents: 'none',
        display: cursorPhase === 'burst' ? 'block' : 'none',
      }} />

      {/* ── navbar ── */}
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-sm border-b border-[#111111]/5"
      >
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
            <img src={logo} alt="Placify AI" className="h-6 w-auto" />
            <span className="text-sm font-bold text-[#111111] tracking-tight">Placify AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
            <a href="#features" onClick={scrollToFeatures} className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 cursor-pointer no-underline">Features</a>
            <a href="#" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Pricing</a>
            <Link to="/dashboard" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Dashboard</Link>
            <Link to="/analyze"   className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Analyze</Link>
            <a href="#" className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Blog</a>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <Link to="/login"    className="text-[13px] text-[#111111]/60 hover:text-[#111111] transition-colors duration-150 no-underline">Sign In</Link>
            <Link to="/register" className="flex items-center gap-1.5 bg-[#111111] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#222222] transition-colors duration-150 no-underline">
              Get Started <span className="text-base leading-none">↗</span>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative pb-20 z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-20 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent" />

        {/* ── hero ── */}
        <section className="relative h-screen">

          {/* text block — pinned so line 1 sits on the vertical center axis */}
          <div ref={heroWrapRef} style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            right: '5%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
          }}>

            {/* logo — floats above line 1, never displaces the text */}
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, paddingBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <AnimatePresence>
                {typingDone && (
                  <motion.div
                    key="logo"
                    initial={{ opacity: 0, y: -16, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.07, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <img src={logo} alt="Placify AI" style={{ height: '36px', width: 'auto' }} />
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111111', letterSpacing: '-0.03em' }}>Placify AI</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* line 1 and line 2 */}
            <div ref={heroTextRef} style={{ fontFamily: '"Funnel Sans", sans-serif', fontWeight: 200, lineHeight: 1.2, letterSpacing: '-0.035em', color: '#111111', fontSize: '10vw' }}>
              <div>
                {line1Typed}{cursorPhase !== 'burst' && cursorPhase !== 'done' && !hasNewline && cursor}
              </div>
              <div>
                {line2Typed}{cursorPhase !== 'burst' && cursorPhase !== 'done' && hasNewline && cursor}
              </div>
            </div>

          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 md:px-10 flex flex-col items-center">
          <div style={{ height: 280 * cardScale, overflow: 'visible' }}>
            <div style={{ transform: `scale(${cardScale})`, transformOrigin: 'top center' }}>
              <BounceCards
              cardCount={FEATURE_CARDS.length}
              containerWidth={700}
              containerHeight={280}
              animationDelay={0.3}
              animationStagger={0.09}
              easeType="elastic.out(1, 0.5)"
              transformStyles={[
                'rotate(8deg) translate(-170px)',
                'rotate(3deg) translate(-58px)',
                'rotate(-3deg) translate(58px)',
                'rotate(-8deg) translate(170px)',
              ]}
              enableHover
              hoverPush={220}
              renderCard={idx => {
                const card = FEATURE_CARDS[idx]
                return (
                  <div style={{ width: 360, height: 200, display: 'flex', background: '#fff' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '22px 20px', gap: 8, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontFamily: 'inherit', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(17,17,17,0.38)' }}>{card.metric}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#111111', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{card.title}</div>
                      <p style={{ fontSize: 11, color: 'rgba(17,17,17,0.55)', lineHeight: 1.55, margin: 0 }}>{card.desc}</p>
                      <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fff', background: 'linear-gradient(180deg,#3a3a3a 0%,#0f0f0f 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)', borderRadius: 999, padding: '4px 10px', marginTop: 2 }}>{card.tag}</span>
                    </div>
                    <div style={{ width: 160, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <img src={card.img} alt={card.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )
              }}
            />
            </div>
          </div>
        </section>

        {/* ── features ── */}
        <section id="features" className="container mx-auto px-6 space-y-32">

          {/* feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-20">
            <motion.div
              variants={fadeLeft} initial="hidden" whileInView="visible" viewport={VP}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex-1 space-y-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-white leading-tight">Peer Benchmarking</h2>
              <p className="text-white/70 text-lg leading-relaxed font-body">Understand your position among other students — not in isolation.</p>
              <ul className="space-y-4">
                {[
                  'Percentile ranking across profiles',
                  'Confidence score for prediction reliability',
                  'Tier probability distribution (Startup, Product, Service, etc.)',
                ].map((text, i) => {
                  const c = tickColors[i]
                  return (
                    <li key={text} className="flex items-center gap-3 text-sm font-headline font-bold uppercase tracking-wider text-white">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
                        style={{
                          background: `linear-gradient(145deg, rgba(255,255,255,0.28) 0%, ${c} 45%, ${c}bb 100%)`,
                          boxShadow: `0 2px 8px ${c}88, inset 0 1px 0 rgba(255,255,255,0.4)`,
                        }}
                      >✓</span>
                      {text}
                    </li>
                  )
                })}
              </ul>
              <p className="text-white/60 text-sm font-body italic">Know if you're ahead, average, or behind — with data.</p>
            </motion.div>
            <motion.div
              variants={fadeRight} initial="hidden" whileInView="visible" viewport={VP}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
              className="flex-1 relative"
            >
              <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 aspect-square rounded-[4rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.08)] group">
                <div className="w-64 h-64 bg-gradient-to-br from-primary-container to-secondary-container rounded-full blur-[80px] opacity-30 absolute animate-pulse z-10 pointer-events-none" />
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop"
                  alt="Behavioral analysis"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/30 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>

          {/* feature 2 */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-20">
            <motion.div
              variants={fadeLeft} initial="hidden" whileInView="visible" viewport={VP}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
              className="flex-1 relative"
            >
              <div className="bg-white/40 backdrop-blur-2xl border border-outline-variant/15 aspect-[4/3] rounded-[4rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.08)] group">
                <div className="w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-[100px] opacity-40 absolute z-10 pointer-events-none" />
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop"
                  alt="Salary analytics dashboard"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/30 via-transparent to-transparent" />
              </div>
            </motion.div>
            <motion.div
              variants={fadeRight} initial="hidden" whileInView="visible" viewport={VP}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex-1 space-y-8"
            >
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
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={VP}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="container mx-auto px-6 mt-40"
        >
          <div className="bg-white/40 backdrop-blur-3xl border border-outline-variant/15 p-12 md:p-24 rounded-[4rem] relative overflow-hidden text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -ml-48 -mb-48" />
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                  className="inline-block"
                >
                  <Link to="/analyze" className="inline-block px-12 py-6 bg-primary text-white font-headline font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:shadow-blue transition-shadow pointer-events-auto">
                    Start Your Placement Analysis
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* ── footer ── */}
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
