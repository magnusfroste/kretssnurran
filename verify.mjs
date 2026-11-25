// Kontrollerar Kretssnurrans data och kretsmodell i public/app.js.
// Reglerna räknas om här, oberoende av appens egen kod:
//   lampan lyser exakt när alla platser är fyllda, alla delar leder ström,
//   det finns minst ett batteri, minst (nivåns) antal lampor och ingen öppen brytare.
// Dessutom: varje nivå går att lösa med delarna i brickan, förklaringen pekar på rätt
// plats när felet är ett gap/en isolator/en brytare, och platserna ligger i slingan.
//   node verify.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./public/app.js", import.meta.url), "utf8");
const start = src.indexOf("var VARLD =");
const end = src.indexOf("/* Del 1 slut.");
if (start < 0 || end < 0) throw new Error("hittar inte datadelen i app.js");
const ren = src.slice(start, end);
const G = eval("(function(){" + ren +
  "\nreturn {VARLD, LOOP, LOOP_P, PLATSER, PLATSER_P, DELAR, NIVAA, tomPlacering, utvardera};})()");

let fel = 0;
const kolla = (c, m, p) => { if (!c) { fel++; if (fel <= 20) console.log("FEL", m, JSON.stringify(p)); } };

const plats = id => G.PLATSER.find(x => x.id === id);
const nycklar = Object.keys(G.DELAR);

// --- 1. data ---
kolla(G.PLATSER.length === 4, "fyra platser", G.PLATSER.length);
kolla(G.PLATSER_P.length === 4, "fyra platser i stående läge", G.PLATSER_P.length);
for (const [upps, loop, namn] of [[G.PLATSER, G.LOOP, "liggande"], [G.PLATSER_P, G.LOOP_P, "stående"]]) {
  const sedda = new Set();
  for (const p of upps) {
    kolla(!sedda.has(p.id), "dubbel plats-id", namn + " " + p.id); sedda.add(p.id);
    kolla(p.x >= 0 && p.x <= G.VARLD.b && p.y >= 0 && p.y <= G.VARLD.h, "plats utanför världen", namn + " " + p.id);
    kolla(["h", "v"].includes(p.riktning), "okänd riktning", p);
    // platsen måste sitta på slingans kant
    const påKant = (p.riktning === "h" && (p.y === loop.y0 || p.y === loop.y1)) ||
                   (p.riktning === "v" && (p.x === loop.x0 || p.x === loop.x1));
    kolla(påKant, "platsen sitter inte på sladden (" + namn + ")", p);
  }
  for (const s of ["topp", "hoger", "botten", "vanster"]) kolla(sedda.has(s), "plats saknas", namn + " " + s);
}
for (const d of Object.values(G.DELAR)) {
  kolla(typeof d.leder === "boolean", "delen saknar leder", d);
  kolla(d.namn && d.namn.length > 1, "delen saknar namn", d);
}
kolla(G.DELAR.gummi.leder === false, "gummi måste vara isolator", G.DELAR.gummi);
kolla(G.DELAR.koppar.leder === true && G.DELAR.batteri.leder === true && G.DELAR.lampa.leder === true,
  "metall, batteri och lampa leder ström", null);

// --- 2. nivåerna bygger på varandra ---
let förra = 0;
for (let i = 0; i < G.NIVAA.length; i++) {
  const n = G.NIVAA[i];
  kolla(n.n === i + 1, "nivånumreringen", n.n);
  kolla(n.platser.length >= förra, "nivån tar bort platser", n.n);
  förra = n.platser.length;
  kolla(new Set(n.platser).size === n.platser.length, "dubblett i nivåns platser", n.platser);
  for (const id of n.platser) kolla(plats(id), "okänd plats i nivån", id);
  for (const t of n.bricka) kolla(G.DELAR[t], "okänd del i brickan", t);
  kolla(n.lampor >= 1 && n.lampor <= 2, "konstigt lampkrav", n.lampor);
  const behöverLampor = n.bricka.filter(t => t === "lampa").length;
  kolla(behöverLampor >= 1, "brickan saknar lampa", n.n);
  kolla(n.bricka.some(t => G.DELAR[t].batteri), "brickan saknar batteri", n.n);
  kolla(n.bricka.some(t => !G.DELAR[t].leder), "nivån har ingen isolator att välja fel på", n.n);
  kolla(typeof n.mal === "string" && n.mal.length > 8, "målet saknas", n.n);
  kolla(typeof n.forklaring === "string" && n.forklaring.length > 20, "förklaringen saknas", n.n);
}

// --- 3. modellen mot oberoende regel, alla kombinationer ---
function förväntat(plac, oppen, n) {
  let batteri = 0, lampor = 0;
  for (const id of n.platser) {
    const d = plac[id];
    if (!d) return false;
    if (!G.DELAR[d].leder) return false;
    if (d === "batteri") batteri++;
    if (d === "lampa") lampor++;
    if (d === "brytare" && oppen[id]) return false;
  }
  return batteri >= 1 && lampor >= n.lampor;
}

let fall = 0, lysande = 0;
const typer = new Set(["gap", "isolator", "brytare", "batteri", "lampor", "sluten"]);
for (const n of G.NIVAA) {
  const k = n.platser.length;
  const val = [...nycklar, null];
  const total = Math.pow(val.length, k) * Math.pow(2, k);
  for (let kod = 0; kod < total; kod++) {
    let rest = kod;
    const plac = {};
    for (const id of n.platser) { plac[id] = val[rest % val.length]; rest = Math.floor(rest / val.length); }
    const oppen = {};
    for (const id of n.platser) { oppen[id] = (rest % 2) === 1; rest = Math.floor(rest / 2); }
    const f = förväntat(plac, oppen, n);
    const ut = G.utvardera(plac, oppen, n.n);
    fall++;
    if (f) lysande++;
    kolla(ut.lys === f, "modellen och regeln är oense", { niva: n.n, plac, oppen, ut: ut.lys, f });
    kolla(typer.has(ut.typ), "okänd typ", ut.typ);
    kolla(typeof ut.text === "string" && ut.text.length > 10, "tom förklaring", ut);
    if (ut.lys) kolla(ut.typ === "sluten", "lysande krets utan typ sluten", ut);
    // när felet är gap/isolator/brytare ska platsen peka på en plats som faktiskt är problemet
    if (ut.typ === "gap") kolla(!plac[ut.plats], "gap pekar på en fylld plats", ut);
    if (ut.typ === "isolator") kolla(plac[ut.plats] && !G.DELAR[plac[ut.plats]].leder, "isolatorfel pekar fel", ut);
    if (ut.typ === "brytare") kolla(plac[ut.plats] === "brytare" && oppen[ut.plats], "brytarfel pekar fel", ut);
  }
}
kolla(fall > 10000, "för få prövade kombinationer", fall);

// --- 4. varje nivå går att lösa med brickans delar ---
for (const n of G.NIVAA) {
  let löst = false;
  const val = n.bricka;
  const total = Math.pow(val.length, n.platser.length);
  for (let kod = 0; kod < total && !löst; kod++) {
    let rest = kod;
    const plac = {}, oppen = {};
    for (const id of n.platser) { plac[id] = val[rest % val.length]; rest = Math.floor(rest / val.length); oppen[id] = false; }
    if (G.utvardera(plac, oppen, n.n).lys) löst = true;
  }
  kolla(löst, "nivån går inte att lösa med brickans delar", n.n);
}

// --- 5. nivå 4 kräver två lampor, nivå 1–3 en ---
const baraEnLampa = { topp: "batteri", hoger: "lampa", botten: "koppar", vanster: "brytare" };
kolla(G.utvardera(baraEnLampa, { vanster: false }, 3).lys === true, "nivå 3 ska lysa med en lampa", null);
kolla(G.utvardera(baraEnLampa, { vanster: false }, 4).lys === false, "nivå 4 ska kräva två lampor", null);
const tvåLampor = { topp: "batteri", hoger: "lampa", botten: "lampa", vanster: "brytare" };
kolla(G.utvardera(tvåLampor, { vanster: false }, 4).lys === true, "nivå 4 ska lysa med två lampor", null);

console.log(`${fel} fel, ${fall} kombinationer prövade, ${lysande} av dem sluter kretsen`);
process.exit(fel ? 1 : 0);