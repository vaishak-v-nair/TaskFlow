import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";

export default async function Home() {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/login");
  }

  redirect("/dashboard");
}
