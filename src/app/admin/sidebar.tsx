"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpenIcon,
  ChatCircleIcon,
  EnvelopeIcon,
  HouseIcon,
  LinkIcon,
  ListIcon,
  PencilIcon,
  SignOutIcon,
  FolderOpenIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { LogoIcon } from "@/components/shared/logo-icon";
import { useSafeSignOut as useSignOut } from "@/components/shared/auth-session";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useDictionary } from "@/lib/i18n/provider";

function useNavItems() {
  const t = useDictionary().admin.sidebar;
  return [
    { title: t.overview, href: "/admin", icon: ListIcon },
    { title: t.guestbook, href: "/admin/guestbook", icon: ChatCircleIcon },
    { title: t.comments, href: "/admin/comments", icon: BookOpenIcon },
    { title: t.messages, href: "/admin/messages", icon: EnvelopeIcon },
    { title: t.projects, href: "/admin/projects", icon: FolderOpenIcon },
    { title: t.visitors, href: "/admin/visitor", icon: UsersIcon },
    { title: t.links, href: "/admin/links", icon: LinkIcon },
    { title: t.blog, href: "/admin/blog", icon: PencilIcon },
  ];
}

export function AdminSidebar({
  unreadMessages = 0,
}: {
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const { signOut } = useSignOut();
  const t = useDictionary().admin;
  const navItems = useNavItems();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                  <LogoIcon size={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t.title}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            {t.sidebar.management}
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ title, href, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    href === "/admin"
                      ? pathname === "/admin"
                      : pathname === href || pathname.startsWith(`${href}/`)
                  }
                  tooltip={title}
                >
                  <Link href={href as Route}>
                    <Icon className="size-4" />
                    <span>{title}</span>
                    {href === "/admin/messages" && unreadMessages > 0 && (
                        <SidebarMenuBadge>
                            {unreadMessages}
                        </SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <HouseIcon className="size-4" />
                <span>{t.backToSite}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-destructive hover:text-destructive"
            >
              <SignOutIcon className="size-4" />
              <span>{t.signOut}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
