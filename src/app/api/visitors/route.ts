import { NextResponse } from "next/server";
import { deviceHash, getVisitorStats, trackVisit } from "@/lib/visitors";

/**
 * GET /api/visitors — ringkasan kunjungan (total perangkat + hari ini),
 * untuk tampilan footer. Tanpa payload dan tanpa identitas mentah.
 */
export async function GET() {
    try {
        const stats = await getVisitorStats();
        return NextResponse.json({ ok: true, visitors: stats });
    } catch (error) {
        console.error("Visitor stats failed:", error);
        return NextResponse.json(
            { error: "Stats unavailable." },
            { status: 500 },
        );
    }
}

/**
 * POST /api/visitors — catat kunjungan. Identitas: hash IP + perangkat
 * (user-agent) dengan salt sisi server; IP mentah tidak pernah disimpan.
 * Klien memanggil ini maksimal sekali per sesi sehingga tidak berisik.
 */
export async function POST(request: Request) {
    try {
        const hash = await deviceHash(request.headers);
        await trackVisit(hash, request.headers);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Visitor tracking failed:", error);
        return NextResponse.json(
            { error: "Tracking unavailable." },
            { status: 500 },
        );
    }
}
