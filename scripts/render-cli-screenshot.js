#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.input || !options.output) {
    throw new Error("Usage: node scripts/render-cli-screenshot.js --input file.txt --output file.html --title \"Title\"");
  }

  const content = fs.readFileSync(path.resolve(options.input), "utf8");
  const html = renderHtml(options.title || "notion-sync", content);
  fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
  fs.writeFileSync(path.resolve(options.output), html);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      options.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--output") {
      options.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--title") {
      options.title = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0b1220;
      --panel: #0f172a;
      --panel-2: #111827;
      --text: #e5edf7;
      --muted: #93a4ba;
      --green: #8ddf97;
      --border: rgba(148, 163, 184, 0.2);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(34, 197, 94, 0.14), transparent 28%),
        radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.12), transparent 24%),
        linear-gradient(180deg, #08111f 0%, #0b1220 100%);
      color: var(--text);
      font-family: "JetBrains Mono", "Fira Code", monospace;
      display: grid;
      place-items: center;
      padding: 32px;
    }
    .frame {
      width: 1280px;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 30px 100px rgba(0, 0, 0, 0.4);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border);
    }
    .dots {
      display: flex;
      gap: 10px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 999px;
    }
    .dot.red { background: #fb7185; }
    .dot.yellow { background: #fbbf24; }
    .dot.green { background: #4ade80; }
    .title {
      font-size: 15px;
      color: var(--muted);
      letter-spacing: 0.03em;
    }
    .brand {
      color: var(--green);
      font-weight: 700;
    }
    pre {
      margin: 0;
      padding: 28px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 22px;
      line-height: 1.55;
      background: linear-gradient(180deg, rgba(17, 24, 39, 0.68), rgba(2, 6, 23, 0.88));
    }
    .prompt { color: var(--green); }
  </style>
</head>
<body>
  <div class="frame">
    <div class="topbar">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="brand">notion-sync</div>
    </div>
    <pre><span class="prompt">$ </span>${escapeHtml(content)}</pre>
  </div>
</body>
</html>
`;
}

main();
