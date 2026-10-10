# hagioi

[English](README.md) | **Ελληνικά** | [Italiano](README.it.md) | [Français](README.fr.md) | [Español](README.es.md) | [Deutsch](README.de.md)

Ένας διαδραστικός χάρτης των Αγίων της Ορθόδοξης Εκκλησίας. Κάντε κλικ σε ένα σημάδι για να δείτε την εικόνα του αγίου, την ημέρα της εορτής του και ένα σύντομο βιογραφικό.

Είναι φτιαγμένο ως στατικό frontend (απλό HTML/CSS/JS) με μερικές μικρές serverless συναρτήσεις του Vercel — χωρίς βήμα build, χωρίς framework, χωρίς βάση δεδομένων. Τα δεδομένα των αγίων βρίσκονται στο [public/data/saints.json](public/data/saints.json).

## Τοπική ανάπτυξη

1. Αντιγράψτε το [.env.local.example](.env.local.example) στο `.env.local` και συμπληρώστε το `GOOGLE_MAPS_API_KEY` (περιορίστε το σε HTTP referrers στο Google Cloud Console, συμπεριλαμβανομένου του `http://localhost:3000/*` για τοπική ανάπτυξη).
2. Εγκαταστήστε το Vercel CLI αν δεν το έχετε ήδη και, στη συνέχεια, εκτελέστε:
   ```bash
   npx vercel dev
   ```
   Ανοίξτε την τοπική διεύθυνση URL που εμφανίζεται (συνήθως http://localhost:3000).

Δείτε το [AGENTS.md](AGENTS.md) για περισσότερα σχετικά με το μοντέλο δεδομένων και τις συμβάσεις (στα αγγλικά).

## Συνεισφορά

Δείτε το [CONTRIBUTING.md](CONTRIBUTING.md). Για ζητήματα ασφάλειας, δείτε το [SECURITY.md](SECURITY.md) (στα αγγλικά).

## Υποστήριξη

- [Buy Me a Coffee](https://buymeacoffee.com/thekyria)
- [Ko-fi](https://ko-fi.com/thekyria)
- [PayPal](https://paypal.me/TheodorosKyriakidis)
- [Patreon](https://www.patreon.com/c/thekyria)
