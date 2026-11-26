import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/disposal",
    "/disposal/:path*",
    "/lost",
    "/lost/:path*",
    "/lent",
    "/lent/:path*",
    "/locations/:path*",
    "/location-history/:path*",
    "/travel",
    "/travel/:path*",
    "/sales",
    "/sales/:path*",
    "/profile/:path*",
    "/login",
  ],
};
