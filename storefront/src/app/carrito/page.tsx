import type { Metadata } from "next";
import CarritoPage from "@/components/carrito/CarritoPage";

export const metadata: Metadata = {
  title: "Tu cesta",
};

export default function Page() {
  return <CarritoPage />;
}
