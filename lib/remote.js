"use strict";

async function uploadReportToRemote(report, config, collectSummaryText) {
  if (!config.remoteApiUrl) {
    throw new Error("Missing NOTION_SYNC_API_URL for remote upload.");
  }

  if (!report.hasChanges) {
    return {
      ok: true,
      skipped: true,
      reason: `No new entries for ${report.reportDate}.`,
    };
  }

  const payload = {
    title: report.title,
    userLabel: config.remoteUserLabel,
    source: config.remoteSource,
    summary: report.preview.summary,
    codexText: collectSummaryText(report, "Codex History"),
    terminalText: collectSummaryText(report, "Terminal Logs"),
    shellText: collectSummaryText(report, "Recent Shell History"),
  };

  return postRemotePayload(payload, config.remoteApiUrl);
}

async function uploadCodexExportToRemote(result, config) {
  if (!config.remoteApiUrl) {
    throw new Error("Missing NOTION_SYNC_API_URL for remote upload.");
  }

  const payload = {
    title: result.title,
    userLabel: config.remoteUserLabel,
    source: config.remoteSource,
    summary: `Codex export entries: ${result.count}`,
    codexText: result.rendered,
    terminalText: "",
    shellText: "",
  };

  return postRemotePayload(payload, config.remoteApiUrl);
}

async function postRemotePayload(payload, remoteApiUrl) {
  const response = await fetch(remoteApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Remote upload failed (${response.status}).`);
  }

  return result;
}

function collectSummaryText(report, headingName) {
  const lines = [];
  let capture = false;

  for (const block of report.blocks) {
    if (block.type === "heading_2") {
      const heading = block.heading_2.rich_text[0].text.content;
      capture = heading === headingName;
      continue;
    }

    if (capture && block.type === "paragraph") {
      const text = block.paragraph.rich_text.map((part) => part.text.content).join("");
      lines.push(text);
    }
  }

  return lines.join("\n").trim();
}

module.exports = {
  uploadReportToRemote,
  uploadCodexExportToRemote,
  collectSummaryText,
};
