import type { Metadata } from "next";
import CategoryPage from "@/components/categoria/CategoryPage";

export const metadata: Metadata = {
  title: "Categoría",
};

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { cat: string } }) {
  return <CategoryPage cat={decodeURIComponent(params.cat)} />;
}
