"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { useDictionary } from "@/lib/i18n/provider";

export function ProjectsSubnav() {
  const pathname = usePathname();
  const t = useDictionary().admin.projects.subnav;
  const items = [
    { label: t.projects, href: "/admin/projects" },
    { label: t.stacks, href: "/admin/projects/stacks" },
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
