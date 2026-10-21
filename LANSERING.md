> Uppdaterat 21 oktober 2026: Cloudflare Turnstile och deploy hook används inte. Kontaktformuläret skickar via Resend med fältvalidering, origin-kontroll och ett dolt spamfält. Efter ändringar i SiteCMS görs en manuell Redeploy i Vercel. Äldre kontroller nedan är historiska.

# Lansering: sweaenterprise.se

Uppdaterad 20 oktober 2026. Avser nuvarande kod i detta repo. Domän- och nyckelvärden som bara finns i era konton är markerade som hämtvärden; de är inte skapade eller verifierade här.

## Beslutad uppdelning

- **Vercel:** hemsidan och två serverfunktioner: kontaktformulär och CMS-publicering.
- **Strato:** DNS, inkorgen `anton@sweaenterprise.se` och aliaset `info@sweaenterprise.se` till samma inkorg.
- **Resend:** skickar mejl från kontaktformuläret. Ingen vanlig inkorg eller SMTP-inloggning för Anton skapas i Resend.
- **SiteCMS:** Anton får rollen redaktör för just denna sajt. Sajten hämtar innehållet vid bygge; en sparning i CMS begär nytt Vercelbygge.
- **Cloudflare Turnstile:** skyddar kontaktformuläret. Cloudflare behöver inte ta över DNS.

Ett alias är ingen separat postlåda. Konfigurera rätt att även svara som `info@` i Strato/webbmejlen om Anton ska använda den avsändaren. Webbformulärets besökaradress blir Reply-To, inte avsändare.

## 1. Strato: inkorg och alias först

1. Skapa postlådan `anton@sweaenterprise.se` i Stratos e-postadministration och ge Anton inloggning på ett säkert sätt.
2. Lägg `info@sweaenterprise.se` som alias till Antons inkorg.
3. Testa vanlig inkommande e-post till båda adresserna och svar från Antons inkorg till en extern adress.
4. Behåll Stratos MX och dess e-postautentisering. Resends sändningsposter läggs till på andra värdnamn.

Strato-lösenord, IMAP/SMTP-inloggning och eventuella återställningsuppgifter ska **inte** läggas i Vercel eller i detta repo. Kontaktformuläret använder Resends API, inte Stratos SMTP.

## 2. Alla miljövariabler i Vercel

Lägg dem i projektet `sweaenterpriseab` → Settings → Environment Variables. Tabellen beskriver **Production**. Klistra in värdet utan omslutande citattecken. Hemliga värden markeras som känsliga när Vercel erbjuder det.

| Variabel | Produktionsvärde | Varifrån / användning | Hemlig? |
| --- | --- | --- | --- |
| `SITE_URL` | `https://www.sweaenterprise.se` | Huvudadress enligt Vercels befintliga inställning; serverns origin-kontroll och SEO | Nej |
| `SITE_INDEXABLE` | `false` vid inkoppling, sedan `true` efter testerna nedan | Öppnar Googles indexering enbart på rätt produktionsdomän | Nej |
| `RESEND_API_KEY` | `re_…` – verklig API-nyckel | Resend → API Keys; ge sändbehörighet begränsad till domänen | **Ja** |
| `CONTACT_FROM_EMAIL` | `SWEA Enterprise AB <info@sweaenterprise.se>` | Fast, verifierad avsändare för formulärmejl | Nej |
| `CONTACT_TO_EMAIL` | `anton@sweaenterprise.se` | Fast mottagare; fungerande Strato-inkorg krävs | Nej |
| `CMS_API_URL` | `https://sitecms.se` | Officiell API-bas | Nej |
| `CMS_SITE` | Den **exakta sluggen** från sajtens Integration i SiteCMS | Förväxla inte med domänen eller sajtens visningsnamn | Nej |
| `CMS_API_KEY` | Verklig API-nyckel för denna sajt | SiteCMS → sajt → Integration | **Ja** |
| `CMS_REQUIRED` | `true` när CMS är inkopplat | Stoppar bygget om CMS-anslutningen saknas/fallerar; hindrar tyst återgång till gamla texter | Nej |

`VERCEL_ENV` sätts automatiskt av Vercel; skapa den inte själv. Koden behöver inte `DATABASE_URL`, Strato-lösenord, SMTP-variabler eller några `NEXT_PUBLIC_…`-nycklar.

Preview ska ha `SITE_INDEXABLE=false`. Kopiera inte produktionsnycklar och produktions-deployhook till förhandsversioner slentrianmässigt. Testa mejl separat med en testmottagare och en Turnstile-widget vars hostname matchar testadressen. Lokal granskning utan nycklar använder den statiska webbservern; riktiga serverfunktioner körs i Vercel eller via Vercels lokala funktionsmiljö.

**Efter varje ändring av miljövariabler:** gör en ny deployment. CMS-nycklar och Resend-nycklar får aldrig finnas i HTML/JavaScript som besökaren laddar ner. Den publika Turnstile-nyckeln är däremot avsiktligt synlig.

## 3. Inställningar i Resend

Detta är Resend-inställningar, inte en andra uppsättning miljövariabler:

| Inställning | Värde |
| --- | --- |
| Sending domain | `sweaenterprise.se` |
| Sending | Aktiverad, domänen ska bli Verified |
| Receiving för rotdomänen | **Avstängd** i detta upplägg; Strato tar emot vanlig e-post |
| Region | Välj lämplig tillgänglig EU-region; använd DNS-värdena just den regionen visar |
| Return-Path | Använd Resends rekommenderade subdomän, normalt `send` |
| Avsändare i API-anrop | `SWEA Enterprise AB <info@sweaenterprise.se>` |
| Mottagare i API-anrop | `anton@sweaenterprise.se` |
| API-nyckel | Skapa sändnyckel för domänen; lägg den som `RESEND_API_KEY` i Vercel |
| Utskick/webhook | Inget mottagningswebhook behövs för detta formulärflöde |

Domänverifiering ger rätt att skicka från adressen; den skapar inte en Strato-postlåda eller ett alias. Resends eventuella Receiving-produkt har API/webhook och är inte den vanliga inkorgslösning ni har valt. [Resend-domäner](https://resend.com/docs/dashboard/domains/introduction), [Resends inkommande mejl](https://www.resend.com/features/inbound).

## 4. DNS-poster i Strato

Behåll DNS hos Strato. Lägg **både** `sweaenterprise.se` och `www.sweaenterprise.se` i Vercel → Settings → Domains. Använd **www som huvuddomän**, vilket matchar den redan observerade Vercel-inställningen. Rotdomänen omdirigeras till www, aldrig tvärtom. Hämta de rekommenderade A/CNAME-värdena för just projektet.

I Stratos formulär avser ”namn” nedan värdnamnet relativt domänen. Om panelen visar hela domänen ska samma fullständiga namn användas utan att domännamnet läggs till två gånger. `@` kan visas som tomt fält/rotdomän beroende på panelen.

### Webbplats och vanlig e-post

| Typ | Namn | Värde | Prioritet | Åtgärd |
| --- | --- | --- | --- | --- |
| A | `@` | Nuvarande `216.198.79.1`; kontrollera mot **exakt IP Vercel visar** | – | Webbdomänen svarar redan över HTTPS vid kontroll 20/10 |
| CNAME | `www` | Nuvarande `sweaenterprise.se.`; Vercel kan rekommendera ett projektspecifikt mål | – | Behåll fungerande DNS eller följ Domains-vyns rekommendation; www är huvuddomänen |
| MX | `@` | Behåll befintlig Strato-post; vid kontroll 19/10: `smtp.rzone.de.` | `5` vid kontroll | Ska fortsätta peka på Strato för inkorgen |
| TXT/CNAME | Stratos DKIM-namn, om Strato visar ett | Exakt värde från Stratos e-postadministration | – | Behåll/aktivera för Antons vanliga utgående mejl |
| TXT | `@` om Strato kräver SPF för utgående mejl | Stratos rekommenderade SPF-värde | – | En SPF-policy per värdnamn; skapa inte dubbla SPF-poster |

Vercels dokumentation har generella exempel som `76.76.21.21` och `cname.vercel-dns-0.com`, men dessa är **inte verifierade projektvärden** för er domän. Använd det projektets Domains-vy faktiskt anger. Behövs en TXT-ägandeverifiering, exempelvis `_vercel`, kopieras även dess exakta namn och värde därifrån. Ta bara bort konkurrerande gamla webbposter för samma värdnamn; behåll e-postposter och andra tjänsters verifieringar. Kontrollera eventuella gamla AAAA-poster och CAA-begränsningar mot Vercels instruktioner. [Vercels domänguide](https://vercel.com/docs/domains/set-up-custom-domain).

### Resends sändningsposter

| Typ | Namn, normalt | Värde | Prioritet | Kommentar |
| --- | --- | --- | --- | --- |
| TXT | `resend._domainkey` | **Hela publika DKIM-värdet från Resend**, normalt med `p=…` | – | Unikt för domänen; går inte att härleda i förväg |
| TXT | `send` | **Exakt SPF-värde från Resend**, normalt `v=spf1 include:amazonses.com ~all` | – | Gäller underdomänen `send`, inte automatiskt `@` |
| MX | `send` | **Exakt feedback-smtp-värde från Resend för vald region** | Normalt `10`, kopiera visat värde | Detta är retur-/studshantering; ersätter inte Stratos MX på `@` |
| TXT | `_dmarc` | Befintlig `v=DMARC1;p=reject;` | – | Behåll befintlig policy; verifiera både Strato- och Resend-utskick mot den |

Om Resend visar andra namn eller ett annat returdomänprefix används deras faktiska värden. Ändra inte en fungerande DMARC-policy till ett svagare exempelvärde. Lägg inte till en påhittad rapportadress; `rua` kan införas när ni valt mottagare för rapporter. Resend och Strato kan använda olika DKIM-selektorer parallellt. [Resend om SPF/DKIM](https://resend.com/blog/email-authentication-a-developers-guide/).

TTL: använd Auto/Stratos standard, eller 3600 sekunder om fältet kräver ett tal. Vissa Strato-fält administreras via e-postinställningar i stället för fria DNS-rader. Om en post inte går att lägga in ska dess namn inte flyttas till ett annat värdnamn; kontrollera rätt fält i Strato.

### Publik DNS-kontroll, 20 oktober 2026

Vid ny kontroll via Google Public DNS fanns A-posten `216.198.79.1`, ingen AAAA-post och MX `5 smtp.rzone.de.`. Webbplatsen svarade HTTP 200 över HTTPS med SWEA:s sidtitel. `www` var CNAME till `sweaenterprise.se.`. En Google-verifiering fanns som TXT på roten; den ska bevaras. Stratos namnservrar var `shades10.rzone.de.` och `docks01.rzone.de.` vid den tidigare kontrollen 19/10.

Resends `resend._domainkey` hade redan en publik DKIM-nyckel. `_dmarc` var `v=DMARC1;p=reject;`. Däremot saknades MX-svar för `send.sweaenterprise.se`, och TXT-posten där var enbart `send.forge.rmta.net`. **Den strängen ensam är ingen SPF-policy.** Kontrollera om Resend avser ett annat värde eller en annan posttyp och kopiera hela raden exakt från dess Domains-vy. Vi gissar inte ett nytt SPF- eller MX-värde från värdnamnet. En eventuell CNAME kan inte samexistera med andra posttyper på samma värdnamn; följ leverantörens kompletta uppsättning.

Kontrollen visar DNS, inte att postlådan/aliaset är skapade eller att Resend-domänen är Verified. Det är en ögonblicksbild; läs aktuell konfiguration före ändringar.

## 5. Kontaktformulär utan Cloudflare

Ingen extern captcha används. Formuläret kräver SITE_URL, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL och RESEND_API_KEY.

## 6. SiteCMS och Antons redigering

1. Logga in på SiteCMS och skapa en sajt för `sweaenterprise.se` om den inte finns.
2. Under Integration hämtas sajtens verkliga slug och API-nyckel. Lägg dem i Vercel. Sätt `CMS_REQUIRED=true` i Production när inkopplingen är klar.
6. Med `CMS_API_URL`, `CMS_SITE` och `CMS_API_KEY` satta i en säker lokal process: kör `node scripts/sitecms-sync.mjs` en gång för att registrera `sitecms.schema.json`. Använd Node 22:s env-fil-stöd om nycklarna sparas lokalt: `node --env-file=.env.local scripts/sitecms-sync.mjs`. Filen är Git-ignorerad. Lägg inte nycklarna i kommandoradshistoriken.
7. Synken skapar sidor/fält med starttexter och använder `prune:false`; den begär inte att befintligt innehåll raderas. Kör samma synk när schemastrukturen senare utökas.
8. Bygg/deploya igen så att SiteCMS-texterna hämtas.
9. Under Medlemmar: bjud in `anton@sweaenterprise.se` som **redaktör** för just denna sajt. Anton väljer sitt eget lösenord via SiteCMS. Använd inte ett delat administratörskonto.
10. Ändra en textrad, spara och gör sedan en manuell Redeploy i Vercel. Kontrollera att den nya texten faktiskt syns på hemsidan.

Fälten omfattar startsidans rubrik/ingress, presentationen av Anton och de fem tjänsternas namn, korttexter och beskrivningar. SiteCMS sid-SEO används där det finns; sajtens URL:er och canonical styrs av webbprojektet. Struktur, lagtexter och integrationshemligheter redigeras inte som vanlig webbtext.

Detta repo använder SiteCMS dokumenterade REST-API och en statisk byggare, **inte** Next.js-cache. En godkänd webhook betyder att nytt bygge begärts, inte att ändringen redan är live. CMS-dokumentationen anger fem sekunders webhook-timeout och inga automatiska omförsök; vid fel behöver man spara igen eller starta ny deploy. En tillgänglig tidigare deploy ersätts först efter lyckat nytt bygge. [SiteCMS officiella dokumentation](https://sitecms.se/docs).

## 7. Ordning för lansering

1. Verifiera Strato-inkorgen och `info@`-aliaset.
2. Lägg domänerna i Vercel och webb-DNS i Strato. Verifiera HTTPS på båda adresserna och omdirigering till huvuddomänen.
3. Verifiera Resends sändningsdomän med DKIM/SPF/retur-MX. Behåll Stratos rotdomän-MX.
4. Lägg Turnstile-nycklar och samtliga driftvariabler i Vercel, med `SITE_INDEXABLE=false` under inkopplingen.
5. Anslut SiteCMS, synka schema och verifiera ett redigeringsflöde inklusive Vercel-deployhook.
6. Deploya koden. Skicka en **verklig testförfrågan** med extern svarsadress och kontrollera att den når Antons inkorg, även skräppost, och att Svara går till rätt person.
7. Prova fel: ogiltiga fält, saknad/utgången bot-token och tillfälligt mejlfel får inte ge lyckad kvittens. Telefon/mejl ska vara tydliga alternativ.
8. Kontrollera aktuella företags-/tjänstetexter och integritetsrutiner. Bestäm gallring i Antons inkorg och leverantörers loggar.
9. När allt fungerar: sätt `SITE_INDEXABLE=true` och deploya igen. Kontrollera canonical, sitemap, robots och noindex på **den verkliga domänen**; preview ska fortsatt vara noindex.
10. Verifiera `https://www.sweaenterprise.se/` i Search Console (eller hela domänen med DNS), skicka `https://www.sweaenterprise.se/sitemap.xml` och uppdatera Google Företagsprofil.

## Kvarvarande konto-/värdeberoenden

API-nycklar, Turnstile-nycklar, Vercels exakta DNS-värden/deployhook, SiteCMS-slug och DKIM-värdet från Resend måste hämtas ur era konton. De kan inte skapas eller ersättas med exempelvärden i en guide. Inga inkorgar, DNS-poster, användarinbjudningar eller hemliga nycklar har skapats genom att denna fil skrivits.
