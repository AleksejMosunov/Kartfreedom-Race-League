import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isValidAdminSession, AUTH_COOKIE_NAME } from "@/lib/auth";
import StatsClient from "./StatsClient";

export default async function StatsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(token);
  if (!isAdmin) return notFound();
  return <StatsClient />;
}
