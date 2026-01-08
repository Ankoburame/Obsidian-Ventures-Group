type Props = {
  title: string
  value: string | number
}

export default function StatCard({ title, value }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-2xl font-bold text-cyan-400">{value}</p>
    </div>
  )
}
