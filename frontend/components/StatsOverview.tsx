"use client"

import { useEffect, useState } from "react"

type DashboardStats = {
  stock_total: number
  active_refining: number
  estimated_stock_value: number
}


/* =========================
   Small Stat Card Component
   ========================= */
function Stat({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <div
      style={{
        background: "#151a23",
        padding: 16,
        borderRadius: 8,
        border: "1px solid #222",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: "bold" }}>{value}</div>
    </div>
  )
}

/* =========================
   Dashboard Overview
   ========================= */
export default function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    // Initial load
    fetch("http://127.0.0.1:8000/dashboard/")
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)

    // WebSocket live updates
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/dashboard/")

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "DASHBOARD_UPDATE") {
        setStats(data.payload)
      }
    }

    return () => ws.close()
  }, [])

  if (!stats) return <p>Chargement…</p>

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      <Stat title="Stock total" value={`${stats.stock_total} SCU`} />
      <Stat title="Raffinages actifs" value={stats.active_refining} />
      <Stat title="Valeur estimé du stock" value={`${stats.estimated_stock_value.toFixed()} aUEC`} />
    </div>
  )
}
