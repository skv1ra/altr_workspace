import { NextResponse } from "next/server";
import { CONNECTION_PROVIDERS } from "@/lib/connections";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const [connectionsResult, importsResult] = await Promise.all([
      admin
        .from("altr_data_connections")
        .select("id,provider,display_name,status,connected_at,last_synced_at,updated_at,metadata")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("altr_conversation_imports")
        .select("platform,status,conversations,messages,created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false }),
    ]);
    if (connectionsResult.error) throw connectionsResult.error;
    if (importsResult.error) throw importsResult.error;

    const connections = connectionsResult.data ?? [];
    const imports = importsResult.data ?? [];
    const providers = CONNECTION_PROVIDERS.map((provider) => {
      const connection = connections.find((item) => item.provider === provider && item.status === "connected")
        ?? connections.find((item) => item.provider === provider);
      const providerImports = imports.filter((item) => item.platform === provider);
      const totals = providerImports.reduce(
        (total, item) => ({
          conversations: total.conversations + Number(item.conversations ?? 0),
          messages: total.messages + Number(item.messages ?? 0),
        }),
        { conversations: 0, messages: 0 },
      );
      const metadata = connection?.metadata && typeof connection.metadata === "object" && !Array.isArray(connection.metadata)
        ? connection.metadata as Record<string, unknown>
        : {};
      const sync = metadata.sync && typeof metadata.sync === "object" && !Array.isArray(metadata.sync)
        ? metadata.sync as Record<string, unknown>
        : {};
      const liveTotals = {
        conversations: Number(sync.conversations ?? 0),
        messages: Number(sync.messages ?? 0),
      };
      return {
        provider,
        available: provider === "gmail",
        connectionId: connection?.id ?? null,
        displayName: connection?.display_name ?? null,
        status: connection?.status ?? "disconnected",
        connectedAt: connection?.connected_at ?? null,
        lastSyncedAt: connection?.last_synced_at ?? null,
        imports: providerImports.length,
        conversations: totals.conversations + liveTotals.conversations,
        messages: totals.messages + liveTotals.messages,
      };
    });

    return NextResponse.json({ providers });
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? "AUTH_REQUIRED" : "CONNECTIONS_LIST_FAILED" },
      { status },
    );
  }
}
