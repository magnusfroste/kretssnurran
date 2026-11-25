# Kretssnurran – sätt ström på rätt väg

**Mål (en sak):** barnet ska förstå att en lampa bara lyser när strömmen kan gå hela
vägen runt i en sluten krets – och vad som bryter kretsen (ett gap, en strömbrytare som
är öppen, ett material som inte leder).

**Målgrupp:** åk 4–6 (9–11 år), katalogkategori 3–6. iPads först, sedan dator, sist telefon.

**Kärnmekanik (touch först):** två tryck, aldrig drag. Tryck på en del i brickan (den blir
aktiv, en genomskinlig förhandsvisning följer fingret), tryck på en plats i kretsen.
Kretsen utvärderas av en modell direkt: lampan tänds bara om alla platser är fyllda med
ledande delar, det finns batteri och lampa, och alla strömbrytare är slutna. Trycker man
på en placerad strömbrytare öppnas/sluts den.

**4 nivåer, en fast tavla per nivå:** 1) batteri + lampa (brickan har också en gummislang
som frestelse), 2) + strömbrytare som börjar öppen, 3) + ett gap som bara koppartråd leder
över, 4) två lampor i serie med brytare.

**5-minuterssession:** fyra tavlor, ca 60–90 s per tavla, "Spela igen" efter sista.

**Belöning barnet kan berätta om:** "Jag slöt kretsen – då gick strömmen runt och lampan
lyste. Gummislangen ledde inte, för gummi är en isolator."

**Vad barnet lär:** sluten/öppen krets, batteriets roll, strömbrytarens funktion,
ledare och isolator, seriekoppling av två lampor.

**Lgr22 (1 punkt, ordagrant från Skolverkets text):** FY.4-6.1.6 – "Elektriska kretsar med
batterier. Hur de kan kopplas och hur de kan användas i vardaglig elektrisk utrustning."

**Varför iPad:** allt ritas i kod (SVG), inga bildfiler, inget nät beroende, inga konton,
inga länkar ut; fyra stora tryckytor på tavlan, delarna i brickan är 88 px höga; frågan och
förklaringen finns alltid som text (klassrummets iPads är ofta ljudlösa) och läses dessutom
upp.

**Kotten:** samma kotte som i Kotten-familjen, fem uttryck (glad, funderar, hejar, firar,
nyfiken), ritas i SVG.

## Testplan (mätbara krav)

1. Allt ryms: `scrollHeight-innerHeight == 0` och `scrollWidth-innerWidth == 0` vid
   1024×768, 768×1024, 390×844, 1440×900, både på startskärmen och i spelet.
2. Spelbart med bara touch: `Input.dispatchTouchEvent` på bricka och tavla flyttar en del;
   tavlan 4 går att slutföra med touch enbart.
3. Återkoppling: fel del ger en förklaring i text och tal, inget tas bort och inget låses.
4. Modellen: `node verify.mjs` prövar alla kombinationer av delar på alla platser i alla
   nivåer – lampan lyser exakt när kretsen är sluten, har batteri och lampa och inga öppna
   brytare eller isolatorer; förklaringen pekar på det som faktiskt är fel.
5. Tryckytor: varje plats ≥ 56 px i alla fyra storlekar (mätt ur SVG:ns skalning).
6. Ingen inloggning, ingen reklam, inga länkar ut, ingen tredjeparts-CDN (kotten.js
   undantagen, den ligger på skolappar.com).
7. Faktakontroll: påståendena i appen (vad som leder ström, vad en bruten krets gör) ska
   stämma med grundskolans fysik – inga påhittade siffror eller material.