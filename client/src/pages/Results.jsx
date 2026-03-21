import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import { generateReport } from '../utils/pdfReport'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  FiArrowLeft, FiAward, FiBookOpen, FiBriefcase, FiDownload, FiTarget,
  FiTrendingUp, FiUsers, FiZap,
} from 'react-icons/fi'

const TIER_BADGE = {
  Startup: 'badge-startup',
  'Service-Based': 'badge-service',
  'Product-Based': 'badge-product',
  Fintech: 'badge-fintech',
  'Top-Tier': 'badge-toptier',
}

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9']

export default function Results() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()

  const [data, setData] = useState(location.state?.analysis || null)
  const [loading, setLoading] = useState(!data)

  useEffect(() => {
    if (data) return

    api.get(`/analysis/${id}`)
      .then((res) => {
        setData(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [data, id])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="glass-card empty-state">
          <h3>Analysis not found</h3>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const results = data.results

  const radarData = results.domain_scores
    ? Object.entries(results.domain_scores).map(([name, value]) => ({
        subject: name,
        score: value,
        fullMark: 100,
      }))
    : []

  const tierData = results.tier_distribution
    ? Object.entries(results.tier_distribution).map(([name, value]) => ({
        name,
        probability: value,
      }))
    : []

  const handleDownload = () => {
    generateReport(results, user?.name)
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="fade-in">
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <button id="download-report" className="btn btn-primary" onClick={handleDownload}>
          <FiDownload /> Download Report
        </button>
      </div>

      {results.overall_confidence < 45 && (
        <div className="fade-in" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--text)' }}>
          <div style={{ fontWeight: 600, color: 'var(--error)' }}>Low confidence warning</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Your skill profile looks too generalized or sparse. For a stronger prediction, tailor your resume toward one clear target role.
          </div>
        </div>
      )}

      <div className="result-hero fade-in fade-in-delay-1">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Predicted Role
        </div>
        <div className="result-role">{results.predicted_role}</div>
        <div className="result-tier" style={{ marginTop: '0.75rem' }}>
          <span className={`badge ${TIER_BADGE[results.predicted_tier] || ''}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            {results.predicted_tier}
          </span>
        </div>
        <div className="confidence-gauge" style={{ marginTop: '1.25rem' }}>
          <div className="confidence-circle">{results.overall_confidence}%</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Confidence Score</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Based on ML model prediction</div>
          </div>
        </div>
      </div>

      {results.ats_score !== undefined && (
        <div className="glass-card fade-in fade-in-delay-1" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: results.ats_score >= 70 ? 'var(--success)' : results.ats_score >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                {results.ats_score}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ATS Match</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', flex: 1, minWidth: '250px' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Resume Structural Feedback</div>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {results.ats_feedback?.map((feedback) => (
                  <li key={feedback}>{feedback}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid-4 fade-in fade-in-delay-2">
        <div className="glass-card stat-card">
          <div className="stat-value">INR {results.salary_range?.expected}L</div>
          <div className="stat-label">Expected CTC</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{results.faang_probability}%</div>
          <div className="stat-label">FAANG Probability</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{results.resume_strength}</div>
          <div className="stat-label">Resume Strength</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">Top {100 - results.peer_percentile}%</div>
          <div className="stat-label">Peer Ranking</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', maxWidth: '800px', marginInline: 'auto' }}>
        <div className="glass-card fade-in fade-in-delay-3">
          <div className="section-header">
            <FiTarget className="icon" /> Domain Skill Scores
          </div>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="glass-card fade-in fade-in-delay-3">
          <div className="section-header">
            <FiBriefcase className="icon" /> Top Predicted Roles
          </div>
          {results.top_roles?.map((role, index) => (
            <div key={role.role} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  #{index + 1} {role.role}
                </span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{role.probability}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${role.probability}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card fade-in fade-in-delay-3">
          <div className="section-header">
            <FiTrendingUp className="icon" /> Company Tier Probability
          </div>
          {tierData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tierData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                  {tierData.map((entry, index) => (
                    <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="glass-card fade-in fade-in-delay-3">
          <div className="section-header">
            <FiAward className="icon" /> Industry Readiness
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {results.industry_readiness}%
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {results.industry_readiness >= 80 ? "Excellent - you're ready!" : results.industry_readiness >= 60 ? 'Good - keep improving!' : 'Needs work - follow the recommendations'}
            </div>
            <div className="progress-bar" style={{ marginTop: '1rem' }}>
              <div className="progress-fill" style={{ width: `${results.industry_readiness}%` }}></div>
            </div>
          </div>
        </div>

        <div className="glass-card fade-in fade-in-delay-3">
          <div className="section-header">
            <FiUsers className="icon" /> Peer Comparison
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {results.peer_percentile}th
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Percentile - better than {results.peer_percentile}% of comparable candidates
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card fade-in fade-in-delay-4" style={{ marginTop: '1.5rem' }}>
        <div className="section-header">
          <FiTarget className="icon" /> Skill Gap Analysis
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="skill-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Score</th>
                <th>Target</th>
                <th>Gap</th>
                <th>Status</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {results.skill_gaps?.map((gap) => (
                <tr key={gap.skill}>
                  <td style={{ fontWeight: 600 }}>{gap.skill}</td>
                  <td>{gap.current_score}</td>
                  <td>{gap.target_score}</td>
                  <td>{gap.gap > 0 ? gap.gap : '-'}</td>
                  <td>
                    <span className={`status-${gap.status}`}>
                      {gap.status === 'strong' ? 'Strong' : gap.status === 'moderate' ? 'Moderate' : 'Weak'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 300 }}>{gap.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="fade-in fade-in-delay-4">
          <div className="section-header">
            <FiZap className="icon" /> Quick Improvement Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.quick_actions?.map((action) => (
              <div key={action} className="action-card">{action}</div>
            ))}
          </div>
        </div>

        <div className="fade-in fade-in-delay-4">
          <div className="section-header">
            <FiBriefcase className="icon" /> Target Companies
          </div>
          <div className="glass-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {results.target_companies?.map((company) => (
                <span key={company} className={`badge ${TIER_BADGE[results.predicted_tier] || 'badge-service'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                  {company}
                </span>
              ))}
            </div>
          </div>

          <div className="section-header" style={{ marginTop: '1.5rem' }}>
            <FiBookOpen className="icon" /> Interview Prep Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.interview_tips?.map((tip, index) => (
              <div key={tip} className="tip-card">
                <span className="tip-number">{index + 1}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fade-in fade-in-delay-4" style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '2rem' }}>
        <button className="btn btn-primary btn-lg" onClick={handleDownload}>
          <FiDownload /> Download Full Report (PDF)
        </button>
      </div>
    </div>
  )
}
