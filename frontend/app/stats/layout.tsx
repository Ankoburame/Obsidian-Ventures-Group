import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}