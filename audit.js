#!/usr/bin/env node
/* Controllo SEO/GEO delle pagine generate. Uso: node audit.js dist */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const dir = path.resolve(process.argv[2] || "dist");

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
}
const files = walk(dir);
const htmlFiles = files.filter((f) => f.endsWith(".html") && !f.endsWith("admin.html") && !f.endsWith("404.html"));
const rel = (f) => path.relative(dir, f);
const exists = (u) => {
  const p = u.split("#")[0].split("?")[0];
  if (!p || p === "./") return true;
  const t = path.join(dir, p);
  return fs.existsSync(t) && (!fs.statSync(t).isDirectory() || fs.existsSync(path.join(t, "index.html")));
};

const rows = [], issues = [], titles = new Map(), descs = new Map();
let errors = 0, warns = 0;
const bad = (page, m) => { issues.push("ERRORE  " + page + ": " + m); errors++; };
const warn = (page, m) => { issues.push("avviso  " + page + ": " + m); warns++; };

for (const f of htmlFiles) {
  const page = rel(f) === "index.html" ? "/" : "/" + rel(f).replace(/index\.html$/, "");
  const doc = new JSDOM(fs.readFileSync(f, "utf8")).window.document;
  const main = doc.querySelector("main");
  const q = (s) => [...doc.querySelectorAll(s)];
  const robots = (doc.querySelector('meta[name=robots]') || {}).content || "";
  const noindex = /noindex/.test(robots);
  const title = (doc.title || "").trim();
  const desc = ((doc.querySelector('meta[name=description]') || {}).content || "").trim();
  const canon = (doc.querySelector('link[rel=canonical]') || {}).href || "";
  const h1 = q("h1"), h2 = q("h2"), h3 = q("h3");
  const words = ((main && main.textContent) || "").trim().split(/\s+/).filter(Boolean).length;
  const imgs = q("main img"), noAlt = imgs.filter((i) => !(i.getAttribute("alt") || "").trim()).length;
  const svgs = q("main svg").filter((s) => !s.getAttribute("aria-label") && s.getAttribute("aria-hidden") !== "true" && !s.closest("[aria-hidden=true]")).length;
  const types = [];
  q('script[type="application/ld+json"]').forEach((s) => {
    try { const j = JSON.parse(s.textContent); (Array.isArray(j) ? j : [j]).forEach((x) => types.push(x["@type"])); }
    catch (e) { bad(page, "JSON-LD non valido"); }
  });

  if (!title) bad(page, "title mancante"); else { if (title.length > 60) warn(page, "title lungo " + title.length); if (title.length < 15) warn(page, "title corto " + title.length); }
  if (!desc) bad(page, "meta description mancante"); else { if (desc.length > 160) warn(page, "description lunga " + desc.length); if (desc.length < 70) warn(page, "description corta " + desc.length); }
  if (!canon) bad(page, "canonical mancante");
  if (h1.length !== 1 && page !== "/carrello/") bad(page, "H1 trovati: " + h1.length);
  if (!doc.querySelector('meta[property="og:title"]')) bad(page, "Open Graph mancante");
  if (!doc.documentElement.lang) bad(page, "lang mancante");
  if (!doc.querySelector("base")) bad(page, "base href mancante");
  if (noAlt) bad(page, noAlt + " immagini senza alt");
  if (svgs) warn(page, svgs + " svg senza etichetta");
  if (h3.length && !h2.length) bad(page, "H3 senza H2");
  // ordine dei titoli senza salti
  let last = 1;
  q("main h1,main h2,main h3,main h4").forEach((h) => { const n = +h.tagName[1]; if (n > last + 1) bad(page, "salto di livello titolo (H" + last + " → H" + n + ")"); last = n; });
  // id duplicati
  const ids = new Set(); q("[id]").forEach((e) => { if (ids.has(e.id)) bad(page, "id duplicato " + e.id); ids.add(e.id); });
  // link interni
  q("a[href]").forEach((a) => {
    const h = a.getAttribute("href");
    if (/^(https?:|mailto:|tel:|#|data:)/.test(h)) return;
    if (!exists(h)) bad(page, "link interno rotto " + h);
  });
  q("main img").forEach((i) => {
    if (!i.hasAttribute("width") || !i.hasAttribute("height")) warn(page, "immagine senza width/height");
  });
  if (!noindex && words < 150 && !/privacy|cookie|recesso|condizioni/.test(page)) warn(page, "poco testo: " + words + " parole");
  if (!noindex) {
    if (titles.has(title)) bad(page, "title duplicato con " + titles.get(title)); else titles.set(title, page);
    if (descs.has(desc)) bad(page, "description duplicata con " + descs.get(desc)); else descs.set(desc, page);
  }
  if (/\/prodotti\/./.test(page) && !types.includes("Product")) bad(page, "manca Product JSON-LD");
  if (/\/prodotti\/./.test(page) && !/<h2[^>]*>Descrizione/.test(doc.body.innerHTML)) warn(page, "manca sezione Descrizione");

  rows.push({ pagina: page, robots: noindex ? "noindex" : "index", titleLen: title.length, descLen: desc.length, H1: h1.length, H2: h2.length, H3: h3.length, parole: words, img: imgs.length, senzaAlt: noAlt, schema: [...new Set(types)].join("+") });
}

console.table(rows);
["sitemap.xml", "robots.txt", "llms.txt", "404.html", ".nojekyll"].forEach((n) => { if (!files.some((f) => rel(f) === n)) bad(n, "file mancante"); });
const sm = fs.existsSync(path.join(dir, "sitemap.xml")) ? fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8") : "";
if (/carrello|admin/.test(sm)) bad("sitemap.xml", "contiene carrello o admin");
const rb = fs.existsSync(path.join(dir, "robots.txt")) ? fs.readFileSync(path.join(dir, "robots.txt"), "utf8") : "";
console.log("\nrobots.txt:\n" + rb.split("\n").slice(0, 6).join("\n") + "\n");
console.log("URL in sitemap:", (sm.match(/<loc>/g) || []).length);
issues.forEach((i) => console.log(i));
console.log("\nRisultato: " + errors + " errori, " + warns + " avvisi su " + htmlFiles.length + " pagine");
process.exit(errors ? 1 : 0);
