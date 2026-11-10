#!/usr/bin/env node
/* Genera il sito statico in dist/: pagine vere con URL propri, dati strutturati, sitemap, robots e llms.txt.
   Legge prodotti e impostazioni da Supabase (sola lettura pubblica) oppure da un file di prova: --data tests/fixture.json */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "seo.config.json"), "utf8"));
const SITE = (process.env.SITE_URL || cfg.siteUrl).replace(/\/*$/, "/");
const BASE = new URL(SITE).pathname;
const argv = process.argv.slice(2);
const dataArg = argv.indexOf("--data") >= 0 ? argv[argv.indexOf("--data") + 1] : null;
const warnings = [];

/* ---------- utilità ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (n) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
const countWords = (t) => (String(t || "").trim().match(/\S+/g) || []).length;
function cut(t, n) {
  t = String(t || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const s = t.slice(0, n - 1), i = s.lastIndexOf(" ");
  return s.slice(0, i > 40 ? i : s.length).replace(/[,.;:\s-]+$/, "") + "…";
}
const fit = (...c) => { for (const x of c) if (x.length <= 60) return x; return cut(c[c.length - 1], 60); };
const ld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, "\\u003c") + "</script>";
const paragraphs = (t) => String(t || "").split(/\n{2,}|\r\n\r\n/).map((x) => x.trim()).filter(Boolean).map((x) => "<p>" + esc(x) + "</p>").join("");

/* ---------- app.js in jsdom: riuso dei testi legali ---------- */
function loadApi() {
  const dom = new JSDOM("<!doctype html><body><div id='app'></div></body>", { runScripts: "outside-only", url: SITE });
  dom.window.__BUILD = true;
  dom.window.eval(fs.readFileSync(path.join(ROOT, "app.js"), "utf8"));
  if (!dom.window.__api) throw new Error("app.js non espone __api");
  return dom.window.__api;
}

/* ---------- dati ---------- */
async function loadData() {
  if (dataArg) return JSON.parse(fs.readFileSync(path.resolve(dataArg), "utf8"));
  const h = { apikey: cfg.supabaseKey, Authorization: "Bearer " + cfg.supabaseKey };
  const pr = await fetch(cfg.supabaseUrl + "/rest/v1/shop_products?select=*&visible=eq.true&order=created_at.desc", { headers: h });
  if (!pr.ok) throw new Error("Lettura prodotti non riuscita: HTTP " + pr.status);
  const st = await fetch(cfg.supabaseUrl + "/rest/v1/shop_settings?select=data&id=eq.1", { headers: h });
  if (!st.ok) throw new Error("Lettura impostazioni non riuscita: HTTP " + st.status);
  const s = await st.json();
  return { products: await pr.json(), settings: (s[0] && s[0].data) || {} };
}
const imgUrl = (p) => /^https?:/.test(p) ? p : /^img\//.test(p) ? SITE + p : cfg.supabaseUrl + "/storage/v1/object/public/shop-images/" + encodeURI(p);
function mapRow(r) {
  return { id: r.id, name: r.name, category: r.category || "Ciotole", type: r.type, price: Number(r.price), stock: r.stock | 0,
    desc: (r.descr || "").trim(), dims: r.dims || "", material: r.material || "", care: r.care || "", c1: r.c1, c2: r.c2,
    images: r.images || [], alts: r.image_alts || [], slug: r.slug || "", meta: (r.meta_desc || "").trim(), created: r.created_at };
}

/* ---------- categorie ---------- */
const CATS = {
  Ciotole: { slug: "ciotole", h1: "Ciotole turche in ceramica dipinta a mano", noun: "ciotola",
    intro: "Le ciotole in ceramica turca dipinta a mano servono tutti i giorni: zuppe, frutta, insalate, oppure da lasciare in vista come centrotavola. Ogni pezzo è decorato a mano, quindi smalti e disegni possono variare leggermente da un esemplare all’altro. Nella scheda di ogni ciotola trovi misure, materiale e consigli di cura. Se cerchi una misura o un colore che non vedi qui, scrivici." },
  Piatti: { slug: "piatti", h1: "Piatti turchi in ceramica dipinta a mano", noun: "piatto",
    intro: "I piatti in ceramica turca dipinta a mano sono pensati per la tavola di tutti i giorni e per le occasioni speciali: portata, dessert, oppure da appoggiare come decorazione. Ogni decoro è dipinto a mano, per questo due piatti non sono mai identici al cento per cento. Le schede indicano diametro, materiale e cura di ogni pezzo." },
  Tazze: { slug: "tazze", h1: "Tazze turche in ceramica smaltata", noun: "tazza",
    intro: "Le tazze in ceramica turca smaltata sono ideali per caffè, tè e cioccolata. Sono decorate a mano, quindi colore e smalto possono differire leggermente da una tazza all’altra. Nella scheda trovi misure e capacità di ogni modello." },
  Vasi: { slug: "vasi", h1: "Vasi turchi in ceramica dipinta a mano", noun: "vaso",
    intro: "I vasi in ceramica turca dipinta a mano sono un modo semplice di portare colore in casa, con o senza fiori. Forme e decori sono realizzati da artigiani, per questo ogni vaso ha le sue piccole differenze. Controlla altezza e diametro nella scheda per scegliere quello adatto allo spazio che hai in mente." },
  Decorazioni: { slug: "decorazioni", h1: "Decorazioni turche in ceramica dipinta a mano", noun: "decorazione",
    intro: "Piastrelle, piccoli oggetti e decorazioni in ceramica turca dipinta a mano: pezzi pensati per dare un tocco di colore alle pareti, ai ripiani e alla tavola. Ogni oggetto è decorato a mano e può avere piccole differenze rispetto alle foto." }
};
function catInfo(name) {
  return CATS[name] || { slug: slugify(name), h1: name + " in ceramica turca", noun: String(name).toLowerCase(),
    intro: "Ceramiche turche artigianali della categoria " + name + ", selezionate una per una. Ogni pezzo è decorato a mano e può avere piccole differenze rispetto alle foto." };
}

/* ---------- costruzione ---------- */
async function main() {
  const api = loadApi();
  const data = await loadData();
  const S = Object.assign({}, api.DEFAULTS, data.settings || {});
  api.setSettings(data.settings || {});
  const brand = S.brand;

  let products = (data.products || []).filter((r) => r.visible !== false).map(mapRow);
  let demo = false;
  if (!products.length) {
    demo = true;
    products = api.DEMO.map((d) => ({ id: d.id, name: d.name, category: d.category, type: d.type, price: d.price, stock: d.stock, desc: d.desc, dims: d.dims,
      material: "Ceramica smaltata, dipinta a mano", care: "Lavaggio a mano consigliato", c1: d.c1, c2: d.c2, images: [], alts: [], slug: "", meta: "", created: null }));
    warnings.push("Nessun prodotto nel catalogo: uso i prodotti di esempio e metto tutto in noindex.");
  }
  const used = new Set();
  products.forEach((p) => { let s = p.slug || slugify(p.name) || "prodotto", k = s, i = 2; while (used.has(k)) k = s + "-" + i++; p.slug = k; used.add(k); });

  const missingSeller = ["company", "vat", "address", "email", "rea"].filter((k) => !S[k]);
  if (missingSeller.length) warnings.push("Dati del venditore mancanti nelle impostazioni: " + missingSeller.join(", "));
  if (brand === api.DEFAULTS.brand) warnings.push("Il nome del brand è ancora quello provvisorio.");
  const indexable = !!cfg.indexable && !demo;
  if (!cfg.indexable) warnings.push("seo.config.json: indexable è false, quindi il sito è escluso dai motori di ricerca.");
  const robots = indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow";

  const cats = [];
  products.forEach((p) => { if (!cats.includes(p.category)) cats.push(p.category); });
  const byCat = (c) => products.filter((p) => p.category === c);
  const productPath = (p) => "prodotti/" + p.slug + "/";
  const catPath = (c) => "negozio/" + catInfo(c).slug + "/";
  const ogDefault = cfg.ogImage || (S.heroImage ? imgUrl(S.heroImage) : "") || (products.find((p) => p.images.length) ? imgUrl(products.find((p) => p.images.length).images[0]) : "");

  const ship = { cost: Number(S.shippingCost), free: Number(S.freeFrom), days: S.shippingDays };
  const org = { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "#organizzazione", name: brand, url: SITE,
    description: S.siteDesc || (brand + ": " + S.tagline + "."), areaServed: "IT" };
  if (S.email) org.email = S.email;
  if (S.phone) org.telephone = S.phone;
  if (S.address) org.address = { "@type": "PostalAddress", streetAddress: S.address, addressCountry: "IT" };
  if (S.vat) org.vatID = /^IT/i.test(S.vat) ? S.vat : "IT" + S.vat;
  const sameAs = [];
  if (S.instagram) sameAs.push("https://www.instagram.com/" + S.instagram.replace(/^@/, ""));
  const etsy = /^https:\/\/([a-z0-9-]+\.)?etsy\.com\//i.test(S.etsy || "") ? S.etsy : "";
  if (etsy) sameAs.push(etsy);
  if (sameAs.length) org.sameAs = sameAs;
  if (S.etsy && !etsy) warnings.push("Il link Etsy non sembra un indirizzo etsy.com: non lo uso.");
  const etsyA = (label, cls) => etsy ? '<a ' + (cls ? 'class="' + cls + '" ' : "") + 'href="' + esc(etsy) + '" target="_blank" rel="noopener">' + label + "</a>" : "";
  const website = { "@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "#sito", name: brand, url: SITE, inLanguage: "it", publisher: { "@id": SITE + "#organizzazione" } };

  const themeCss = api.themeCss(S);
  const pages = [];
  const faqLd = (qa) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  const faqHtml = (qa, extra) => '<section class="sec faq" aria-labelledby="h-faq"><h2 id="h-faq">Domande frequenti</h2>' + qa.map(([q, a, html]) => "<h3>" + esc(q) + "</h3><p>" + (html || esc(a)) + "</p>").join("") + (extra || "") + "</section>";
  const crumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + p })) });
  const crumbHtml = (items) => '<nav class="crumbs" aria-label="Briciole di pane"><ol>' + items.map(([n, p], i) => "<li>" + (i === items.length - 1 ? '<span aria-current="page">' + esc(n) + "</span>" : '<a href="' + (p || "./") + '">' + esc(n) + "</a>") + "</li>").join("") + "</ol></nav>";

  /* immagini */
  const altOf = (p, i) => (p.alts[i] && p.alts[i].trim()) || (i === 0 ? p.name + ", ceramica artigianale turca dipinta a mano" : p.name + ", foto " + (i + 1));
  function picHtml(p, eager) {
    if (p.images.length) return '<img src="' + esc(imgUrl(p.images[0])) + '" alt="' + esc(altOf(p, 0)) + '" width="800" height="800" decoding="async" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ">";
    const svg = api.vessel(p.type, p.c1, p.c2).replace(/aria-label="[^"]*"/, 'aria-label="' + esc(p.name + ", illustrazione") + '"');
    return '<div class="art" style="background:color-mix(in srgb,' + esc(p.c1 || "#1d3fae") + ' 16%,var(--surface2))">' + svg + "</div>";
  }
  const card = (p, eager) => '<article class="card"><a class="pic" href="' + productPath(p) + '" tabindex="-1" aria-hidden="true">' + picHtml(p, eager) + (p.stock <= 0 ? '<span class="tag sold">Esaurito</span>' : "") + "</a>" +
    '<h3><a href="' + productPath(p) + '">' + esc(p.name) + '</a></h3><div class="meta"><span>' + esc(p.category) + "</span><strong>" + eur(p.price) + "</strong></div></article>";
  const grid = (l) => '<div class="grid">' + l.map((p, i) => card(p, i < 2)).join("") + "</div>";

  /* pagina generica */
  function shell(o) {
    const canon = SITE + o.path;
    const pageRobots = o.noindex ? "noindex,nofollow" : robots;
    const img = o.image || ogDefault;
    const nav = (href, label) => '<a href="' + href + '"' + (o.path === href || (href !== "" && o.path.indexOf(href) === 0 && href !== "carrello/") ? ' aria-current="page"' : "") + ">" + label + "</a>";
    const head = '<!doctype html>\n<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
      '<base href="' + esc(BASE) + '"><title>' + esc(o.title) + '</title><meta name="description" content="' + esc(o.desc) + '"><meta name="robots" content="' + pageRobots + '">' +
      '<link rel="canonical" href="' + esc(canon) + '"><meta property="og:type" content="' + (o.ogType || "website") + '"><meta property="og:site_name" content="' + esc(brand) + '"><meta property="og:locale" content="it_IT">' +
      '<meta property="og:title" content="' + esc(o.title) + '"><meta property="og:description" content="' + esc(o.desc) + '"><meta property="og:url" content="' + esc(canon) + '">' +
      (img ? '<meta property="og:image" content="' + esc(img) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(img) + '">' : '<meta name="twitter:card" content="summary">') +
      '<meta name="twitter:title" content="' + esc(o.title) + '"><meta name="twitter:description" content="' + esc(o.desc) + '">' +
      '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect x=\'7\' y=\'7\' width=\'18\' height=\'18\' fill=\'%231d3fae\' transform=\'rotate(45 16 16)\'/%3E%3C/svg%3E">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap">' +
      '<link rel="stylesheet" href="app.css">' + ((api.FONTS[S.fontStyle] || {}).url ? '<link rel="stylesheet" href="' + esc(api.FONTS[S.fontStyle].url) + '">' : "") +
      (themeCss ? "<style>" + themeCss + "</style>" : "") + (o.ld || []).map(ld).join("") + "</head>";
    const header = '<a class="skip" href="' + esc(BASE + o.path) + '#contenuto">Vai al contenuto</a>' + (S.announce ? '<div class="announce" role="note">' + esc(S.announce) + "</div>" : "") +
      '<header class="top"><div class="top-in"><a class="brand" href="./">' + (S.logo ? '<img class="logo" src="' + esc(imgUrl(S.logo)) + '" alt="" height="32">' : "<i></i>") + '<span>' + esc(brand) + '</span></a>' +
      '<nav class="nav" aria-label="Principale">' + nav("negozio/", "Negozio") + nav("chi-siamo/", "Chi siamo") + nav("spedizioni/", "Spedizioni") + nav("contatti/", "Contatti") + etsyA("Etsy ↗") +
      '<a href="carrello/" class="cartbtn" aria-label="Carrello">Carrello <b id="cartcount">0</b></a></nav></div></header>';
    const footer = '<footer class="wrap foot"><div><p class="fh">' + esc(brand) + "</p><p>" + esc(S.tagline) + ".</p>" +
      (S.company ? '<p style="margin-top:8px">' + esc(S.company) + (S.vat ? " · P.IVA " + esc(S.vat) : "") + (S.rea ? " · " + esc(S.rea) : "") + "</p>" : "") +
      (S.address ? "<p>" + esc(S.address) + "</p>" : "") + (S.email ? "<p>" + esc(S.email) + "</p>" : "") + (S.pec ? "<p>PEC: " + esc(S.pec) + "</p>" : "") +
      (S.instagram ? "<p>Instagram: @" + esc(S.instagram.replace(/^@/, "")) + "</p>" : "") + "</div>" +
      '<div><p class="fh">Negozio</p><ul><li><a href="negozio/">Tutte le ceramiche</a></li>' + cats.map((c) => '<li><a href="' + catPath(c) + '">' + esc(c) + "</a></li>").join("") + '<li><a href="spedizioni/">Spedizioni e resi</a></li><li><a href="chi-siamo/">Chi siamo</a></li><li><a href="contatti/">Contatti</a></li>' + (etsy ? "<li>" + etsyA("Il nostro negozio su Etsy ↗") + "</li>" : "") + '</ul></div>' +
      '<div><p class="fh">Informazioni legali</p><ul><li><a href="condizioni/">Condizioni di vendita</a></li><li><a href="recesso/">Diritto di recesso</a></li><li><a href="privacy/">Privacy</a></li><li><a href="cookie/">Cookie</a></li></ul></div></footer>';
    const html = head + '<body class="' + (o.cart ? "p-cart" : "p-static") + '">' + header + '<main id="contenuto" class="wrap">' + o.body + "</main>" + footer +
      '<script>window.PAGE="' + (o.mode || "static") + '";</script>' +
      (o.mode ? '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>' : "") + '<script src="app.js" defer></script></body></html>\n';
    pages.push({ path: o.path, file: o.path ? o.path + "index.html" : "index.html", html, noindex: !!o.noindex || !indexable, lastmod: o.lastmod, priority: o.priority });
  }

  /* ---------- home ---------- */
  function heroHtml() {
    const t = esc(S.heroTitle), x = esc(S.heroText);
    const btns = '<div class="cta-row"><a class="btn" href="negozio/">' + esc(S.heroCta) + '</a><a class="btn ghost" href="chi-siamo/">' + esc(S.heroCta2) + "</a></div>";
    const copy = '<div class="hero-copy"><p class="eyebrow">' + esc(S.tagline) + "</p><h1>" + t + '</h1><p class="lead">' + x + "</p>" + btns + "</div>";
    const alt = esc(S.heroAlt || "Ceramica turca dipinta a mano");
    if (S.heroImage && S.heroLayout === "full")
      return '<section class="hero-full" style="--ov:' + (Math.min(90, Math.max(0, Number(S.heroOverlay) || 0)) / 100) + '"><img class="hero-bg" src="' + esc(imgUrl(S.heroImage)) + '" alt="' + alt + '" width="1800" height="1200" fetchpriority="high">' + copy + "</section>";
    if (S.heroImage)
      return '<section class="hero">' + copy + '<div class="hero-art hero-photo"><img src="' + esc(imgUrl(S.heroImage)) + '" alt="' + alt + '" width="1800" height="1200" fetchpriority="high"></div></section>';
    return '<section class="hero">' + copy + '<div class="hero-art" aria-hidden="true">' + api.vessel("vaso", "#e9a23b", "#fff4d6", 120) + api.vessel("ciotola", "#f4f6f5", "#1d3fae", 190) + api.vessel("tazza", "#17b3ad", "#ffffff", 110) + "</div></section>";
  }
  const homeFaq = [
    ["Da dove arrivano le vostre ceramiche?", "Le ceramiche sono prodotte da artigiani in Turchia e selezionate da noi, un pezzo alla volta."],
    ["Le ceramiche sono dipinte a mano?", "Sì, ogni pezzo è decorato a mano: per questo può avere piccole differenze di colore e di smalto rispetto alle foto."],
    ["Quanto costa la spedizione?", "Spediamo in Italia in " + ship.days + ". La spedizione costa " + eur(ship.cost) + " ed è gratuita per ordini da " + eur(ship.free) + "."],
    ["Posso restituire un prodotto?", "Sì, hai 14 giorni dal ricevimento per recedere dal contratto. Trovi tutti i dettagli nella pagina Diritto di recesso."],
    ["Emettete fattura?", "Sì, per ogni ordine emettiamo fattura con i dati di fatturazione che ci indichi al momento dell’ordine."]
  ];
  const homeDesc = S.siteDesc || cut(brand + ": ceramiche turche artigianali dipinte a mano, selezionate una per una. Ciotole, piatti, tazze e vasi con spedizione in Italia.", 155);
  shell({ path: "", title: fit(brand + " | " + S.tagline, brand + " | Ceramiche turche artigianali", brand), desc: homeDesc, priority: "1.0", ld: [org, website, faqLd(homeFaq)],
    body: heroHtml() +
      (S.showValues === "0" ? "" : '<section class="sec" aria-labelledby="h-come"><h2 id="h-come">Come scegliamo le nostre ceramiche</h2><div class="values">' +
      "<div><h3>Selezionate in Turchia</h3><p>Lavoriamo con piccoli laboratori e scegliamo i pezzi di persona, guardandoli uno a uno.</p></div>" +
      "<div><h3>Dipinte a mano</h3><p>Ogni ceramica ha il suo disegno: piccole differenze di smalto sono parte del pezzo e non un difetto.</p></div>" +
      "<div><h3>Imballate con cura</h3><p>Protezioni su misura per far arrivare tutto intero, anche i vasi più delicati.</p></div></div></section>") +
      '<section class="sec" aria-labelledby="h-new"><div class="sec-head"><div><p class="eyebrow">In vetrina</p><h2 id="h-new">Le ultime arrivate</h2></div><a class="btn ghost small" href="negozio/">Vedi tutto</a></div>' + grid(products.slice(0, Math.max(2, Number(S.featured) || 4))) + "</section>" +
      '<section class="sec" aria-labelledby="h-cat"><h2 id="h-cat">Sfoglia per categoria</h2><ul class="catnav">' + cats.map((c) => '<li><a href="' + catPath(c) + '">' + esc(catInfo(c).h1) + "</a></li>").join("") + "</ul></section>" +
      (S.showStory === "0" ? "" : '<section class="sec"><div class="story"><div><p class="eyebrow">La nostra storia</p><h2>Una selezione, non una fabbrica</h2></div><p>' + esc(S.story) + "</p></div></section>") + faqHtml(homeFaq) });

  /* ---------- negozio e categorie ---------- */
  const catNav = (cur) => '<ul class="catnav"><li><a href="negozio/"' + (cur === null ? ' aria-current="page"' : "") + ">Tutte</a></li>" + cats.map((c) => '<li><a href="' + catPath(c) + '"' + (cur === c ? ' aria-current="page"' : "") + ">" + esc(c) + " (" + byCat(c).length + ")</a></li>").join("") + "</ul>";
  const listLd = (l, name) => ({ "@context": "https://schema.org", "@type": "ItemList", name, itemListElement: l.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + productPath(p), name: p.name })) });
  shell({ path: "negozio/", title: fit("Ceramiche turche artigianali | " + brand, "Ceramiche turche artigianali"), priority: "0.9",
    desc: cut("Tutte le ceramiche turche artigianali di " + brand + ": " + cats.join(", ").toLowerCase() + ". Dipinte a mano, con spedizione in Italia.", 155),
    ld: [crumbLd([["Home", ""], ["Negozio", "negozio/"]]), listLd(products, "Ceramiche turche artigianali")],
    body: crumbHtml([["Home", ""], ["Negozio", "negozio/"]]) + '<section class="sec"><h1>Ceramiche turche artigianali</h1>' +
      '<p class="prose" style="margin-top:12px;color:var(--muted)">Ceramiche dipinte a mano da artigiani in Turchia e selezionate da noi. Scegli per categoria o sfoglia tutta la collezione: in ogni scheda trovi misure, materiale e consigli di cura.</p>' + catNav(null) +
      '<h2 style="margin:28px 0 16px">Tutta la collezione</h2>' + grid(products) + "</section>" +
      '<section class="sec prose"><h2>Come scegliere una ceramica turca</h2><ul><li>Controlla le misure: diametro e altezza sono indicati in ogni scheda, così puoi confrontarli con ciò che hai a casa.</li>' +
      "<li>Pensa a come la userai: per la tavola di tutti i giorni o come decorazione. Nella scheda trovi i consigli di cura.</li>" +
      "<li>Accetta le piccole differenze: essendo dipinta a mano, ogni ceramica ha il suo disegno e una sfumatura di smalto leggermente diversa.</li></ul></section>" });
  cats.forEach((c) => {
    const ci = catInfo(c), l = byCat(c);
    shell({ path: catPath(c), title: fit(ci.h1 + " | " + brand, ci.h1), priority: "0.8",
      desc: cut(ci.h1 + ". " + l.length + (l.length === 1 ? " pezzo selezionato" : " pezzi selezionati") + " da " + brand + ", con misure e dettagli in ogni scheda. Spedizione in Italia.", 155),
      ld: [crumbLd([["Home", ""], ["Negozio", "negozio/"], [c, catPath(c)]]), listLd(l, ci.h1)],
      body: crumbHtml([["Home", ""], ["Negozio", "negozio/"], [c, catPath(c)]]) + '<section class="sec"><h1>' + esc(ci.h1) + '</h1><p class="prose" style="margin-top:12px;color:var(--muted)">' + esc(ci.intro) + "</p>" + catNav(c) +
        '<h2 style="margin:28px 0 16px">' + esc(c) + " in vetrina</h2>" + grid(l) + "</section>" });
  });

  /* ---------- prodotti ---------- */
  const shipText = "Spediamo in Italia in " + ship.days + ". La spedizione costa " + eur(ship.cost) + " ed è gratuita per ordini da " + eur(ship.free) + ".";
  products.forEach((p) => {
    const ci = catInfo(p.category), path_ = productPath(p), inStock = p.stock > 0;
    const faq = [];
    if (p.dims) faq.push(["Quali sono le misure di " + p.name + "?", "Le misure sono: " + p.dims + "."]);
    faq.push(["È un pezzo identico alle foto?", "È dipinto a mano, quindi forma, smalto e decoro possono variare leggermente da un pezzo all’altro. La tua ceramica può differire un poco dalle foto."]);
    faq.push(["Come si pulisce?", (p.care || "Lavaggio a mano consigliato") + ". In caso di dubbi scrivici prima di usarla per gli alimenti."]);
    faq.push(["Quanto costa la spedizione e in quanto arriva?", shipText]);
    faq.push(["Posso restituirlo?", "Sì, hai 14 giorni dal ricevimento per recedere dal contratto, come spiegato nella pagina Diritto di recesso."]);
    faq.push(["È disponibile?", inStock ? "Sì, al momento risulta disponibile. La disponibilità viene verificata di nuovo quando aggiungi il prodotto al carrello." : "Al momento è esaurito. Scrivici per sapere se tornerà disponibile."]);
    const offer = { "@type": "Offer", url: SITE + path_, priceCurrency: "EUR", price: p.price.toFixed(2), availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition", seller: { "@id": SITE + "#organizzazione" },
      shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: ship.cost.toFixed(2), currency: "EUR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "IT" } },
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "IT", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 14, returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/ReturnFeesCustomerResponsibility" } };
    const product = { "@context": "https://schema.org", "@type": "Product", "@id": SITE + path_ + "#prodotto", name: p.name, sku: p.slug, category: p.category,
      description: p.desc || (p.name + ", " + ci.noun + " in ceramica turca dipinta a mano."), brand: { "@type": "Brand", name: brand }, offers: offer };
    if (p.material) product.material = p.material;
    if (p.images.length) product.image = p.images.map(imgUrl);
    let auto = p.name + ". " + (p.desc || (ci.noun + " in ceramica turca dipinta a mano")).replace(/\s+/g, " ");
    if (auto.length < 100) auto += " Ceramica turca dipinta a mano, spedizione in Italia.";
    const desc = p.meta || cut(auto, 155);
    const rel = products.filter((x) => x !== p).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 4);
    const more = p.images.length > 1 ? '<div class="more">' + p.images.slice(1).map((_, i) => '<img src="' + esc(imgUrl(p.images[i + 1])) + '" alt="' + esc(altOf(p, i + 1)) + '" width="400" height="400" loading="lazy" decoding="async">').join("") + "</div>" : "";
    const specs = [["Categoria", p.category], ["Misure", p.dims], ["Materiale", p.material], ["Cura", p.care], ["Disponibilità", inStock ? "Disponibile" : "Esaurito"]].filter((r) => r[1]);
    shell({ path: path_, ogType: "product", image: p.images.length ? imgUrl(p.images[0]) : "", lastmod: p.created ? p.created.slice(0, 10) : null, priority: "0.7", noindex: demo,
      title: fit(p.name + " | " + ci.noun.charAt(0).toUpperCase() + ci.noun.slice(1) + " turca artigianale | " + brand, p.name + " | " + brand, p.name),
      desc, ld: [product, crumbLd([["Home", ""], ["Negozio", "negozio/"], [p.category, catPath(p.category)], [p.name, path_]])],
      body: crumbHtml([["Home", ""], ["Negozio", "negozio/"], [p.category, catPath(p.category)], [p.name, path_]]) +
        '<article class="pdp"><div class="gal"><div class="big">' + picHtml(p, true) + "</div>" + more + '</div><div class="pdp-info"><h1>' + esc(p.name) + '</h1><p class="price">' + eur(p.price) + "</p>" +
        "<p>" + (inStock ? "Disponibile" : "Esaurito") + " · " + esc(shipText) + "</p>" +
        '<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn" data-act="add" data-v="' + esc(p.id) + '" data-stock="' + p.stock + '"' + (inStock ? "" : " disabled") + ">" + (inStock ? "Aggiungi al carrello" : "Esaurito") + '</button><a class="btn ghost" href="spedizioni/">Spedizioni e resi</a></div>' +
        '<p><a href="contatti/?prodotto=' + encodeURIComponent(p.name) + '">Hai una domanda su questo pezzo? Scrivici</a>' + (etsy ? " · " + etsyA("Vedi il nostro negozio su Etsy ↗") : "") + "</p>" +
        '<div class="note">Pezzo artigianale: piccole variazioni di colore e di smalto sono normali e lo rendono unico.</div></div></article>' +
        '<section class="sec prose" aria-labelledby="h-desc"><h2 id="h-desc">Descrizione</h2>' + (p.desc ? paragraphs(p.desc) : "<p>" + esc(p.name) + ", " + esc(ci.noun) + " in ceramica turca dipinta a mano.</p>") + "</section>" +
        '<section class="sec" aria-labelledby="h-car"><h2 id="h-car">Caratteristiche</h2><dl class="specs">' + specs.map((r) => "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl></section>" +
        '<section class="sec prose" aria-labelledby="h-sp"><h2 id="h-sp">Spedizione e resi</h2><p>' + esc(shipText) + ' Hai 14 giorni per recedere: leggi il <a href="recesso/">diritto di recesso</a> e le <a href="condizioni/">condizioni di vendita</a>.</p></section>' +
        faqHtml(faq) + (rel.length ? '<section class="sec" aria-labelledby="h-rel"><h2 id="h-rel">Altre ceramiche che potrebbero piacerti</h2>' + grid(rel) + "</section>" : "") });
  });

  /* ---------- pagine di servizio ---------- */
  const shipFaq = [
    ["In quanto tempo arriva l’ordine?", "Spediamo in Italia in " + ship.days + " dalla conferma dell’ordine."],
    ["Quanto costa la spedizione?", "La spedizione costa " + eur(ship.cost) + " ed è gratuita per ordini da " + eur(ship.free) + "."],
    ["Spedite anche all’estero?", "Per ora spediamo solo in Italia."],
    ["Cosa faccio se un pezzo arriva danneggiato?", "Scrivici entro 48 ore con qualche foto del pacco e del contenuto, troveremo una soluzione."],
    ["Posso restituire un prodotto?", "Sì, hai 14 giorni dal ricevimento per recedere dal contratto. Le spese di restituzione sono a tuo carico, salvo diversa indicazione."]
  ];
  shell({ path: "spedizioni/", title: fit("Spedizioni e resi | " + brand, "Spedizioni e resi"), priority: "0.5",
    desc: cut("Spedizioni in Italia in " + ship.days + ", costo " + eur(ship.cost) + " e gratis da " + eur(ship.free) + ". Recesso entro 14 giorni. Tutte le informazioni di " + brand + ".", 155),
    ld: [crumbLd([["Home", ""], ["Spedizioni e resi", "spedizioni/"]]), faqLd(shipFaq)],
    body: crumbHtml([["Home", ""], ["Spedizioni e resi", "spedizioni/"]]) + '<article class="legal"><h1>Spedizioni e resi</h1>' +
      "<h2>Tempi e costi</h2><p>Spediamo in Italia in " + esc(ship.days) + " dalla conferma dell’ordine. La spedizione costa " + eur(ship.cost) + " ed è gratuita per ordini da " + eur(ship.free) + ". Ogni ceramica è protetta con materiali da imballo resistenti.</p>" +
      "<h2>Se un pezzo arriva danneggiato</h2><p>Controlla il pacco alla consegna. Se qualcosa non va, scrivici entro 48 ore" + (S.email ? " a " + esc(S.email) : "") + " con qualche foto del pacco e del contenuto: troveremo una soluzione.</p>" +
      '<h2>Resi e recesso</h2><p>Hai 14 giorni dal ricevimento per recedere. Come fare e come funziona il rimborso è spiegato nella pagina <a href="recesso/">Diritto di recesso</a>.</p></article>' + faqHtml(shipFaq) });

  const about = '<article class="legal"><h1>Chi siamo</h1><h2>La nostra selezione</h2><p>' + esc(S.story) + "</p>" +
    "<h2>Come lavoriamo</h2><p>Scegliamo le ceramiche una per una, le guardiamo da vicino e le imballiamo con cura prima di spedirle. Ogni pezzo è dipinto a mano: per questo smalti e decori possono avere piccole differenze rispetto alle foto, e questo fa parte del loro valore.</p>" +
    '<h2>Contatti</h2><p>' + (S.email ? "Scrivici a " + esc(S.email) + ". " : "") + 'Il modulo è nella pagina <a href="contatti/">Contatti</a>. Trovi le condizioni di acquisto nelle pagine <a href="condizioni/">Condizioni di vendita</a> e <a href="spedizioni/">Spedizioni e resi</a>.</p><p><a class="btn" href="negozio/">Vai al negozio</a></p></article>';
  shell({ path: "chi-siamo/", title: fit("Chi siamo | " + brand, "Chi siamo"), priority: "0.5", ld: [crumbLd([["Home", ""], ["Chi siamo", "chi-siamo/"]]), org],
    desc: cut(brand + ": selezioniamo ceramiche turche dipinte a mano, le guardiamo una per una e le imballiamo con cura. Scopri come lavoriamo.", 155),
    body: crumbHtml([["Home", ""], ["Chi siamo", "chi-siamo/"]]) + about });

  const contactBody = '<article class="legal"><h1>Contatti</h1>' +
    "<p>Hai una domanda su una ceramica, su un ordine o su una spedizione? Scrivici dal modulo: rispondiamo appena possibile, di solito entro uno o due giorni lavorativi." + (etsy ? " Puoi anche trovarci su Etsy." : "") + "</p>" +
    '<h2>Scrivici un messaggio</h2><form class="form" id="contact" novalidate style="max-width:620px">' +
    '<div class="two"><label class="f">Nome<input type="text" name="name" required maxlength="120" autocomplete="name"></label><label class="f">Email<input type="email" name="email" required maxlength="200" autocomplete="email"></label></div>' +
    '<div class="two"><label class="f">Telefono (facoltativo)<input type="tel" name="phone" maxlength="40" autocomplete="tel"></label><label class="f">Di cosa si tratta<select name="topic" id="c-topic"><option>Informazioni su un prodotto</option><option>Un ordine già fatto</option><option>Spedizione e consegna</option><option>Fattura</option><option selected>Altro</option></select></label></div>' +
    '<label class="f">Prodotto di cui parli (facoltativo)<input type="text" name="product" id="c-product" maxlength="160"></label>' +
    '<label class="f">Messaggio<textarea name="message" required maxlength="4000" style="min-height:140px"></textarea></label>' +
    '<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Non compilare<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
    '<label class="check"><input type="checkbox" name="consent" required> Ho letto l’<a href="privacy/">informativa privacy</a> e accetto che i miei dati siano usati per rispondere.</label>' +
    '<div data-err></div><div><button class="btn" type="submit">Invia messaggio</button></div>' +
    '<noscript><p class="note">Per inviare il modulo serve JavaScript attivo' + (S.email ? ": in alternativa scrivici a " + esc(S.email) : "") + ".</p></noscript></form>" +
    "<h2>Dove trovarci</h2><ul>" + (S.company ? "<li>" + esc(S.company) + (S.vat ? ", P.IVA " + esc(S.vat) : "") + "</li>" : "") + (S.address ? "<li>" + esc(S.address) + "</li>" : "") +
    (S.email ? '<li>Email: <a href="mailto:' + esc(S.email) + '">' + esc(S.email) + "</a></li>" : "") + (S.phone ? "<li>Telefono: " + esc(S.phone) + "</li>" : "") +
    (S.pec ? "<li>PEC: " + esc(S.pec) + "</li>" : "") + (S.instagram ? '<li>Instagram: <a href="https://www.instagram.com/' + esc(S.instagram.replace(/^@/, "")) + '/" target="_blank" rel="noopener">@' + esc(S.instagram.replace(/^@/, "")) + "</a></li>" : "") +
    (etsy ? "<li>Etsy: " + etsyA("il nostro negozio su Etsy ↗") + "</li>" : "") + "</ul>" +
    '<h2>Prima di scriverci</h2><p>Tempi e costi di consegna li trovi in <a href="spedizioni/">Spedizioni e resi</a>, le regole del recesso in <a href="recesso/">Diritto di recesso</a>. Per una ceramica che ti interessa indica il nome del pezzo: così possiamo risponderti con le misure e con una foto in più, se serve.</p></article>';
  shell({ path: "contatti/", mode: "contact", title: fit("Contatti | " + brand, "Contatti"), priority: "0.5",
    desc: cut("Scrivi a " + brand + " per informazioni su una ceramica, un ordine o una spedizione. Modulo contatti, indirizzo ed email.", 155),
    ld: [crumbLd([["Home", ""], ["Contatti", "contatti/"]]), Object.assign({ "@context": "https://schema.org", "@type": "ContactPage", url: SITE + "contatti/", name: "Contatti" })],
    body: crumbHtml([["Home", ""], ["Contatti", "contatti/"]]) + contactBody });

  const legal = [["condizioni", "Condizioni di vendita", "Condizioni di vendita di " + brand + ": prezzi, ordini, consegna, garanzia legale, recesso e controversie."],
    ["recesso", "Diritto di recesso", "Come recedere dall’acquisto entro 14 giorni: procedura, rimborso e modulo tipo."],
    ["privacy", "Informativa privacy", "Come trattiamo i tuoi dati personali quando acquisti su " + brand + ": finalità, conservazione e diritti."],
    ["cookie", "Cookie", "Il sito usa solo strumenti tecnici necessari al funzionamento: nessun cookie di profilazione."]];
  legal.forEach(([k, t, d]) => shell({ path: k + "/", title: fit(t + " | " + brand, t), desc: cut(d, 155), priority: "0.3", ld: [crumbLd([["Home", ""], [t, k + "/"]])], body: crumbHtml([["Home", ""], [t, k + "/"]]) + api.LEGAL[k]() }));

  shell({ path: "carrello/", title: fit("Carrello | " + brand, "Carrello"), desc: "Il tuo carrello e il modulo per inviare la richiesta d’ordine.", noindex: true, cart: true, mode: "cart",
    body: '<div id="app"><noscript><p class="note" style="margin:24px 0">Per usare il carrello serve JavaScript attivo nel browser.</p></noscript></div>' });

  /* ---------- scrittura ---------- */
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  pages.forEach((p) => { const f = path.join(OUT, p.file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, p.html); });
  fs.writeFileSync(path.join(OUT, "404.html"), pages[0].html.replace(/<title>[^<]*<\/title>/, "<title>Pagina non trovata | " + esc(brand) + "</title>").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,nofollow">')
    .replace(/<main id="contenuto" class="wrap">[\s\S]*<\/main>/, '<main id="contenuto" class="wrap"><section class="sec"><h1>Pagina non trovata</h1><p style="margin:12px 0 20px;color:var(--muted)">L’indirizzo non esiste più o è stato scritto male.</p><a class="btn" href="negozio/">Vai al negozio</a></section></main>'));
  ["app.css", "app.js", "admin.html"].forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f)));
  fs.cpSync(path.join(ROOT, "img"), path.join(OUT, "img"), { recursive: true });
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter((p) => !p.noindex);
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    (indexable ? urls : pages.filter((p) => p.path !== "carrello/")).map((p) => "  <url><loc>" + esc(SITE + p.path) + "</loc><lastmod>" + (p.lastmod || today) + "</lastmod><priority>" + (p.priority || "0.5") + "</priority></url>").join("\n") + "\n</urlset>\n");
  const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"];
  fs.writeFileSync(path.join(OUT, "robots.txt"), indexable
    ? "User-agent: *\nAllow: /\nDisallow: " + BASE + "admin.html\nDisallow: " + BASE + "carrello/\n\nSitemap: " + SITE + "sitemap.xml\n\n" + bots.map((b) => "User-agent: " + b + "\nAllow: /\n").join("\n")
    : "User-agent: *\nDisallow: /\n");
  const llms = ["# " + brand, "", "> " + (S.siteDesc || (S.tagline + ". Negozio online di ceramiche turche artigianali dipinte a mano, con spedizione in Italia.")), "",
    "## Informazioni utili", "- Prodotti: " + cats.join(", ") + ", ceramica turca dipinta a mano.", "- Spedizione: solo Italia, " + ship.days + ", " + eur(ship.cost) + " (gratis da " + eur(ship.free) + ").",
    "- Resi: recesso entro 14 giorni dal ricevimento.", "- Fattura: emessa per ogni ordine.", S.email ? "- Contatti: " + S.email : "", "",
    "## Pagine principali", "- [Negozio](" + SITE + "negozio/): tutta la collezione", "- [Spedizioni e resi](" + SITE + "spedizioni/): tempi, costi e resi", "- [Chi siamo](" + SITE + "chi-siamo/): come selezioniamo le ceramiche", "- [Contatti](" + SITE + "contatti/): modulo di contatto" + (etsy ? "\n- [Negozio su Etsy](" + etsy + ")" : ""), "- [Condizioni di vendita](" + SITE + "condizioni/)", "- [Diritto di recesso](" + SITE + "recesso/)", "",
    "## Prodotti", ...products.map((p) => "- [" + p.name + "](" + SITE + productPath(p) + "): " + p.category + ", " + eur(p.price) + (p.dims ? ", " + p.dims : "") + (p.stock > 0 ? ", disponibile" : ", esaurito"))].filter((l, i, a) => l !== "" || a[i - 1] !== "");
  fs.writeFileSync(path.join(OUT, "llms.txt"), llms.join("\n") + "\n");

  console.log("Pagine generate: " + pages.length + " in dist/ (" + products.length + " prodotti" + (demo ? ", di esempio" : "") + ", " + (indexable ? "indicizzabile" : "noindex") + ")");
  warnings.forEach((w) => console.log("ATTENZIONE: " + w));
}
main().catch((e) => { console.error("Build non riuscita:", e.message); process.exit(1); });
