import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { readdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const express = require("express"),
  mount = require("../hosting/aliceindev-mount.cjs");
let server: any, base: string;
beforeAll(async () => {
  const app = express();
  app.use((_req: any, res: any, next: any) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  mount(app, express, { distPath: path.resolve("dist") });
  app.get("/", (_req: any, res: any) => res.send("Aliceindev"));
  app.get("/WEREINTHISTOGETHER", (_req: any, res: any) =>
    res.status(401).send("Existing auth"),
  );
  app.get("/ispeakparseltongue", (_req: any, res: any) =>
    res.send("Existing proxy"),
  );
  await new Promise<void>((r) => (server = app.listen(0, "127.0.0.1", r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => new Promise<void>((r) => server.close(r)));
describe("Aliceindev static mount", () => {
  it("canonicalizes the slash and preserves query strings", async () => {
    const r = await fetch(base + "/mobywatel?demo=1", { redirect: "manual" });
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("/mobywatel/?demo=1");
  });
  it("serves app and deep routes with revalidated HTML", async () => {
    for (const route of ["/mobywatel/", "/mobywatel/cases/letter-case"]) {
      const r = await fetch(base + route);
      expect(r.status).toBe(200);
      expect(r.headers.get("cache-control")).toBe("no-cache");
      expect(await r.text()).toContain("/mobywatel/assets/");
    }
  });
  it("does not send HTML for missing assets or API calls", async () => {
    for (const route of [
      "/mobywatel/assets/missing.js",
      "/mobywatel/missing.png",
      "/mobywatel/api/nope",
      "/mobywatel/.env",
    ]) {
      const r = await fetch(base + route);
      expect(r.status).toBe(404);
      expect(await r.text()).not.toContain("<html");
    }
  });
  it("caches hashed assets and denies runtime connections and device APIs", async () => {
    const file = readdirSync("dist/assets").find((n) => n.endsWith(".js"))!;
    const r = await fetch(base + "/mobywatel/assets/" + file);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toContain("immutable");
    expect(r.headers.get("content-security-policy")).toContain(
      "connect-src 'none'",
    );
    expect(r.headers.get("permissions-policy")).toContain(
      "camera=(), microphone=()",
    );
  });
  it("leaves sibling apps and their authentication outside the mount", async () => {
    expect(await (await fetch(base + "/")).text()).toBe("Aliceindev");
    expect((await fetch(base + "/WEREINTHISTOGETHER")).status).toBe(401);
    expect(await (await fetch(base + "/ispeakparseltongue")).text()).toBe(
      "Existing proxy",
    );
  });
  it("has no prototype backend endpoints", async () => {
    expect(
      (await fetch(base + "/mobywatel/cases", { method: "POST" })).status,
    ).toBe(405);
  });
});
