"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CopyIcon, CheckIcon, DownloadIcon, CodeIcon } from "@/components/shared/icons";
import { getRawSvgAction } from "../actions";
import { toast } from "sonner";

export function SvgCodeModal({
  isOpen,
  onClose,
  id,
  name,
  componentName,
  sizeBytes,
}: {
  isOpen: boolean;
  onClose: () => void;
  id: string | null;
  name: string | null;
  componentName: string | null;
  sizeBytes: number;
}) {
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");
  const [copiedType, setCopiedType] = useState<"code" | "tag" | null>(null);

  useEffect(() => {
    if (!isOpen || !id) {
      setSvgContent("");
      return;
    }

    let active = true;
    setLoading(true);

    getRawSvgAction(id)
      .then((content) => {
        if (active) setSvgContent(content);
      })
      .catch((err) => {
        if (active) toast.error((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, id]);

  const handleCopySvg = () => {
    if (!svgContent) return;
    navigator.clipboard.writeText(svgContent);
    setCopiedType("code");
    toast.success("Kode SVG mentah berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyMdx = () => {
    if (!componentName) return;
    const code = `<${componentName} className="w-full max-w-lg mx-auto aspect-4/3 my-6" />`;
    navigator.clipboard.writeText(code);
    setCopiedType("tag");
    toast.success(`Tag MDX <${componentName} /> berhasil disalin!`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const sizeKb = (sizeBytes / 1024).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>{name}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {id}.svg
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Ukuran Berkas: <span className="font-mono font-medium text-foreground">{sizeKb} KB</span> • Format: <span className="font-mono font-medium text-foreground">SVG XML Standar</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 shrink-0">
          <Button
            size="sm"
            variant="default"
            onClick={handleCopySvg}
            disabled={loading || !svgContent}
            className="text-xs gap-1.5 h-8 font-mono"
          >
            {copiedType === "code" ? (
              <>
                <CheckIcon className="size-3.5 text-emerald-400" />
                Kode Tersalin
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                Salin Kode SVG
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyMdx}
            disabled={loading || !componentName}
            className="text-xs gap-1.5 h-8 font-mono"
          >
            {copiedType === "tag" ? (
              <>
                <CheckIcon className="size-3.5 text-emerald-400" />
                Tag Tersalin
              </>
            ) : (
              <>
                <CodeIcon className="size-3.5" />
                Salin Tag MDX
              </>
            )}
          </Button>

          {id && (
            <Button asChild size="sm" variant="ghost" className="text-xs gap-1.5 h-8 font-mono ml-auto">
              <a href={`/illustrations/isometric/${id}.svg`} download={`${id}.svg`}>
                <DownloadIcon className="size-3.5" />
                Unduh File
              </a>
            </Button>
          )}
        </div>

        {/* Konten Kode SVG */}
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/40 p-3 mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Spinner className="size-6 text-primary" />
              <p className="text-xs font-mono">Memuat kode SVG mentah...</p>
            </div>
          ) : (
            <pre className="font-mono text-2xs leading-relaxed text-foreground/90 whitespace-pre-wrap select-all">
              {svgContent || "Kode SVG tidak ditemukan."}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
