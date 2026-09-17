import type { Metadata } from "next";
import { Suspense } from "react";
import BuscarPage from "@/components/buscar/BuscarPage";

export const metadata: Metadata = {
  title: "Buscar",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="page container"><p className="grid__empty">Buscando…</p></div>}>
      <BuscarPage />
    </Suspense>
  );
}
