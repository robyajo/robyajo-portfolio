export const siteConfig = {
    name: "Roby Karti S.",
    domain: "ajoroby.is-a.dev",
    role: "Fullstack Software Developer",
    email: "robyfull.dev@gmail.com",
    description:
        "Fullstack developer from Pekanbaru, Indonesia. I build city-scale digital services (SuperApp, dashboards, tax systems) with TypeScript, React, Next.js, Laravel, and Go.",
    baseUrl:
        process.env.NEXT_PUBLIC_BASE_URL ??
        (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
            : "http://localhost:3000"),
    availableForHire: true,
    handle: "robyajo",
    twitterHandle: "robyajo",
    githubRepo: "robyajo/robyajo-portfolio",
    repoUrl: "https://github.com/robyajo/robyajo-portfolio",
    sameAs: [
        "https://github.com/robyajo",
        "https://x.com/roby_karti",
        "https://id.linkedin.com/in/robykartis",
        "https://www.instagram.com/roby_karti",
        "https://robyajo.fyi",
    ] as const,
    resumeURL:
        "https://github.com/robyajo/robyajo-portfolio/releases/latest/download/Roby_Karti_S_Resume.pdf",
    nav: [
        { href: "/projects", label: "Projects" },
        { href: "/blogs", label: "Blogs" },
        { href: "/about", label: "About" },
        { href: "/resume", label: "Resume" },
        { href: "/guestbook", label: "Guestbook" },
    ] as const,
    social: [
        {
            platform: "github",
            href: "https://github.com/robyajo",
            label: "GitHub",
        },
        {
            platform: "x",
            href: "https://x.com/roby_karti",
            label: "X",
        },
        {
            platform: "linkedin",
            href: "https://id.linkedin.com/in/robykartis",
            label: "LinkedIn",
        },
        { platform: "instagram", href: "https://www.instagram.com/roby_karti", label: "Instagram" },
    ] as const,
} as const;
