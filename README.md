Questa è l'API di Zappr su Vercel. Viene usata per far riprodurre al [frontend](https://github.com/ZapprTV/frontend) i canali trasmessi su Babylon Cloud e i canali Rai [senza geoblocking](#come-controllare-se-un-canale-rai-è-protetto-da-geoblocking).

**Per i canali trasmessi su Dailymotion e YouTube (in base all'ID di un canale), usare l'[API su Cloudflare Workers](https://github.com/ZapprTV/cloudflare-api).**

## URL supportati
- Babylon Cloud:
    - `*://*/video/viewlivestreaming?rel=XX&cntr=0`

- Rai:
    - `*://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=XXXXXX` *(attenzione: non includere il parametro `output`)*

## Come controllare se un canale Rai è protetto da geoblocking
1. Prendi l'URL Mediapolis del canale, e imposta il parametro `output` a `62`.
    - Esempio: `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=1&output=62`
2. Aprilo nel tuo browser (preferibilmente in Firefox o in un browser con [un'estensione per visualizzare meglio i file JSON](https://chromewebstore.google.com/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh)).
3. Individua il valore della key `geoprotection` (di solito presente sotto `description`).
    - Se è `S`, il canale **è protetto** da geoblocking.
    - Se è `N`, il canale **non è protetto** da geoblocking.