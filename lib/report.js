"use strict";

const crypto = require("crypto");

const DEFAULT_SECRET_PATTERNS = [
  /ntn_[A-Za-z0-9]+/g,
  /secret_[A-Za-z0-9]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /ghp_[A-Za-z0-9]+/g,
  /github_pat_[A-Za-z0-9_]+/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /NOTION_TOKEN\s*=\s*.+/g,
  /OPENAI_API_KEY\s*=\s*.+/g,
  /CLIENT_KEY_[A-Za-z0-9_]*\s*=\s*.+/g,
];

function buildReport(reportDate, codexEntries, terminalEntries, shellEntries, dependencies) {
  const { createBlocks } = dependencies;
  const codexSummary = summarizeEntries(codexEntries, 12);
  const terminalSummary = summarizeEntries(terminalEntries, 8);
  const shellSummary = summarizeEntries(shellEntries, 20);
  const codexText = codexSummary.join("\n").slice(0, 4000);
  const terminalText = terminalSummary.join("\n").slice(0, 4000);
  const shellText = shellSummary.join("\n").slice(0, 2000);
  const summary = [
    `Codex entries: ${codexEntries.length}`,
    `Terminal logs: ${terminalEntries.length}`,
    `Shell commands captured: ${shellEntries.length}`,
  ].join(" | ");

  const blocks = createBlocks([
    `Daily automation report for ${reportDate}.`,
    summary,
    "Codex History",
    codexText || "No Codex session data found for this day.",
    "Terminal Logs",
    terminalText || "No terminal log files found for this day.",
    "Recent Shell History",
    shellText || "No shell history file found.",
  ]);

  return {
    title: `Daily Codex Log ${reportDate}`,
    reportDate,
    blocks,
    hasChanges: codexEntries.length > 0 || terminalEntries.length > 0 || shellEntries.length > 0,
    preview: {
      title: `Daily Codex Log ${reportDate}`,
      summary,
      codexEntries: codexEntries.length,
      terminalEntries: terminalEntries.length,
      shellEntries: shellEntries.length,
    },
    hashes: {
      codex: sha256(codexText),
      terminal: sha256(terminalText),
      shell: sha256(shellText),
    },
  };
}

function summarizeEntries(entries, limit) {
  return entries.slice(0, limit).map((entry) => {
    const firstLine = entry.text.split("\n").find((line) => line.trim()) || "";
    const condensed = firstLine.replace(/\s+/g, " ").slice(0, 220);
    const prefix = entry.timestamp ? `[${entry.timestamp}] ` : "";
    return `${prefix}${entry.source}: ${condensed}`;
  });
}

function sanitizeText(text, secretPatterns = DEFAULT_SECRET_PATTERNS) {
  let output = text;
  for (const pattern of secretPatterns) {
    output = output.replace(pattern, "[REDACTED]");
  }
  return output;
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "");
}

function renderReportPreview(report) {
  const lines = [`Title: ${report.title}`, `Date: ${report.reportDate}`, `Summary: ${report.preview.summary}`, ""];

  for (const block of report.blocks) {
    if (block.type === "heading_2") {
      lines.push(`## ${block.heading_2.rich_text[0].text.content}`);
    }
    if (block.type === "paragraph") {
      lines.push(block.paragraph.rich_text[0].text.content);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

module.exports = {
  buildReport,
  sanitizeText,
  stripAnsi,
  renderReportPreview,
};
