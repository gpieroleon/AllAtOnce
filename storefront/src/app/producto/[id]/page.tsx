import type { Metadata } from "next";
import ProductoPage from "@/components/producto/ProductoPage";

export const metadata: Metadata = {
  title: "Producto",
};

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return <ProductoPage id={decodeURIComponent(params.id)} />;
}
