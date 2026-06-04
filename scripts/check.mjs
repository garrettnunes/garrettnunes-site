// Zero-dependency build check for garrettnunes-site.
// Verifies: index.html exists & parses key bits, referenced local assets
// resolve on disk, in-page anchors (#id) have matching targets, and no
// obvious unclosed-tag mismatch on the major structural tags.
//
// Exits non-zero on any failure so Render (or CI) blocks a broken deploy.

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

function rel(p) {
  return p.replace(root, "").replace(/\\/g, "/").replace(/^\//, "") || ".";
}

// --- 1. index.html must exist ---
const indexPath = join(root, "index.html");
if (!existsSync(indexPath)) {
  errors.push("index.html is missing at repo root.");
  report();
}
const html = readFileSync(indexPath, "utf8");

// --- 2. local asset references resolve on disk ---
const assetRe = /(?:href|src)\s*=\s*"([^"]+)"/g;
let m;
const anchors = [];
while ((m = assetRe.exec(html)) !== null) {
  const ref = m[1].trim();
  if (ref.startsWith("#")) {
    anchors.push(ref.slice(1));
    continue;
  }
  // skip external + data + mailto + protocol-relative
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:") || ref.startsWith("mailto:")) {
    continue;
  }
  const clean = ref.split("?")[0].split("#")[0];
  if (!clean) continue;
  const onDisk = join(root, clean);
  if (!existsSync(onDisk)) {
    errors.push(`Referenced local asset not found: "${ref}" -> ${rel(onDisk)}`);
  }
}

// --- 3. in-page anchors have matching id targets ---
const ids = new Set();
const idRe = /\bid\s*=\s*"([^"]+)"/g;
while ((m = idRe.exec(html)) !== null) ids.add(m[1]);
for (const a of anchors) {
  if (a && a !== "top" && !ids.has(a)) {
    errors.push(`Anchor "#${a}" has no matching element id in index.html.`);
  }
}

// --- 4. quick structural sanity: balanced major tags ---
for (const tag of ["html", "head", "body", "main", "header", "footer"]) {
  const open = (html.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
  if (open !== close) {
    errors.push(`Unbalanced <${tag}> tags: ${open} open vs ${close} close.`);
  }
}

// --- 5. essential meta presence (soft) ---
if (!/<title>[^<]+<\/title>/.test(html)) warnings.push("Missing or empty <title>.");
if (!/name="description"/.test(html)) warnings.push("Missing meta description.");

report();

function report() {
  for (const w of warnings) console.log("  warn:  " + w);
  if (errors.length) {
    console.error("\nBUILD CHECK FAILED:");
    for (const e of errors) console.error("  x  " + e);
    console.error(`\n${errors.length} error(s).`);
    process.exit(1);
  }
  console.log("Build check passed: assets resolve, anchors valid, tags balanced.");
  process.exit(0);
}
