import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <FavoritesClient />;
}