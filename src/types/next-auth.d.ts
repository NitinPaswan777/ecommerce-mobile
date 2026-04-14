import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth`, contains the session data.
   */
  interface Session {
    backendToken?: string;
    user: {
      id?: string;
      role?: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id?: string;
    role?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `auth`, when using JWT sessions.
   */
  interface JWT {
    id?: string;
    role?: string;
    phone?: string;
  }
}
