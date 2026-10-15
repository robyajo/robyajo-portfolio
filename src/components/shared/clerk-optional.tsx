"use client";

import {
    ClerkProvider,
    SignInButton as ClerkSignInButton,
    useClerk as useClerkOriginal,
    useUser as useUserOriginal,
} from "@clerk/nextjs";
import type { ReactNode } from "react";

function isConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Renders a real ClerkProvider when keys are present, otherwise
 * passes children through untouched. Lets the site build and run
 * without auth services configured.
 */
export function OptionalClerkProvider({ children }: { children: ReactNode }) {
    if (!isConfigured()) return <>{children}</>;
    return <ClerkProvider>{children}</ClerkProvider>;
}

/** Sign-in button that renders nothing when auth is not configured. */
export function SafeSignInButton(
    props: React.ComponentProps<typeof ClerkSignInButton>,
) {
    if (!isConfigured()) return null;
    return <ClerkSignInButton {...props} />;
}

type SafeUser = {
    user: null;
    isSignedIn: false;
    isLoaded: true;
};

/** useUser() that degrades to signed-out when auth is not configured. */
export function useSafeUser(): SafeUser | ReturnType<typeof useUserOriginal> {
    if (!isConfigured()) return { user: null, isSignedIn: false, isLoaded: true };
    // Config is static per build, so the hook order never changes at runtime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useUserOriginal();
}

type SafeClerk = { signOut: (...args: Array<unknown>) => Promise<void> };

/** useClerk() that degrades to a no-op when auth is not configured. */
export function useSafeClerk(): SafeClerk | ReturnType<typeof useClerkOriginal> {
    if (!isConfigured()) return { signOut: async () => {} };
    // Config is static per build, so the hook order never changes at runtime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClerkOriginal();
}
