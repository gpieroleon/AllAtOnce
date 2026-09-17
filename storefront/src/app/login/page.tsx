import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Identifícate",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
