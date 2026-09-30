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
## Spesa media cliente (Performance / Indice)

Il secondo grafico usa le righe del report già filtrate per periodo e centro,
raggruppate per consulente; applica anche il filtro consulente della pagina.
La media è il rapporto dei totali, non la media delle medie giornaliere:

`(somma revenue − somma installments[].amount con status "Rata ris.") / somma soldSubscriptionsTotal`

Mappatura verificata in `app.js` (payload Daily) e `google-apps-script/Code.gs`
(lettura/scrittura del foglio):

- `revenue`: colonna **Fatturato**; nessun importo nei dettagli degli abbonamenti.
- `installments`: JSON della colonna **Dettaglio ratei**, con `amount` e `status`.
  **Rata ris.** identifica una rata riscossa, **Rata ins.** una rata insoluta.
- `soldSubscriptionsTotal`: **Abbonamenti totali venduti**, separato da
  `installmentsTotal` (**Numero ratei**). Non sommare il conteggio o i dettagli
  delle rate a quello degli abbonamenti.
- `totalCollected`, le modalità di pagamento, `futuraAmount` e `ticket` non
  entrano nel calcolo: aggiungerli al fatturato conterebbe nuovamente gli incassi.

Zero abbonamenti o ratei con importo e stato sconosciuto danno **N/D**;
importi netti negativi restano visibili. Nessuna modifica al calcolo dell'indice
esistente e nessun nuovo deploy di Apps Script necessario.

Test del calcolo: `node --test tests/customer-spend.test.js` (Node 20+).
Test browser: avviare un server locale su `127.0.0.1:8765`, poi eseguire
`node tests/performance-browser.cjs` con Playwright e Chrome installati.
Il test browser sostituisce autenticazione e API solo nel contesto di prova,
usando dati sintetici, senza accedere al Google Sheet.

## Correzione incassi Ticket/Futura — 30 settembre 2026

`ensureHeaders_` aggiungeva una colonna vuota e poi usava nuovamente
`getLastColumn()`, che restituisce l'ultima colonna con contenuto, non quella
appena allocata. Le intestazioni mancanti sovrascrivevano quindi l'ultima
intestazione e mescolavano Ticket con Timestamp invio nei salvataggi successivi.
I valori circa 46.294 sono seriali data/ora di Sheets, non importi.
La migrazione ora scrive tutte le intestazioni mancanti dopo l'ultima colonna
occupata, senza spostare o sovrascrivere i dati. Riutilizza le colonne vuote.

Il report Operatore ora rende Incassato, Futura e Ticket direttamente dai campi
omonimi; non usa più `operatore-ticket.js`, che cercava le celle confrontando
importi uguali e poteva scambiarle. Ticket è incluso anche nel CSV.
Gli incassi mancanti/non numerici restano `null` nell'API. Su richiesta dell'utente,
Ticket e Futura non compilati vengono mostrati come 0,00 € nei riepiloghi e
precompilati a zero in modifica Daily. I valori storici nel foglio non vengono
riscritti automaticamente. La colonna arancione Inc. Ratei somma esclusivamente
`installments[].amount` con stato `Rata ris.`, accanto a Incassato, includendo
il totale di colonna e l'esportazione CSV. Non viene aggiunta di nuovo al totale incassato.
Nessun filtro basato sulla soglia 46.000 è applicato agli importi validi.

Il recupero dei dati storici è un intervento separato: fare un backup,
confermare la struttura reale e preservare i valori originali. Non eseguire
funzioni di configurazione password. Test: `node --test tests/*.test.js`.
