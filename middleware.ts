import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/locations/:path*",
    "/profile/:path*",
    "/login",
  ],
};
