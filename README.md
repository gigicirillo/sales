# Sales Daily — Futura Clubs

Piattaforma mobile-first per l'inserimento giornaliero delle attività dei consulenti commerciali.

## Venditori
Donatella, Elena, Erika, Francesco, Ramses.

## Come vengono salvati i dati
Ogni invio contiene una **data di riferimento** e un **venditore**. Il backend Google Apps Script crea automaticamente un tab mensile (`2026-08`, `2026-09`, ecc.) nel Google Sheet e salva una riga per ogni combinazione **giorno + venditore**. Se lo stesso venditore reinvia la stessa giornata, la riga viene aggiornata invece di essere duplicata.

## Collegamento a Google Sheets

1. Crea un nuovo Google Foglio.
2. Copia l'ID del foglio dall'URL: è la parte compresa tra `/d/` e `/edit`.
3. Nel Foglio apri **Estensioni → Apps Script**.
4. Copia il contenuto di `google-apps-script/Code.gs` nell'editor Apps Script.
5. Sostituisci `INCOLLA_QUI_ID_GOOGLE_SHEET` con l'ID del tuo foglio.
6. In Apps Script imposta il fuso orario su **Europe/Rome**.
7. Clicca **Distribuisci → Nuova distribuzione → App web**.
8. Esegui come: **Me**. Accesso: **Chiunque** (o l'opzione equivalente disponibile sul tuo account).
9. Autorizza lo script e copia l'URL finale che termina con `/exec`.
10. Apri `config.js` in questa repository e incolla quell'URL in `GOOGLE_SCRIPT_URL`.

Non inserire password, API key o credenziali Google nella repository.

## GitHub Pages
La piattaforma è statica e può essere pubblicata con GitHub Pages: **Settings → Pages → Deploy from a branch → main / root**.

## Campi registrati
- Azioni da telefonate
- Azioni da tour spontanei
- Azioni da clientela organica
- Altre azioni
- Vendite: fatturato, incassato, Futurament

Gli importi vengono salvati come numeri e formattati in euro nel foglio mensile.