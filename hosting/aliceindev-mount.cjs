"use strict";
// Copy this file to aliceindev/mobywatel-mount.js. No new server process.
const path = require("node:path");
module.exports = function mountMobywatel(app, express, options = {}) {
  const base = options.base || "/mobywatel";
  const dist =
    options.distPath ||
    process.env.MOBYWATEL_DIST_PATH ||
    path.join(__dirname, "..", "mobywatel", "dist");
  const router = express.Router();
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
    const originalPath = req.originalUrl.split("?")[0];
    if (originalPath === base) {
      const query = req.originalUrl.includes("?")
        ? "?" + req.originalUrl.split("?").slice(1).join("?")
        : "";
      return res.redirect(308, base + "/" + query);
    }
    next();
  });
  router.use(
    express.static(dist, {
      index: false,
      dotfiles: "ignore",
      setHeaders(res, file) {
        if (
          path.basename(path.dirname(file)) === "assets" &&
          /-[a-zA-Z0-9_-]{8,}\.(js|css)$/.test(file)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );
  router.use((req, res, next) => {
    if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
    if (
      req.path.startsWith("/assets/") ||
      req.path.startsWith("/api/") ||
      path.extname(req.path) ||
      req.path.split("/").some((p) => p.startsWith("."))
    )
      return res.status(404).end();
    if (!req.accepts("html")) return res.status(404).end();
    res.sendFile(path.join(dist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
  app.use(base, router);
  return router;
};
