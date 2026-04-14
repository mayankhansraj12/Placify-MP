import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import ScrollScene from '../components/ScrollScene'
import logo from '../assets/logo.png'
import LandingFooter from '../components/LandingFooter'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const COMM_LEVELS = [
  { value: 1, label: '1 — Basic' },
  { value: 2, label: '2 — Conversational' },
  { value: 3, label: '3 — Proficient' },
  { value: 4, label: '4 — Fluent' },
  { value: 5, label: '5 — Native / Expert' },
]

export default function Analyze() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [aptitude, setAptitude] = useState(85)
  const [communication, setCommunication] = useState(3)
  const [codingProblems, setCodingProblems] = useState(124)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const getErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail
    if (Array.isArray(detail)) return detail[0]?.msg || fallback
    return detail || fallback
  }

  const acceptSelectedFile = (selected) => {
    if (!selected) return
    if (selected.type !== 'application/pdf') { setError('Please upload a PDF file'); return }
    if (selected.size > MAX_FILE_SIZE) { setError('File must be smaller than 5MB'); return }
    setFile(selected); setError('')
  }

  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop      = (e) => { e.preventDefault(); setDragOver(false); acceptSelectedFile(e.dataTransfer.files[0]) }
  const handleFileSelect= (e) => acceptSelectedFile(e.target.files[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please upload your resume (PDF)'); return }
    setError(''); setLoading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('aptitude_score', aptitude)
      formData.append('communication_score', communication)
      formData.append('coding_problems_solved', codingProblems)
      const res = await api.post('/analysis', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate(`/results/${res.data.id}`, { state: { analysis: res.data } })
    } catch (err) {
      setError(getErrorMessage(err, 'Analysis failed. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="bg-background ethereal-bg font-body text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-40 opacity-50 mix-blend-multiply">
        <ScrollScene scrollProgress={0.4} />
      </div>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center pt-16 pb-16 md:pt-24 md:pb-24 px-6 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <header className="text-center mb-8 md:mb-16 space-y-4">
          <h1 className="text-3xl md:text-7xl font-black font-headline tracking-tighter text-on-surface leading-none">
            Analyze <span className="text-primary">Intelligence.</span>
          </h1>
          <p className="text-sm md:text-lg text-on-surface-variant max-w-xl mx-auto font-light">
            Upload your portfolio and calibrate your core competencies for high-precision career placement matching.
          </p>
        </header>

        {error && (
          <div className="w-full max-w-2xl mb-8 p-4 bg-primary/5 border border-primary/10 rounded-xl text-center text-primary font-bold">
            {error}
          </div>
        )}

        {/* Dynamic Grid Layout */}
        <form onSubmit={handleSubmit} className="w-full pointer-events-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 w-full items-stretch">
            
            {/* Left: Upload Dropzone */}
            <section className="lg:col-span-7 group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`h-full min-h-[200px] md:min-h-[320px] border-2 border-dashed ${dragOver ? 'border-primary bg-primary-container/20' : 'border-primary-container'} rounded-[2rem] bg-surface-container-lowest/30 backdrop-blur-md p-6 md:p-12 flex flex-col items-center justify-center hover:border-primary hover:bg-surface-container-lowest/60 group-hover:shadow-[0_40px_80px_rgba(9,98,160,0.08)] relative overflow-hidden cursor-pointer`}
                style={{ transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
              >
                {/* Atmospheric Glow Background */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-container/20 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary-container/20 blur-[100px] rounded-full"></div>
                
                <input id="resume-upload" ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                  {file ? (
                    <>
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-primary-container/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-110">
                        <span className="material-symbols-outlined text-3xl md:text-5xl text-primary">check_circle</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-headline font-bold tracking-tight text-primary">{file.name}</h3>
                        <p className="text-primary/60 font-medium">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-primary-container/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-110">
                        <span className="material-symbols-outlined text-3xl md:text-5xl text-primary">cloud_upload</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-3xl font-headline font-bold tracking-tight text-on-surface">Upload Portfolio</h3>
                        <p className="text-on-surface-variant font-medium">Drag and drop your PDF file here</p>
                      </div>
                    </>
                  )}
                  
                  <button type="button" className="mt-4 px-5 py-2 md:px-8 md:py-3 bg-surface-container-highest/50 rounded-full font-headline font-bold text-sm tracking-tighter uppercase border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
                    Browse Files
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Configuration Controls */}
            <section className="lg:col-span-5">
              <div className="glass-card h-full rounded-[2rem] p-6 md:p-10 space-y-6 md:space-y-10 shadow-card flex flex-col bg-white/50">
                <h4 className="text-base md:text-xl font-headline font-bold tracking-tight border-b border-outline-variant/10 pb-6 text-[#111111]">Calibration Profiles</h4>
                
                {/* Aptitude Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Aptitude Score</label>
                    <span className="text-primary font-bold font-headline text-2xl">{aptitude}<span className="text-xs text-on-surface-variant/60 ml-1">%</span></span>
                  </div>
                  <input className="w-full" max="100" min="0" type="range" value={aptitude} onChange={(e) => setAptitude(Number(e.target.value))} />
                </div>

                {/* Communication Dropdown */}
                <div className="space-y-4">
                  <label className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Communication Style</label>
                  <div className="relative">
                    <select value={communication} onChange={(e) => setCommunication(Number(e.target.value))} className="w-full bg-white/60 border border-outline-variant/20 rounded-xl px-4 py-4 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface font-medium cursor-pointer">
                      {COMM_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                  </div>
                </div>

                {/* Solved Problems Numeric */}
                <div className="space-y-4">
                  <label className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Complex Problems Solved</label>
                  <div className="flex items-center bg-white/60 border border-outline-variant/20 rounded-xl overflow-hidden group focus-within:ring-2 focus-within:ring-primary">
                    <span className="material-symbols-outlined px-4 text-on-surface-variant">terminal</span>
                    <input className="w-full border-none bg-transparent py-4 text-on-surface font-bold focus:ring-0 outline-none" placeholder="000" type="number" min="0" value={codingProblems} onChange={(e) => setCodingProblems(Number(e.target.value))} />
                  </div>
                </div>

                <div className="mt-auto pt-6 text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Calibration Active</p>
                </div>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="mt-8 md:mt-20 w-full max-w-xl mx-auto flex flex-col items-center">
            <button disabled={loading} type="submit" className="group w-full relative overflow-hidden py-4 md:py-8 px-6 md:px-12 bg-primary text-white rounded-[2rem] font-headline font-black text-lg md:text-3xl tracking-tighter uppercase transition-all duration-500 hover:shadow-[0_20px_60px_rgba(9,98,160,0.4)] active:scale-95 disabled:opacity-50">
              <div className="absolute inset-0 bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-center gap-6">
                <span>{loading ? 'Processing Neural Data...' : 'Launch AI Engine'}</span>
                <span className={`material-symbols-outlined text-2xl md:text-4xl ${loading ? 'animate-spin' : 'animate-pulse'}`}>{loading ? 'sync' : 'bolt'}</span>
              </div>
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-secondary-container/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            </button>
            <p className="text-center mt-6 text-on-surface-variant/60 font-medium text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              Data is encrypted and processed in isolated VPC environments.
            </p>
          </div>
        </form>
      </main>
      <LandingFooter />

      {false && (
      <footer className="w-full py-16 px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-on-surface-variant relative z-10 bg-white/40 border-t border-outline-variant/10 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        <div className="md:col-span-1 space-y-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Placify AI" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#111111] font-headline">Placify AI</span>
          </div>
          <p className="text-on-surface-variant text-sm font-body leading-relaxed">
            The future of precision recruitment. Engineered for speed, built for intelligence.
          </p>
        </div>
        <div className="space-y-4 relative z-10">
          <h5 className="text-[#111111] font-medium text-sm">Solutions</h5>
          <div className="flex flex-col gap-3">
            <Link className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 text-sm" to="#">Portfolio Analysis</Link>
            <Link className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 text-sm" to="#">Skill Calibration</Link>
          </div>
        </div>
        <div className="space-y-4 relative z-10">
          <h5 className="text-[#111111] font-medium text-sm">Company</h5>
          <div className="flex flex-col gap-3">
            <Link className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 text-sm" to="#">Privacy</Link>
            <Link className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 text-sm" to="#">Terms</Link>
          </div>
        </div>
        <div className="space-y-4 relative z-10">
          <h5 className="text-[#111111] font-medium text-sm">Legal</h5>
          <p className="text-on-surface-variant text-xs leading-relaxed">© 2026 Placify AI. All rights reserved. Prices in ₹.</p>
          <div className="flex gap-4 mt-2">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-[#111111] cursor-pointer transition-colors">public</span>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-[#111111] cursor-pointer transition-colors">share</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
