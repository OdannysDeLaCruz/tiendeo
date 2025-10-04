import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminRootPage() {
  const session = await auth();

  if (session?.user.role === "SUPERADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/admin/login");
  }
}
