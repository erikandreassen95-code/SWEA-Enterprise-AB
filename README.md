# SWEA Enterprise AB

Företagswebbplats på svenska med statiska sidor och ett kontaktformulär. Bygget använder Node.js 22 utan externa paket. Vercel publicerar `dist/` som statiska filer och kör kontaktfunktionen separat.

## Lokal förhandsvisning

Kör `node scripts/build.mjs` och därefter `node scripts/serve.mjs`, eller dubbelklicka på `Starta-hemsidan.cmd`. Öppna http://127.0.0.1:4173/. Den lokala servern är endast en förhandsvisning; den kör inte Vercels API-funktion eller skickar kontaktmejl. Lokala sidor har `noindex`.

Ändra sidmallar och grundtexter i `scripts/build.mjs`, stil i `src/app/globals.css` och integritetstext i `content/privacy.html`. Kör bygget igen efter ändringar. `dist/` är genererad och ska inte redigeras direkt.

## Produktion

Vercel använder `vercel.json` med `framework: null`, tomt installationssteg och `node scripts/build.mjs`. Projektets Root Directory ska vara repots rot. Node-versionen är `22.x` i `package.json`.

Miljövariablerna finns i `.env.example`. Hemliga värden hör hemma i Vercels miljövariabler, aldrig i Git. Kontaktformuläret behöver en verifierad Resend-avsändardomän, en fungerande mottagarinkorg och Cloudflare Turnstile. Resend sköter utskicket från formuläret; inkommande e-post till `anton@sweaenterprise.se` och aliaset `info@sweaenterprise.se` går till STRATO-inkorgen enligt domänens MX-inställningar.

SiteCMS används vid bygget för redigerbara texter. Kör `npm run cms:sync` när schemat har ändrats och CMS-uppgifterna är på plats. Webbplatsen är statisk, så en publicerad ändring i SiteCMS måste starta ett nytt Vercel-bygge via den skyddade webhooken. SiteCMS-nyckeln skickas aldrig till webbläsaren. Med `CMS_REQUIRED=true` ska bygget stoppa om CMS-kopplingen saknas eller misslyckas. Lämna `CMS_REQUIRED=false` för lokal förhandsvisning utan CMS.

Huvudadressen är `https://www.sweaenterprise.se`, vilket följer projektets befintliga domäninställning i Vercel. Rotdomänen omdirigeras dit. Använd samma www-adress i SITE_URL, Turnstile och SiteCMS-webhooken för att undvika omdirigering av API-anrop.

Indexering öppnas endast när `VERCEL_ENV=production`, `SITE_URL=https://www.sweaenterprise.se` och `SITE_INDEXABLE=true` samtidigt. Förhandsvisningar förblir avindexerade. Det är en avsiktlig publiceringsspärr, så sätt den sista flaggan först efter kontrollerna i [LANSERING.md](LANSERING.md).

## Kontroller

Kör `node --test` för funktionstester och `node scripts/check.mjs` medan den lokala servern kör. Den senare går igenom sidstruktur, interna länkar, resurser och 404-svar. En riktig sändning och mottagning måste dessutom provas i den färdiga Vercel-miljön innan formuläret används i produktion.
