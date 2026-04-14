import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [users] = await pool.execute<RowDataPacket[]>(
          "SELECT * FROM users WHERE email = ?",
          [credentials.email]
        );

        const user = users[0];

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretkey9999",
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const [existingUsers] = await pool.execute<RowDataPacket[]>(
          "SELECT * FROM users WHERE email = ?",
          [user.email]
        );

        if (existingUsers.length === 0) {
          const id = uuidv4();
          await pool.execute(
            "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
            [id, user.email || "", user.name || "", user.image || null]
          );
          (user as any).id = id;
        } else {
          await pool.execute(
            "UPDATE users SET name = ?, image = ? WHERE email = ?",
            [user.name || "", user.image || null, user.email || ""]
          );
          (user as any).id = existingUsers[0].id;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

