"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";
import type { OAuthProviderInfo } from "@/lib/auth";

export function LoginForm({ providers }: { providers: OAuthProviderInfo[] }) {
    const t = useDictionary().auth;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setPending(true);
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/",
            });
            if (!result || result.error) {
                setError(t.invalidCredentials);
                return;
            }
            window.location.href = result.url ?? "/";
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <TypographySmall asChild>
                        <label htmlFor="login-email">{t.emailLabel}</label>
                    </TypographySmall>
                    <Input
                        id="login-email"
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
                        <label htmlFor="login-password">{t.passwordLabel}</label>
                    </TypographySmall>
                    <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
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
                    {t.loginButton}
                </Button>
            </form>
            {providers.length > 0 && (
                <div className="flex flex-col gap-3">
                    <TypographyMuted className="text-center text-xs">
                        {t.orContinueWith}
                    </TypographyMuted>
                    {providers.map((p) => (
                        <Button
                            key={p.id}
                            type="button"
                            variant="outline"
                            onClick={() => void signIn(p.id, { callbackUrl: "/" })}
                            className="font-semibold"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            )}
            <TypographyMuted className="text-center text-sm">
                {t.noAccount}{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
                    {t.registerLink}
                </Link>
            </TypographyMuted>
        </div>
    );
}
