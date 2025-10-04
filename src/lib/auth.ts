import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const config = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        storeSlug: { label: "Store Slug", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const storeSlug = credentials.storeSlug as string | undefined;

        // Intentar buscar SUPERADMIN (tabla User)
        const superadmin = await prisma.user.findUnique({
          where: { email },
        });

        if (superadmin) {
          // Verificar contraseña
          const isValid = await bcrypt.compare(password, superadmin.password);
          if (!isValid) {
            return null;
          }

          // Es SUPERADMIN
          return {
            id: superadmin.id,
            email: superadmin.email,
            name: superadmin.name,
            role: "SUPERADMIN",
            storeId: null,
            storeSlug: null,
          };
        }

        // Si no es superadmin, buscar en StoreUser (TENDERO)
        if (!storeSlug) {
          // Tenderos necesitan storeSlug
          return null;
        }

        // Buscar la tienda
        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, slug: true, isActive: true },
        });

        if (!store || !store.isActive) {
          return null;
        }

        // Buscar el StoreUser
        const storeUser = await prisma.storeUser.findUnique({
          where: {
            storeId_email: {
              storeId: store.id,
              email: email,
            },
          },
        });

        if (!storeUser || !storeUser.isActive) {
          return null;
        }

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, storeUser.password);
        if (!isValid) {
          return null;
        }

        // Es TENDERO
        return {
          id: storeUser.id,
          email: storeUser.email,
          name: storeUser.name,
          role: "STORE_OWNER",
          storeId: store.id,
          storeSlug: store.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.storeId = user.storeId;
        token.storeSlug = user.storeSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.storeId = token.storeId as string | null;
        session.user.storeSlug = token.storeSlug as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
