#!/usr/bin/env node
/**
 * Validate dataset files.
 * Usage:
 *   node scripts/validate-data.js
 *
 * Notes:
 * - This is a "no-install" minimal validator (no AJV). It checks core invariants.
 * - If you want full JSON Schema validation, add ajv later.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCES_PATH = path.join(ROOT, "data", "sources", "sources.json");
const VN_PATH = path.join(ROOT, "data", "vietnam", "periods.json");
const CN_PATH = path.join(ROOT, "data", "china", "periods.json");

const ALLOWED_COUNTRIES = new Set(["VN", "CN"]);
const ALLOWED_TYPES = new Set(["period", "dynasty", "event", "war", "era"]);
const ALLOWED_GRADES = new Set(["L6","L7","L8","L9","L10","L11","L12"]);
const ALLOWED_TOPICS = new Set(["politics","military","culture","economy","society","diplomacy","science_tech","religion","law"]);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function fail(errors, msg, ctx = "") {
  errors.push(ctx ? `${msg} | ${ctx}` : msg);
}

function validateItem(item, sourceIdsSet, errors) {
  const ctx = `id=${item?.id ?? "(missing)"}`;

  if (!isNonEmptyString(item.id) || !/^[a-z0-9_\-]+$/.test(item.id)) fail(errors, "Invalid id (must be [a-z0-9_-])", ctx);
  if (!ALLOWED_COUNTRIES.has(item.country)) fail(errors, "Invalid country", ctx);
  if (!ALLOWED_TYPES.has(item.type)) fail(errors, "Invalid type", ctx);
  if (!isNonEmptyString(item.name)) fail(errors, "Missing name", ctx);

  if (!Number.isInteger(item.startYear) || !Number.isInteger(item.endYear)) fail(errors, "startYear/endYear must be integers", ctx);
  if (Number.isInteger(item.startYear) && Number.isInteger(item.endYear) && item.startYear > item.endYear) fail(errors, "startYear > endYear", ctx);

  if (!Array.isArray(item.grades) || item.grades.length === 0) fail(errors, "grades must be non-empty array", ctx);
  if (Array.isArray(item.grades)) {
    for (const g of item.grades) if (!ALLOWED_GRADES.has(g)) fail(errors, `Invalid grade: ${g}`, ctx);
  }

  if (!Array.isArray(item.topics) || item.topics.length === 0) fail(errors, "topics must be non-empty array", ctx);
  if (Array.isArray(item.topics)) {
    for (const t of item.topics) if (!ALLOWED_TOPICS.has(t)) fail(errors, `Invalid topic: ${t}`, ctx);
  }

  if (!isNonEmptyString(item.summary) || item.summary.length < 10 || item.summary.length > 400) fail(errors, "summary must be 10..400 chars", ctx);

  if (!Array.isArray(item.sourceIds) || item.sourceIds.length === 0) fail(errors, "sourceIds must be non-empty array", ctx);
  if (Array.isArray(item.sourceIds)) {
    for (const sid of item.sourceIds) if (!sourceIdsSet.has(sid)) fail(errors, `Unknown sourceId: ${sid}`, ctx);
  }

  // content
  if (typeof item.content !== "object" || item.content === null) {
    fail(errors, "content must be an object", ctx);
  } else {
    for (const k of ["events","figures","achievements"]) {
      if (!Array.isArray(item.content[k])) fail(errors, `content.${k} must be array`, ctx);
      if (Array.isArray(item.content[k])) {
        for (const it of item.content[k]) {
          if (!isNonEmptyString(it.title) || !isNonEmptyString(it.detail)) {
            fail(errors, `content.${k} items require {title, detail}`, ctx);
            break;
          }
        }
      }
    }
  }
}

function validateNoDuplicateIds(allItems, errors) {
  const seen = new Set();
  for (const it of allItems) {
    if (seen.has(it.id)) fail(errors, "Duplicate id", `id=${it.id}`);
    seen.add(it.id);
  }
}

function overlap(a, b) {
  return a.startYear <= b.endYear && b.startYear <= a.endYear;
}

function validateOverlaps(items, errors) {
  // check overlaps within same country for types dynasty/period/era (events & wars can overlap)
  const keyTypes = new Set(["dynasty","period","era"]);
  const filtered = items.filter(it => keyTypes.has(it.type));
  filtered.sort((x,y) => x.startYear - y.startYear || x.endYear - y.endYear);

  for (let i=0; i<filtered.length; i++) {
    for (let j=i+1; j<filtered.length; j++) {
      const a = filtered[i], b = filtered[j];
      if (b.startYear > a.endYear) break;
      if (overlap(a,b) && !(a.overlapAllowed || b.overlapAllowed)) {
        fail(errors, "Overlap detected (set overlapAllowed=true if intentional)", `${a.id} (${a.startYear}-${a.endYear}) vs ${b.id} (${b.startYear}-${b.endYear})`);
      }
    }
  }
}

function main() {
  const sources = readJson(SOURCES_PATH);
  const sourceIdsSet = new Set((sources.sources || []).map(s => s.id));

  const vn = readJson(VN_PATH);
  const cn = readJson(CN_PATH);

  const errors = [];

  if (!Array.isArray(vn)) fail(errors, "VN periods.json must be an array");
  if (!Array.isArray(cn)) fail(errors, "CN periods.json must be an array");

  const all = [...vn, ...cn];

  validateNoDuplicateIds(all, errors);

  for (const it of all) validateItem(it, sourceIdsSet, errors);

  validateOverlaps(vn, errors);
  validateOverlaps(cn, errors);

  // useful stats
  const todo = all.filter(x => x.notes === "PLACEHOLDER_TODO").length;
  const real = all.length - todo;

  if (errors.length) {
    console.error("❌ DATA VALIDATION FAILED");
    for (const e of errors) console.error(" -", e);
    console.error(`\nStats: total=${all.length}, real=${real}, placeholders=${todo}`);
    process.exit(1);
  }

  console.log("✅ DATA VALIDATION PASSED");
  console.log(`Stats: total=${all.length}, real=${real}, placeholders=${todo}`);
  if (todo > 0) {
    console.log("⚠️ You still have placeholder TODO items. Replace them gradually with verified content + sources.");
  }
}

main();
