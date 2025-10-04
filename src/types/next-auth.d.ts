import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      storeId: string | null;
      storeSlug: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    storeId: string | null;
    storeSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    storeId: string | null;
    storeSlug: string | null;
  }
}
