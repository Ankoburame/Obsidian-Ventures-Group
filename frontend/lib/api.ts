/**
 * API client for Star Citizen App backend.
 * Handles all HTTP requests to the FastAPI backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Dashboard data interface
 */
export interface DashboardData {
  stock_total: number;
  estimated_stock_value: number;
  active_refining: number;
  refining_history: RefiningHistoryItem[];
}

/**
 * Refining history item interface
 */
export interface RefiningHistoryItem {
  id: number;
  material: string;
  quantity: number;
  ended_at: string;
}

/**
 * Active refining job interface
 */
export interface RefiningJob {
  id: number;
  material_name: string;
  quantity: number;
  remaining_seconds: number;
  total_seconds: number;
}

/**
 * Fetch dashboard statistics.
 * 
 * @returns Dashboard data including stock totals and refining info
 * @throws Error if the API request fails
 */
export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_URL}/dashboard/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Dashboard API error:", text);
    throw new Error(`Dashboard API failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch active refining jobs.
 * 
 * @returns Array of active refining jobs with progress information
 * @throws Error if the API request fails
 */
export async function getRefiningJobs(): Promise<RefiningJob[]> {
  const res = await fetch(`${API_URL}/refining/active`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Refining API error:", text);
    throw new Error(`Failed to fetch refining jobs: ${res.status}`);
  }

  return res.json();
}

/**
 * Format a large number with appropriate units (K, M, B).
 * 
 * @param value - Number to format
 * @returns Formatted string with unit suffix
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)} K`;
  }
  return value.toLocaleString();
}