import type { Metadata } from "next";
import { Suspense } from "react";
import AdminPage from "@/components/admin/AdminPage";

export const metadata: Metadata = {
  title: "Panel de administración",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "sans-serif" }}>Cargando panel…</div>}>
      <AdminPage />
    </Suspense>
  );
}
