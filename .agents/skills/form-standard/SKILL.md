---
name: form-standard
description: "Setiap form di admin panel WAJIB diletakkan di dalam folder _components/ milik modul tersebut, sebagai berkas terpisah (bukan inline di panel.tsx). Aktif saat membuat form baru atau merestruktur form yang sudah ada."
---

# Form Standard

Setiap form di admin panel **wajib** menjadi komponen terpisah di dalam folder `_components/` milik modul tersebut.

## Aturan

1. **Folder lokasi**: `src/app/admin/<modul>/_components/`
2. **Nama berkas**: camelCase, mis. `shredForm.tsx`, `userForm.tsx`, `tagForm.tsx`
3. **Jangan inline**: form tidak boleh ditulis langsung di dalam `panel.tsx`
4. **Export**: form diekspor sebagai named export, bukan default
5. **Props**: `initial`, `onSubmit`, `onCancel`, `submitting`

## Struktur baku

```tsx
export function<Nama>Form({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: FormData;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  // ...
}
```

## Contoh

- `src/app/admin/projects/_components/shredForm.tsx` — form proyek
- `src/app/admin/blog/_components/` — (rencana) form blog
- `src/app/admin/links/_components/` — (rencana) form links
