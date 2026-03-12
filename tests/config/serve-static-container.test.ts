import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { startStaticServer } from "../../scripts/serve-static-container.js";

test("startStaticServer serves the built app and falls back to index.html for SPA routes", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "companyhelm-static-server-"));

  try {
    mkdirSync(join(tempDir, "assets"), { recursive: true });
    writeFileSync(join(tempDir, "index.html"), "<html><body>app-shell</body></html>", "utf8");
    writeFileSync(join(tempDir, "assets", "app.js"), "console.log('ok');", "utf8");

    const server = await startStaticServer({
      host: "127.0.0.1",
      port: 0,
      rootDir: tempDir,
    });

    try {
      const address = server.address();
      assert.ok(address && typeof address === "object");

      const rootResponse = await fetch(`http://127.0.0.1:${address.port}/`);
      assert.equal(rootResponse.status, 200);
      assert.match(await rootResponse.text(), /app-shell/);

      const assetResponse = await fetch(`http://127.0.0.1:${address.port}/assets/app.js`);
      assert.equal(assetResponse.status, 200);
      assert.match(assetResponse.headers.get("content-type") || "", /javascript/);
      assert.match(await assetResponse.text(), /console\.log/);

      const routeResponse = await fetch(`http://127.0.0.1:${address.port}/projects/123`);
      assert.equal(routeResponse.status, 200);
      assert.match(await routeResponse.text(), /app-shell/);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("startStaticServer returns 404 for missing asset paths", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "companyhelm-static-server-"));

  try {
    writeFileSync(join(tempDir, "index.html"), "<html><body>app-shell</body></html>", "utf8");

    const server = await startStaticServer({
      host: "127.0.0.1",
      port: 0,
      rootDir: tempDir,
    });

    try {
      const address = server.address();
      assert.ok(address && typeof address === "object");

      const response = await fetch(`http://127.0.0.1:${address.port}/assets/missing.js`);
      assert.equal(response.status, 404);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
