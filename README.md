# Bottega Ceramiche

Negozio online di ceramiche artigianali turche. Sito statico (GitHub Pages) con Supabase come database, login e archivio foto.

## File

- `index.html`, `app.css`, `app.js`: tutto il sito, senza build.
- Database Supabase, tabelle con prefisso `shop_`: `shop_products`, `shop_settings`, `shop_orders`, `shop_admins`. Foto nel bucket `shop-images`.

## Gestione

Dal link "Area riservata" nel piè di pagina (`#admin`): accesso con email e password. Può gestire il negozio solo chi è nella tabella `shop_admins`. Da lì si caricano prodotti e foto, si vedono gli ordini e si compilano i dati del negozio usati nei testi legali.

## Stato

Bozza. Il checkout registra una richiesta d'ordine e non incassa pagamenti. Prima di aprire ai clienti: compilare i dati del venditore, far controllare i testi legali, collegare un sistema di pagamento.
