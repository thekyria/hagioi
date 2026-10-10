# hagioi

[English](README.md) | [Ελληνικά](README.el.md) | [Italiano](README.it.md) | **Français** | [Español](README.es.md) | [Deutsch](README.de.md)

Une carte interactive des saints chrétiens orthodoxes. Cliquez sur un marqueur pour voir l'icône du saint, le jour de sa fête et une courte biographie.

Conçue comme un frontend statique (HTML/CSS/JS natif) avec quelques petites fonctions serverless Vercel — pas d'étape de build, pas de framework, pas de base de données. Les données des saints se trouvent dans [public/data/saints.json](public/data/saints.json). Le site est disponible en anglais et en grec (sélecteur de langue dans l'en-tête) ; les traductions grecques des saints se trouvent dans [public/data/saints.el.json](public/data/saints.el.json).

## Développement local

1. Copiez [.env.local.example](.env.local.example) vers `.env.local` et renseignez `GOOGLE_MAPS_API_KEY` (restreignez-la aux référents HTTP dans la Google Cloud Console, y compris `http://localhost:3000/*` pour le développement local).
2. Installez la CLI Vercel si vous ne l'avez pas encore, puis exécutez :
   ```bash
   npx vercel dev
   ```
   Ouvrez l'URL locale affichée (généralement http://localhost:3000).

Consultez [AGENTS.md](AGENTS.md) pour en savoir plus sur le modèle de données et les conventions (en anglais).

## Contribuer

Consultez [CONTRIBUTING.md](CONTRIBUTING.md). Pour les questions de sécurité, consultez [SECURITY.md](SECURITY.md) (en anglais).

## Soutien

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
