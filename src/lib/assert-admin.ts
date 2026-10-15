import { getAuth } from "@/lib/auth";

export async function assertAdmin(): Promise<void> {
    const { userId } = await getAuth();
    if (userId !== process.env.OWNER_CLERK_USER_ID) {
        throw new Error("Unauthorized");
    }
}
