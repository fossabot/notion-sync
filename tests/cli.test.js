const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

process.env.NOTION_TOKEN = "ntn_test";
process.env.NOTION_DATABASE_ID = "db_test";
process.env.ENCRYPTION_KEY = "encryption_test_value";
process.env.NOTION_SYNC_STATE_FILE = path.join(os.tmpdir(), "notion-sync-test-state.json");

let cli = require("../daily-upload.js");

function loadCli() {
  delete require.cache[require.resolve("../daily-upload.js")];
  cli = require("../daily-upload.js");
  return cli;
}

function testNormalizeCommand() {
  assert.equal(cli.normalizeCommand([]), "run");
  assert.equal(cli.normalizeCommand(["help"]), "help");
  assert.equal(cli.normalizeCommand(["doctor"]), "doctor");
  assert.equal(cli.normalizeCommand(["remote"]), "remote");
}

function testSanitizeText() {
  const input = "NOTION_TOKEN=secret_abc Bearer token-value ntn_123 ghp_123";
  const output = cli.sanitizeText(input);
  assert.ok(!output.includes("secret_abc"));
  assert.ok(output.includes("[REDACTED]"));
}

function testStripAnsi() {
  const input = "\u001b[31mred\u001b[0m";
  assert.equal(cli.stripAnsi(input), "red");
}

function testInitializeEnvFile() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "notion-sync-init-"));
  const previousCwd = process.cwd();
  process.chdir(tempDir);
  try {
    const message = cli.initializeEnvFile();
    assert.ok(message.includes("Created"));
    assert.ok(fs.existsSync(path.join(tempDir, ".env")));
    const secondMessage = cli.initializeEnvFile();
    assert.ok(secondMessage.includes("already exists"));
  } finally {
    process.chdir(previousCwd);
  }
}

function testDoctorShape() {
  const report = cli.runDoctor();
  assert.equal(typeof report.ok, "boolean");
  assert.ok(Array.isArray(report.checks));
  assert.ok(report.checks.some((check) => check.name === "paths.stateFile"));
}

async function testRemoteUploadFlow() {
  process.env.NOTION_SYNC_API_URL = "http://127.0.0.1:45231/api/sync";
  process.env.NOTION_SYNC_USER_LABEL = "integration-user";
  process.env.NOTION_SYNC_SOURCE = "integration-test";
  const cliWithRemote = loadCli();

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const payload = JSON.parse(body);
      assert.equal(payload.userLabel, "integration-user");
      assert.equal(payload.source, "integration-test");
      assert.match(payload.summary, /Codex entries/);
      assert.match(payload.codexText, /rollout-1\.jsonl/);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, pageId: "page_123", url: "https://example.com/page_123" }));
    });
  });

  await new Promise((resolve) => server.listen(45231, "127.0.0.1", resolve));

  try {
    const report = cliWithRemote.buildReport(
      "2026-03-09",
      [{ source: "rollout-1.jsonl", timestamp: "2026-03-09T10:00:00Z", text: "assistant: synced output" }],
      [{ source: "session.log", timestamp: null, text: "build completed" }],
      [{ source: "bash_history", timestamp: "new-1", text: "npm test" }]
    );

    const result = await cliWithRemote.uploadReportToRemote(report);
    assert.equal(result.pageId, "page_123");
    assert.equal(result.url, "https://example.com/page_123");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    delete process.env.NOTION_SYNC_API_URL;
    delete process.env.NOTION_SYNC_USER_LABEL;
    delete process.env.NOTION_SYNC_SOURCE;
    loadCli();
  }
}

async function run() {
  testNormalizeCommand();
  testSanitizeText();
  testStripAnsi();
  testInitializeEnvFile();
  testDoctorShape();
  await testRemoteUploadFlow();
  console.log("cli.test.js passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
