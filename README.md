# SWEA Enterprise AB

Företagswebbplats på svenska med CMS-innehåll som hämtas vid varje sidvisning och ett kontaktformulär. Bygget använder Node.js 22 utan externa paket. Vercel publicerar resurser från `dist/` och kör sidrendering och kontaktformulär som serverfunktioner.

## Lokal förhandsvisning

Kör `node scripts/build.mjs` och därefter `node scripts/serve.mjs`, eller dubbelklicka på `Starta-hemsidan.cmd`. Öppna http://127.0.0.1:4173/. Den lokala servern är endast en förhandsvisning; den kör inte Vercels API-funktion eller skickar kontaktmejl. Lokala sidor har `noindex`.

Ändra sidmallar och grundtexter i `scripts/build.mjs`, stil i `src/app/globals.css` och integritetstext i `content/privacy.html`. Kör bygget igen efter ändringar. `dist/` är genererad och ska inte redigeras direkt.

## Produktion

Vercel använder `vercel.json` med `framework: null`, tomt installationssteg och `node scripts/build.mjs`. Projektets Root Directory ska vara repots rot. Node-versionen är `22.x` i `package.json`.

Miljövariablerna finns i `.env.example`. Hemliga värden hör hemma i Vercels miljövariabler, aldrig i Git. Kontaktformuläret behöver en verifierad Resend-avsändardomän, en fungerande mottagarinkorg. Resend sköter utskicket från formuläret; inkommande e-post till `anton@sweaenterprise.se` och aliaset `info@sweaenterprise.se` går till STRATO-inkorgen enligt domänens MX-inställningar.

SiteCMS hämtas på servern vid varje sidvisning. Sparade/publicerade CMS-ändringar syns när besökaren öppnar eller laddar om sidan, utan redeploy eller deploy hook. Sidornas HTML och SEO renderas med samma aktuella innehåll och cachas inte. CMS-nyckeln skickas aldrig till webbläsaren. Vid CMS-avbrott returneras tillfälligt HTTP 503 i stället för gamla texter. En redan öppen sida uppdateras vid omladdning.

Kör `node --env-file=.env.local scripts/sitecms-sync.mjs` när fältschemat ändras. Kod- och designändringar kräver fortfarande deployment. Den lokala statiska förhandsvisningen och byggfilerna är ögonblicksbilder.

Huvudadressen är `https://www.sweaenterprise.se`, vilket följer projektets befintliga domäninställning i Vercel. Rotdomänen omdirigeras dit. Använd samma www-adress i SITE_URL för att undvika omdirigering av API-anrop.

Indexering öppnas endast när `VERCEL_ENV=production`, `SITE_URL=https://www.sweaenterprise.se` och `SITE_INDEXABLE=true` samtidigt. Förhandsvisningar förblir avindexerade. Det är en avsiktlig publiceringsspärr, så sätt den sista flaggan först efter kontrollerna i [LANSERING.md](LANSERING.md).

## Kontroller

Kör `node --test` för funktionstester och `node scripts/check.mjs` medan den lokala servern kör. Den senare går igenom sidstruktur, interna länkar, resurser och 404-svar. En riktig sändning och mottagning måste dessutom provas i den färdiga Vercel-miljön innan formuläret används i produktion.
