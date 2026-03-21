import jsPDF from 'jspdf'

export function generateReport(results, userName) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Placify AI', 15, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Placement Prediction Report', 15, 28)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 15, 35)
  if (userName) {
    doc.text(`Candidate: ${userName}`, pageWidth - 15, 35, { align: 'right' })
  }

  y = 52

  const addSection = (title) => {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(99, 102, 241)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 15, y)
    doc.setDrawColor(99, 102, 241)
    doc.line(15, y + 2, pageWidth - 15, y + 2)
    y += 10
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
  }

  const addRow = (label, value) => {
    if (y > 275) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(label, 20, y)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), 100, y)
    y += 7
  }

  addSection('Prediction Summary')
  addRow('Predicted Role:', results.predicted_role)
  addRow('Company Tier:', results.predicted_tier)
  addRow('Confidence:', `${results.overall_confidence}%`)
  addRow('FAANG Probability:', `${results.faang_probability}%`)
  addRow('Resume Strength:', `${results.resume_strength}/100`)
  addRow('Industry Readiness:', `${results.industry_readiness}%`)
  addRow('Peer Percentile:', `Top ${100 - results.peer_percentile}%`)
  y += 5

  addSection('Expected Salary')
  addRow('Expected CTC:', `INR ${results.salary_range.expected} LPA`)
  addRow('Salary Range:', `INR ${results.salary_range.low} - INR ${results.salary_range.high} LPA`)
  y += 5

  addSection('Domain-wise Skill Scores')
  if (results.domain_scores) {
    Object.entries(results.domain_scores).forEach(([domain, score]) => {
      addRow(`${domain}:`, `${score}/100`)
    })
  }
  y += 5

  addSection('Top Predicted Roles')
  if (results.top_roles) {
    results.top_roles.forEach((role, index) => {
      addRow(`${index + 1}. ${role.role}:`, `${role.probability}%`)
    })
  }
  y += 5

  addSection('Skill Gap Analysis')
  if (results.skill_gaps) {
    results.skill_gaps.forEach((gap) => {
      if (y > 265) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      if (gap.status === 'strong') doc.setTextColor(16, 185, 129)
      else if (gap.status === 'moderate') doc.setTextColor(245, 158, 11)
      else doc.setTextColor(239, 68, 68)
      doc.text(`${gap.skill} [${gap.status.toUpperCase()}]`, 20, y)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.text(`Score: ${gap.current_score}/${gap.target_score}`, 100, y)
      y += 6
      if (gap.recommendation) {
        const lines = doc.splitTextToSize(gap.recommendation, pageWidth - 40)
        doc.setFontSize(9)
        doc.text(lines, 25, y)
        y += lines.length * 5 + 2
        doc.setFontSize(10)
      }
    })
  }
  y += 5

  if (results.quick_actions && results.quick_actions.length > 0) {
    addSection('Quick Improvement Actions')
    results.quick_actions.forEach((action, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const lines = doc.splitTextToSize(`${index + 1}. ${action}`, pageWidth - 40)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 3
    })
    y += 5
  }

  if (results.target_companies && results.target_companies.length > 0) {
    addSection('Target Companies')
    addRow('Companies:', results.target_companies.join(', '))
    y += 5
  }

  if (results.interview_tips && results.interview_tips.length > 0) {
    addSection('Interview Preparation Tips')
    results.interview_tips.forEach((tip, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const lines = doc.splitTextToSize(`${index + 1}. ${tip}`, pageWidth - 40)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 3
    })
  }

  const totalPages = doc.internal.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Placify AI Report - Page ${page} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    )
  }

  doc.save(`Placify_AI_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
}
