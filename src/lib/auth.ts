import { auth as clerkAuth } from "@clerk/nextjs/server";

/**
 * Whether Clerk authentication is configured.
 *
 * The portfolio is deployable without auth services: sign-in,
 * guestbook posting, blog comments, and the admin panel degrade
 * gracefully (signed-out state + empty data fallbacks) until the
 * Clerk keys are provided.
 */
export function isClerkConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

export async function getAuth(): Promise<{ userId: string | null }> {
    if (!isClerkConfigured()) return { userId: null };
    const { userId } = await clerkAuth();
    return { userId };
}
