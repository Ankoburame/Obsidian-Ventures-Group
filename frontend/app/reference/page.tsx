"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferencePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/reference/refining");
  }, [router]);
  
  return null;
}