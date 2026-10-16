import { getAuth } from "@/lib/auth";

/** Lolos bila role admin ATAU id cocok dengan OWNER_USER_ID (darurat). */
export async function assertAdmin(): Promise<void> {
    const { userId, role } = await getAuth();
    if (role === "admin") return;
    if (userId && userId === process.env.OWNER_USER_ID) return;
    throw new Error("Unauthorized");
}

/** True bila sesi saat ini admin (untuk UI). */
export async function isAdmin(): Promise<boolean> {
    try {
        await assertAdmin();
        return true;
    } catch {
        return false;
    }
}
