# hagioi

[English](README.md) | [Ελληνικά](README.el.md) | [Italiano](README.it.md) | [Français](README.fr.md) | [Español](README.es.md) | **Deutsch**

Eine interaktive Karte orthodoxer christlicher Heiliger. Klicke auf eine Markierung, um die Ikone des Heiligen, seinen Festtag und eine kurze Biografie zu sehen.

Umgesetzt als statisches Frontend (reines HTML/CSS/JS) mit ein paar kleinen Vercel-Serverless-Funktionen — kein Build-Schritt, kein Framework, keine Datenbank. Die Daten der Heiligen befinden sich in [public/data/saints.json](public/data/saints.json).

## Lokale Entwicklung

1. Kopiere [.env.local.example](.env.local.example) nach `.env.local` und trage `GOOGLE_MAPS_API_KEY` ein (beschränke den Schlüssel in der Google Cloud Console auf HTTP-Referrer, einschließlich `http://localhost:3000/*` für die lokale Entwicklung).
2. Installiere die Vercel CLI, falls noch nicht vorhanden, und führe dann Folgendes aus:
   ```bash
   npx vercel dev
   ```
   Öffne die angezeigte lokale URL (normalerweise http://localhost:3000).

Weitere Informationen zum Datenmodell und zu den Konventionen findest du in [AGENTS.md](AGENTS.md) (auf Englisch).

## Mitwirken

Siehe [CONTRIBUTING.md](CONTRIBUTING.md). Bei Sicherheitsfragen siehe [SECURITY.md](SECURITY.md) (auf Englisch).

## Unterstützung

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
