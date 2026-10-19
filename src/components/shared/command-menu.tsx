"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  BookOpenIcon,
  BriefcaseIcon,
  DownloadIcon,
  FileTextIcon,
  GithubLogoIcon,
  HouseIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  MoonIcon,
  PencilIcon,
  SunIcon,
  XLogoIcon,
} from "@/components/shared/icons";
import {
  getCommandMenuOpen,
  getCommandMenuServerSnapshot,
  setCommandMenuOpen,
  subscribeCommandMenu,
  toggleCommandMenu,
} from "@/lib/command-menu-store";
import { siteConfig } from "@/lib/config";
import type { SearchEntry, SearchIndex } from "@/lib/search-index";
import { useIsMac } from "@/hooks/use-is-mac";
import { useDictionary } from "@/lib/i18n/provider";
import { navLabel } from "@/lib/i18n/nav";

const NAV_ICONS = {
  "/projects": BriefcaseIcon,
  "/blogs": BookOpenIcon,
  "/resume": FileTextIcon,
  "/guestbook": PencilIcon,
} as const;

const SOCIAL_ICONS = {
  github: GithubLogoIcon,
  x: XLogoIcon,
  linkedin: LinkedinLogoIcon,
  instagram: InstagramLogoIcon,
} as const;

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  return target.isContentEditable;
}

function SearchResults({
  heading,
  icon: Icon,
  entries,
  onSelect,
}: {
  heading: string;
  icon: typeof FileTextIcon;
  entries: SearchEntry[];
  onSelect: (url: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <CommandGroup heading={heading}>
      {entries.map((entry) => (
        <CommandItem
          key={entry.url}
          value={[entry.title, entry.description, entry.keywords].join(" ")}
          onSelect={() => onSelect(entry.url)}
        >
          <Icon aria-hidden="true" />
          <span className="truncate">{entry.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

export function CommandMenu({ index }: { index: SearchIndex }) {
  const [query, setQuery] = useState("");
  const dict = useDictionary();
  const palette = dict.palette;
  const open = useSyncExternalStore(
    subscribeCommandMenu,
    getCommandMenuOpen,
    getCommandMenuServerSnapshot,
  );
  const router = useRouter();
  const { setTheme } = useTheme();
  const isMac = useIsMac();
  const themeShortcut = isMac ? "⇧⌘D" : "Ctrl+Shift+D";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCmdOrCtrlK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!isCmdOrCtrlK || isEditableTarget(event.target)) return;

      event.preventDefault();
      toggleCommandMenu();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runCommand = useCallback((action: () => void) => {
    setCommandMenuOpen(false);
    setQuery("");
    action();
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        setCommandMenuOpen(next);
      }}
      title={palette.title}
      description={palette.description}
    >
      <CommandInput
        placeholder={palette.placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{palette.empty}</CommandEmpty>

        {query.trim().length >= 2 && (
          <>
            <SearchResults
              heading={palette.searchPosts}
              icon={FileTextIcon}
              entries={index.posts}
              onSelect={(url) => runCommand(() => router.push(url as Route))}
            />
            <SearchResults
              heading={palette.searchProjects}
              icon={BriefcaseIcon}
              entries={index.projects}
              onSelect={(url) => runCommand(() => router.push(url as Route))}
            />
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading={palette.navigation}>
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <HouseIcon aria-hidden="true" />
            {palette.home}
          </CommandItem>
          {siteConfig.nav.map((item) => {
            const Icon = NAV_ICONS[item.href];
            return (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon aria-hidden="true" />
                {navLabel(item.href, dict)}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={palette.actions}>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("light"))}
          >
            <SunIcon aria-hidden="true" />
            {palette.lightTheme}
            <CommandShortcut translate="no">{themeShortcut}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <MoonIcon aria-hidden="true" />
            {palette.darkTheme}
            <CommandShortcut translate="no">{themeShortcut}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.location.href = "/api/resume/download";
              })
            }
          >
            <DownloadIcon aria-hidden="true" />
            {palette.downloadResume}
            <CommandShortcut>PDF</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={palette.elsewhere}>
          {siteConfig.social.map((item) => {
            const Icon = SOCIAL_ICONS[item.platform];
            return (
              <CommandItem
                key={item.platform}
                onSelect={() =>
                  runCommand(() => {
                    window.open(item.href, "_blank", "noopener,noreferrer");
                  })
                }
              >
                <Icon aria-hidden="true" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
