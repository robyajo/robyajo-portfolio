"use client";

import { Avatar } from "@/components/engagement/avatar";
import {
  Composer,
  type ComposerSubmitHandler,
} from "@/components/engagement/composer";
import { TypingBubble } from "@/components/shared/doodles";
import { SignInIcon, SignOutIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { SafeSignInButton as SignInButton } from "@/components/shared/auth-session";
import { useDictionary } from "@/lib/i18n/provider";
import Link from "next/link";

const COMMENT_MAX_LENGTH = 1000;

export interface CommentComposerAreaProps {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user:
    | {
        id: string;
        fullName: string | null;
        username: string | null;
        imageUrl: string;
      }
    | null
    | undefined;
  userName: string | null;
  onSubmit: ComposerSubmitHandler;
  onSignOut: () => void;
}

export function CommentComposerArea({
  isLoaded,
  isSignedIn,
  user,
  userName,
  onSubmit,
  onSignOut,
}: CommentComposerAreaProps) {
  const dict = useDictionary();
  const t = dict.blog.comments;
  if (!isLoaded) return null;

  const placeholder = userName
    ? t.sayDareNamed.replace("{name}", userName)
    : t.sayDare;

  if (isSignedIn && user) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              imageUrl={user.imageUrl}
              name={user.fullName || user.username || t.you}
              size="size-6"
            />
            <TypographyMuted className="text-xs truncate">
              {t.commentingAs}{" "}
              <span className="text-foreground font-medium">
                {user.fullName || user.username}
              </span>
            </TypographyMuted>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <SignOutIcon
              data-icon="inline-start"
              size={13}
              aria-hidden="true"
            />
            {t.signOut}
          </Button>
        </div>
        <Composer
          maxLength={COMMENT_MAX_LENGTH}
          onSubmit={onSubmit}
          placeholder={placeholder}
          submitLabel={t.comment}
          ariaLabel={t.writeAria}
          maxHeight={240}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <TypingBubble />
        <div className="space-y-0.5">
          <TypographySmall className="font-semibold">
            {t.gotSomething}
          </TypographySmall>
          <TypographyMuted className="text-xs">
            {t.signInBodyPrefix}{" "}
            <Link
              href="/guestbook"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {t.signInGuestbook}
            </Link>
            {t.signInBodySuffix}
          </TypographyMuted>
        </div>
      </div>
      <SignInButton mode="modal">
        <Button size="sm" className="shrink-0">
          <SignInIcon data-icon="inline-start" size={14} aria-hidden="true" />
          {t.signInToComment}
        </Button>
      </SignInButton>
    </div>
  );
}
