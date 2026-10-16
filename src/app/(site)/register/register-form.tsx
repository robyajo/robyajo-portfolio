"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";
import { registerAccount } from "@/app/(site)/register/actions";

export function RegisterForm() {
    const t = useDictionary().auth;
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setPending(true);
        try {
            const result = await registerAccount({ name, email, password });
            if (!result.success) {
                setError(result.error);
                return;
            }
            const login = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/",
            });
            if (!login || login.error) {
                window.location.href = "/login";
                return;
            }
            window.location.href = login.url ?? "/";
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <TypographySmall asChild>
                        <label htmlFor="register-name">{t.nameLabel}</label>
                    </TypographySmall>
                    <Input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <TypographySmall asChild>
                        <label htmlFor="register-email">{t.emailLabel}</label>
                    </TypographySmall>
                    <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <TypographySmall asChild>
                        <label htmlFor="register-password">{t.passwordLabel}</label>
                    </TypographySmall>
                    <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && (
                    <TypographyMuted role="alert" className="text-sm text-destructive">
                        {error}
                    </TypographyMuted>
                )}
                <Button type="submit" disabled={pending} className="font-semibold">
                    {t.registerButton}
                </Button>
            </form>
            <TypographyMuted className="text-center text-sm">
                {t.haveAccount}{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                    {t.loginLink}
                </Link>
            </TypographyMuted>
        </div>
    );
}
