"use client"

import { useEffect, useState } from "react"

type Commodity = {
  id: number
  name: string
  code: string
  price_buy: number
  price_sell: number
}

export function CommodityGrid({
  onSelect,
}: {
  onSelect: (commodity: Commodity) => void
}) {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/market/commodities")
      .then(res => res.json())
      .then(data => {
        setCommodities(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <p className="text-zinc-400">Chargement des commodities…</p>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {commodities.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className="p-4 bg-zinc-900 border border-zinc-800 rounded hover:border-cyan-400 text-left"
        >
          <div className="font-semibold">{c.name}</div>
          <div className="text-sm text-zinc-400">{c.code}</div>
          <div className="text-sm mt-1">
            Sell: <span className="text-cyan-400">{c.price_sell}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
