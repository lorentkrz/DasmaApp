import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function RegisterRedirectPage() {
  // Registration is disabled. Always redirect to login.
  redirect("/auth/login")
}
