import type { Metadata } from "next";
import CuentaPage from "@/components/cuenta/CuentaPage";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <CuentaPage />;
}
