"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowCounterClockwiseIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@/components/shared/icons";
import { useDictionary } from "@/lib/i18n/provider";

interface ProjectFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: "all" | "enabled" | "disabled";
  onStatusChange: (value: "all" | "enabled" | "disabled") => void;
  stack: string;
  onStackChange: (value: string) => void;
  stacks: string[];
  onReset: () => void;
  hasActiveFilter: boolean;
}

export function ProjectFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stack,
  onStackChange,
  stacks,
  onReset,
  hasActiveFilter,
}: ProjectFilterProps) {
  const dict = useDictionary();
  const t = dict.admin.projects;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <InputGroup className="flex-1">
        <InputGroupAddon align="inline-start">
          <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
        {search && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => onSearchChange("")}
              aria-label={dict.common.close}
            >
              <XIcon aria-hidden="true" className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {/* Status Filter */}
      <div className="w-full sm:w-40">
        <Select
          value={status}
          onValueChange={(val) =>
            onStatusChange(val as "all" | "enabled" | "disabled")
          }
        >
          <SelectTrigger aria-label={t.filterStatusAll}>
            <SelectValue placeholder={t.filterStatusAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filterStatusAll}</SelectItem>
            <SelectItem value="enabled">{t.filterStatusEnabled}</SelectItem>
            <SelectItem value="disabled">{t.filterStatusDisabled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stack Filter */}
      {stacks.length > 0 && (
        <div className="w-full sm:w-48">
          <Select value={stack} onValueChange={onStackChange}>
            <SelectTrigger aria-label={t.filterStackAll}>
              <SelectValue placeholder={t.filterStackAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterStackAll}</SelectItem>
              {stacks.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset Filter Button */}
      {hasActiveFilter && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="shrink-0"
        >
          <ArrowCounterClockwiseIcon aria-hidden="true" className="size-3.5" />
          <span>{t.resetFilter}</span>
        </Button>
      )}
    </div>
  );
}
