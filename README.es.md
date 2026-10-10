# hagioi

[English](README.md) | [Ελληνικά](README.el.md) | [Italiano](README.it.md) | [Français](README.fr.md) | **Español** | [Deutsch](README.de.md)

Un mapa interactivo de los santos cristianos ortodoxos. Haz clic en un marcador para ver el icono del santo, el día de su fiesta y una breve biografía.

Está construido como un frontend estático (HTML/CSS/JS puro) con un par de pequeñas funciones serverless de Vercel — sin paso de compilación, sin framework, sin base de datos. Los datos de los santos están en [public/data/saints.json](public/data/saints.json).

## Desarrollo local

1. Copia [.env.local.example](.env.local.example) a `.env.local` y completa `GOOGLE_MAPS_API_KEY` (restríngela a referentes HTTP en Google Cloud Console, incluido `http://localhost:3000/*` para el desarrollo local).
2. Instala la CLI de Vercel si aún no la tienes y luego ejecuta:
   ```bash
   npx vercel dev
   ```
   Abre la URL local que se muestra (normalmente http://localhost:3000).

Consulta [AGENTS.md](AGENTS.md) para obtener más información sobre el modelo de datos y las convenciones (en inglés).

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Para cuestiones de seguridad, consulta [SECURITY.md](SECURITY.md) (en inglés).

## Apoyo

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
