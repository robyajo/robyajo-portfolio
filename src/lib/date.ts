export function formatLongDate(date: Date | string, locale: string = "en-US"): string {
    return new Date(date).toLocaleDateString(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
};

export function formatShortDate(date: Date | string, locale: string = "en-US"): string {
    return new Date(date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function formatMonthYear(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function formatMonthDay(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export function toISOString(date: Date | string): string {
    return new Date(date).toISOString();
}

export function toTimestamp(date: Date | string | undefined): number {
    return date ? new Date(date).getTime() : 0;
}

export function toRFC822(date: Date | string): string {
    return new Date(date).toUTCString();
}

export function formatFileDate(date: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-GB")
        .format(date)
        .replace(/\//g, "-");
}

export function currentYear(): number {
    return new Date().getFullYear();
}

export function nowISO(): string {
    return new Date().toISOString();
}

export function formatTimeInZone(timezone: string, date: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
    }).format(date);
}

export function getHourInZone(timezone: string, date: Date = new Date()): number {
    return Number(
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hourCycle: "h23",
            timeZone: timezone,
        }).format(date),
    );
}

export function statusForHourIndex(hour: number): number {
    if (hour < 2) return 0;
    if (hour < 6) return 1;
    if (hour < 9) return 2;
    if (hour < 13) return 3;
    if (hour < 14) return 4;
    if (hour < 18) return 5;
    if (hour < 21) return 6;
    return 7;
}

const EN_STATUSES = [
    "one more commit",
    "probably asleep",
    "brewing coffee",
    "deep in the code",
    "lunch break",
    "shipping things",
    "side-quest hours",
    "one more commit",
];

export function statusForHour(hour: number, statuses: readonly string[] = EN_STATUSES): string {
    return statuses[statusForHourIndex(hour)] ?? statuses[0] ?? "";
}

export function getZoneOffsetHours(timezone: string, from: Date = new Date()): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(from);

    const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? "0");
    const zoneAsUTC = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
    );
    const zoneOffsetMins = Math.round((zoneAsUTC - from.getTime()) / 60000);
    const localOffsetMins = -from.getTimezoneOffset();
    return Math.round((zoneOffsetMins - localOffsetMins) / 60);
}

export function timeAgo(date: string, locale: string = "en"): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
        ["second", 1],
    ];
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    for (const [unit, secs] of units) {
        if (seconds >= secs) return rtf.format(-Math.floor(seconds / secs), unit);
    }
    return locale === "id" ? "baru saja" : "just now";
}

/**
 * Label relasi berbasis HARI (bukan jam/menit). Dipakai untuk data yang hanya
 * akurat sampai tingkat hari (tanggal kegiatan), sehingga hasil label tetap
 * benar walaupun halaman dibuat dari snapshot cache beberapa jam lama lalu.
 * Selalu memakai zona Asia/Jakarta agar konsisten antara render server dan
 * cache, terlepas dari zona waktu host.
 */
export function dayAgoLabel(iso: string, locale: string = "en"): string {
    const zone = "Asia/Jakarta";
    const dayKey = (value: Date): string =>
        new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(value);
    const dayNumber = (key: string): number =>
        Date.parse(`${key}T00:00:00Z`) / 86_400_000;
    const isId = locale.startsWith("id");
    const diff = Math.round(
        dayNumber(dayKey(new Date(iso))) - dayNumber(dayKey(new Date())),
    );
    const ago = Math.abs(diff);
    if (ago === 0) return isId ? "Hari ini" : "Today";
    if (ago === 1) return isId ? "Kemarin" : "Yesterday";
    if (ago < 30) {
        return isId
            ? `${ago} hari yang lalu`
            : `${ago} day${ago > 1 ? "s" : ""} ago`;
    }
    if (ago < 365) {
        const months = Math.floor(ago / 30);
        return isId
            ? `${months} bulan yang lalu`
            : `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(ago / 365);
    return isId
        ? `${years} tahun yang lalu`
        : `${years} year${years > 1 ? "s" : ""} ago`;
}

export function formatRelativeDate(iso: string): string {    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
}
