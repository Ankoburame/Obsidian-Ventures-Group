"use client"

import { useEffect, useState } from "react"

type HistoryJob = {
  id: number
  material: string
  quantity: number
  started_at: string
  completed_at: string
  duration_minutes: number
}

export default function RefiningHistory() {
  const [jobs, setJobs] = useState<HistoryJob[]>([])

  useEffect(() => {
  fetch("http://127.0.0.1:8000/refining/history/")
    .then(res => res.json())
    .then(data => {
      console.log("REFINING HISTORY RAW =", data)
      if (Array.isArray(data)) {
        setJobs(data)
      } else {
        setJobs([])
      }
    })
}, [])


  return (
    <div
      style={{
        background: "#151a23",
        padding: 16,
        borderRadius: 8,
        border: "1px solid #222",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Historique des raffinages</h2>

      {jobs.length === 0 && (
        <div style={{ opacity: 0.6 }}>Aucun raffinage terminé</div>
      )}

      {jobs.map(job => (
        <div
          key={job.id}
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #222",
            fontSize: 14,
          }}
        >
          <strong>{job.material}</strong> — {job.quantity} SCU
          <div style={{ opacity: 0.6, fontSize: 12 }}>
            Durée : {job.duration_minutes} min
          </div>
        </div>
      ))}
    </div>
  )
}
