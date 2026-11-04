/**
 * Registry Template & Konteks Halaman untuk ER AI Assistant.
 * Memberikan informasi kontekstual mengenai halaman yang sedang dikunjungi pengunjung,
 * beserta template pertanyaan cepat (quick inquiry templates) yang relevan dan dapat diklik.
 */

export interface PageChatTemplate {
  badge: { id: string; en: string };
  title: { id: string; en: string };
  summary: { id: string; en: string };
  welcomeGreeting: { id: string; en: string };
  prompts: { id: string; en: string }[];
  iconType:
    | "home"
    | "about"
    | "projects"
    | "project-detail"
    | "resume"
    | "blogs"
    | "blog-detail"
    | "markas"
    | "now"
    | "uses"
    | "activity"
    | "guestbook"
    | "changelog"
    | "branding"
    | "contact"
    | "privacy"
    | "admin"
    | "general";
}

export const PAGE_CHAT_TEMPLATES: Record<string, PageChatTemplate> = {
  home: {
    badge: { id: "// HALAMAN: BERANDA", en: "// PAGE: HOME" },
    title: {
      id: "Beranda Utama (Overview Portfolio)",
      en: "Main Homepage (Portfolio Overview)",
    },
    summary: {
      id: "Pusat ikhtisar profil Roby Karti S., status ketersediaan kerja (Available for hire), 6 prinsip kerja ('Rules I Follow'), proyek unggulan, dan artikel blog pilihan.",
      en: "Central overview of Roby Karti S., availability status (Available for hire), 6 core work principles ('Rules I Follow'), featured projects, and curated technical articles.",
    },
    welcomeGreeting: {
      id: "Halo! Selamat datang di beranda portofolio Roby Karti S. Saya siap memandu Anda mengeksplorasi karya digital, filosofi rekayasa perangkat lunak, maupun keahlian Roby.",
      en: "Hello! Welcome to Roby Karti S.'s portfolio homepage. I'm ready to guide you through his digital projects, software engineering philosophy, and technical expertise.",
    },
    prompts: [
      {
        id: "Siapa Roby Karti S. dan apa keahlian utama yang paling dikuasai?",
        en: "Who is Roby Karti S. and what are his primary core competencies?",
      },
      {
        id: "Bisa jelaskan 6 prinsip kerja ('Rules I Follow') yang dipegang Roby?",
        en: "Can you explain the 6 work principles ('Rules I Follow') Roby adheres to?",
      },
      {
        id: "Tunjukkan proyek-proyek unggulan skala kota dan SaaS buatan Roby",
        en: "Showcase the most impactful municipal and SaaS projects built by Roby",
      },
      {
        id: "Apakah Roby saat ini tersedia untuk tawaran kerja atau kolaborasi?",
        en: "Is Roby currently available for hire or project collaborations?",
      },
    ],
    iconType: "home",
  },

  about: {
    badge: { id: "// HALAMAN: TENTANG SAYA", en: "// PAGE: ABOUT" },
    title: {
      id: "Tentang Saya (Karier & Filosofi)",
      en: "About Roby (Career & Philosophy)",
    },
    summary: {
      id: "Membahas perjalanan karier 12+ tahun Roby (dari SMK TKJ hingga arsitek sistem kota di Diskominfo Pekanbaru), filosofi modularitas, dan etos kerja sistem terdistribusi.",
      en: "Explores Roby's 12+ year career trajectory (from vocational networking to municipal system architect at Diskominfo), modularity philosophy, and distributed systems work ethic.",
    },
    welcomeGreeting: {
      id: "Selamat datang di halaman Tentang Saya! Di sini Anda dapat membaca perjalanan karier dan etos kerja Roby. Ada hal spesifik seputar pengalaman beliau yang ingin Anda tanyakan?",
      en: "Welcome to the About page! Here you can discover Roby's career milestones and engineering philosophy. What specific aspect of his journey would you like to explore?",
    },
    prompts: [
      {
        id: "Ceritakan perjalanan karier 12+ tahun Roby dari awal hingga kini",
        en: "Walk me through Roby's 12+ year career trajectory from the beginning to now",
      },
      {
        id: "Bagaimana peran Roby sebagai arsitek sistem skala kota di Diskominfo Pekanbaru?",
        en: "What is Roby's role as a municipal systems architect at Diskominfo Pekanbaru?",
      },
      {
        id: "Apa latar belakang pendidikan formal dan sertifikasi keahlian Roby?",
        en: "What is Roby's formal education background and technical certifications?",
      },
      {
        id: "Bagaimana filosofi Roby dalam merancang sistem yang aman dan tahan banting?",
        en: "How does Roby approach designing resilient, secure, and maintainable software systems?",
      },
    ],
    iconType: "about",
  },

  projects: {
    badge: { id: "// HALAMAN: KATALOG PROYEK", en: "// PAGE: PROJECTS" },
    title: {
      id: "Katalog 25+ Proyek Digital",
      en: "25+ Digital Projects Showcase",
    },
    summary: {
      id: "Direktori lengkap 25+ karya digital Roby yang mencakup GovTech skala kota, platform SaaS, e-commerce, tools keamanan siber (WAF), dan aplikasi desktop lintas-platform.",
      en: "Comprehensive directory of 25+ digital works by Roby spanning municipal GovTech, SaaS platforms, e-commerce, cybersecurity tools (WAF), and cross-platform desktop applications.",
    },
    welcomeGreeting: {
      id: "Halo! Anda sedang membuka galeri proyek digital Roby. Setiap proyek memiliki studi kasus arsitektur, peran, dan tantangan teknisnya. Proyek jenis apa yang ingin Anda bedah?",
      en: "Hello! You are browsing Roby's digital project showcase. Each project includes case studies, architectural diagrams, and challenges. What type of project are you interested in?",
    },
    prompts: [
      {
        id: "Proyek apa yang paling berdampak besar bagi layanan publik masyarakat?",
        en: "Which project delivered the most significant impact for public civic services?",
      },
      {
        id: "Bisa jelaskan proyek SaaS dan aplikasi desktop yang dibangun oleh Roby?",
        en: "Can you break down the SaaS platforms and desktop applications created by Roby?",
      },
      {
        id: "Teknologi apa saja yang paling sering dipakai Roby dalam 25+ proyeknya?",
        en: "What technologies and frameworks does Roby frequently leverage across his 25+ projects?",
      },
      {
        id: "Tunjukkan proyek mana saja yang memiliki repositori kode open-source di GitHub",
        en: "Show me which projects offer open-source repositories and code on GitHub",
      },
    ],
    iconType: "projects",
  },

  resume: {
    badge: { id: "// HALAMAN: RESUME & CV", en: "// PAGE: RESUME" },
    title: {
      id: "Resume & CV Profesional",
      en: "Professional Resume & CV",
    },
    summary: {
      id: "Penampil dokumen resume resmi Roby Karti S., rincian riwayat jabatan, kompetensi teknologi, rekapitulasi dampak proyek, dan akses unduh file PDF cetak.",
      en: "Official resume viewer of Roby Karti S., detailing employment history, technical stack competencies, quantifiable project impact, and printable PDF download access.",
    },
    welcomeGreeting: {
      id: "Selamat datang di halaman Resume & CV. Di sini Anda bisa meninjau kualifikasi profesional Roby secara mendalam serta mengunduh berkas PDF resminya.",
      en: "Welcome to the Resume & CV page. Here you can inspect Roby's professional qualifications in depth and download his official printable PDF resume.",
    },
    prompts: [
      {
        id: "Ringkaskan rekam jejak karier, spesialisasi, dan pengalaman kerja Roby",
        en: "Summarize Roby's career trajectory, core specializations, and professional work history",
      },
      {
        id: "Bagaimana cara mengunduh berkas resume PDF resmi Roby Karti S.?",
        en: "How can I download the official printable PDF resume of Roby Karti S.?",
      },
      {
        id: "Berapa lama pengalaman Roby dalam arsitektur backend, DevOps, dan cloud?",
        en: "How many years of experience does Roby bring to backend architecture, DevOps, and cloud?",
      },
      {
        id: "Sebutkan teknologi kunci dan keahlian infrastruktur yang dikuasai Roby",
        en: "List the key technologies, infrastructure tools, and proficiencies mastered by Roby",
      },
    ],
    iconType: "resume",
  },

  blogs: {
    badge: { id: "// HALAMAN: ARSIP BLOG", en: "// PAGE: BLOGS" },
    title: {
      id: "Blog Teknis & Catatan Rekayasa",
      en: "Technical Blog & Engineering Notes",
    },
    summary: {
      id: "Koleksi tulisan mendalam dwibahasa (ID & EN) seputar investigasi keamanan siber, system call Linux, privasi data konsumen, rekayasa balik API, dan arsitektur web modern.",
      en: "Curated bilingual (ID & EN) engineering essays covering cybersecurity audits, Linux kernel syscalls, data privacy telemetry, reverse-engineering, and modern web architecture.",
    },
    welcomeGreeting: {
      id: "Halo! Selamat datang di arsip artikel teknis Roby. Semua artikel ditulis berdasarkan riset dan pengalaman praktis langsung. Topik apa yang menarik perhatian Anda?",
      en: "Hello! Welcome to Roby's technical blog archive. All essays stem from practical engineering and hands-on research. Which topic captures your interest?",
    },
    prompts: [
      {
        id: "Artikel teknis apa saja yang paling direkomendasikan untuk dibaca pertama kali?",
        en: "Which technical articles are most recommended for a first-time reader?",
      },
      {
        id: "Bisa jelaskan ringkasan artikel tentang system call Linux dan audit regulasi?",
        en: "Can you summarize the article on Linux system calls and security compliance audits?",
      },
      {
        id: "Bagaimana ulasan Roby mengenai isu privasi Smart TV dan telemetri mobil pintar?",
        en: "What are Roby's insights on Smart TV privacy harvesting and smart car telemetry?",
      },
      {
        id: "Bagaimana cara kerja bot tiket 4 AM yang dibuat Roby lewat reverse engineering?",
        en: "How did the 4 AM ticket alert bot engineered via reverse-engineering work?",
      },
    ],
    iconType: "blogs",
  },

  markas: {
    badge: { id: "// HALAMAN: MARKAS AGEN 3D", en: "// PAGE: 3D HQ" },
    title: {
      id: "Markas Agen AI 3D Command Center",
      en: "3D AI Agent Command Center",
    },
    summary: {
      id: "Simulasi kantor miniatur 3D interaktif Three.js yang menampilkan Ayah Roby santai di meja komando, ruang bermain anak di belakang Ayah bersama Bunda Putri & Alyona, tim developer, bangku santai lounge, kurir pengantar berkas AI, dan layar dinding chart real-time.",
      en: "Interactive Three.js 3D miniature office simulation featuring Ayah Roby relaxing at the command desk, kids playroom behind Ayah with Bunda Putri & Alyona, developer squad, lounge sofa, AI document courier, and live wall charts.",
    },
    welcomeGreeting: {
      id: "Selamat datang di Markas Agen AI 3D! Seluruh agen di kantor ini memiliki tugas dan kepribadian masing-masing. Anda bisa berinteraksi, memicu kurir berkas AI, atau menyembunyikan panel chat untuk tampilan penuh sinematik.",
      en: "Welcome to the 3D AI Agent HQ! Each agent in this miniature office has unique duties and routines. You can interact, trigger the AI courier, or minimize the chat panel for a cinematic full view.",
    },
    prompts: [
      {
        id: "Jelaskan konsep dan fitur unik apa saja yang ada di Markas Agen AI 3D ini",
        en: "Explain the concept and unique interactive features of this 3D AI Agent HQ",
      },
      {
        id: "Siapa saja karakter di markas ini (Ayah Roby, Bunda Putri, Alyona, & tim dev)?",
        en: "Who are the characters in this HQ (Ayah Roby, Bunda Putri, Alyona, & dev team)?",
      },
      {
        id: "Bagaimana alur kurir paket mengantar berkas tugas saat prompting masuk?",
        en: "How does the courier delivery cycle work when a task prompt is submitted?",
      },
      {
        id: "Bagaimana cara beralih mode sembunyikan chat untuk melihat 3D layar penuh?",
        en: "How do I toggle the hide/show chat mode to enjoy the full-screen 3D view?",
      },
    ],
    iconType: "markas",
  },

  now: {
    badge: { id: "// HALAMAN: SEKARANG", en: "// PAGE: NOW" },
    title: {
      id: "Sekarang (Aktivitas & Fokus Terkini)",
      en: "Now Page (Current Focus & Learning)",
    },
    summary: {
      id: "Halaman 'Now' yang memperlihatkan apa yang sedang dikerjakan, dipelajari, dibaca, dan dieksplorasi oleh Roby saat ini secara real-time.",
      en: "Public 'Now' page presenting what Roby is actively building, learning, reading, and exploring in real-time.",
    },
    welcomeGreeting: {
      id: "Halo! Halaman 'Now' merangkum prioritas hidup dan rekayasa teknologi Roby saat ini. Ingin tahu apa yang sedang beliau kembangkan?",
      en: "Hello! The 'Now' page summarizes Roby's current engineering priorities and learning radar. Curious about what he's actively developing?",
    },
    prompts: [
      {
        id: "Apa fokus utama yang sedang dipelajari dan dieksplorasi Roby saat ini?",
        en: "What is Roby's primary learning focus and exploratory radar right now?",
      },
      {
        id: "Proyek atau sistem apa yang sedang aktif dikembangkan Roby saat ini?",
        en: "Which projects or systems is Roby actively developing right now?",
      },
      {
        id: "Buku atau riset teknologi apa yang sedang dibaca Roby belakangan ini?",
        en: "What tech books, papers, or documentation has Roby been reading lately?",
      },
      {
        id: "Bagaimana frekuensi pembaruan halaman 'Now' di portfolio ini?",
        en: "How frequently is the 'Now' page updated in this portfolio?",
      },
    ],
    iconType: "now",
  },

  uses: {
    badge: { id: "// HALAMAN: PERKAKAS & STACK", en: "// PAGE: USES" },
    title: {
      id: "Perkakas, Hardware, & Tech Stack",
      en: "Hardware, Server Lab, & Tech Stack",
    },
    summary: {
      id: "Daftar perkakas kerja harian Roby: spesifikasi Home Lab Enterprise (Proxmox VE, MikroTik RouterOS), perangkat laptop/PC, sistem operasi Linux, code editor, dan utilitas penunjang produktivitas.",
      en: "Roby's daily engineering armory: Enterprise Home Lab specs (Proxmox VE, MikroTik RouterOS), PC/laptop gear, Linux OS setup, code editors, and developer productivity tools.",
    },
    welcomeGreeting: {
      id: "Selamat datang di halaman Uses! Di sini dirinci seluruh perangkat keras, server home lab, sistem operasi, dan perangkat lunak yang dipakai Roby. Tertarik dengan setup server atau hardware beliau?",
      en: "Welcome to the Uses page! Here you can inspect all hardware, home lab servers, operating systems, and developer tools used by Roby. Curious about his server setup?",
    },
    prompts: [
      {
        id: "Bisa jelaskan spesifikasi server Home Lab Enterprise dan Proxmox VE milik Roby?",
        en: "Can you detail Roby's Enterprise Home Lab and Proxmox VE server specs?",
      },
      {
        id: "Kenapa Roby memilih MikroTik RouterOS dan Linux untuk infrastruktur harian?",
        en: "Why does Roby rely on MikroTik RouterOS and Linux for his daily infrastructure?",
      },
      {
        id: "Apa text editor, shell, dan ekstensi utama yang dipakai Roby untuk koding?",
        en: "What text editor, shell, and primary extensions does Roby use for coding?",
      },
      {
        id: "Perangkat keras (PC, laptop, peripheral) apa yang digunakan Roby saat ini?",
        en: "What hardware workstation (PC, laptop, peripherals) does Roby currently use?",
      },
    ],
    iconType: "uses",
  },

  activity: {
    badge: { id: "// HALAMAN: LINIMASA KEGIATAN", en: "// PAGE: ACTIVITY" },
    title: {
      id: "Linimasa Kegiatan & Rilis Sistem",
      en: "Live Activity & Release Timeline",
    },
    summary: {
      id: "Feed linimasa kegiatan real-time yang mencatat setiap penambahan fitur, perbaikan performa, rilis keamanan, dan aktivitas pengembangan sistem secara transparan.",
      en: "Real-time activity feed chronicling feature deployments, performance tuning, security patches, and developmental milestones with total transparency.",
    },
    welcomeGreeting: {
      id: "Halo! Anda berada di halaman Linimasa Kegiatan. Di sini setiap langkah pengembangan portfolio dicatat secara kronologis. Ada aktivitas rilis yang ingin Anda telusuri?",
      en: "Hello! You are viewing the Live Activity Timeline. Every developmental milestone and patch is logged here chronologically. Looking for a specific activity?",
    },
    prompts: [
      {
        id: "Apa pembaruan dan rilis fitur terbaru yang tercatat di linimasa kegiatan ini?",
        en: "What are the latest feature updates and deployments recorded in this activity log?",
      },
      {
        id: "Bagaimana cara kerja sinkronisasi kegiatan dwibahasa (ID & EN) di sistem ini?",
        en: "How does the bilingual (ID & EN) activity sync engine operate across the system?",
      },
      {
        id: "Rilis apa saja yang berkaitan dengan optimasi performa dan keamanan sistem?",
        en: "Which recent releases relate specifically to performance tuning and security hardening?",
      },
      {
        id: "Bagaimana komitmen Roby terhadap transparansi log kegiatan pengembangan?",
        en: "How does Roby maintain accountability and transparency across his engineering logs?",
      },
    ],
    iconType: "activity",
  },

  guestbook: {
    badge: { id: "// HALAMAN: BUKU TAMU", en: "// PAGE: GUESTBOOK" },
    title: {
      id: "Buku Tamu Digital Warga",
      en: "Digital Community Guestbook",
    },
    summary: {
      id: "Ruang interaktif publik di mana sesama developer, klien, rekan kerja, dan pengunjung dari seluruh dunia dapat meninggalkan pesan, sapaan, dan tanda tangan digital.",
      en: "Interactive public guestbook where developers, clients, colleagues, and visitors worldwide leave friendly messages, greetings, and digital signatures.",
    },
    welcomeGreeting: {
      id: "Selamat datang di Buku Tamu! Siapa pun boleh meninggalkan jejak dan salam di sini. Ingin tahu cara berpartisipasi atau melihat pesan-pesan sebelumnya?",
      en: "Welcome to the Guestbook! Everyone is invited to leave a signature and friendly note here. Want to know how to contribute or explore previous messages?",
    },
    prompts: [
      {
        id: "Bagaimana cara saya masuk dan menandatangani buku tamu digital ini?",
        en: "How can I sign in and leave a digital signature in this guestbook?",
      },
      {
        id: "Apakah pesan yang saya tinggalkan akan langsung tampil di halaman ini?",
        en: "Will my guestbook message appear immediately on this public wall?",
      },
      {
        id: "Siapa saja yang biasanya meninggalkan pesan di buku tamu Roby?",
        en: "Who typically leaves notes and feedback in Roby's guestbook?",
      },
      {
        id: "Bagaimana sistem menjaga keamanan dan menyaring spam di buku tamu ini?",
        en: "How does the system mitigate spam and protect the guestbook against abuse?",
      },
    ],
    iconType: "guestbook",
  },

  changelog: {
    badge: { id: "// HALAMAN: CATATAN RILIS", en: "// PAGE: CHANGELOG" },
    title: {
      id: "Catatan Rilis Publik (Changelog)",
      en: "Public Changelog & Releases",
    },
    summary: {
      id: "Dokumentasi rilis versi situs yang ditulis dalam bahasa manusia yang ramah, berorientasi manfaat nyata bagi pengunjung tanpa jargon teknis yang membingungkan.",
      en: "User-facing version release notes written in friendly human language, focusing on practical benefits for visitors without confusing internal jargon.",
    },
    welcomeGreeting: {
      id: "Halo! Di halaman Catatan Rilis ini, Anda dapat melihat riwayat pembaruan situs yang dirangkum rapi. Penasaran dengan fitur yang baru dirilis?",
      en: "Hello! On the Changelog page, you can trace all site enhancements neatly organized by date. Curious about recent feature rollouts?",
    },
    prompts: [
      {
        id: "Fitur baru apa saja yang hadir pada catatan rilis versi terbaru saat ini?",
        en: "What new features and improvements debuted in the latest version release?",
      },
      {
        id: "Bagaimana pendekatan Roby dalam menyusun catatan rilis yang ramah pembaca?",
        en: "How does Roby craft user-centric release notes that non-engineers can easily read?",
      },
      {
        id: "Tunjukkan riwayat perubahan besar pada fitur chat AI dan 3D Markas",
        en: "Show me the evolutionary timeline for the AI chat assistant and 3D HQ features",
      },
      {
        id: "Di mana saya bisa melihat rincian teknis dari setiap perubahan rilis?",
        en: "Where can I inspect the technical breakdown and source keys for each release?",
      },
    ],
    iconType: "changelog",
  },

  branding: {
    badge: { id: "// HALAMAN: IDENTITAS MEREK", en: "// PAGE: BRANDING" },
    title: {
      id: "Identitas Merek & Panduan Desain",
      en: "Brand Identity & Design Guidelines",
    },
    summary: {
      id: "Filosofi logo, maskot, tipografi pixel/sans modern, palet warna berdaya kontras ramah mata, serta akses unduhan aset vektor SVG resmi portofolio Roby Karti S.",
      en: "Design philosophy behind the logo, mascot, typography, high-contrast accessible color palette, and downloadable official vector SVG brand assets.",
    },
    welcomeGreeting: {
      id: "Selamat datang di halaman Identitas Merek! Di sini terangkum filosofi visual dan aset desain resmi portofolio Roby. Ada aset atau palet warna yang ingin Anda unduh?",
      en: "Welcome to the Brand Identity page! Here lies the visual philosophy and official vector assets of Roby's portfolio. Need logos or color palette codes?",
    },
    prompts: [
      {
        id: "Apa filosofi dan makna di balik logo dan maskot merek Ajo Roby?",
        en: "What is the meaning and philosophy behind the Ajo Roby logo and mascot?",
      },
      {
        id: "Bagaimana aturan penggunaan palet warna dan tipografi di situs ini?",
        en: "What are the rules and color codes for the typography and palettes here?",
      },
      {
        id: "Bagaimana cara mengunduh aset logo dan banner vektor SVG resmi?",
        en: "How can I download the official vector SVG logos and banner graphics?",
      },
      {
        id: "Apakah saya boleh menggunakan aset logo Roby untuk artikel atau publikasi?",
        en: "Am I allowed to use Roby's brand assets for articles or publication mentions?",
      },
    ],
    iconType: "branding",
  },

  contact: {
    badge: { id: "// HALAMAN: KONTAK LANGSUNG", en: "// PAGE: CONTACT" },
    title: {
      id: "Kontak Langsung & Kolaborasi",
      en: "Direct Contact & Collaboration",
    },
    summary: {
      id: "Saluran komunikasi langsung untuk diskusi proyek enterprise, tawaran rekrutmen profesional, sesi konsultasi arsitektur cloud, atau sekadar menyapa.",
      en: "Direct communication channel for enterprise project inquiries, professional recruitment offers, cloud architecture consulting, or tech chats.",
    },
    welcomeGreeting: {
      id: "Halo! Halaman Kontak adalah pintu tercepat untuk terhubung langsung dengan Roby. Ingin berdiskusi tentang proyek, konsultasi teknis, atau tawaran kerja?",
      en: "Hello! The Contact page is your fastest doorway to reach Roby directly. Planning an enterprise project, technical consultation, or career inquiry?",
    },
    prompts: [
      {
        id: "Bagaimana cara tercepat untuk menghubungi atau merekrut Roby Karti S.?",
        en: "What is the fastest way to contact or recruit Roby Karti S. for an opportunity?",
      },
      {
        id: "Berapa lama estimasi balasan jika saya mengirim pesan lewat form kontak?",
        en: "What is the typical response turnaround if I submit a message via the contact form?",
      },
      {
        id: "Apakah Roby terbuka untuk proyek freelance, kontrak, atau full-time remote?",
        en: "Is Roby open to freelance, advisory contracts, or full-time remote positions?",
      },
      {
        id: "Apa saja media sosial resmi dan saluran komunikasi yang dimiliki Roby?",
        en: "What are Roby's official social media profiles and communication handles?",
      },
    ],
    iconType: "contact",
  },

  privacy: {
    badge: { id: "// HALAMAN: KEBIJAKAN PRIVASI", en: "// PAGE: PRIVACY" },
    title: {
      id: "Kebijakan Privasi & Perlindungan Data",
      en: "Privacy Policy & Data Protection",
    },
    summary: {
      id: "Komitmen perlindungan privasi pengunjung: tanpa pelacak pihak ketiga agresif, enkripsi hash satu arah untuk IP pengunjung, dan kepatuhan standar keamanan data.",
      en: "Visitor privacy pledge: zero intrusive third-party trackers, one-way hashed IP storage, and strict data protection compliance.",
    },
    welcomeGreeting: {
      id: "Selamat datang di halaman Kebijakan Privasi. Portofolio ini dibangun dengan menghargai privasi Anda sepenuhnya tanpa pelacakan invasif. Ada yang ingin Anda pastikan?",
      en: "Welcome to the Privacy Policy page. This portfolio is engineered with absolute respect for visitor privacy without tracking. Anything you wish to clarify?",
    },
    prompts: [
      {
        id: "Bagaimana portofolio ini melindungi privasi dan data pengunjungnya?",
        en: "How does this portfolio protect visitor privacy and handle interaction data?",
      },
      {
        id: "Apakah ada tracker analitik pihak ketiga atau penjualan data di situs ini?",
        en: "Are there third-party tracking scripts, cookies, or data selling on this site?",
      },
      {
        id: "Bagaimana cara sistem mengamankan alamat IP pengunjung saat membaca halaman?",
        en: "How does the system securely hash visitor IP addresses for rate limiting?",
      },
      {
        id: "Bagaimana jika saya ingin meminta penghapusan pesan yang pernah saya kirim?",
        en: "How can I request the deletion of a message I previously submitted?",
      },
    ],
    iconType: "privacy",
  },

  admin: {
    badge: { id: "// HALAMAN: PANEL ADMIN", en: "// PAGE: ADMIN PANEL" },
    title: {
      id: "Panel Administrasi & Kontrol Sistem",
      en: "System Administration & Control Panel",
    },
    summary: {
      id: "Area pengelolaan eksklusif untuk konfigurasi provider AI, kurasi artikel blog, persetujuan komentar, manajemen tautan, dan pemantauan telemetri pengunjung.",
      en: "Exclusive administration console for managing AI models, blog editorial workflows, comment moderation, links, and visitor telemetry.",
    },
    welcomeGreeting: {
      id: "Selamat datang di area administrasi internal. Sebagai asisten terverifikasi, saya dapat membantu Anda mengelola data proyek, artikel, konfigurasi AI, dan sistem.",
      en: "Welcome to the internal administration area. As your AI assistant, I can help you monitor projects, manage articles, AI configurations, and system health.",
    },
    prompts: [
      {
        id: "Bagaimana cara mengatur provider dan model AI yang aktif untuk chat asisten?",
        en: "How do I configure active AI providers and reasoning models for this assistant?",
      },
      {
        id: "Tunjukkan statistik ringkas aktivitas pengunjung dan status database terkini",
        en: "Show me a quick summary of visitor telemetry and recent database records",
      },
      {
        id: "Bagaimana alur kerja kurasi dan penerbitan artikel blog di dashboard ini?",
        en: "How does the blog curation and publishing workflow operate in this dashboard?",
      },
      {
        id: "Bisa jelaskan struktur keamanan dan role permission di panel admin ini?",
        en: "Can you explain the security architecture and role permissions for the admin panel?",
      },
    ],
    iconType: "admin",
  },
};

/**
 * Mencari template informasi halaman berdasarkan pathname yang sedang aktif.
 */
export function getPageChatTemplate(pathname: string): PageChatTemplate {
  const cleanPath = (pathname || "/").split("?")[0].replace(/\/$/, "") || "/";

  // 1. Root Homepage
  if (cleanPath === "") {
    return PAGE_CHAT_TEMPLATES.home;
  }

  // 2. Exact static routes
  if (cleanPath === "/about") return PAGE_CHAT_TEMPLATES.about;
  if (cleanPath === "/projects") return PAGE_CHAT_TEMPLATES.projects;
  if (cleanPath === "/resume") return PAGE_CHAT_TEMPLATES.resume;
  if (cleanPath === "/blogs") return PAGE_CHAT_TEMPLATES.blogs;
  if (cleanPath === "/markas") return PAGE_CHAT_TEMPLATES.markas;
  if (cleanPath === "/now") return PAGE_CHAT_TEMPLATES.now;
  if (cleanPath === "/uses") return PAGE_CHAT_TEMPLATES.uses;
  if (cleanPath === "/activity") return PAGE_CHAT_TEMPLATES.activity;
  if (cleanPath === "/guestbook") return PAGE_CHAT_TEMPLATES.guestbook;
  if (cleanPath === "/changelog") return PAGE_CHAT_TEMPLATES.changelog;
  if (cleanPath === "/branding") return PAGE_CHAT_TEMPLATES.branding;
  if (cleanPath === "/contact") return PAGE_CHAT_TEMPLATES.contact;
  if (cleanPath === "/privacy-policy") return PAGE_CHAT_TEMPLATES.privacy;

  // 3. Admin routes
  if (cleanPath.startsWith("/admin")) {
    return PAGE_CHAT_TEMPLATES.admin;
  }

  // 4. Project Detail (/projects/[slug])
  if (cleanPath.startsWith("/projects/")) {
    const slug = cleanPath.replace("/projects/", "").split("/")[0];
    const formattedSlug = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      badge: {
        id: `// HALAMAN: PROYEK // ${slug.toUpperCase()}`,
        en: `// PAGE: PROJECT // ${slug.toUpperCase()}`,
      },
      title: {
        id: `Studi Kasus Proyek: ${formattedSlug}`,
        en: `Project Case Study: ${formattedSlug}`,
      },
      summary: {
        id: `Studi kasus komprehensif proyek ${formattedSlug}: latar belakang masalah, peran arsitektur Roby, teknologi yang diimplementasikan, tautan demo langsung, dan repositori GitHub.`,
        en: `In-depth case study of ${formattedSlug}: problem statement, Roby's architectural role, technology stack used, live demo URL, and GitHub repository.`,
      },
      welcomeGreeting: {
        id: `Halo! Anda sedang meninjau studi kasus proyek **${formattedSlug}**. Saya memiliki data lengkap seputar arsitektur, tantangan rekayasa, dan kode proyek ini. Ada yang ingin Anda ketahui?`,
        en: `Hello! You are inspecting the case study for **${formattedSlug}**. I have complete context on its architecture, engineering challenges, and codebase. What would you like to know?`,
      },
      prompts: [
        {
          id: `Jelaskan latar belakang, arsitektur, dan solusi teknis pada proyek ${formattedSlug}`,
          en: `Explain the background, architecture, and technical solution for ${formattedSlug}`,
        },
        {
          id: `Apa peran dan kontribusi kunci Roby dalam pembangunan proyek ${formattedSlug}?`,
          en: `What was Roby's specific role and key architectural contribution to ${formattedSlug}?`,
        },
        {
          id: `Teknologi dan stack apa saja yang digunakan pada proyek ${formattedSlug}?`,
          en: `What technologies and libraries power the ${formattedSlug} project?`,
        },
        {
          id: `Apakah ada live demo dan tautan repositori GitHub publik untuk ${formattedSlug}?`,
          en: `Is there a live demo or public GitHub repository link for ${formattedSlug}?`,
        },
      ],
      iconType: "project-detail",
    };
  }

  // 5. Blog Detail (/blogs/[slug])
  if (cleanPath.startsWith("/blogs/")) {
    const slug = cleanPath.replace("/blogs/", "").split("/")[0];
    const formattedSlug = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      badge: {
        id: `// HALAMAN: ARTIKEL // ${slug.slice(0, 20).toUpperCase()}`,
        en: `// PAGE: ARTICLE // ${slug.slice(0, 20).toUpperCase()}`,
      },
      title: {
        id: `Artikel Teknis: ${formattedSlug}`,
        en: `Technical Essay: ${formattedSlug}`,
      },
      summary: {
        id: `Tulisan teknis mendalam tentang ${formattedSlug}, menyajikan riset analitis, temuan investigasi, diagram arsitektur, dan pandangan rekayasa perangkat lunak.`,
        en: `In-depth technical essay on ${formattedSlug}, delivering investigative research, architectural breakdowns, and software engineering insights.`,
      },
      welcomeGreeting: {
        id: `Selamat membaca! Anda sedang membuka artikel **${formattedSlug}**. Saya siap merangkum poin-poin utama, menjelaskan istilah teknis, atau mendiskusikan temuan dalam tulisan ini.`,
        en: `Enjoy the read! You are currently viewing **${formattedSlug}**. I'm here to summarize key takeaways, clarify technical terms, or discuss the findings in this essay.`,
      },
      prompts: [
        {
          id: `Bisa berikan ringkasan eksekutif dan poin penting dari artikel ${formattedSlug}?`,
          en: `Can you give an executive summary and key takeaways of ${formattedSlug}?`,
        },
        {
          id: `Apa kesimpulan dan rekomendasi utama yang disampaikan Roby dalam artikel ini?`,
          en: `What are the primary conclusions and recommendations made by Roby in this essay?`,
        },
        {
          id: `Artikel lain apa di blog ini yang berkaitan erat dengan topik ${formattedSlug}?`,
          en: `What other essays in this blog are closely related to ${formattedSlug}?`,
        },
        {
          id: `Bagaimana relevansi topik artikel ini dengan industri teknologi saat ini?`,
          en: `How does the topic of this essay reflect real-world challenges in today's tech industry?`,
        },
      ],
      iconType: "blog-detail",
    };
  }

  // 6. Fallback General
  return {
    badge: { id: "// HALAMAN: PORTOFOLIO", en: "// PAGE: PORTFOLIO" },
    title: {
      id: "Halaman Portofolio Roby Karti S.",
      en: "Roby Karti S. Portfolio Page",
    },
    summary: {
      id: "Bagian dari situs resmi portofolio personal Roby Karti S., S.Kom. (Senior Full Stack Developer & System Architect).",
      en: "Part of the official personal portfolio of Roby Karti S., S.Kom. (Senior Full Stack Developer & System Architect).",
    },
    welcomeGreeting: {
      id: "Halo! Saya ER AI Assistant. Saya siap memandu Anda menjawab pertanyaan seputar portofolio, karya, pengalaman, dan teknologi Roby Karti S.",
      en: "Hello! I am ER AI Assistant. I'm ready to answer any questions regarding Roby Karti S.'s portfolio, projects, career, and tech expertise.",
    },
    prompts: PAGE_CHAT_TEMPLATES.home.prompts,
    iconType: "general",
  };
}
