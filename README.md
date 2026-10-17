# SWEA Enterprise AB – lokal hemsida

En svensk företagssajt med startsida, tjänsteöversikt, fem tjänstesidor, Om Anton, Utförda jobb, kontakt, integritet och 404-sida. Sol har lett arkitekturen och delegerat design samt kontakt/integritet till subagenter.

## Starta

Kräver Node.js 20 eller senare. Ingen paketinstallation krävs.

Dubbelklicka på `Starta-hemsidan.cmd` i projektmappen. Låt terminalfönstret vara öppet och besök **http://127.0.0.1:4173/**. Stäng servern med Ctrl+C.

Alternativ från projektmappen:

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

Om porten redan används: använd den befintliga servern eller stoppa den innan en ny startas. Servern är avsiktligt bunden till denna dator, inte till hela nätverket.

## Ändra och granska

- `scripts/build.mjs`: sidmallar, tjänstetexter och navigation.
- `src/app/globals.css`: layout, färger, typografi och mobilanpassning.
- `public/site.js`: mobilmeny.
- `public/contact-form.js`: lokal formulärdemo och validering.
- `content/privacy.html`: integritetsinformation för demon.
- `assets/brand/swea-logotyp-referens.png`: användarens oförändrade logotypreferens; symbolen visas genom CSS.

Kör `node scripts/build.mjs` efter ändringar och ladda sedan om webbläsaren. `dist/` skapas automatiskt och ska inte handredigeras. Servern behöver normalt inte startas om när endast innehållet byggs om.

Med servern igång kan du köra:

```powershell
node scripts/check.mjs
```

Kontrollen går igenom sidstruktur, interna länkar och resurser via HTTP, noindex samt riktig 404-status. Mobilmeny, FAQ, tjänstenavigation och formulärdemo har också granskats i webbläsare.

## Vad som fungerar nu

- Alla fem tjänsteområden har egen sida och kontaktväg.
- Responsiv svart/gul design med logotyp och lokala systemtypsnitt.
- Tangentbordsfokus, hoppa-till-innehåll, mobilmeny och FAQ.
- Kontaktformulär med obligatoriska fält, e-postkontroll, textgränser, dubbeltrycksspärr och återställning.
- Tjänsten kan förväljas från respektive tjänstesida.
- Demokvittensen är tydlig: inget meddelande skickas och ingen formulärdata sparas av sajten.
- Sidtitlar, beskrivningar, svenska HTML-sidor och sökbara textstrukturer är förberedda. Lokala versionen har avsiktligt noindex.

## Före offentlig lansering

1. Bekräfta Antons telefon, e-post, företagsuppgifter, arbetsområde och exakta erbjudande.
2. Lägg till porträtt och riktiga arbetsbilder samt godkända projektbeskrivningar. Inga kundcase eller omdömen har hittats på.
3. Bekräfta uthyrningsobjekt, priser/villkor och eventuella behörighetskrävande arbetsmoment.
4. Välj kontaktleverantör och anslut verklig mottagning med validering, missbruksskydd och tydlig felhantering. Demon har ingen backend. Publicera inte ett demoformulär som om det tog emot förfrågningar.
5. Anpassa integritetsinformation och rutiner till de faktiska leverantörerna och lagringen.
6. Ange stabil produktionsadress, canonical, sitemap, delningsmetadata och relevanta verifierade strukturerade företagsuppgifter. Dessa ska inte peka på en gissad domän.
7. Aktivera indexering för färdig produktion: ändra HTML-metadata och `robots.txt`. Den lokala serverns noindex-header ska fortsatt skydda lokal granskning.
8. Verifiera Search Console, skicka sitemap och uppdatera Google Företagsprofil. Indexering eller placering kan inte garanteras.

## Senare Vercel-publicering

Inget har publicerats. Statiska filer i `dist/` kan senare levereras av Vercel med byggkommando `node scripts/build.mjs` och output directory `dist`. Ingen Neon-databas behövs för nuvarande funktioner. Kontrollera kommersiell Vercel-plan, produktionsformulär och lanseringspunkterna ovan först. Inga konton, abonnemang eller externa tjänster har ändrats.

Next.js var det ursprungliga förslaget. Paketinstallationen slog i miljöns minnesgräns, så den lokala leveransen använder en liten statisk byggare och en Node-server utan externa beroenden.
