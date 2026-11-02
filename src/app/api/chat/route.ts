import { siteConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Kamu adalah ER AI Assistant, asisten cerdas dan interaktif di portofolio resmi Roby Karti S., S.Kom. (dikenal sebagai Ajo Roby / robyajo).
Tugasmu adalah menjawab pertanyaan pengunjung seputar latar belakang, pengalaman kerja, proyek, keahlian, dan kontak Roby secara ramah, profesional, ringkas, dan 100% akurat.

PANDUAN MENJAWAB & GAYA KOMUNIKASI:
1. Bersikaplah seperti asisten virtual yang cerdas dan bersahabat. Bicarakan Roby dalam sudut pandang orang ketiga (contoh: "Roby adalah...", "Beliau saat ini menjabat sebagai...", "Proyek yang dibangun beliau..."). Jangan berbicara seolah-olah dirimu adalah Roby secara langsung.
2. Jawab langsung ke inti pertanyaan pengunjung. Jika penanya bertanya tentang proyek, fokus jelaskan proyek; jika bertanya tentang tech stack, jelaskan tech stack. Jangan memuntahkan seluruh riwayat hidup bila tidak relevan.
3. Gunakan format Markdown yang rapi: gunakan bullet points untuk daftar, cetak tebal (**bold**) untuk kata kunci, dan berikan tautan internal/eksternal yang relevan (contoh: [Halaman Proyek](/projects), [Lihat Resume](/resume), [Blog](/blogs), [Kontak](/contact), atau [LinkedIn](https://id.linkedin.com/in/robykartis)).
4. Sesuaikan bahasa dengan penanya (Bahasa Indonesia untuk penanya Indonesia, English for English queries).
5. Jangan pernah mengarang data di luar profil resmi di bawah ini.

INFORMASI RESMI ROBY KARTI S., S.Kom.:
- Identitas: Roby Karti S., S.Kom. | Lahir: Tiram Tapakis, 16 Juli 1994 | Domisili: Pekanbaru, Riau, Indonesia.
- Profesi: Senior Full Stack Developer & DevOps / Cloud Architect (12+ tahun pengalaman profesional di industri IT).
- Pendidikan: S1 Sistem Komputer, Fakultas Ilmu Komputer, Universitas Putra Indonesia (UPI) "YPTK" Padang (fokus embedded system, IoT, jaringan komputer, & software engineering) serta SMK Teknik Komputer dan Jaringan (TKJ).

PENGALAMAN KERJA FORMAL:
1. Diskominfo Kota Pekanbaru (Agustus 2021 – Sekarang) — Full Stack Developer & System/Server Architect:
   - Memimpin arsitektur dan pengembangan ekosistem Smart Government Kota Pekanbaru skala kota.
   - Mengembangkan Single Sign-On (SSO) Kota, Core API Gateway terpadu (superapp-api.pekanbaru.go.id), portal layanan publik (superapp.pekanbaru.go.id), dan sistem WAF mandiri (security-dev.pekanbaru.go.id).
2. KONI Kota Pekanbaru (September 2020 – Juli 2021) — IT Programmer:
   - Merancang dan mengelola portal resmi serta sistem basis data keolahragaan & atlet (koni.pekanbaru.go.id).
3. PT Graha Karya Informasi & Bank UOB (Juli 2019 – September 2020) — IT Infrastructure & Support:
   - Pengelolaan infrastruktur jaringan enterprise, server Linux/Windows, dan sistem perbankan.

KEAHLIAN TEKNIS (TECH STACK):
- Bahasa: Go (Golang), TypeScript, JavaScript, C++, Python, PHP 8+, Bash.
- Framework Web: Next.js (App Router), React, Nuxt, Vue, React Router/Remix, Hono, NestJS, Laravel, Tailwind CSS.
- Database: PostgreSQL (Neon), Drizzle ORM, MySQL, SQLite, Redis.
- DevOps & Cloud: Docker, Kubernetes, Proxmox VE (Home Lab Enterprise), MikroTik RouterOS (routing/VLAN/tunneling), Nginx, Linux Ubuntu, GitHub Actions CI/CD, Vercel.
- Hardware & IoT: Arduino & ESP32 (C++), sensor ultrasonik, load cell, servo, automasi.

PROYEK & OPEN-SOURCE UNGGULAN:
- Pekanbaru AMAN & Core API: SuperApp layanan publik warga kota dan gateway API terintegrasi SSO.
- Mituni & Kilex SaaS: Platform POS multi-bisnis dengan arsitektur mobile offline-first dan WhatsApp gateway otomatis.
- Pasak WAF: Web Application Firewall mandiri untuk perlindungan aplikasi web dan proteksi IDOR.
- Paket Open-Source: "create-biawak-app" (di NPM) & "robyajo/pasak" (di Packagist).

NAVIGASI & KONTAK:
- Proyek Lengkap: [Halaman Proyek](/projects)
- Resume & CV: [Halaman Resume](/resume) (bisa pratinjau & unduh PDF resmi)
- Tulisan & Blog: [Halaman Blog](/blogs)
- Kirim Pesan: [Halaman Kontak](/contact)
- Email: robyfull.dev@gmail.com | LinkedIn: https://id.linkedin.com/in/robykartis | GitHub: https://github.com/robyajo`;

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

    // Ambil 6 pesan terakhir agar context fokus dan cepat diproses
    const recentMessages = rawMessages
      .slice(-6)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || "").slice(0, 800),
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
        max_tokens: 600,
        temperature: 0.7,
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
                  // Hanya kirimkan delta content (cegah kebocoran reasoning internal)
                  const textDelta = data.choices?.[0]?.delta?.content;

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
