# SWEA Enterprise AB

Företagswebbplats på svenska med CMS-innehåll som hämtas vid varje sidvisning och ett kontaktformulär. Bygget använder Node.js 22 och sitecms-next 0.3.0. Vercel publicerar resurser från `dist/` och kör sidrendering och kontaktformulär som serverfunktioner.

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


## Förfrågningar och bekräftelsemejl

Formuläret registrerar förfrågan i SiteCMS innan mejl skickas. Telefon och samtycke krävs enligt SiteCMS API. Ett Resend-batchanrop skickar aviseringen till CONTACT_TO_EMAIL och ett automatiskt kvitto från info@sweaenterprise.se till kunden. Om mejlet misslyckas efter registreringen visas att förfrågan är mottagen men att kvittot inte kunde skickas; ingen ny förfrågan behöver skickas.

Lämna SiteCMS-inställningen **E-post för offertförfrågningar** tom eftersom webbplatsen sköter mejlen. Annars skickar SiteCMS också egna aviseringar och kvitton. API-nyckeln ska ha åtkomst till den befintliga sajten. SiteCMS begränsar förfrågningar per timme med en nyckelbaserad IP-hash från Vercels betrodda IP-header. Inga råa IP-adresser skickas till CMS.

Installera beroenden med npm ci före byggstart. Vercel gör detta via vercel.json. CMS-innehåll hämtas genom sitecms-next med no-store; ingen deploy hook behövs. Se [Antons mejlguide](ANTON-MEJLGUIDE.md).


## Skydd utan captcha

Ett dolt website-fält fungerar som botfälla: ifyllda inskickningar ignoreras utan CMS-anrop eller mejl. I produktion godtas endast en giltig IP-adress från Vercels x-vercel-forwarded-for. En lokal begränsare stoppar fler än fem försök per IP på tio minuter per funktionsinstans; SiteCMS ger dessutom en gemensam gräns på fem registrerade förfrågningar per IP-hash och timme. Den lokala begränsaren är ett komplement, inte ett globalt datalager. Saknad eller felaktig betrodd IP ger HTTP 503. Begränsning ger HTTP 429 och Retry-After. Inga råa IP-adresser lagras av begränsaren eller skickas till CMS.

Privata PDF-guider och deras arbetsfiler ligger i Git-ignorerade output/pdf respektive tmp/pdfs. Lösenord ska aldrig läggas i den versionshanterade mejlguiden.
