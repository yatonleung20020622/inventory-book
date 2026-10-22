import "next-auth";

type UserRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string | null;
    username?: string | null;
    role?: UserRole | null;
  }
}
