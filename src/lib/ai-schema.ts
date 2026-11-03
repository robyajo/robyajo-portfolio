import { z } from "zod";

export const aiProviderSchema = z.object({
  id: z.string().min(1, "ID provider wajib diisi").max(64),
  name: z.string().min(1, "Nama provider wajib diisi").max(128),
  baseUrl: z.string().url("Base URL harus berupa URL valid").max(512),
  apiKey: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  enabled: z.boolean().default(true),
});

export type AiProviderInput = z.infer<typeof aiProviderSchema>;

export const aiModelSchema = z.object({
  providerId: z.string().min(1, "Provider wajib dipilih").max(64),
  modelId: z.string().min(1, "Model ID wajib diisi").max(128),
  name: z.string().min(1, "Nama model wajib diisi").max(128),
  family: z.string().max(64).optional().nullable(),
  description: z.string().optional().nullable(),
  isThinkingSupported: z.boolean().default(false),
  reasoningEffort: z.enum(["low", "medium", "high"]).default("medium"),
  enabled: z.boolean().default(true),
});

export type AiModelInput = z.infer<typeof aiModelSchema>;

export const aiSettingSchema = z.object({
  task: z.enum(["chat", "blog"]),
  providerId: z.string().min(1, "Provider wajib dipilih"),
  modelId: z.string().min(1, "Model ID wajib dipilih"),
  enableThinking: z.boolean().default(false),
  reasoningEffort: z.enum(["low", "medium", "high"]).default("medium"),
  temperature: z.string().default("0.7"),
  maxTokens: z.number().int().min(128).max(32768).default(2048),
  systemPrompt: z.string().optional().nullable(),
});

export type AiSettingInput = z.infer<typeof aiSettingSchema>;

export interface AiModelRow {
  id: number;
  providerId: string;
  modelId: string;
  name: string;
  family: string | null;
  description: string | null;
  isThinkingSupported: boolean;
  reasoningEffort: "low" | "medium" | "high";
  pricing: Record<string, unknown> | null;
  features: string[] | null;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiProviderRow {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string | null;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiSettingRow {
  task: "chat" | "blog";
  providerId: string;
  modelId: string;
  enableThinking: boolean;
  reasoningEffort: "low" | "medium" | "high" | string;
  temperature: string;
  maxTokens: number;
  systemPrompt: string | null;
  updatedAt: Date;
}
