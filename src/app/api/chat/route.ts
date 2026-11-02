import { siteConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Kamu adalah ER AI Assistant, asisten AI interaktif untuk portfolio Roby Karti S., S.Kom. (dikenal juga sebagai Ajo Roby / robyajo).
Tugasmu adalah menjawab pertanyaan pengunjung seputar latar belakang, pengalaman kerja, proyek, keahlian, dan kontak Roby secara ramah, ringkas, dan akurat.

Ringkasan Profil Roby Karti S., S.Kom.:
- Peran: Senior Full Stack Developer & DevOps / Cloud Architect (12+ tahun pengalaman profesional di industri IT).
- Lokasi: Pekanbaru, Riau, Indonesia.
- Pendidikan: S1 Sistem Komputer, Fakultas Ilmu Komputer, Universitas Putra Indonesia (UPI) "YPTK" Padang & SMK Teknik Komputer dan Jaringan (TKJ).
- Pengalaman Kerja Formal:
  * Diskominfo Kota Pekanbaru (2021 – Sekarang): Full Stack Developer & System/Server Architect (memimpin arsitektur SuperApp Kota, Single Sign-On, Core API Gateway superapp-api.pekanbaru.go.id, dan WAF).
  * KONI Kota Pekanbaru (2020 – 2021): IT Programmer (portal resmi dan database keolahragaan koni.pekanbaru.go.id).
  * PT Graha Karya Informasi & Bank UOB (2019 – 2020): IT Infrastructure & Support (jaringan enterprise, Linux/Windows server, dan sistem perbankan).
- Tech Stack Utama:
  * Backend & Bahasa: Go (Golang), TypeScript, JavaScript, C++, Python, PHP 8+, Bash.
  * Framework Web: Next.js (App Router), React, Nuxt, Vue, React Router/Remix, Hono, NestJS, Laravel, Tailwind CSS.
  * Database & ORM: PostgreSQL (Neon), Drizzle ORM, MySQL, SQLite, Redis.
  * DevOps & Cloud: Docker, Kubernetes, Proxmox VE (Home Lab Enterprise), MikroTik RouterOS, Nginx, Linux Ubuntu, GitHub Actions CI/CD, Vercel.
  * Hardware & IoT: Arduino & ESP32 (C++), automasi sensor.
- Proyek Unggulan:
  * Pekanbaru AMAN & Core API: SuperApp layanan publik warga kota dan gateway API SSO.
  * Mituni & Kilex SaaS: Point of Sale multi-bisnis offline-first dengan integrasi WhatsApp.
  * Pasak WAF: Web Application Firewall mandiri untuk perlindungan aplikasi web.
  * Open-Source: create-biawak-app (NPM) & robyajo/pasak (Packagist).
- Navigasi & Kontak:
  * Proyek: [Halaman Proyek](/projects)
  * Resume & CV: [Halaman Resume](/resume)
  * Tulisan: [Halaman Blog](/blogs)
  * Kontak: [Halaman Kontak](/contact) | Email: robyfull.dev@gmail.com | LinkedIn: https://id.linkedin.com/in/robykartis | GitHub: https://github.com/robyajo

Panduan Menjawab:
1. Jawab langsung ke inti pertanyaan pengunjung secara ramah, profesional, dan padat.
2. Gunakan Bahasa Indonesia untuk penanya Indonesia, atau Bahasa Inggris untuk penanya berbahasa Inggris.
3. Gunakan format Markdown yang rapi dengan bullet points dan tautan yang relevan.
4. Jangan pernah menampilkan proses berpikir atau catatan internal.`;

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

    // Ambil 6 pesan terakhir agar konteks fokus, ringan, dan cepat diproses oleh VPS
    const recentMessages = rawMessages
      .slice(-6)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || "").slice(0, 800),
      }));

    const apiKey =
      process.env.LLAMA_API_KEY ??
      process.env.CHAT_LLM_API_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Sambungkan signal client ke upstream agar pembatalan seketika menghentikan inferensi di VPS
    const response = await fetch(siteConfig.llmApiUrl, {
      method: "POST",
      headers,
      signal: req.signal,
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
        let insideThinkTag = false;
        let isThinkingProcess = false;

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
                  const textDelta = data.choices?.[0]?.delta?.content;

                  if (textDelta) {
                    if (textDelta.includes("<think>")) {
                      insideThinkTag = true;
                      continue;
                    }
                    if (textDelta.includes("</think>")) {
                      insideThinkTag = false;
                      continue;
                    }
                    if (insideThinkTag) {
                      continue;
                    }

                    // Deteksi teks awal Thinking Process
                    if (textDelta.includes("Thinking Process:") || textDelta.includes("Here's a thinking process")) {
                      isThinkingProcess = true;
                      continue;
                    }

                    // Jika sedang di dalam Thinking Process tapi sudah menemukan pemisah jawaban (misal breakline ganda ke salam)
                    if (isThinkingProcess) {
                      if (textDelta.includes("\n\n\n") || (textDelta.includes("\n\n") && /^[A-ZHaloSelamat]/i.test(textDelta.trim()))) {
                        isThinkingProcess = false;
                      }
                      continue;
                    }

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
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
