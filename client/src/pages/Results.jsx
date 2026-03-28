import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import { generateReport } from '../utils/pdfReport'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import ScrollScene from '../components/ScrollScene'
import logo from '../assets/logo.png'

const BAR_COLORS = ['#888888', '#AAAAAA', '#111111', '#555555', '#333333']

export default function Results() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()

  const [data, setData] = useState(location.state?.analysis || null)
  const [loading, setLoading] = useState(!data)

  useEffect(() => {
    if (data) return
    api.get(`/analysis/${id}`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [data, id])

  if (loading) {
    return (
      <div className="bg-surface font-body min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-[rgba(0,0,0,0.40)] font-bold font-headline animate-pulse">Synchronizing Neural Analysis...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-surface font-body min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-sm w-full p-10 text-center rounded-[2rem]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">error</span>
          <h3 className="font-headline text-2xl font-extrabold text-[#111111] mb-2">Analysis not found</h3>
          <p className="text-[rgba(0,0,0,0.40)] text-sm mb-8">We couldn't find the requested analysis report.</p>
          <Link to="/dashboard" className="inline-block bg-[#111111] text-white px-8 py-3 rounded-full font-headline font-bold hover:scale-105 transition-transform">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const results = data.results
  const handleDownload = () => generateReport(results, user?.name)

  const radarData = results.domain_scores
    ? Object.entries(results.domain_scores).map(([name, value]) => ({ subject: name, score: value, fullMark: 100 }))
    : []

  const tierData = results.tier_distribution
    ? Object.entries(results.tier_distribution).map(([name, value]) => ({ name, probability: value }))
    : []

  return (
    <div className="bg-surface font-body text-on-surface overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-40 opacity-40 mix-blend-multiply">
        <ScrollScene scrollProgress={0.8} />
      </div>

      <main className="pt-24 pb-24 px-6 md:px-12 max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* Hero Section: High-Impact Analysis */}
        <section className="relative">
          <div className="bg-on-surface-variant rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative shadow-blue flex flex-col md:flex-row items-center gap-12 border border-white/10">
            {/* Decorative Light Bleed */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
            
            <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-primary-fixed text-xs font-bold tracking-widest uppercase">
                Analysis Complete
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                {results.predicted_role}
              </h1>
              <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                <div className="space-y-1">
                  <p className="text-white/50 text-xs font-bold tracking-widest uppercase">Predicted Tier</p>
                  <p className="text-2xl font-headline font-bold text-white tracking-tight">{results.predicted_tier}</p>
                  {results.tier_confidence != null && (
                    <p className="text-xs text-white/40 font-semibold">{results.tier_confidence}% tier confidence</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-white/50 text-xs font-bold tracking-widest uppercase">Expected Package</p>
                  <p className="text-2xl font-headline font-bold text-primary-fixed tracking-tight hover:text-white transition-colors">₹{results.salary_range?.expected} LPA</p>
                  {results.salary_range?.low != null && results.salary_range?.high != null && (
                    <p className="text-xs text-white/40 font-semibold">Range: ₹{results.salary_range.low}L – ₹{results.salary_range.high}L</p>
                  )}
                </div>
              </div>
              <button onClick={handleDownload} className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:bg-white/25 backdrop-blur-md transition-all">
                <span className="material-symbols-outlined text-sm">download</span> Download PDF Report
              </button>
            </div>

            {/* Confidence Dial */}
            <div className="relative w-64 h-64 flex items-center justify-center z-10 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" fill="transparent" r="110" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
                <circle className="drop-shadow-[0_0_15px_rgba(0,0,0,0.15)]" cx="128" cy="128" fill="transparent" r="110" stroke="url(#gradient)" strokeDasharray="691" strokeDashoffset={691 - (691 * (results.overall_confidence || 0)) / 100} strokeLinecap="round" strokeWidth="16" style={{ transition: 'stroke-dashoffset 1s ease-out' }}></circle>
                <defs>
                  <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#888888"></stop>
                    <stop offset="100%" stopColor="#555555"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black text-white tracking-tighter">{results.overall_confidence}%</span>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">Confidence</span>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Scorecard */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Resume Strength',   value: results.resume_strength,   suffix: '%',  icon: 'description', color: 'text-primary',   bg: 'bg-primary-container/20' },
            { label: 'Industry Readiness',value: results.industry_readiness, suffix: '%',  icon: 'factory',     color: 'text-secondary',  bg: 'bg-secondary-container/20' },
            { label: 'Peer Percentile',   value: results.peer_percentile,   suffix: 'th', icon: 'leaderboard', color: 'text-primary',   bg: 'bg-primary-fixed/50' },
            { label: 'FAANG Probability', value: results.faang_probability, suffix: '%',  icon: 'stars',       color: 'text-secondary',  bg: 'bg-secondary-fixed/60' },
          ].map(({ label, value, suffix, icon, color, bg }) => value != null && (
            <div key={label} style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }} className={`${bg} backdrop-blur-md rounded-[1.5rem] p-6 flex flex-col gap-3 hover:scale-[1.03] hover:shadow-blue-sm`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">{label}</p>
                <p className={`text-3xl font-black font-headline tracking-tighter ${color}`}>
                  {value}<span className="text-lg font-bold">{suffix}</span>
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Insights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Radar Chart Glass Card */}
          <div style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }} className="glass-card rounded-[2rem] p-8 min-h-[400px] flex flex-col justify-between hover:shadow-blue bg-white/60">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">Skill Competency</h3>
              <p className="font-headline text-2xl font-bold tracking-tight text-on-surface">Capability Spectrum</p>
            </div>
            <div className="flex items-center justify-center py-4 h-[300px]">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(0,0,0,0.10)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(0,0,0,0.65)', fontSize: 13, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="#333333" fill="#888888" fillOpacity={0.4} strokeWidth={3} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm font-bold text-on-surface-variant">Not enough data</p>
              )}
            </div>
          </div>

          {/* Bar Chart Glass Card */}
          <div style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }} className="glass-card rounded-[2rem] p-8 min-h-[400px] flex flex-col justify-between hover:shadow-blue bg-white/60">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-secondary mb-2">Benchmarking</h3>
              <p className="font-headline text-2xl font-bold tracking-tight text-on-surface">Tier Probability</p>
            </div>
            <div className="flex items-center justify-center py-4 h-[300px]">
              {tierData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(0,0,0,0.50)', fontSize: 11, fontWeight: 600 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(0,0,0,0.65)', fontSize: 12, fontWeight: 700 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                      labelStyle={{ color: '#111111', fontWeight: 700, marginBottom: 4 }}
                      itemStyle={{ color: '#333333', fontWeight: 600 }}
                    />
                    <Bar dataKey="probability" radius={[0, 12, 12, 0]} barSize={24}>
                      {tierData.map((_, index) => (
                        <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 <p className="text-sm font-bold text-on-surface-variant">Not enough data</p>
              )}
            </div>
          </div>
        </section>

        {/* ATS Report */}
        {results.ats_score != null && (
          <section style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }} className="glass-card bg-white/60 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-start hover:shadow-blue">
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="12" />
                  <circle
                    cx="72" cy="72" r="60" fill="none"
                    stroke={results.ats_score >= 75 ? '#22c55e' : results.ats_score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * (results.ats_score || 0)) / 100}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-[#111111] font-headline leading-none">{results.ats_score}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/60 mt-0.5">ATS Score</span>
                </div>
              </div>
              <p className={`text-xs font-bold px-3 py-1 rounded-full ${results.ats_score >= 75 ? 'bg-primary-fixed text-on-primary-fixed' : results.ats_score >= 50 ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-[#111111]/80 text-white'}`}>
                {results.ats_score >= 75 ? 'ATS Optimized' : results.ats_score >= 50 ? 'Needs Review' : 'Needs Work'}
              </p>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-1">Resume Scan</h3>
                <p className="font-headline text-2xl font-bold tracking-tight text-on-surface">ATS Compatibility Report</p>
              </div>
              {results.ats_feedback?.length > 0 && (
                <ul className="space-y-2 pt-2">
                  {results.ats_feedback.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#111111]/80">
                      <span className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${item.toLowerCase().startsWith('missing') || item.toLowerCase().startsWith('no ') || item.toLowerCase().startsWith('low') ? 'text-red-500' : 'text-emerald-500'}`}>
                        {item.toLowerCase().startsWith('missing') || item.toLowerCase().startsWith('no ') || item.toLowerCase().startsWith('low') ? 'error' : 'check_circle'}
                      </span>
                      <span className="leading-relaxed font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* CTC Breakdown */}
        {results.ctc_breakdown && (
          <section className="bg-[#111111] rounded-[2rem] p-8 md:p-12 overflow-hidden relative shadow-2xl">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-primary-fixed/60 mb-1">Compensation Intelligence</h3>
                <p className="font-headline text-3xl font-black text-white tracking-tighter">CTC Breakdown</p>
              </div>
              {/* Monthly in-hand highlight */}
              {results.ctc_breakdown.monthly_in_hand != null && (
                <div className="flex items-end gap-2 border-b border-white/10 pb-6">
                  <span className="text-6xl font-black text-primary-fixed font-headline tracking-tighter leading-none">
                    ₹{Math.round(results.ctc_breakdown.monthly_in_hand * 100)}K
                  </span>
                  <span className="text-white/50 font-bold text-sm mb-2">/ month in-hand</span>
                </div>
              )}
              {/* Component grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Base Salary', key: 'base_salary', icon: 'account_balance_wallet' },
                  { label: 'HRA', key: 'hra', icon: 'home' },
                  { label: 'Performance Bonus', key: 'performance_bonus', icon: 'emoji_events' },
                  { label: 'Stocks / ESOPs', key: 'stocks_esops', icon: 'trending_up' },
                  { label: 'Special Allowances', key: 'special_allowances', icon: 'savings' },
                  { label: 'Insurance & Benefits', key: 'insurance_benefits', icon: 'health_and_safety' },
                ].map(({ label, key, icon }) => results.ctc_breakdown[key] != null && (
                  <div key={key} className="bg-white/5 rounded-2xl p-5 space-y-2 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-primary-fixed/60">{icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
                    </div>
                    <p className="text-xl font-black text-white font-headline">₹{results.ctc_breakdown[key]} LPA</p>
                  </div>
                ))}
              </div>
              {results.ctc_breakdown.total_ctc != null && (
                <p className="text-sm text-white/30 font-medium">Total CTC: ₹{results.ctc_breakdown.total_ctc} LPA</p>
              )}
            </div>
          </section>
        )}

        {/* Matching Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Target Companies + Role Alternatives */}
          <div className="lg:col-span-1 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-black tracking-tighter">Target Enterprises</h2>
                <span className="material-symbols-outlined text-on-surface-variant">corporate_fare</span>
              </div>
              <div className="space-y-4">
                {(results.target_companies || []).map((company, i) => (
                  <div key={i} style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} className="p-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-card border border-white/40 flex items-center gap-4 hover:scale-[1.02] hover:shadow-blue-sm cursor-default">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${i % 2 === 0 ? 'bg-[#111111] text-white' : 'bg-primary text-white'}`}>
                      <span className="font-black text-xl italic">{company.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight text-[#111111]">{company}</p>
                      <p className="text-xs text-on-surface-variant font-medium">Top Match</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {results.top_roles?.length > 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-2xl font-black tracking-tighter text-[#111111]">Role Alternatives</h2>
                  <span className="material-symbols-outlined text-secondary">work</span>
                </div>
                <div className="flex flex-col gap-3">
                  {results.top_roles.slice(1).map((role, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-outline-variant/10">
                      <span className="text-sm font-semibold text-[#111111]">{role.role}</span>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{role.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill Gaps + Quick Actions + Interview Tips */}
          <div className="lg:col-span-2 space-y-12">

            {/* Skills Analysis — all skills */}
            {results.skill_gaps?.length > 0 && (
              <div className="p-8 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/10 space-y-6 shadow-card">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">Competency Deep Dive</h3>
                    <p className="font-headline text-2xl font-bold tracking-tight text-[#111111]">Skill Analysis</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-container inline-block"></span>Strong</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span>Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#111111]/50 inline-block"></span>Weak</span>
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.skill_gaps.map((gap, i) => (
                    <div key={i} style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} className={`space-y-2 p-4 rounded-2xl hover:scale-[1.02] ${
                      gap.status === 'strong' ? 'bg-primary-container/20' :
                      gap.status === 'weak'   ? 'bg-[#111111]/5'          : 'bg-secondary-container/20'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold text-sm ${
                          gap.status === 'strong' ? 'text-primary'   :
                          gap.status === 'weak'   ? 'text-[#111111]' : 'text-secondary'
                        }`}>{gap.skill}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            gap.status === 'strong' ? 'bg-primary-fixed text-on-primary-fixed' :
                            gap.status === 'weak'   ? 'bg-[#111111]/10 text-[#111111]'          : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}>{gap.status}</span>
                          <span className="text-xs font-semibold text-on-surface-variant/70">{gap.current_score} / {gap.target_score}</span>
                        </div>
                      </div>

                      <div className={`h-2 rounded-full overflow-hidden ${
                        gap.status === 'strong' ? 'bg-primary-container/30'    :
                        gap.status === 'weak'   ? 'bg-[#111111]/15'            : 'bg-secondary-container/30'
                      }`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            gap.status === 'strong' ? 'bg-primary-container'    :
                            gap.status === 'weak'   ? 'bg-[#111111]/60'         : 'bg-secondary-container'
                          }`}
                          style={{ width: `${Math.min(100, (gap.current_score / gap.target_score) * 100)}%` }}
                        />
                      </div>

                      {gap.recommendation && gap.status !== 'strong' && (
                        <p className={`text-xs font-medium leading-relaxed ${
                          gap.status === 'weak' ? 'text-[#111111]/70' : 'text-secondary/80'
                        }`}>{gap.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>

                {results.skill_gaps.some(g => g.status !== 'strong') && (
                  <div className="pt-4">
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed italic border-l-2 border-primary/15 pl-3">
                      Addressing these gaps is proven to elevate interview success for the {results.predicted_tier} tier.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {results.quick_actions?.length > 0 && (
              <div className="space-y-6">
                <h2 className="font-headline text-2xl font-black tracking-tighter text-[#111111]">Quick Win Actions</h2>
                <div className="flex flex-col gap-4">
                  {results.quick_actions.map((action, i) => (
                    <div key={i} style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} className="group flex gap-4 items-start p-5 bg-white/60 border border-white/40 rounded-[1.5rem] hover:bg-white hover:shadow-blue-sm hover:scale-[1.01]">
                      <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 flex items-center justify-center text-primary font-black text-sm mt-0.5">{i + 1}</div>
                      <p className="text-sm font-medium text-[#111111] leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Tips */}
            {results.interview_tips?.length > 0 && (
              <div className="space-y-6">
                <h2 className="font-headline text-2xl font-black tracking-tighter text-[#111111]">Interview Preparation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.interview_tips.map((tip, i) => (
                    <div key={i} style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} className="group flex gap-4 items-start p-5 bg-white/60 border border-white/40 rounded-[1.5rem] hover:bg-white hover:shadow-blue-sm hover:scale-[1.01] cursor-default">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">lightbulb</span>
                      </div>
                      <p className="text-sm font-medium text-[#111111] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-12 grid grid-cols-1 md:grid-cols-4 gap-12 bg-[#111111] font-body tracking-tight text-sm text-slate-400 relative z-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
        
        <div className="col-span-1 md:col-span-1 relative z-10">
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="Placify AI" className="h-8 w-auto brightness-0 invert" />
            <span className="text-lg font-bold text-white font-headline uppercase tracking-widest">Placify AI</span>
          </div>
          <p className="max-w-xs leading-relaxed font-medium">
            Empowering the next generation of tech leaders through algorithmic precision and career intelligence.
          </p>
        </div>
        <div className="relative z-10">
          <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Product</h4>
          <ul className="space-y-2 font-medium">
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Analysis</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Benchmarking</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">API</Link></li>
          </ul>
        </div>
        <div className="relative z-10">
          <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Company</h4>
          <ul className="space-y-2 font-medium">
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Support</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Privacy</Link></li>
            <li><Link className="hover:text-primary transition-colors duration-200" to="#">Terms</Link></li>
          </ul>
        </div>
        <div className="flex flex-col items-start md:items-end justify-between h-full relative z-10">
          <div className="flex gap-4">
            <span className="material-symbols-outlined hover:text-white cursor-pointer transition-colors">language</span>
            <span className="material-symbols-outlined hover:text-white cursor-pointer transition-colors">share</span>
          </div>
          <p className="mt-8 md:mt-0 text-[10px] uppercase font-bold tracking-widest">
            © 2026 Placify AI. All rights reserved. Prices in ₹.
          </p>
        </div>
      </footer>
    </div>
  )
}
