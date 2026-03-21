import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import { FiChevronRight, FiClock, FiUpload } from 'react-icons/fi'

const TIER_BADGE = {
  Startup: 'badge-startup',
  'Service-Based': 'badge-service',
  'Product-Based': 'badge-product',
  Fintech: 'badge-fintech',
  'Top-Tier': 'badge-toptier',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analysis/history')
      .then((res) => {
        setAnalyses(res.data.analyses)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const latestAnalysis = analyses[0] || null

  const formatDate = (dateStr) => (
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  )

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p>Track your placement readiness and analyze your career potential</p>
      </div>

      <div className="grid-4 fade-in fade-in-delay-1">
        <div className="glass-card stat-card">
          <div className="stat-value">{analyses.length}</div>
          <div className="stat-label">Total Analyses</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{latestAnalysis?.resume_strength || '-'}</div>
          <div className="stat-label">Resume Strength</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{latestAnalysis?.overall_confidence ? `${latestAnalysis.overall_confidence}%` : '-'}</div>
          <div className="stat-label">Confidence</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{latestAnalysis?.salary_expected ? `INR ${latestAnalysis.salary_expected}L` : '-'}</div>
          <div className="stat-label">Expected CTC</div>
        </div>
      </div>

      <div className="glass-card fade-in fade-in-delay-2" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>Ready for a new analysis?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload your latest resume and get AI-powered placement predictions</p>
        </div>
        <Link to="/analyze" className="btn btn-primary btn-lg">
          <FiUpload /> New Analysis
        </Link>
      </div>

      <div style={{ marginTop: '2rem' }} className="fade-in fade-in-delay-3">
        <div className="section-header">
          <FiClock className="icon" /> Analysis History
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading your analyses...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="icon">No data</div>
            <h3>No analyses yet</h3>
            <p>Upload your resume to get your first AI-powered placement prediction</p>
            <Link to="/analyze" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <FiUpload /> Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="grid-2">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="glass-card history-card"
                onClick={() => navigate(`/results/${analysis.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{analysis.predicted_role}</h3>
                    <span className={`badge ${TIER_BADGE[analysis.predicted_tier] || 'badge-service'}`}>
                      {analysis.predicted_tier}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      INR {analysis.salary_expected} LPA
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {analysis.overall_confidence}% confidence
                    </div>
                  </div>
                </div>
                <div className="history-meta">
                  <FiClock size={13} />
                  {formatDate(analysis.created_at)}
                  <span style={{ marginLeft: 'auto', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    View Details <FiChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
