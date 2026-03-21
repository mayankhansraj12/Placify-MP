import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FiAlertCircle, FiBarChart2, FiCheck, FiCpu, FiFile, FiSearch, FiUploadCloud, FiZap } from 'react-icons/fi'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const COMM_LEVELS = [
  { value: 1, label: '1 - Basic' },
  { value: 2, label: '2 - Conversational' },
  { value: 3, label: '3 - Proficient' },
  { value: 4, label: '4 - Fluent' },
  { value: 5, label: '5 - Native/Expert' },
]

const LOADING_STEPS = [
  { text: 'Parsing resume content...', icon: <FiSearch /> },
  { text: 'Extracting skill profiles...', icon: <FiCpu /> },
  { text: 'Running ML prediction models...', icon: <FiBarChart2 /> },
  { text: 'Generating recommendations...', icon: <FiZap /> },
]

export default function Analyze() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [aptitude, setAptitude] = useState(60)
  const [communication, setCommunication] = useState(3)
  const [codingProblems, setCodingProblems] = useState(150)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')

  const getErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail
    if (Array.isArray(detail)) {
      return detail[0]?.msg || fallback
    }
    return detail || fallback
  }

  const acceptSelectedFile = (selected) => {
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Please upload a PDF smaller than 5MB')
      return
    }
    setFile(selected)
    setError('')
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    acceptSelectedFile(event.dataTransfer.files[0])
  }

  const handleFileSelect = (event) => {
    acceptSelectedFile(event.target.files[0])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('Please upload your resume (PDF)')
      return
    }

    setError('')
    setLoading(true)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 1500)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('aptitude_score', aptitude)
      formData.append('communication_score', communication)
      formData.append('coding_problems_solved', codingProblems)

      const res = await api.post('/analysis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      clearInterval(stepInterval)
      navigate(`/results/${res.data.id}`, { state: { analysis: res.data } })
    } catch (err) {
      clearInterval(stepInterval)
      setError(getErrorMessage(err, 'Analysis failed. Please try again.'))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card analysis-loading fade-in">
          <div className="spinner"></div>
          <h2 style={{ marginBottom: '0.5rem' }}>Analyzing Your Profile</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Our AI models are processing your resume...</p>

          <div className="analysis-steps">
            {LOADING_STEPS.map((step, index) => (
              <div key={step.text} className={`analysis-step ${index < loadingStep ? 'done' : index === loadingStep ? 'active' : ''}`}>
                {index < loadingStep ? <FiCheck /> : step.icon}
                {step.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <h1>Analyze Your Profile</h1>
        <p>Upload your resume and provide additional details for a comprehensive prediction</p>
      </div>

      {error && (
        <div className="alert alert-error fade-in">
          <FiAlertCircle /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="fade-in fade-in-delay-1">
            <div className="section-header">
              <FiUploadCloud className="icon" /> Resume Upload
            </div>
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                id="resume-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {file ? (
                <>
                  <div className="upload-icon"><FiCheck /></div>
                  <div className="upload-filename">{file.name}</div>
                  <div className="upload-hint">
                    {(file.size / 1024).toFixed(0)} KB - Click to change
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-icon"><FiFile /></div>
                  <div className="upload-text">
                    Drag and drop your resume here, or <strong>click to browse</strong>
                  </div>
                  <div className="upload-hint">PDF files only - Max 5MB</div>
                </>
              )}
            </div>
          </div>

          <div className="fade-in fade-in-delay-2">
            <div className="section-header">
              <FiBarChart2 className="icon" /> Additional Details
            </div>
            <div className="glass-card">
              <div className="form-group">
                <label className="form-label">Aptitude Score</label>
                <div className="slider-container">
                  <span className="slider-value">{aptitude}/100</span>
                  <input
                    id="aptitude-score"
                    type="range"
                    min="0"
                    max="100"
                    value={aptitude}
                    onChange={(event) => setAptitude(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">English Communication Level</label>
                <select
                  id="communication-level"
                  className="form-select"
                  value={communication}
                  onChange={(event) => setCommunication(Number(event.target.value))}
                >
                  {COMM_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Coding Problems Solved (LeetCode/HackerRank)</label>
                <input
                  id="coding-problems"
                  type="number"
                  className="form-input"
                  min="0"
                  max="5000"
                  value={codingProblems}
                  onChange={(event) => setCodingProblems(Number(event.target.value))}
                  placeholder="e.g., 200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="fade-in fade-in-delay-3" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button id="analyze-submit" type="submit" className="btn btn-primary btn-lg" style={{ minWidth: 250 }}>
            <FiZap /> Analyze My Profile
          </button>
        </div>
      </form>
    </div>
  )
}
