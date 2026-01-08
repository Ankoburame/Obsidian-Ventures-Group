"use client"

import { useEffect, useState } from "react"

/* =======================
   TYPES
======================= */

type RefiningJob = {
  id: number
  material_name: string
  quantity: number
  remaining_seconds: number
  total_seconds: number
}

/* =======================
   INTERNAL STATE
======================= */

type LiveJob = RefiningJob & {
  remaining: number
}

/* =======================
   COMPONENT
======================= */

export default function RefiningLive() {
  const [jobs, setJobs] = useState<LiveJob[]>([])
  const [loading, setLoading] = useState(true)

  /* =======================
     FETCH (SOURCE OF TRUTH)
  ======================= */

  useEffect(() => {
    let mounted = true

    const fetchJobs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/refining/active")
        if (!res.ok) throw new Error()

        const data: RefiningJob[] = await res.json()
        if (!mounted) return

        if (Array.isArray(data)) {
          const mapped: LiveJob[] = data
            .filter(j => j.remaining_seconds > 0)
            .map(j => ({
              ...j,
              remaining: j.remaining_seconds,
            }))

          setJobs(mapped)
        } else {
          setJobs([])
        }
      } catch {
        if (mounted) setJobs([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchJobs()
    const sync = setInterval(fetchJobs, 5000)

    return () => {
      mounted = false
      clearInterval(sync)
    }
  }, [])

  /* =======================
     LOCAL TIMER (1s)
  ======================= */

  useEffect(() => {
    const tick = setInterval(() => {
      setJobs(prev =>
        prev
          .map(job => ({
            ...job,
            remaining: Math.max(0, job.remaining - 1),
          }))
          .filter(job => job.remaining > 0)
      )
    }, 1000)

    return () => clearInterval(tick)
  }, [])

  /* =======================
     STATES
  ======================= */

  if (loading) {
    return <p style={{ opacity: 0.7 }}>Chargement des raffinages…</p>
  }

  return (
    <div
      style={{
        background: "#151a23",
        padding: 20,
        borderRadius: 10,
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ marginBottom: 16 }}>Raffinages en cours</h2>

      {jobs.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          Aucun raffinage en cours
        </div>
      )}

      {jobs.map(job => {
        const minutes = Math.floor(job.remaining / 60)
        const seconds = job.remaining % 60

        const progress =
          job.total_seconds > 0
            ? 1 - job.remaining / job.total_seconds
            : 1

        return (
          <div
            key={job.id}
            style={{
              marginBottom: 14,
              padding: 14,
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>
              {job.material_name} — {job.quantity} SCU
            </strong>

            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                marginTop: 4,
              }}
            >
              ⏳ {minutes}m {seconds.toString().padStart(2, "0")}s restantes
            </div>

            <div
              style={{
                marginTop: 8,
                height: 6,
                background: "#020617",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e, #4ade80)",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
