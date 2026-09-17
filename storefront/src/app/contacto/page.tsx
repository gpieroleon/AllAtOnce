import type { Metadata } from "next";
import { ContactoPage } from "@/components/static/StaticPages";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function Page() {
  return <ContactoPage />;
}
