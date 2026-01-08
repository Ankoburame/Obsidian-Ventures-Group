export interface Commodity {
  id: number
  name: string
  code: string
  kind: string
  price_buy: number | null
  price_sell: number | null
  is_available: boolean
  is_available_live: boolean
}

export interface CommodityHistoryPoint {
  collected_at: string
  price_sell: number
}
