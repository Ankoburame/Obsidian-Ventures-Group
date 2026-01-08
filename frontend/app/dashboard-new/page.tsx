"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DashboardNewPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res1 = await fetch(API_URL + "/dashboard/");
        const res2 = await fetch(API_URL + "/refining/active");
        
        const data1 = await res1.json();
        const data2 = await res2.json();
        
        setDashboard(data1);
        setJobs(data2);
      } catch (e) {
        console.error(e);
      }
    }
    
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!dashboard) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl text-white">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 p-6 rounded">
          <div className="text-zinc-400 text-sm">Stock</div>
          <div className="text-2xl font-bold">{dashboard.stock_total} SCU</div>
        </div>
        
        <div className="bg-zinc-800 p-6 rounded">
          <div className="text-zinc-400 text-sm">Active</div>
          <div className="text-2xl font-bold">{dashboard.active_refining}</div>
        </div>
        
        <div className="bg-zinc-800 p-6 rounded">
          <div className="text-zinc-400 text-sm">Value</div>
          <div className="text-2xl font-bold text-green-400">
            {(dashboard.estimated_stock_value / 1000000000).toFixed(2)} B aUEC
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Refining</h2>
        {jobs.map(job => (
          <div key={job.id} className="bg-zinc-800 p-4 rounded mb-2">
            <div className="flex justify-between mb-2">
              <span>{job.material_name} - {job.quantity} SCU</span>
              <span>ETA: {Math.ceil(job.remaining_seconds / 60)} min</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded">
              <div 
                className="h-full bg-green-500 rounded"
                style={{width: `${((job.total_seconds - job.remaining_seconds) / job.total_seconds * 100)}%`}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}