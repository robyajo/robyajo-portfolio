"use client";

import { SessionProvider, signIn, signOut as nextSignOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

/** Session provider — tidak butuh kunci apa pun untuk render. */
export function AuthProvider({ children }: { children: ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}

interface SignInProps {
    mode?: string;
    forceRedirectUrl?: string;
    signUpForceRedirectUrl?: string;
    children: ReactNode;
}

/** Tombol masuk: tanpa provider terkonfigurasi, NextAuth menampilkan halaman bantuannya. */
export function SafeSignInButton({ children }: SignInProps) {
    return (
        <span onClick={() => void signIn()} style={{ display: "contents" }}>
            {children}
        </span>
    );
}

export interface SafeUserShape {
    id: string;
    fullName: string | null;
    username: string | null;
    imageUrl: string;
    primaryEmailAddress?: { emailAddress: string };
}

/** Pengganti useUser(): bentuk data sama, sumbernya sesi NextAuth. */
export function useSafeUser(): {
    user: SafeUserShape | null;
    isSignedIn: boolean;
    isLoaded: boolean;
} {
    const { data: session, status } = useSession();
    const u = session?.user;
    if (!u) return { user: null, isSignedIn: false, isLoaded: status !== "loading" };
    return {
        user: {
            id: u.id,
            fullName: u.name ?? null,
            username: null,
            imageUrl: u.image ?? "",
            primaryEmailAddress: u.email ? { emailAddress: u.email } : undefined,
        },
        isSignedIn: true,
        isLoaded: true,
    };
}

/** Pengganti sign-out terisolasi: hanya signOut, redirectUrl dipetakan ke callbackUrl. */
export function useSafeSignOut(): {
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
} {
    return {
        signOut: async (options) => {
            await nextSignOut({ callbackUrl: options?.redirectUrl ?? "/" });
        },
    };
}
