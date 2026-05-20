/**
 * ============================================================
 * BEACON PROJECT — HTTP Utility
 * ============================================================
 * File:     scripts/http.js
 * Purpose:  All HTTP requests made by any agent go through
 *           this module. Centralises timeout handling, redirect
 *           following, error classification, and response
 *           normalisation. No agent fetches URLs directly.
 *
 * Owner:    Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const https   = require("https");
const http    = require("http");
const { THRESHOLDS } = require("./config");

// ─────────────────────────────────────────────────────────────────────────────
// CORE FETCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a URL and returns a normalised response object.
 * Follows redirects up to THRESHOLDS.maxRedirects hops.
 * Times out after THRESHOLDS.requestTimeoutMs milliseconds.
 *
 * @param {string}  url
 * @param {object}  [options]
 * @param {number}  [options.timeoutMs]     - Override default timeout
 * @param {number}  [options.redirectCount] - Internal redirect counter
 * @returns {Promise<{
 *   ok:      boolean,
 *   status:  number,
 *   body:    string,
 *   headers: object,
 *   url:     string,
 *   error:   string|null
 * }>}
 */
function fetchUrl(url, options = {}) {
  const timeoutMs      = options.timeoutMs      || THRESHOLDS.requestTimeoutMs;
  const redirectCount  = options.redirectCount  || 0;

  return new Promise((resolve) => {

    if (redirectCount > THRESHOLDS.maxRedirects) {
      return resolve({ ok: false, status: 0, body: "", headers: {}, url, error: "Too many redirects" });
    }

    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, { timeout: timeoutMs }, (res) => {

      // Follow redirects transparently
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, { ...options, redirectCount: redirectCount + 1 }));
      }

      let body = "";
      res.on("data",  chunk => { body += chunk; });
      res.on("error", err   => resolve({ ok: false, status: 0, body: "", headers: {}, url, error: err.message }));
      res.on("end",   ()    => resolve({
        ok:      res.statusCode === 200,
        status:  res.statusCode,
        body,
        headers: res.headers,
        url,
        error:   null,
      }));
    });

    req.on("error",   err => resolve({ ok: false, status: 0, body: "", headers: {}, url, error: err.message }));
    req.on("timeout", ()  => {
      req.destroy();
      resolve({ ok: false, status: 0, body: "", headers: {}, url, error: `Timed out after ${timeoutMs}ms` });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick check — returns just ok/status without storing body.
 * Used by uptime ping where we only care about HTTP status.
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<{ok: boolean, status: number, url: string, error: string|null}>}
 */
async function pingUrl(url, options = {}) {
  const res = await fetchUrl(url, { timeoutMs: THRESHOLDS.hourlyUptimeTimeoutMs, ...options });
  return { ok: res.ok, status: res.status, url, error: res.error };
}

/**
 * Fetches a URL and returns the body only.
 * Returns empty string on failure.
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchBody(url) {
  const res = await fetchUrl(url);
  return res.ok ? res.body : "";
}

/**
 * Fetches a URL and checks whether a phrase is present in the body.
 * @param {string} url
 * @param {string} phrase
 * @returns {Promise<{found: boolean, ok: boolean, error: string|null}>}
 */
async function fetchAndCheck(url, phrase) {
  const res = await fetchUrl(url);
  return {
    found: res.ok && res.body.includes(phrase),
    ok:    res.ok,
    error: res.error,
  };
}

module.exports = { fetchUrl, pingUrl, fetchBody, fetchAndCheck };
