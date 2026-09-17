import type { Metadata } from "next";
import AdminLoginPage from "@/components/admin/AdminLoginPage";

export const metadata: Metadata = {
  title: "Acceso del equipo",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminLoginPage />;
}
