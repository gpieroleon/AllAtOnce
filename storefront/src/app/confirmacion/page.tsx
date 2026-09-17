import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmacionPage from "@/components/checkout/ConfirmacionPage";

export const metadata: Metadata = {
  title: "Confirmación del pedido",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="page container"><p className="grid__empty">Cargando…</p></div>}>
      <ConfirmacionPage />
    </Suspense>
  );
}
