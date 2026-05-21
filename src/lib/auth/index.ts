import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";

const config: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: Number(process.env.SESSION_MAX_AGE ?? 604800) },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        // Non-active retail pharmacies may sign in, but the middleware confines
        // them to /pending-approval until an admin verifies the account.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          pharmacyName: user.pharmacyName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.status = (user as { status: string }).status;
        token.pharmacyName = (user as { pharmacyName: string | null }).pharmacyName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.status = token.status as string;
      session.user.pharmacyName = token.pharmacyName as string | null;
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      pharmacyName: string | null;
    };
  }
}
