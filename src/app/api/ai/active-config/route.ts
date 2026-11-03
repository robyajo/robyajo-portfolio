import { NextResponse } from "next/server";
import { getActiveAiConfig } from "@/lib/ai-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskParam = searchParams.get("task");
    const task = taskParam === "blog" ? "blog" : "chat";

    const config = await getActiveAiConfig(task);

    // Jangan bocorkan full secret jika dipanggil publik, tapi untuk skrip internal sertakan detail penting
    return NextResponse.json({
      success: true,
      task: config.task,
      providerId: config.providerId,
      providerName: config.providerName,
      modelId: config.modelId,
      endpointUrl: config.endpointUrl,
      enableThinking: config.enableThinking,
      reasoningEffort: config.reasoningEffort,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      isDbDriven: config.isDbDriven,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
