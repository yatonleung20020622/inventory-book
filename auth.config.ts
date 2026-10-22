import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = typeof token.email === "string" ? token.email : "";
        session.user.username =
          typeof token.username === "string" ? token.username : "";
        session.user.role =
          token.role === "ADMIN" || token.role === "USER"
            ? token.role
            : "USER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/items") ||
        pathname.startsWith("/locations") ||
        pathname.startsWith("/categories") ||
        pathname.startsWith("/sales") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/admin")
      ) {
        return isLoggedIn;
      }

      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
