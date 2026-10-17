"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { useDictionary } from "@/lib/i18n/provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export function BlogSubnav() {
  const pathname = usePathname();
  const t = useDictionary().admin.blog.subnav;
  const items = [
    { label: t.posts, href: "/admin/blog" },
    { label: t.categories, href: "/admin/blog/categories" },
    { label: t.tags, href: "/admin/blog/tags" },
  ];

  return (
    <div className="flex items-center justify-between gap-4">
      <ButtonGroup aria-label={t.aria}>
        {items.map((item, index) => (
          <span key={item.href} className="contents">
            {index > 0 && <ButtonGroupSeparator />}
            <Button
              asChild
              size="sm"
              variant={pathname === item.href ? "secondary" : "ghost"}
            >
              <Link href={item.href as Route}>{item.label}</Link>
            </Button>
          </span>
        ))}
      </ButtonGroup>
    </div>
  );
}
