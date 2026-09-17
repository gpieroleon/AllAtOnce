import type { Metadata } from "next";
import RecuperarPage from "@/components/auth/RecuperarPage";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function Page() {
  return <RecuperarPage />;
}
