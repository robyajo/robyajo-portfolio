import { getServerSession, type AuthOptions, type DefaultSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
    interface Session {
        user: { id: string } & DefaultSession["user"];
    }
}

function buildProviders(authOptionsProviders: AuthOptions["providers"]) {
    if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
        authOptionsProviders.push(
            GitHubProvider({
                clientId: process.env.GITHUB_ID,
                clientSecret: process.env.GITHUB_SECRET,
            }),
        );
    }
    if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
        authOptionsProviders.push(
            GoogleProvider({
                clientId: process.env.GOOGLE_ID,
                clientSecret: process.env.GOOGLE_SECRET,
            }),
        );
    }
}

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token }) {
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
};

buildProviders(authOptions.providers);

export interface AuthInfo {
    userId: string | null;
    name: string | null;
    image: string | null;
}

/**
 * Server-side auth: session user id stabil dari OAuth provider (token.sub).
 * Tanpa provider terkonfigurasi selalu signed-out — build & runtime aman.
 */
export async function getAuth(): Promise<AuthInfo> {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) return { userId: null, name: null, image: null };
    return { userId: user.id, name: user.name ?? null, image: user.image ?? null };
}
