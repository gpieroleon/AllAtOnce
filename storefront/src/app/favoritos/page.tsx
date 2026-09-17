import type { Metadata } from "next";
import FavoritosPage from "@/components/favoritos/FavoritosPage";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function Page() {
  return <FavoritosPage />;
}
