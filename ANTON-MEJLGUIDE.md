# Anton – din SWEA-mejl på iPhone och i webbläsaren

För adresserna **anton@sweaenterprise.se** och **info@sweaenterprise.se**. Kontrollerad 21 oktober 2026.

## Börja här

Adresserna måste vara skapade i Stratos e-postadministration och ha fungerande mottagning. Den här guiden skapar inga postlådor. Ha **e-postkontots lösenord** till hands; det är inte lösenordet till Stratos kundkonto eller ditt Apple-konto.

Kontrollera om adresserna är två separata postlådor eller om `info@` är ett alias till `anton@`. Ett alias har samma inkorg som huvudkontot och ska normalt inte läggas till som ett andra separat konto.

## Alternativ 1: Stratos webbmail – snabbast att komma igång

1. Öppna Safari och gå till **https://webmail.strato.com/appsuite/signin**.
2. Ange hela mejladressen, exempelvis **anton@sweaenterprise.se**.
3. Ange lösenordet till just den postlådan och välj **Logga in**.
4. Du kan nu läsa och skicka mejl direkt i webbläsaren.

Har `info@` en egen postlåda loggar du in med den adressen och dess lösenord när du vill öppna den. Är `info@` ett alias kommer mejlen till huvudkontots inkorg. Kontrollera avsändaradressen innan du svarar.

Webbmail kräver ett Strato-paket som stöder tjänsten. Om inloggningen inte fungerar: kontrollera att postlådan finns och att du använder dess e-postlösenord. Stratos kundinloggning används för administration, inte för att läsa mejlen.

## Alternativ 2: Lägg till kontot i iPhones Mail-app

### Lägg först till anton@sweaenterprise.se

1. Öppna **Inställningar → Appar → Mail → E-postkonton → Lägg till konto**. På äldre iOS finns Mail direkt under Inställningar.
2. Ange **anton@sweaenterprise.se**. Om Strato inte hittas, välj **Lägg till annat konto → E-postkonto**. På vissa iOS-versioner heter valet **Annat → Lägg till e-postkonto**.
3. Fyll i namn **Anton – SWEA Enterprise AB**, mejladress, postlådans lösenord och beskrivning **SWEA Anton**. Tryck på **Nästa**.
4. Om du får ange inställningar manuellt, välj **IMAP** och använd tabellen nedan.
5. Tryck på **Nästa**, låt telefonen kontrollera uppgifterna och välj **Spara**. Se till att Mail är aktiverat för kontot.

| Inställning | Inkommande mejl | Utgående mejl |
| --- | --- | --- |
| Server/värdnamn | `imap.strato.de` | `smtp.strato.de` |
| Användarnamn | `anton@sweaenterprise.se` | `anton@sweaenterprise.se` |
| Lösenord | Postlådans lösenord | Samma postlådas lösenord |
| Port | **993** | **465** |
| SSL/TLS | **På** | **På** |
| Autentisering | Lösenord | Lösenord |

Fyll i användarnamn och lösenord även för utgående server om iPhone visar dem som valfria. Välj IMAP så att mejlen synkroniseras mellan iPhone och webbmailen.

### Lägg sedan till info@sweaenterprise.se

**Om info@ är en egen postlåda:** upprepa samma steg, byt användarnamn och mejladress till **info@sweaenterprise.se**, använd dess eget lösenord och ange beskrivningen **SWEA Info**. Serveradresser och portar är samma.

**Om info@ är ett alias:** lägg bara till huvudkontot. Inkommande info-mejl visas där. För att kunna svara som info behöver aliaset också vara tillåtet som avsändare hos Strato och valt i Mail. Prova först i webbmailen; om info inte går att välja, be administratören kontrollera aliasets avsändarinställningar.

## Kontrollera att allt fungerar

Skicka ett mejl från en annan adress till vardera SWEA-adressen. Öppna mejlen på iPhone och svara. Kontrollera i mottagarens inkorg att svaret kom fram och att rätt SWEA-adress står som avsändare.

Om du kan ta emot men inte skicka: kontrollera SMTP-servern, port 465, SSL och att hela mejladressen och lösenordet finns ifyllda även där. Om inget fungerar, testa webbmailen först. Stäng inte av SSL för att försöka lösa ett fel.

## Förfrågningar från hemsidan

Förfrågningar sparas under **Förfrågningar** i SiteCMS. Anton får också en avisering till den mottagaradress som hemsidan är inställd på. Kunden får en automatisk mottagningsbekräftelse från **info@sweaenterprise.se**. Det är en bekräftelse på mottagning, inte ett avtal eller en bokning. Svara på kundaviseringen för att kontakta kunden.

## Officiell hjälp

- [Stratos serverinställningar](https://www.strato.se/faq/e-post/e-postserver-adresser-portar-ssl-tls/)
- [Stratos webbmail – inloggning och lösenord](https://www.strato.se/faq/e-post/hur-loggar-jag-in-paa-STRATO-webmail/)
- [Apple – lägga till e-postkonto på iPhone](https://support.apple.com/sv-se/102619)
