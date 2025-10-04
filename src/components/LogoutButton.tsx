"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  callbackUrl?: string;
}

export default function LogoutButton({
  callbackUrl = "/admin/login",
}: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-800"
    >
      Cerrar sesión
    </button>
  );
}
