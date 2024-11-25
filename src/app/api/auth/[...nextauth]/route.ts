import NextAuth from "next-auth";
import { uuidv7 as UuidV7 } from "uuidv7";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorize } from "@/app/dependencies/dataBackend/auth";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Anonymous" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        return credentials ? await authorize(credentials.username, credentials.password) : null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 3 * 60 * 60,
    async generateSessionToken() {
      return UuidV7();
    }
  }
});

export { handler as GET, handler as POST };