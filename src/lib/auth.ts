import { getServerSession, type AuthOptions, type DefaultSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type UserRole } from "@/lib/schema";
import { loginSchema, normalizeEmail, verifyPassword } from "@/lib/credentials";

declare module "next-auth" {
    interface Session {
        user: { id: string; role: UserRole } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid?: string;
        role?: UserRole;
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
    authOptionsProviders.push(
        CredentialsProvider({
            id: "credentials",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(raw) {
                const parsed = loginSchema.safeParse(raw ?? {});
                if (!parsed.success) return null;
                const email = normalizeEmail(parsed.data.email);
                const [row] = await db
                    .select({
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                        role: users.role,
                        passwordHash: users.passwordHash,
                    })
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);
                if (!row) return null;
                const ok = await verifyPassword(parsed.data.password, row.passwordHash);
                if (!ok) return null;
                return {
                    id: String(row.id),
                    name: row.name,
                    email: row.email,
                    image: row.image,
                    role: row.role as UserRole,
                };
            },
        }),
    );
}

async function findOrCreateOAuthUser(profile: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
}): Promise<{ id: number; role: UserRole } | null> {
    if (!profile.email) return null;
    const email = normalizeEmail(profile.email);
    const [existing] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    if (existing) return { id: existing.id, role: existing.role as UserRole };
    const [created] = await db
        .insert(users)
        .values({
            email,
            name: profile.name ?? null,
            image: profile.image ?? null,
            // OAuth users have no local password; unusable random hash.
            passwordHash: `oauth:${email}`,
            role: "guest",
        })
        .returning({ id: users.id, role: users.role });
    if (!created) return null;
    return { id: created.id, role: created.role as UserRole };
}

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                if (account?.provider === "credentials") {
                    token.uid = user.id;
                    token.role = (user as { role?: UserRole }).role ?? "guest";
                    return token;
                }
                const profile = {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
                const row = await findOrCreateOAuthUser(profile);
                if (row) {
                    token.uid = String(row.id);
                    token.role = row.role;
                    return token;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                if (token.uid) session.user.id = token.uid;
                else if (token.sub) session.user.id = token.sub;
                session.user.role = token.role ?? "guest";
            }
            return session;
        },
    },
};

buildProviders(authOptions.providers);

export interface OAuthProviderInfo {
    id: string;
    label: string;
}

/** OAuth providers yang aktif (untuk tombol di halaman login). */
export function getOAuthProviders(): OAuthProviderInfo[] {
    const out: OAuthProviderInfo[] = [];
    if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
        out.push({ id: "github", label: "GitHub" });
    }
    if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
        out.push({ id: "google", label: "Google" });
    }
    return out;
}

export interface AuthInfo {
    userId: string | null;
    role: UserRole | null;
    name: string | null;
    image: string | null;
}

/**
 * Server-side auth: id numerik baris users untuk semua metode login,
 * plus role (guest/admin). Tanpa sesi selalu signed-out.
 */
export async function getAuth(): Promise<AuthInfo> {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) return { userId: null, role: null, name: null, image: null };
    return {
        userId: user.id,
        role: user.role ?? "guest",
        name: user.name ?? null,
        image: user.image ?? null,
    };
}
