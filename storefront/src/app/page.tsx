import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "All At Once — Tienda online",
};

export default function Page() {
  return <HomePage />;
}
