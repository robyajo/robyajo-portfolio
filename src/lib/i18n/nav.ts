import type { Dictionary } from "./id";

const NAV_KEYS = ["/projects", "/blogs", "/resume", "/guestbook"] as const;
export type NavHref = (typeof NAV_KEYS)[number];

export function navLabel(href: string, dict: Dictionary): string {
  switch (href) {
    case "/projects":
      return dict.nav.projects;
    case "/blogs":
      return dict.nav.blogs;
    case "/resume":
      return dict.nav.resume;
    case "/guestbook":
      return dict.nav.guestbook;
    case "/admin":
      return dict.header.dashboard;
    default:
      return href;
  }
}

export function isNavHref(href: string): href is NavHref {
  return (NAV_KEYS as readonly string[]).includes(href);
}
