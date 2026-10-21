import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string | null;
    username?: string | null;
  }
}
