# hagioi

[English](README.md) | [Ελληνικά](README.el.md) | **Italiano** | [Français](README.fr.md) | [Español](README.es.md) | [Deutsch](README.de.md)

Una mappa interattiva dei santi cristiani ortodossi. Fai clic su un segnaposto per vedere l'icona del santo, il giorno della sua festa e una breve biografia.

È realizzata come frontend statico (HTML/CSS/JS puro) con un paio di piccole funzioni serverless su Vercel — nessuna fase di build, nessun framework, nessun database. I dati dei santi si trovano in [public/data/saints.json](public/data/saints.json). Il sito è disponibile in inglese e in greco (selettore della lingua nell'intestazione); le traduzioni greche dei santi si trovano in [public/data/saints.el.json](public/data/saints.el.json).

## Sviluppo locale

1. Copia [.env.local.example](.env.local.example) in `.env.local` e compila `GOOGLE_MAPS_API_KEY` (limitala ai referrer HTTP nella Google Cloud Console, incluso `http://localhost:3000/*` per lo sviluppo locale).
2. Installa la Vercel CLI se non l'hai già, quindi esegui:
   ```bash
   npx vercel dev
   ```
   Apri l'URL locale indicato (di solito http://localhost:3000).

Consulta [AGENTS.md](AGENTS.md) per maggiori dettagli sul modello dei dati e sulle convenzioni (in inglese).

## Contribuire

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Per questioni di sicurezza, consulta [SECURITY.md](SECURITY.md) (in inglese).

## Supporto

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
