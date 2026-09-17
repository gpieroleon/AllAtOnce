import type { Metadata } from "next";
import { SobreNosotrosPage } from "@/components/static/StaticPages";

export const metadata: Metadata = {
  title: "Sobre nosotros",
};

export default function Page() {
  return <SobreNosotrosPage />;
}
