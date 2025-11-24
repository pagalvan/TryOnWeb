import { getAuthenticatedUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user || user.role !== "admin") {
    redirect("/")
  }

  return <>{children}</>
}
