# Bottega Ceramiche

Negozio online di ceramiche artigianali turche. Sito statico (GitHub Pages) con Supabase come database, login e archivio foto.

## File

- `build.js` genera in `dist/` le pagine vere (home, negozio, categorie, prodotti, pagine legali) con titoli, dati strutturati, sitemap, robots e llms.txt, leggendo prodotti e impostazioni da Supabase. `audit.js` controlla il risultato (title, H1/H2, parole, alt, link). `seo.config.json`: indirizzo del sito e interruttore `indexable`.
- `app.css`, `app.js`: stile e logica (carrello, admin). Il workflow `.github/workflows/pages.yml` ricostruisce il sito a ogni push, ogni 6 ore e a mano.

## Pubblicazione

Impostazioni del repo → Pages → Source: **GitHub Actions**. Per far comparire su Google il sito: compilare i dati del venditore, scegliere il nome, poi mettere `"indexable": true` in `seo.config.json`.
- Database Supabase, tabelle con prefisso `shop_`: `shop_products`, `shop_settings`, `shop_orders`, `shop_admins`. Foto nel bucket `shop-images`.

## Gestione

Pagina separata `admin.html` (non collegata dal menu del sito): accesso con la sola password. Esiste un solo account di gestione, creato nel database con una password provvisoria che va cambiata al primo accesso. Può gestire il negozio solo chi è nella tabella `shop_admins`. Da lì si caricano prodotti e foto, si vedono gli ordini e si compilano i dati del negozio usati nei testi legali.

## Stato

Bozza. Il checkout registra una richiesta d'ordine e non incassa pagamenti. Prima di aprire ai clienti: compilare i dati del venditore, far controllare i testi legali, collegare un sistema di pagamento.
