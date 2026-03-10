"use strict";

async function deliverExportToSupabase(result, config) {
  if (!config.supabaseUrl) {
    throw new Error("Missing SUPABASE_URL for supabase destination.");
  }
  if (!config.supabaseKey) {
    throw new Error("Missing SUPABASE_KEY for supabase destination.");
  }
  if (!config.supabaseTable) {
    throw new Error("Missing SUPABASE_TABLE for supabase destination.");
  }

  const row = {
    user_label: config.remoteUserLabel || null,
    source_type: "codex",
    title: result.title,
    summary: `Codex export entries: ${result.count}`,
    content_markdown: result.format === "markdown" ? result.rendered : null,
    content_text: result.format === "text" ? result.rendered : result.rendered,
    destination: "supabase",
    export_type: result.inputPaths?.length > 1 ? "batch" : "single",
    session_count: result.inputPaths?.length || 1,
    source_paths: result.inputPaths || [result.inputPath],
    metadata: {
      output_path: result.outputPath,
      format: result.format,
    },
  };

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.supabaseTable}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${config.supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const payload = await response.json().catch(() => []);
  if (!response.ok) {
    const message = Array.isArray(payload) ? JSON.stringify(payload) : payload.message || JSON.stringify(payload);
    throw new Error(`Supabase upload failed (${response.status}): ${message}`);
  }

  const inserted = Array.isArray(payload) ? payload[0] || {} : payload;
  return {
    ok: true,
    destination: "supabase",
    rowId: inserted.id || null,
    outputPath: result.outputPath,
    count: result.count,
    table: config.supabaseTable,
  };
}

module.exports = {
  deliverExportToSupabase,
};
