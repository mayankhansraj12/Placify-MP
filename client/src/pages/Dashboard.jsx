import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import ScrollScene from '../components/ScrollScene'
import logo from '../assets/logo.png'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analysis/history')
      .then(res => { setAnalyses(res.data.analyses); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const latest = analyses[0] || null
  const statValues = {
    count: analyses.length,
    strength: latest?.resume_strength || '—',
    confidence: latest?.overall_confidence ? `${latest.overall_confidence}` : '—',
    ctc: latest?.salary_expected ? `${latest.salary_expected}` : '—',
  }

  const icons = ['robot_2', 'architecture', 'psychology', 'strategy']
  const bgColors = ['bg-primary-container/20', 'bg-secondary-container/20', 'bg-primary-container/20', 'bg-secondary-container/20']
  const textColors = ['text-primary', 'text-secondary', 'text-primary', 'text-secondary']

  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-primary-container selection:text-on-primary-container relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-40 opacity-50 mix-blend-multiply">
        <ScrollScene scrollProgress={0.2} />
      </div>

      <main className="pt-24 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        {/* Welcome Header */}
        <header className="mb-16">
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl">
            Your career trajectory is currently outperforming 84% of your peer group. Ready for your next move?
          </p>
        </header>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {/* Growth Card */}
          <div className="p-8 rounded-[2rem] bg-[#111111] text-white flex flex-col justify-between aspect-square md:aspect-auto shadow-blue">
            <div>
              <span className="material-symbols-outlined mb-4 text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <h3 className="font-label text-sm uppercase tracking-widest opacity-70">Total Scans</h3>
            </div>
            <div className="mt-auto">
              <span className="font-headline text-5xl font-black">{statValues.count}</span>
              <p className="text-xs opacity-60 mt-1">career analyses</p>
            </div>
          </div>
          {/* Score Card */}
          <div className="p-8 rounded-[2rem] bg-primary-container text-on-primary-container flex flex-col justify-between aspect-square md:aspect-auto shadow-blue">
            <div>
              <span className="material-symbols-outlined mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <h3 className="font-label text-sm uppercase tracking-widest opacity-80">Skill Score</h3>
            </div>
            <div className="mt-auto">
              <span className="font-headline text-5xl font-black">{statValues.strength}</span>
              <p className="text-xs opacity-70 mt-1">resume strength /100</p>
            </div>
          </div>
          {/* Market Card */}
          <div className="p-8 rounded-[2rem] bg-secondary-container text-on-secondary-container flex flex-col justify-between aspect-square md:aspect-auto shadow-card-md">
            <div>
              <span className="material-symbols-outlined mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              <h3 className="font-label text-sm uppercase tracking-widest opacity-80">Confidence</h3>
            </div>
            <div className="mt-auto">
              <span className="font-headline text-5xl font-black">{statValues.confidence}{statValues.confidence !== '—' ? '%' : ''}</span>
              <p className="text-xs opacity-70 mt-1">market fit metric</p>
            </div>
          </div>
          {/* Expected CTC */}
          <div className="p-8 rounded-[2rem] glass-card flex flex-col justify-between aspect-square md:aspect-auto shadow-card-md">
            <div>
              <span className="material-symbols-outlined mb-4 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <h3 className="font-label text-sm uppercase tracking-widest text-on-surface-variant">Expected CTC</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-baseline gap-1">
                <span className="font-label text-xl font-medium text-primary">₹</span>
                <span className="font-headline text-4xl font-black text-on-surface">{statValues.ctc}{statValues.ctc !== '—' ? 'L' : ''}</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Market standard max</p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mb-20">
          <div className="bg-[#111111] rounded-[2.5rem] overflow-hidden relative p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-[0_30px_60px_rgba(0,0,0,0.20)]">
            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
              <img alt="abstract tech pattern" className="w-full h-full object-cover grayscale brightness-50 mix-blend-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmLgIwyL2re05fU85i8g1Xyu6BJuAztdf-Wc7sfSSB7dGHjUrUFVBCqguOMWBjb1Gzpg1MgjATjctdyWU-irP_pVdlmzZaDvrhDwUiOp_zJnCjd7YB20acKpbzzGFwVMnFbP8RvWA3txHK9cuvZBvRIAqsRaH2rkLMeSfnj8kMtZHTYYSqgffMCfSVyOZaw-vb36vQewCkDaBAMdLvb8nsdVw-c6I5eRRPBzqIhcaqRTLGZeLKR9N-eQqrdNI87CNr3PvlzMcbZTQ" />
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h2 className="font-headline text-3xl md:text-5xl font-bold text-white tracking-tighter mb-4">Ready for a new career sprint?</h2>
              <p className="text-primary-fixed-dim text-lg opacity-80">Run our latest neural analysis to find your next jump.</p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link to="/analyze" style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} className="inline-block bg-primary-container text-on-primary-container px-8 py-5 rounded-full font-headline font-bold text-lg hover:scale-105 active:scale-95 shadow-blue-sm">
                Start New Analysis
              </Link>
            </div>
          </div>
        </section>

        {/* Analysis History Grid */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter">Analysis History</h2>
            <Link to="/analyze" className="text-primary font-bold font-label flex items-center gap-2 hover:translate-x-1 transition-transform">
              New Scan <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-20 text-on-surface-variant font-bold font-headline animate-pulse">
              Syncing Neural History...
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-20 bg-white/40 glass-card rounded-[2rem]">
              <h3 className="font-headline text-2xl font-bold mb-4">No analysis history yet</h3>
              <p className="text-on-surface-variant mb-8">Begin your journey by uploading your resume.</p>
              <Link to="/analyze" className="bg-[#111111] text-white px-8 py-4 rounded-full font-headline font-bold hover:scale-105 transition-all">Start Now</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {analyses.map((analysis, i) => (
                <div key={analysis.id} onClick={() => navigate(`/results/${analysis.id}`)} style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }} className="glass-card p-10 rounded-[2rem] hover:shadow-blue group cursor-pointer bg-white/50">
                  <div className="flex justify-between items-start mb-12">
                    <div className={`${bgColors[i % 4]} p-4 rounded-2xl`}>
                      <span className={`material-symbols-outlined ${textColors[i % 4]} scale-125`}>{icons[i % 4]}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline text-4xl font-black text-on-surface">{analysis.overall_confidence || 85}%</span>
                      <p className={`font-label text-xs uppercase tracking-widest ${textColors[i % 4]} font-bold`}>Match Score</p>
                    </div>
                  </div>
                  <h3 className="font-headline text-2xl font-bold mb-2 break-words line-clamp-2">{analysis.predicted_role}</h3>
                  <p className="text-on-surface-variant mb-10 font-medium">{analysis.predicted_tier} Tier Target</p>
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Estimated Comp</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold">₹</span>
                        <span className="text-xl font-bold hover:text-primary transition-colors">{analysis.salary_expected}L</span>
                      </div>
                    </div>
                    <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-on-surface group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined">north_east</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-on-surface-variant relative z-10 bg-white/40 border-t border-outline-variant/10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="Placify AI" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#111111] font-headline">Placify AI</span>
          </div>
          <p className="mt-4 font-body tracking-tight text-sm leading-relaxed text-on-surface-variant">
            Empowering career leaps through neural market intelligence and precision matchmaking.
          </p>
        </div>
        <div>
          <h4 className="text-[#111111] font-bold mb-4 uppercase text-xs tracking-widest">Product</h4>
          <ul className="space-y-2 font-body text-sm font-medium">
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Features</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">API</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#111111] font-bold mb-4 uppercase text-xs tracking-widest">Legal</h4>
          <ul className="space-y-2 font-body text-sm font-medium">
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Privacy</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Terms</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-body tracking-tight text-sm font-medium text-on-surface-variant">© 2026 Placify AI. All rights reserved. Prices in ₹.</p>
          <div className="mt-6 flex gap-4">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary text-[#111111] transition-colors">language</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary text-[#111111] transition-colors">share</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
