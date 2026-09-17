import type { Metadata } from "next";
import { PoliticasPage } from "@/components/static/StaticPages";

export const metadata: Metadata = {
  title: "Políticas de la tienda",
};

export default function Page() {
  return <PoliticasPage />;
}
