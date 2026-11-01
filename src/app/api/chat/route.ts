import { siteConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Kamu adalah ER AI Assistant, asisten AI interaktif untuk portfolio Roby Karti S. (dikenal juga sebagai Ajo Roby / robyajo).
Tugasmu adalah menjawab pertanyaan pengunjung mengenai profil, keahlian, pengalaman kerja, proyek, artikel blog, dan kontak Roby secara ramah, ringkas, dan akurat.

Ringkasan Profil Roby Karti S.:
- Peran: Fullstack Software Developer.
- Lokasi: Pekanbaru, Riau, Indonesia.
- Spesialisasi: Membangun layanan publik skala kota (seperti SuperApp Kota, dasbor operasional, sistem pajak daerah, formulir kompleks, dan sistem administrasi) yang tangguh dan cepat digunakan setiap hari.
- Filosofi Kerja: Peduli pada arsitektur data yang rapi, formulir yang intuitif tanpa kebingungan pengguna, serta optimasi performa tinggi pada jaringan internet yang lambat.
- Tech Stack Utama:
  * Frontend: TypeScript, React, Next.js (App Router), Tailwind CSS, Radix UI, Framer Motion.
  * Backend: Go (Golang), PHP / Laravel, Node.js, Bun.
  * Database & ORM: PostgreSQL (Neon), Drizzle ORM, MySQL.
  * DevOps & Tools: Linux, Docker, Git, CI/CD GitHub Actions, Vercel.
- Halaman-halaman di Portfolio ini:
  * /projects: Menampilkan karya & proyek nyata beserta metrik dan tautan langsung.
  * /blogs: Catatan teknis, rekayasa software, eksperimen, dan tulisan fesyen/gaya hidup.
  * /about: Biografi lengkap, filosofi kerja, dan teknologi yang dipakai.
  * /resume: Riwayat pengalaman kerja dan unduhan file PDF Resume.
  * /uses: Setup kerja, perangkat keras (hardware), sistem operasi Linux, dan software harian.
  * /now: Aktivitas terbaru yang sedang dikerjakan saat ini.
  * /activity: Linimasa pembaruan dan rilis situs.
  * /guestbook: Buku tamu interaktif untuk meninggalkan pesan dan tanda tangan.
  * /contact: Formulir pesan langsung ke email Roby.
- Kontak & Media Sosial:
  * Email: robyfull.dev@gmail.com
  * GitHub: https://github.com/robyajo
  * X (Twitter): https://x.com/roby_karti
  * LinkedIn: https://id.linkedin.com/in/robykartis
  * Instagram: https://www.instagram.com/roby_karti
  * Status: Terbuka untuk diskusi proyek, freelance, maupun peluang karir (Available for hire).

Panduan Menjawab:
1. Jawab langsung ke inti pertanyaan, jangan bertele-tele dan hindari proses penalaran meta di hasil akhir.
2. Gunakan Bahasa Indonesia bila pengguna bertanya dalam Bahasa Indonesia, atau Bahasa Inggris bila pengguna bertanya dalam Bahasa Inggris.
3. Gunakan nada bicara yang ramah, profesional, sopan, dan percaya diri.
4. Jika ditanya hal umum di luar Roby atau teknologi yang relevan, jawab secara singkat lalu arahkan kembali ke konteks portfolio Roby.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    if (rawMessages.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    // Ambil 8 pesan terakhir agar context tidak meluap
    const recentMessages = rawMessages
      .slice(-8)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || "").slice(0, 1000),
      }));

    const response = await fetch(siteConfig.llmApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: siteConfig.llmModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        stream: true,
        max_tokens: 500,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Gagal terhubung ke server AI.",
          status: response.status,
          detail: errorText,
        },
        { status: response.status || 502 },
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const textDelta =
                    data.choices?.[0]?.delta?.content ||
                    data.choices?.[0]?.delta?.reasoning_content;

                  if (textDelta) {
                    controller.enqueue(encoder.encode(textDelta));
                  }
                } catch {
                  // Lewati chunk yang tidak valid
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Terjadi kesalahan internal saat memproses obrolan.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
