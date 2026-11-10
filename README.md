# Bottega Ceramiche

Negozio online di ceramiche artigianali turche. Sito statico (GitHub Pages) con Supabase come database, login e archivio foto.

## File

- `index.html`, `app.css`, `app.js`: tutto il sito, senza build.
- Database Supabase, tabelle con prefisso `shop_`: `shop_products`, `shop_settings`, `shop_orders`, `shop_admins`. Foto nel bucket `shop-images`.

## Gestione

Pagina separata `admin.html` (non collegata dal menu del sito): accesso con la sola password. Esiste un solo account di gestione, creato nel database con una password provvisoria che va cambiata al primo accesso. Può gestire il negozio solo chi è nella tabella `shop_admins`. Da lì si caricano prodotti e foto, si vedono gli ordini e si compilano i dati del negozio usati nei testi legali.

## Stato

Bozza. Il checkout registra una richiesta d'ordine e non incassa pagamenti. Prima di aprire ai clienti: compilare i dati del venditore, far controllare i testi legali, collegare un sistema di pagamento.
