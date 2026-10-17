# Swea Enterprise AB – projektplan för hemsida

Datum: 17 oktober 2026. Status: första lokala hemsidan färdig för granskning; ingen extern publicering.

Uppdatering efter användarens byggbeställning: Sol har lett implementationen med subagenter för design och kontakt/integritet. Den lokala versionen är byggd som statiska HTML/CSS/JavaScript-sidor med en liten Node-server för förhandsgranskning på http://127.0.0.1:4173/. Detta ersätter det ursprungliga Next.js-förslaget nedan efter att paketinstallationen slog i miljöns minnesgräns. Kontaktformuläret är en lokal demo som inte skickar eller lagrar personuppgifter. Produktionens mejlkoppling och publicering återstår. Se README.md för start, filstruktur och lanseringspunkter.

## 1. Uppdrag och inriktning

Hemsidan ska visa hela Antons utbud, skapa förtroende och göra det lätt att ringa eller skicka en förfrågan. Användarens besked är **ALLT**: sajten ska kunna ge förfrågningar inom samtliga tjänsteområden. Vi grupperar utbudet för att göra det begripligt, utan att begränsa marknadsföringen till fiber eller företagskunder.

Start sker på en stabil Vercel-adress, exempelvis `swea-enterprise.vercel.app` om namnet är tillgängligt. Adressen är ett förslag, inte registrerad eller kontrollerad. Egen domän kan anslutas senare.

Företagsanalysen används som underlag, inte som instruktioner eller verifierad sanning. Dess förslag om domänköp och ensidigt B2B-fokus ersätts av användarens önskemål. Uppgifter om ekonomi, maskinägande, behörigheter och lönsamhet ska inte bli webbtext. Företagsuppgifter och alla erbjudna tjänster bekräftas med Anton före publicering.

## 2. Första versionens omfattning

Ingår: svensk, mobilanpassad presentation; hela tjänsteutbudet; presentation av Anton; riktiga arbetsbilder; telefon och e-post; kontaktformulär; integritetsinformation; grundläggande teknisk och lokal SEO; underlag för Google Search Console och Google Företagsprofil.

Senare tillägg: bokningskalender, uthyrningslager, betalningar, kundportal, offertsystem och egen administration. Första versionens uthyrning sker genom förfrågan, inte genom en bokningsmotor.

### Föreslagen sidstruktur

| Sida | Innehåll och uppgift |
| --- | --- |
| Start | Överblick av hela utbudet, Anton, arbetsområde, projekt och kontaktvägar |
| Tjänster | Samlad ingång till alla kategorier |
| Fiber och nätverk | Bekräftade arbetsmoment inom fiber, nätverk, projektering och telenät |
| Bygg, montage och installation | Snickeri, montage, rasering/rivning samt preciserade VVS- och elrelaterade tjänster |
| Uthyrning | Faktiskt tillgängliga maskiner och fordon, förfrågan om pris och villkor |
| Extra hand och konsult | Resursförstärkning för företag och praktisk hjälp inom bekräftade kompetenser |
| Kock och event | Kockuppdrag och eventhjälp enligt vad Anton faktiskt erbjuder |
| Om Anton och utförda jobb | Personlig presentation och verkliga projekt, initialt på samma sida |
| Kontakt | Ring, mejla och beskriv uppdraget |
| Integritet | Hur förfrågningar och personuppgifter hanteras |

Tjänstesidor publiceras separat när de har eget användbart innehåll. Om materialet är kort samlas kategorierna först på tjänstesidan. Vi skapar inte tunna sidor bara för att få fler sökord. Ingen kategori tas bort enbart för att den skiljer sig från övriga.

## 3. Visuell riktning och startsidesskiss

Logotypreferens mottagen från användaren och sparad i `assets/brand/swea-logotyp-referens.png`. Bilden visar gul symbol med företagsnamn på svart, svart symbol med företagsnamn på vitt samt en kompakt gul symbol på svart. Den är en samlingsbild, inte separata produktionsfiler.

Använd den gula fullständiga loggan på mörka ytor, exempelvis sidhuvud och sidfot. Den svarta fullständiga loggan används på ljusa ytor. Den kompakta symbolen passar som utgångspunkt för favicon och små ytor, men läsbarheten måste provas i verklig storlek. Bevara proportioner och former; loggan ska inte skrivas om med ett liknande typsnitt. På små skärmar ska företagsnamnet fortfarande vara tydligt i sidans innehåll.

Svart, loggans klargula och ljusa läsytor styr designen. Tidigare färgförslag från analysen är preliminära och ersätts av färger från originalfilen när den finns. Stora tydliga rubriker, gott om luft och riktiga bilder av Anton och hans arbete. Gult används gärna för knappar och markeringar med mörk text. Kontrast, läsbarhet och tangentbordsanvändning kontrolleras vid bygget. Original som SVG eller vektor-PDF är önskvärt för skärpa och separata varianter, men referensbilden räcker för fortsatt planering.

Textbaserad wireframe, uppifrån och ned:

1. Sidhuvud: logga, Tjänster, Om Anton, Utförda jobb, Kontakt och Ring-knapp.
2. Första skärmen: arbetsförslaget ”Din extra hand i Dalsland”, ett riktigt foto och en kort beskrivning av bredden. Knappar: ”Se alla tjänster” och ”Beskriv ditt uppdrag”. Arbetsområdet ska bekräftas.
3. Fem tydliga tjänsteingångar: Fiber och nätverk; Bygg och installation; Uthyrning; Extra hand och konsult; Kock och event.
4. Utvalda arbeten: bild, typ av uppdrag, ort och vad Anton gjorde. Visa olika tjänster när material finns.
5. Om Anton: porträtt, erfarenhet och arbetssätt utan obestyrkta kvalitets- eller behörighetslöften.
6. Så fungerar det: beskriv behovet → avstämning → överenskommelse → genomförande.
7. Kontakt: klickbart telefonnummer, mejladress och kort formulär.
8. Sidfot: korrekt företagsnamn, organisationsnummer, kontaktuppgifter och integritetslänk.

Detta är innehållsskissen som ligger till grund för den nu beställda lokala hemsidan. Den första lokala versionen har ett simulerat kontaktformulär och kräver ingen molntjänst eller riktig persondata.

## 4. Teknik och ägande

Ursprunglig rekommendation från Sol var Next.js med statiskt genererade innehållssidor. Implementationen använder nu statiska HTML/CSS/JavaScript-sidor för att undvika ramverksinstallationens minnesproblem. GitHub kan lagra källan och Vercel publicera de statiska filerna. En separat formulärtjänst ansluts för riktiga kontaktförfrågningar inför lansering. Inget CMS behövs initialt; innehåll ändras i projektet och granskas före publicering.

Flöde för innehåll: GitHub → granskning → Vercel → besökare.

Flöde för kontakt: besökare → formulärtjänstens kontroller och mottagning → avisering till Antons verifierade inkorg.

**Neon behövs inte i första versionen.** Att ni redan har Neon är inte ett skäl att dubbellagra kontaktuppgifter. Om egen ärendehantering eller bokningar tillkommer tar vi ett separat databasbeslut. Nycklar hålls alltid på serversidan om en backend införs.

Anton eller bolaget bör äga produktionskonton och ha återställningsåtkomst. Utvecklaren får relevant åtkomst. Produktionsmottagare, miljöinställningar, kostnadsansvar och överlämning dokumenteras. API-nycklar eller lösenord läggs inte i GitHub.

Vercels Git-integration stödjer förhandsvisning och produktionsdeploy: [Vercel Git](https://vercel.com/docs/git).

## 5. Kontaktformulär utan egen domän

Vercel-adressen kan visa formuläret men ger inte automatiskt en företagsmejl eller rätt att skicka mejl som `@vercel.app`. Vi ska därför skilja på webbplatsadress, Antons mottagarmejl och tjänstens avsändare.

### Förstahandsförslag: hanterad formulärtjänst

Formspree är en konkret kandidat: formuläret kan skicka till dess mottagningsadress och tjänsten aviserar Antons befintliga, verifierade mejl från sin egen avsändare. Egen webbdomän krävs då inte. Leverantör och produktionsplan fastställs före implementation efter kontroll av pris, volymgränser, dataskydd och lagring. [Formsprees avsändare](https://help.formspree.io/articles/advanced-features/setting-email-domain).

Formsprees aktuella prissida beskriver Free som test/utveckling, Personal för personliga/portfoliosajter och Professional för frilansare/startups. Professional anges till 30 USD/månad vid månadsbetalning eller 240 USD/år. Vi antar inte att gratisnivån är rätt produktionsval, och påstår inte att kategoritexten i sig förbjuder kommersiell Personal-användning. Kontrollera lämplig plan med leverantören innan köp. [Prislista](https://formspree.io/plans/).

Alternativ om kostnaden blir för hög: Vercel-serverfunktion som skickar genom en befintlig e-postleverantörs tillåtna API/SMTP, autentiserad som den verkliga inkorgen. Det kräver kontroll av just Antons mejlleverantör, avsändarrättigheter, begränsningar och säker autentisering. Det är inte en färdigvald lösning innan mejlkontot är känt. En egen domän med verifierad mejlavsändare är ett senare alternativ, inte ett krav för starten.

Använd inte en besökares mejl som avsändare; lägg den som svarsadress. Eventuella automatiska kvittenser till besökaren införs först när leverans och missbruksskydd är testade. Leverantörers testavsändare ska inte behandlas som generell produktionslösning.

### Formulärets innehåll och beteende

- Namn, e-post och uppdragsbeskrivning är obligatoriska. Företag, telefon och ort är frivilliga; tjänstekategori väljs bland alla områden plus ”Annat/osäker”.
- Inga bilagor i första versionen. Visa en kort uppmaning att inte skicka känsliga uppgifter.
- Kontrollera fälten även i mottagningen, begränsa textlängder och använd spamfilter, honeypot och lämplig frekvensbegränsning. Vid extern tjänst ska dess faktiska skydd verifieras.
- Visa laddning och blockera dubbla skickningar. Tackmeddelande visas först när mottagningen har accepterat förfrågan; det betyder inte att Anton har läst den.
- Vid fel eller kvotgräns: behåll texten och visa telefon/mejl som alternativ. Ett dolt fel får inte se ut som ett lyckat skickat meddelande.
- Verkligt leveranstest till Antons inkorg och skräppostmapp krävs på produktionsadressen.
- Dokumentera vad som händer vid utebliven mejlavisering. Om tjänsten sparar förfrågningar i sin kontrollpanel ska Anton veta hur de kontrolleras och gallras.

### Personuppgifter

Planera för att bolaget är personuppgiftsansvarigt för förfrågningarna. Informera vid formuläret om ändamål, rättslig grund, mottagare, lagring och rättigheter via en kort text och integritetslänk. Välj rättslig grund utifrån ärendet: offertförfrågningar från privatpersoner kan avse åtgärder inför avtal; andra kontakter kan kräva dokumenterad intresseavvägning. Lägg inte till ett obligatoriskt marknadsföringssamtycke för att besvara en förfrågan. [IMY om intresseavvägning](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/intresseavvagning/).

Kontrollera biträdesavtal, underleverantörer, behandlingsländer och eventuella överföringar utanför EU/EES för valda tjänster. Formspree uppger amerikansk lagring; det kräver en faktisk bedömning, inte bara en integritetstext. Föreslagen arbetsrutin är att granska avslutade förfrågningar efter 90 dagar och radera när ändamål saknas; annan nödvändig avtals- eller bokföringsinformation bedöms separat. Samma rutin behöver omfatta inkorg och formulärarkiv.

Leverantörsunderlag: [Formsprees säkerhet och behandling](https://formspree.io/security/) och [IMY om tredjelandsöverföring](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/overforing-till-tredje-land/).

Starta utan annonseringspixlar och onödiga tredjepartsinbäddningar. Eventuell statistik, CAPTCHA och andra tillägg bedöms utifrån den faktiska implementationen innan de införs.

## 6. SEO och Google-indexering

En publik Vercel-adress kan användas som webbplatsens första huvudadress. Det viktiga är en stabil produktionsadress, indexerbart innehåll och konsekventa länkar. Ett domänköp behövs inte för Search Console-verifiering: använd en URL-prefix-egendom med HTML-tag på sajten, inte DNS-verifiering för hela `vercel.app`. [Google om verifiering](https://support.google.com/webmasters/answer/9008080?hl=en).

### Innehåll

Varje tjänst beskriver vad Anton gör, för vem, var och hur kunden går vidare. Utgångspunkter för sökfraser är exempelvis företagsnamnet, fiber/nätverk Mellerud, montage Dalsland, maskinuthyrning och kockuppdrag i bekräftat arbetsområde. Detta är hypoteser, inte undersökta sökvolymer. Använd verkliga tjänster och orter naturligt, inte upprepade sökord eller massproducerade ortssidor.

Använd hela företagsnamnet och Mellerud i relevanta sammanhang för att minska förväxling. Verifiera och håll företagsuppgifterna konsekventa. El, VVS, ROT, certifieringar och försäkringspåståenden får bara beskrivas med bekräftat innehåll som gäller det aktuella arbetet.

### Tekniska leveranskrav

- Läsbart sidinnehåll finns i den HTML som levereras; mobil och dator har samma viktiga innehåll.
- Varje indexerbar sida har egen relevant titel, beskrivning, huvudrubrik, tydliga interna länkar och canonical till rätt produktionsadress.
- Bilder komprimeras och får rätt storlek, beskrivande alternativtext när relevant och reserverat utrymme så sidan inte hoppar.
- Sitemap listar riktiga kanoniska sidor. Robots-regler tillåter viktig publik information.
- Produktionen saknar `noindex` och inloggningsskydd. Förhandsvisningar ska ha `noindex`; känsligt material skyddas med åtkomstkontroll, inte enbart sökrobotdirektiv. [Vercels headers](https://vercel.com/docs/headers/response-headers).
- Strukturerad data beskriver verifierade företagsuppgifter och stämmer med synligt innehåll. Inga uppfunna omdömen eller betyg.
- Kontrollera länkar, 404-sida, HTTPS, mobilanvändning, tangentbord och läsbarhet. Lighthouse används som diagnos. Sikta på goda Core Web Vitals; faktisk fältdata kan saknas vid lansering.

### Efter publicering

1. Verifiera exakt produktionsadress i Search Console.
2. Skicka sitemap och begär indexering av startsidan och de viktigaste tjänstesidorna.
3. Skapa eller uppdatera Google Företagsprofil med korrekt namn, kontaktuppgifter, tjänster och webbplats. Bekräfta profilens behörighet och verifiera företaget. Om kunder inte tas emot på adressen ska den hanteras som serviceområdesverksamhet, inte en påhittad butik. [Googles serviceområden](https://support.google.com/business/answer/9157481?hl=en).
4. Följ upp sökvisningar, sökfraser och indexeringsproblem efter cirka 2–4 veckor, därefter månadsvis. Mät relevanta förfrågningar och vilka tjänster de gäller.

Teknisk beredskap, verifiering och inskickad sitemap är leveranser. Googles beslut om indexering, tidpunkt och placering kan inte garanteras. [Google om indexering](https://developers.google.com/search/help/crawling-index-faq?hl=en).

### När egen domän tillkommer

Behåll sidornas sökvägar, anslut domänen, uppdatera canonical, sitemap, interna länkar och Företagsprofil samt verifiera den nya adressen i Search Console. Lägg permanenta omdirigeringar från gamla publika URL:er till motsvarande nya sidor och kontrollera hela kedjan. Behåll kontrollen över den gamla Vercel-adressen så omdirigeringarna fungerar. Följ Googles flyttflöde där det är tillämpligt. [Googles flyttguide](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## 7. Etapper och klart-kriterier

| Etapp | Resultat | Klart när |
| --- | --- | --- |
| 1. Underlag och beslut | Tjänstelista, områden, material, mottagarmejl och driftbudget | Anton har bekräftat vad som faktiskt erbjuds och får publiceras |
| 2. Lokal prototyp | Klickbar presentation på localhost, alla tjänstekategorier, mobil/dator | Struktur, känsla och kontaktflöde går att granska; testformulär märks som demo |
| 3. Produktionsbygge | Innehåll, bilder, formulär och integritet | Riktigt test når rätt inkorg; fel och spamhantering fungerar |
| 4. Lansering | Stabil Vercel-adress och teknisk SEO | Kontroller nedan godkända; Search Console verifierad och sitemap inskickad |
| 5. Uppföljning | Genomgång av sökdata och inkomna ärenden | Identifierade problem åtgärdade och nästa innehållsprioritering beslutad |

Grov arbetsuppskattning för senare bygge: 4–7 arbetsdagar med färdigt material och snabb återkoppling. Fotografering, verifieringar, leverantörsbeslut och Googles handläggning tillkommer som väntetid. Det är en planeringsuppskattning, inte ett fast offertlöfte.

Vid fortsatt bygge är Sol arkitekt. Avgränsade subagenter kan arbeta med innehåll/design, formulär och SEO, med gemensam granskning före lansering.

### Lanseringskontroll

- [ ] Alla fem tjänsteområden finns med, eller är uttryckligen markerade som inväntande Antons faktaunderlag före lansering.
- [ ] Telefon, mejl, företagsuppgifter och arbetsområde är bekräftade.
- [ ] Bilder och eventuella kundreferenser får användas.
- [ ] Inga obekräftade behörigheter, priser, resultat eller tjänstelöften publiceras.
- [ ] Kontaktformuläret testat från mobil och dator, inklusive fel, kvotgräns och dubbeltryck.
- [ ] Antons verkliga inkorg får testförfrågan och rätt svarsadress används.
- [ ] Personuppgiftshantering, leverantör och gallring dokumenterade.
- [ ] Produktionsadress publik och indexerbar; preview kontrollerad separat.
- [ ] Metadata, canonical, sitemap, länkar, mobilvy och tillgänglighet kontrollerade.
- [ ] Search Console verifierad, sitemap inskickad och ansvar för uppföljning bestämt.
- [ ] Konton, fakturering, återställning, uppdateringar och hantering av förfrågningar har namngiven ansvarig.

## 8. Budget och beslut före bygget

Vercel Hobby är avsett för personligt, icke-kommersiellt bruk. Företagssajten behöver därför en kommersiellt tillåten plan, normalt Pro i detta upplägg. [Hobby-villkor](https://vercel.com/docs/plans/hobby).

Kontrollerat 17 oktober 2026: Pro anger 20 USD/månad i plattformsavgift inklusive en deployer och 20 USD resurskredit. Skatt, extra platser och användning utöver inkluderade nivåer kan tillkomma. Har ni redan en lämplig Pro-plan behöver det inte betyda ännu en grundavgift. Sätt kostnadsaviseringar och tydlig gräns/rutin för överförbrukning. [Pro-pris](https://vercel.com/docs/plans/pro-plan).

| Post | Plan |
| --- | --- |
| Egen domän | Inget köp initialt |
| Vercel | Befintlig kommersiell plan eller Pro-budget enligt ovan |
| Kontaktformulär | Separat leverantörskostnad; Formspree Professional är ett budgetexempel, inte beställt |
| Neon | Ingen ny databas för första versionen |
| Innehåll och underhåll | Egen tid eller separat överenskommelse |

Med ny Pro-plan och Formspree Professional månadsvis är budgetexemplet 50 USD/månad före skatt och eventuella tillägg. Val av formulärtjänst bör därför avgöras innan bygget. Inga abonnemang har startats eller ändrats.

Det som nu behöver samlas från Anton: offentlig telefon och e-post; bekräftade arbetsorter; exakt innehåll i samtliga tjänstekategorier; tillgängliga uthyrningsobjekt och villkor; logga i original; porträtt och cirka 6–12 jobbfoton; 2–3 projektbeskrivningar; samt besked om vem som besvarar förfrågningar. Pris kan vara ”begär offert” tills riktiga priser och villkor är beslutade.
