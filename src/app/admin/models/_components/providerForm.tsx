"use client";

import { useState } from "react";
import type { AiProviderInput, AiProviderRow } from "@/lib/ai-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DialogFooter } from "@/components/ui/dialog";

export function ProviderForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: AiProviderRow;
  onSubmit: (data: Partial<AiProviderInput>) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial.name || "");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl || "");
  const [apiKey, setApiKey] = useState(initial.apiKey || "");
  const [description, setDescription] = useState(initial.description || "");
  const [enabled, setEnabled] = useState(initial.enabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUrl.trim()) return;

    onSubmit({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim() || null,
      description: description.trim() || null,
      enabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="providerName">Nama Provider</Label>
        <Input
          id="providerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="baseUrl">Base URL / Endpoint Host</Label>
        <Input
          id="baseUrl"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://er-ai-gateway.duckdns.org/v1 atau https://er-ai-api.mooo.com"
          required
        />
        <p className="text-xs text-muted-foreground">
          URL induk layanan API OpenAI-compatible provider ini.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apiKey">API Key / Token Akses (Opsional)</Label>
        <Input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Kosongkan untuk memakai kunci default dari file .env"
        />
        <p className="text-xs text-muted-foreground">
          Bila dikosongkan, server otomatis memakai variabel lingkungan yang sesuai di server.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Keterangan / Catatan</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="enabled" className="cursor-pointer text-sm">
          Provider Aktif
        </Label>
      </div>

      <DialogFooter className="mt-4 gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting || !name.trim() || !baseUrl.trim()}>
          {submitting ? (
            <>
              <Spinner className="size-4 mr-2" />
              Menyimpan…
            </>
          ) : (
            "Simpan Perubahan Provider"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
