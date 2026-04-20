import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const BACKEND_JWT_SECRET = process.env.JWT_SECRET || 'super_secret_instalook_jwt_key_2026';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "silent-login",
      name: "Silent Login",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userId) return null;
        const user = await prisma.user.findUnique({
          where: { id: credentials.userId as string },
        });
        return user ? (user as any) : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.phone = token.phone;

        const backendToken = jwt.sign(
          { userId: token.id, role: token.role || 'USER' },
          BACKEND_JWT_SECRET,
          { expiresIn: '30d' }
        );

        session.backendToken = backendToken;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
        if (!cart) await prisma.cart.create({ data: { userId: user.id } });

        const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id } });
        if (!wishlist) await prisma.wishlist.create({ data: { userId: user.id } });
      }
    }
  }
});
