import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function SuperadminLoginPage() {
  const session = await auth();

  // Si ya tiene sesión activa, redirigir al dashboard
  if (session?.user.role === "SUPERADMIN") {
    redirect("/admin/dashboard");
  }

  return <LoginForm />;
}
