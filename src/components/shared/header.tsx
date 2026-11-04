"use client";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { useDictionary } from "@/lib/i18n/provider";
import { navLabel } from "@/lib/i18n/nav";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { TypographySmall } from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/cn";
import { setCommandMenuOpen } from "@/lib/command-menu-store";
import { useChatExpanded, useChatOpen } from "@/lib/chat-store";
import { useIsMac } from "@/hooks/use-is-mac";
import { useSession } from "next-auth/react";
import {
    ListIcon,
    MagnifyingGlassIcon,
    XIcon,
} from "@/components/shared/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function isActive(pathname: string, href: string) {
    if (pathname === href) return true;
    if (href === "/blogs")
        return pathname.startsWith("/blogs/") || pathname.startsWith("/blog/");
    if (href === "/projects") return pathname.startsWith("/projects/");
    if (href === "/markas") return pathname.startsWith("/markas");
    if (href === "/guestbook") return pathname.startsWith("/guestbook");
    if (href === "/admin") return pathname.startsWith("/admin");
    return false;
}

function NavPin({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className={cn(
                "pointer-events-none size-4 origin-[3px_14px] animate-pin-drop overflow-visible",
                className,
            )}
        >
            <path
                d="M7.5 7.5 L3 14"
                strokeWidth="1.3"
                strokeLinecap="round"
                className="stroke-muted-foreground"
            />
            <ellipse
                cx="8.6"
                cy="6.6"
                rx="4.2"
                ry="3.6"
                className="fill-foreground/15"
            />
            <circle cx="8" cy="5.6" r="3.9" className="fill-(--brand)" />
            <circle cx="6.7" cy="4.3" r="1.2" className="fill-white/70" />
        </svg>
    );
}

function CommandMenuButton({
    isMac,
    dictLabel,
}: {
    isMac: boolean;
    dictLabel?: string;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => setCommandMenuOpen(true)}
            aria-label={dictLabel ?? "Search and commands"}
            aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
            className="h-8.5 gap-1.5 rounded-l-full px-2.5 text-muted-foreground hover:text-foreground pointer-coarse:h-11"
        >
            <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
            <Kbd
                translate="no"
                aria-hidden="true"
                className="max-md:hidden rounded-full px-1.5 font-mono text-3xs"
            >
                {isMac ? "\u2318\u00A0K" : "Ctrl\u00A0K"}
            </Kbd>
        </Button>
    );
}

export function Header() {
    const pathname = usePathname();
    const dict = useDictionary();
    const { data: session } = useSession();
    const chatOpen = useChatOpen();
    const chatExpanded = useChatExpanded();
    const isAdmin = session?.user?.role === "admin";
    const navLinks = isAdmin
        ? [
              ...siteConfig.nav,
              { href: "/admin", label: dict.header.dashboard } as const,
          ]
        : siteConfig.nav;
    const [openPath, setOpenPath] = useState<string | null>(null);
    const open = openPath === pathname;
    const setOpen = useCallback(
        (next: boolean) => setOpenPath(next ? pathname : null),
        [pathname],
    );
    const isMac = useIsMac();
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                menuRef.current?.contains(target) ||
                triggerRef.current?.contains(target)
            ) {
                return;
            }
            setOpenPath(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenPath(null);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <header
            className={cn(
                "fixed inset-x-0 top-0 z-30 border-b border-line bg-background/80 backdrop-blur transition-[right] duration-300 ease-in-out [view-transition-name:site-header]",
                chatOpen &&
                    (chatExpanded
                        ? "md:right-[680px] lg:right-[760px] xl:right-[840px]"
                        : "md:right-[460px] lg:right-[500px] xl:right-[540px]"),
            )}
        >
            <div className="relative mx-auto max-w-7xl border-x border-line bg-background">
                <div className="flex h-14 items-center justify-between px-gutter">
                    <Link
                        href="/"
                        aria-label={`${siteConfig.name}, ${dict.header.homeLabel}`}
                        className="group/logo cursor-pointer rounded-md transition-[scale] duration-150 ease-out active:scale-96"
                    >
                        <Logo size={32} showWordmark alive aria-hidden="true" />
                    </Link>

                    <div className="flex items-center gap-1">
                        <NavigationMenu
                            className="max-md:hidden"
                            aria-label={dict.header.mainNav}
                        >
                            <NavigationMenuList className="gap-0.5">
                                {navLinks.map((link) => {
                                    const active = isActive(
                                        pathname,
                                        link.href,
                                    );
                                    return (
                                        <NavigationMenuItem key={link.href}>
                                            <NavigationMenuLink
                                                asChild
                                                className="group/nav-link relative"
                                            >
                                                <Link
                                                    href={link.href}
                                                    aria-current={
                                                        active && pathname === link.href
                                                            ? "page"
                                                            : active
                                                              ? "true"
                                                              : undefined
                                                    }
                                                >
                                                    <TypographySmall>
                                                        {navLabel(
                                                            link.href,
                                                            dict,
                                                        )}
                                                    </TypographySmall>
                                                    {active && (
                                                        <NavPin
                                                            key={pathname}
                                                            className="absolute -top-2 -right-1.5"
                                                        />
                                                    )}
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    );
                                })}
                            </NavigationMenuList>
                        </NavigationMenu>

                        <ButtonGroup className="max-md:hidden">
                            <CommandMenuButton
                                isMac={isMac}
                                dictLabel={dict.header.searchCommands}
                            />
                            <LanguageToggle />
                            <ThemeToggle />
                        </ButtonGroup>

                        <Button
                            ref={triggerRef}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            aria-expanded={open}
                            aria-controls="mobile-nav-panel"
                            aria-label={
                                open
                                    ? dict.header.closeMenu
                                    : dict.header.openMenu
                            }
                            onClick={() => setOpen(!open)}
                        >
                            {open ? (
                                <XIcon aria-hidden="true" className="size-5" />
                            ) : (
                                <ListIcon aria-hidden="true" className="size-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {open && (
                    <div
                        ref={menuRef}
                        id="mobile-nav-panel"
                        aria-label={dict.header.mobileNav}
                        className="animate-in fade-in-0 slide-in-from-top-2 border-t border-line bg-background px-gutter py-4 md:hidden"
                    >
                        <nav
                            aria-label={dict.header.mobileNav}
                            className="flex flex-col gap-1 pb-3"
                        >
                            {navLinks.map((link) => {
                                const active = isActive(pathname, link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        aria-current={
                                            active && pathname === link.href
                                                ? "page"
                                                : active
                                                  ? "true"
                                                  : undefined
                                        }
                                        className={cn(
                                            "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-muted text-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                        )}
                                        onClick={() => setOpen(false)}
                                    >
                                        <span>
                                            {navLabel(link.href, dict)}
                                        </span>
                                        {active && (
                                            <span
                                                aria-hidden="true"
                                                className="size-1.5 rounded-full bg-(--brand)"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="flex items-center justify-between border-t border-line pt-3">
                            <CommandMenuButton
                                isMac={isMac}
                                dictLabel={dict.header.searchCommands}
                            />
                            <div className="flex items-center gap-1">
                                <LanguageToggle />
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
