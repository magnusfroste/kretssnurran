/* Kretssnurran – sluten krets, strömbrytare och ledare (fysik åk 4–6).
   Tränar Lgr22 FY.4-6.1.6: "Elektriska kretsar med batterier. Hur de kan kopplas och hur
   de kan användas i vardaglig elektrisk utrustning."

   Kretsen är en slinga med fyra platser. Barnet trycker på en del i brickan och sedan på
   en plats i kretsen; modellen nedan räknar ut om strömmen kan gå hela vägen runt.
   Allt ritas i SVG i koden, ljudet skapas i WebAudio och frågan läses upp med talsyntes.
   Del 1 är ren data och ren modell – verify.mjs kör den i node. */
(function () {
  "use strict";

  /* ================================================================ *
   * 1. DATA OCH MODELL – kontrolleras av verify.mjs                   *
   * ================================================================ */

  var VARLD = { b: 1000, h: 620 };
  var LOOP = { x0: 150, y0: 120, x1: 850, y1: 500, r: 46 };

  /* Platserna sitter mitt på varje sida i slingan. riktning h = sladden går vågrätt. */
  var PLATSER = [
    { id: "topp", x: 500, y: 120, riktning: "h" },
    { id: "hoger", x: 850, y: 310, riktning: "v" },
    { id: "botten", x: 500, y: 500, riktning: "h" },
    { id: "vanster", x: 150, y: 310, riktning: "v" }
  ];

  /* I stående läge på en telefon ritas slingan hög och smal, så att tryckytorna blir stora.
     Modellen räknar bara med platsernas id, så geometrin kan bytas utan att reglerna ändras. */
  var LOOP_P = { x0: 320, y0: 90, x1: 680, y1: 520, r: 40 };
  var PLATSER_P = [
    { id: "topp", x: 500, y: 90, riktning: "h" },
    { id: "hoger", x: 680, y: 305, riktning: "v" },
    { id: "botten", x: 500, y: 520, riktning: "h" },
    { id: "vanster", x: 320, y: 305, riktning: "v" }
  ];

  var DELAR = {
    batteri: { namn: "batteri", leder: true, batteri: true },
    lampa: { namn: "lampa", leder: true, lampa: true },
    brytare: { namn: "strömbrytare", leder: true, brytare: true },
    koppar: { namn: "koppartråd", leder: true },
    gummi: { namn: "gummislang", leder: false, isolator: true }
  };

  /* En nivå lägger till en sak i taget. lampor = hur många lampor som måste sitta i kretsen. */
  var NIVAA = [
    { n: 1, platser: ["topp", "hoger"], bricka: ["batteri", "lampa", "gummi"], lampor: 1,
      mal: "Sätt dit batteri och lampa så att lampan lyser.",
      forklaring: "Batteriet driver strömmen runt i slingan. När båda bitarna sitter på plats är kretsen sluten och lampan lyser." },
    { n: 2, platser: ["topp", "hoger", "botten"], bricka: ["batteri", "lampa", "brytare", "gummi"], lampor: 1,
      mal: "Tänd lampan – strömbrytaren måste vara sluten.",
      forklaring: "En strömbrytare är en medveten paus i kretsen. Öppen brytare = bruten krets och ingen ström; stängd brytare = sluten krets." },
    { n: 3, platser: ["topp", "hoger", "botten", "vanster"], bricka: ["batteri", "lampa", "brytare", "koppar", "gummi"], lampor: 1,
      mal: "Hela vägen runt: strömmen ska kunna gå hela kretsen.",
      forklaring: "Metall leder ström, gummi gör det inte. En gummislang i kretsen blir ett gap, fast det ser ut som en bit." },
    { n: 4, platser: ["topp", "hoger", "botten", "vanster"], bricka: ["batteri", "lampa", "brytare", "koppar", "gummi"], lampor: 2,
      mal: "Två lampor ska lysa samtidigt.",
      forklaring: "Med två lampor efter varandra i samma slinga går strömmen genom båda. Det kallas seriekoppling." }
  ];

  function tomPlacering() {
    return { topp: null, hoger: null, botten: null, vanster: null };
  }

  /* oppen = { platsId: true } för strömbrytare som barnet har öppnat.
     Returnerar alltid samma form: { lys, typ, plats, text }. */
  function utvardera(plac, oppen, niva) {
    var p = NIVAA[(niva || 1) - 1], i, id, d;
    var tomma = [], isolatorer = [], oppna = [], batterier = 0, lampor = 0;

    for (i = 0; i < p.platser.length; i++) {
      id = p.platser[i];
      d = plac ? plac[id] : null;
      if (!d) { tomma.push(id); continue; }
      if (!DELAR[d]) { tomma.push(id); continue; }
      if (DELAR[d].batteri) batterier++;
      if (DELAR[d].lampa) lampor++;
      if (!DELAR[d].leder) isolatorer.push(id);
      if (DELAR[d].brytare && oppen && oppen[id]) oppna.push(id);
    }

    if (tomma.length) {
      return { lys: false, typ: "gap", plats: tomma[0],
        text: "Här är ett gap. Strömmen kan inte hoppa över ett hål – sätt en del här." };
    }
    if (isolatorer.length) {
      return { lys: false, typ: "isolator", plats: isolatorer[0],
        text: "Gummi leder inte ström. Det är en isolator – byt till något av metall, till exempel koppartråd." };
    }
    if (oppna.length) {
      return { lys: false, typ: "brytare", plats: oppna[0],
        text: "Strömbrytaren är öppen, så kretsen är bruten. Tryck på den så sluts kretsen." };
    }
    if (!batterier) {
      return { lys: false, typ: "batteri", plats: null,
        text: "Det finns inget batteri i kretsen. Utan batteri finns ingen ström." };
    }
    if (lampor < p.lampor) {
      return { lys: false, typ: "lampor", plats: null,
        text: p.lampor === 2 ? "Sätt dit två lampor i kretsen." : "Sätt dit en lampa i kretsen." };
    }
    return { lys: true, typ: "sluten", plats: null, lampor: lampor,
      text: "Kretsen är sluten! Strömmen går hela vägen runt och lampan lyser." };
  }

  /* Del 1 slut. *//* ================================================================ *
   * 2. RITNING – allt i SVG, inga bildfiler                           *
   * ================================================================ */

  var SLOT_W = 110;      /* halva gapets längd längs sladden */
  var SLOT_H = 56;       /* halva gapets höjd tvärs sladden  */
  var PAPER = "#f2ece1";
  var WIRE = "#8c7a63";
  var KOPPAR = "#c2703a";

  function el(tag, attrs, barn) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag), k;
    for (k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (barn) for (var i = 0; i < barn.length; i++) n.appendChild(barn[i]);
    return n;
  }
  function txt(s, attrs) { var n = el("text", attrs); n.textContent = s; return n; }

  function plasterFor(id) {
    for (var i = 0; i < PLATSER.length; i++) if (PLATSER[i].id === id) return PLATSER[i];
    return null;
  }
  /* Stående läge: egen geometri med högre slinga. */
  function plasterForP(id) {
    for (var i = 0; i < PLATSER_P.length; i++) if (PLATSER_P[i].id === id) return PLATSER_P[i];
    return null;
  }
  function nivaData(n) { return NIVAA[(n || 1) - 1]; }

  /* Sladden: en avrundad slinga, sedan täcks gapen med pappersfärg. */
  function ritaSladd(L) {
    L = L || LOOP;
    var d = "M " + (L.x0 + L.r) + " " + L.y0 +
      " H " + (L.x1 - L.r) + " Q " + L.x1 + " " + L.y0 + " " + L.x1 + " " + (L.y0 + L.r) +
      " V " + (L.y1 - L.r) + " Q " + L.x1 + " " + L.y1 + " " + (L.x1 - L.r) + " " + L.y1 +
      " H " + (L.x0 + L.r) + " Q " + L.x0 + " " + L.y1 + " " + L.x0 + " " + (L.y1 - L.r) +
      " V " + (L.y0 + L.r) + " Q " + L.x0 + " " + L.y0 + " " + (L.x0 + L.r) + " " + L.y0 + " Z";
    return el("path", { d: d, fill: "none", stroke: WIRE, "stroke-width": 18, "stroke-linecap": "round" });
  }

  function gapRekt(p, extra) {
    extra = extra || 0;
    return p.riktning === "h"
      ? { x: p.x - SLOT_W - extra, y: p.y - SLOT_H - extra, width: 2 * (SLOT_W + extra), height: 2 * (SLOT_H + extra) }
      : { x: p.x - SLOT_H - extra, y: p.y - SLOT_W - extra, width: 2 * (SLOT_H + extra), height: 2 * (SLOT_W + extra) };
  }

  function ritaGap(p) {
    var r = gapRekt(p, 4);
    var g = el("g", {});
    g.appendChild(el("rect", { x: r.x, y: r.y, width: r.width, height: r.height, fill: PAPER }));
    /* två poler där sladden slutar */
    var a = p.riktning === "h" ? { x: p.x - SLOT_W, y: p.y } : { x: p.x, y: p.y - SLOT_W };
    var b = p.riktning === "h" ? { x: p.x + SLOT_W, y: p.y } : { x: p.x, y: p.y + SLOT_W };
    [a, b].forEach(function (q) {
      g.appendChild(el("circle", { cx: q.x, cy: q.y, r: 12, fill: WIRE }));
      g.appendChild(el("circle", { cx: q.x, cy: q.y, r: 4, fill: "#e9e0d0" }));
    });
    return g;
  }

  /* Ritar en del. x,y = platsens mitt. */
  function ritaDel(typ, x, y, vald) {
    var g = el("g", { transform: "translate(" + x + " " + y + ")" });
    if (typ === "batteri") {
      g.appendChild(el("rect", { x: -78, y: -30, width: 156, height: 60, rx: 12, fill: "#3f4a56" }));
      g.appendChild(el("rect", { x: -66, y: -19, width: 96, height: 38, rx: 6, fill: "#e8a33d" }));
      g.appendChild(el("rect", { x: 40, y: -19, width: 26, height: 38, rx: 6, fill: "#2b3138" }));
      g.appendChild(el("text", { x: -18, y: 8, "text-anchor": "middle", "font-size": 30, "font-weight": 700, fill: "#2b3138" }, [document.createTextNode("1,5 V")]));
      g.appendChild(el("text", { x: 53, y: 10, "text-anchor": "middle", "font-size": 26, "font-weight": 700, fill: "#fff" }, [document.createTextNode("−")]));
      g.appendChild(el("rect", { x: -8, y: -42, width: 16, height: 12, rx: 3, fill: "#9aa3ad" }));
    } else if (typ === "lampa") {
      var lyser = vald === true;
      if (lyser) g.appendChild(el("circle", { cx: 0, cy: -18, r: 78, fill: "#ffe9a8", opacity: .85, class: "glow" }));
      g.appendChild(el("circle", { cx: 0, cy: -18, r: 40, fill: lyser ? "#ffd75e" : "#efe6d4", stroke: "#b9a077", "stroke-width": 3 }));
      g.appendChild(el("path", { d: "M -14 -8 L -6 -26 L 2 -8 L 10 -26", fill: "none", stroke: lyser ? "#a8641c" : "#a89a80", "stroke-width": 4, "stroke-linejoin": "round" }));
      g.appendChild(el("rect", { x: -18, y: 18, width: 36, height: 26, rx: 5, fill: "#9aa3ad" }));
      g.appendChild(el("rect", { x: -24, y: 36, width: 48, height: 10, rx: 4, fill: "#7e8791" }));
    } else if (typ === "brytare") {
      var sluten = vald === true;
      g.appendChild(el("rect", { x: -76, y: 8, width: 152, height: 26, rx: 8, fill: "#6b5b47" }));
      g.appendChild(el("circle", { cx: -52, cy: 2, r: 9, fill: "#3f4a56" }));
      g.appendChild(el("circle", { cx: 52, cy: 2, r: 9, fill: "#3f4a56" }));
      g.appendChild(el("line", {
        x1: -52, y1: 0, x2: sluten ? 52 : 26, y2: sluten ? 2 : -46,
        stroke: "#3f4a56", "stroke-width": 9, "stroke-linecap": "round"
      }));
    } else if (typ === "koppar") {
      g.appendChild(el("rect", { x: -74, y: -14, width: 148, height: 28, rx: 14, fill: KOPPAR }));
      g.appendChild(el("rect", { x: -74, y: -14, width: 148, height: 9, rx: 5, fill: "#d98f57", opacity: .8 }));
      g.appendChild(el("circle", { cx: -66, cy: 0, r: 5, fill: "#8d4d24" }));
      g.appendChild(el("circle", { cx: 66, cy: 0, r: 5, fill: "#8d4d24" }));
    } else if (typ === "gummi") {
      g.appendChild(el("rect", { x: -76, y: -18, width: 152, height: 36, rx: 18, fill: "#4c4f57" }));
      for (var i = -3; i <= 3; i++) {
        g.appendChild(el("rect", { x: i * 20 - 3, y: -18, width: 6, height: 8, rx: 3, fill: "#6d727c" }));
      }
    }
    if (vald === "spok") g.setAttribute("opacity", "0.45");
    return g;
  }

  /* Kotten: en liten kotte med stora ögon. Fem uttryck. */
  function ritaKotten(uttryck, x, y, s) {
    s = s || 1;
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    var armUpp = uttryck === "hejar" || uttryck === "firar";
    var glad = uttryck === "firar" || uttryck === "hejar" || uttryck === "glad";
    /* kropp */
    g.appendChild(el("ellipse", { cx: 0, cy: 6, rx: 34, ry: 40, fill: "#b07d4b" }));
    for (var i = 0; i < 5; i++) {
      var yy = -26 + i * 13;
      g.appendChild(el("path", {
        d: "M -30 " + yy + " Q 0 " + (yy - 12) + " 30 " + yy,
        fill: "none", stroke: "#96673b", "stroke-width": 5, "stroke-linecap": "round"
      }));
    }
    /* armar */
    g.appendChild(el("line", { x1: -30, y1: 8, x2: armUpp ? -44 : -38, y2: armUpp ? -22 : 26, stroke: "#b07d4b", "stroke-width": 9, "stroke-linecap": "round" }));
    g.appendChild(el("line", { x1: 30, y1: 8, x2: armUpp ? 44 : 38, y2: armUpp ? -22 : 26, stroke: "#b07d4b", "stroke-width": 9, "stroke-linecap": "round" }));
    /* ögon */
    var e = uttryck === "funderar" ? 4 : 9;
    g.appendChild(el("circle", { cx: -12, cy: -4, r: e + 5, fill: "#fff" }));
    g.appendChild(el("circle", { cx: 12, cy: -4, r: e + 5, fill: "#fff" }));
    g.appendChild(el("circle", { cx: -11, cy: -3, r: e - 3, fill: "#14181f" }));
    g.appendChild(el("circle", { cx: 13, cy: -3, r: e - 3, fill: "#14181f" }));
    g.appendChild(el("circle", { cx: -9, cy: -6, r: 2.4, fill: "#fff" }));
    g.appendChild(el("circle", { cx: 15, cy: -6, r: 2.4, fill: "#fff" }));
    /* mun */
    if (uttryck === "funderar") {
      g.appendChild(el("ellipse", { cx: 0, cy: 18, rx: 5, ry: 6, fill: "#7a4f2a" }));
    } else if (glad) {
      g.appendChild(el("path", { d: "M -11 14 Q 0 26 11 14", fill: "none", stroke: "#7a4f2a", "stroke-width": 4, "stroke-linecap": "round" }));
    } else if (uttryck === "nyfiken") {
      g.appendChild(el("ellipse", { cx: 0, cy: 18, rx: 7, ry: 8, fill: "#7a4f2a" }));
    } else {
      g.appendChild(el("path", { d: "M -9 17 Q 0 22 9 17", fill: "none", stroke: "#7a4f2a", "stroke-width": 4, "stroke-linecap": "round" }));
    }
    if (uttryck === "firar") {
      g.appendChild(el("circle", { cx: -34, cy: -34, r: 5, fill: "#e8a33d" }));
      g.appendChild(el("circle", { cx: 0, cy: -48, r: 4, fill: "#c4452f" }));
      g.appendChild(el("circle", { cx: 34, cy: -30, r: 5, fill: "#2f7d5a" }));
    }
    if (uttryck === "nyfiken") {
      g.appendChild(el("circle", { cx: 40, cy: -30, r: 13, fill: "#fff", stroke: "#c9c0ae", "stroke-width": 3 }));
      g.appendChild(txt("?", { x: 40, y: -22, "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: "#5d6470" }));
    }
    return g;
  }

  /* Del 2 slut. *//* ================================================================ *
   * 3. SPELET – tillstånd, tavla, tryck, ljud och tal                 *
   * ================================================================ */

  var S = { niva: 1, plac: tomPlacering(), oppen: {}, valt: null, klar: false,
            stjarnor: 0, startad: false, ljud: true, lage: "start" };

  var $ = function (id) { return document.getElementById(id); };
  var lagerWire, lagerPlats, lagerDel, lagerKotten, tavla;

  /* Stående telefon: brädan är smal och hög, då används den höga slingan. */
  function arSmal() {
    var b = $("brada");
    if (!b) return false;
    var r = b.getBoundingClientRect();
    return r.width < 620 && r.height > r.width * 1.1;
  }

  /* ---------- ljud ---------- */
  var AC = null;
  function klang(frekvens, langd, typ) {
    if (!S.ljud) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = typ || "sine";
      o.frequency.value = frekvens;
      g.gain.value = 0.06;
      o.connect(g); g.connect(AC.destination);
      var t = AC.currentTime;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + (langd || 0.16));
      o.start(t); o.stop(t + (langd || 0.16) + 0.02);
    } catch (e) { /* ljud är aldrig ett krav */ }
  }
  function ljudSatt() { klang(660, 0.12, "triangle"); }
  function ljudFel() { klang(210, 0.22, "sine"); }
  function ljudTand() { klang(523, 0.14, "triangle"); setTimeout(function () { klang(784, 0.2, "triangle"); }, 130); }

  /* ---------- tal ---------- */
  var roster = null;
  function tala(text) {
          try { if (window.__rost && window.__rost(text, true)) return; } catch (e) { }
    if (!S.ljud || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "sv-SE"; u.rate = 0.95; u.pitch = 1.02;
      if (roster) u.voice = roster;
      window.speechSynthesis.speak(u);
    } catch (e) { /* talsyntes är aldrig ett krav */ }
  }
  function valjRoster() {
    if (!("speechSynthesis" in window)) return;
    try {
      var alla = window.speechSynthesis.getVoices() || [];
      for (var i = 0; i < alla.length; i++) if (/sv[-_]SE/i.test(alla[i].lang)) { roster = alla[i]; break; }
    } catch (e) {}
  }
  if ("speechSynthesis" in window) {
    valjRoster();
    window.speechSynthesis.onvoiceschanged = valjRoster;
  }

  function kottensEvent(namn, varde) {
    try {
      if (window.skolappar && typeof window.skolappar.event === "function") {
        window.skolappar.event(namn, varde);
      }
    } catch (e) {}
  }

  /* ---------- HUD ---------- */
  function ritaHud() {
    var prickar = $("nivaPrickar");
    prickar.innerHTML = "";
    for (var i = 1; i <= NIVAA.length; i++) {
      var p = document.createElement("i");
      if (i < S.niva) p.className = "klar";
      else if (i === S.niva) p.className = "nu";
      prickar.appendChild(p);
    }
    $("nivaText").textContent = "Nivå " + S.niva + " av " + NIVAA.length;
    var st = "";
    for (var j = 0; j < NIVAA.length; j++) st += j < S.stjarnor ? "★" : "☆";
    $("stjarnor").textContent = st;
    $("stjarnor").setAttribute("aria-label", S.stjarnor + " av " + NIVAA.length + " stjärnor");
    $("mal").textContent = nivaData(S.niva).mal;
  }

  /* ---------- tavlan ---------- */
  function ritaTavla() {
    var p = nivaData(S.niva), i, id, plats, d;
    var svar = utvardera(S.plac, S.oppen, S.niva);
    var smal = arSmal();
    var loop = smal ? LOOP_P : LOOP;
    var geo = smal ? plasterForP : plasterFor;
    S.smal = smal;
    tavla.setAttribute("viewBox", smal ? "250 40 500 620" : "0 0 1000 620");

    [lagerWire, lagerPlats, lagerDel, lagerKotten].forEach(function (l) { l.innerHTML = ""; });

    lagerWire.appendChild(ritaSladd(loop));
    for (i = 0; i < p.platser.length; i++) {
      lagerWire.appendChild(ritaGap(geo(p.platser[i])));
    }

    for (i = 0; i < p.platser.length; i++) {
      id = p.platser[i];
      plats = geo(id);
      d = S.plac[id];

      var g = el("g", {});
      var rr = gapRekt(plats, 6);
      g.appendChild(el("rect", {
        class: "plats-ring" + (!d && !S.klar ? " mal-puls" : "") + (svar.typ !== "sluten" && svar.plats === id ? " fel" : ""),
        x: rr.x, y: rr.y, width: rr.width, height: rr.height, rx: 20
      }));
      var hit = el("rect", {
        class: "plats-hit", x: rr.x, y: rr.y, width: rr.width, height: rr.height, rx: 20,
        "data-plats": id, role: "button", tabindex: "0"
      });
      hit.setAttribute("aria-label", d ? DELAR[d].namn + " på platsen" : "tom plats i kretsen");
      g.appendChild(hit);
      lagerPlats.appendChild(g);

      if (d) {
        var vald = d === "lampa" ? !!svar.lys : (d === "brytare" ? !S.oppen[id] : true);
        lagerDel.appendChild(ritaDel(d, plats.x, plats.y, vald));
        if (d === "brytare") {
          var lbl = el("text", { x: plats.x, y: plats.y + (plats.riktning === "h" ? 86 : 0) + (plats.riktning === "v" ? 72 : 0),
            "text-anchor": "middle", "font-size": 22, "font-weight": 600, fill: "#5d6470" });
          lbl.textContent = S.oppen[id] ? "öppen – tryck" : "sluten";
          lagerDel.appendChild(lbl);
        }
      }
    }

    var uttryck = svar.lys ? "firar" : (svar.typ === "gap" ? "nyfiken" : "funderar");
    if (smal) {
      lagerKotten.appendChild(ritaKotten(uttryck, 500, 590, 0.9));
    } else {
      lagerKotten.appendChild(ritaKotten(uttryck, 860, 545, 0.95));
      if (S.valt) lagerKotten.appendChild(ritaKotten("hejar", 80, 560, 0.7));
    }

    $("hjalp").textContent = svar.lys
      ? "Kretsen är sluten – strömmen går hela vägen runt."
      : (S.startad ? svar.text : "Tryck på en del i brickan, sedan på en plats i kretsen.");
  }

  /* ---------- brickan ---------- */
  function ritaBricka() {
    var p = nivaData(S.niva), b = $("bricka"), i;
    b.innerHTML = "";
    for (i = 0; i < p.bricka.length; i++) {
      (function (typ) {
        var kn = document.createElement("button");
        kn.className = "del-knapp" + (S.valt === typ ? " aktiv" : "");
        kn.setAttribute("aria-pressed", S.valt === typ ? "true" : "false");
        kn.setAttribute("aria-label", DELAR[typ].namn);
        var sv = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        sv.setAttribute("viewBox", "-92 -56 184 112");
        sv.setAttribute("aria-hidden", "true");
        sv.appendChild(ritaDel(typ, 0, 0, typ === "lampa" ? false : (typ === "brytare" ? true : true)));
        kn.appendChild(sv);
        var sp = document.createElement("span");
        sp.textContent = DELAR[typ].namn;
        kn.appendChild(sp);
        kn.addEventListener("click", function () { valjDel(typ); });
        b.appendChild(kn);
      })(p.bricka[i]);
    }
  }

  function valjDel(typ) {
    if (S.klar) return;
    S.valt = S.valt === typ ? null : typ;
    ljudSatt();
    ritaBricka();
    ritaTavla();
    $("hjalp").textContent = S.valt
      ? "Tryck på platsen i kretsen där " + DELAR[S.valt].namn + "en ska sitta."
      : "Tryck på en del i brickan, sedan på en plats i kretsen.";
    if (S.valt) tala("Tryck på platsen där " + DELAR[S.valt].namn + "en ska sitta.");
  }

  /* ---------- tryck på en plats ---------- */
  function tryckPlats(id) {
    if (S.klar || S.lage !== "spel") return;
    var p = nivaData(S.niva);
    if (p.platser.indexOf(id) < 0) return;
    var har = S.plac[id];

    if (!S.valt) {
      if (har === "brytare") {
        S.oppen[id] = !S.oppen[id];
        ljudSatt();
        ritaTavla();
        var svar = utvardera(S.plac, S.oppen, S.niva);
        if (!S.oppen[id] && svar.lys) { klartNiva(); }
        else { tala(S.oppen[id] ? "Strömbrytaren är öppen. Kretsen är bruten." : "Strömbrytaren är sluten."); }
        return;
      }
      if (har) {
        S.plac[id] = null;
        ljudSatt();
        ritaTavla();
        $("hjalp").textContent = "Platsen är tom igen. Välj en del i brickan.";
        return;
      }
      $("hjalp").textContent = "Välj först en del i brickan nedanför.";
      tala("Välj först en del i brickan.");
      return;
    }

    S.plac[id] = S.valt;
    if (S.valt === "brytare") S.oppen[id] = true;
    S.valt = null;
    S.startad = true;
    kottensEvent("hint");
    ritaBricka();
    ritaTavla();

    var ut = utvardera(S.plac, S.oppen, S.niva);
    if (ut.lys) { klartNiva(); }
    else {
      ljudFel();
      $("hjalp").textContent = ut.text;
      tala(ut.text);
    }
  }

  /* ---------- nivå klar ---------- */
  function klartNiva() {
    if (S.klar) return;
    S.klar = true;
    S.lage = "ruta";
    S.stjarnor++;
    ljudTand();
    ritaHud();
    ritaTavla();
    kottensEvent("level", S.niva);
    tala("Kretsen är sluten. Strömmen går hela vägen runt och lampan lyser.");

    setTimeout(function () {
      var sista = S.niva >= NIVAA.length;
      $("rutaKotten").innerHTML = "";
      $("rutaKotten").appendChild(ritaKotten("firar", 100, 105, 1.35));
      $("rutaTitel").textContent = sista ? "Alla tavlor klara!" : "Kretsen är sluten!";
      $("rutaText").textContent = sista
        ? "Du har tänt lampan på alla fyra tavlorna och fått " + S.stjarnor + " av " + NIVAA.length + " stjärnor."
        : nivaData(S.niva).forklaring;
      $("rutaKnapp").textContent = sista ? "Spela igen" : "Nästa nivå";
      $("ruta").hidden = false;
      $("rutaKnapp").focus();
      kottensEvent("round_done", Math.round(100 * S.stjarnor / NIVAA.length));
    }, 1100);
  }

  /* ---------- start och omstart ---------- */
  function startaNiva(n) {
    S.niva = Math.max(1, Math.min(NIVAA.length, n || 1));
    S.plac = tomPlacering();
    S.oppen = {};
    S.valt = null;
    S.klar = false;
    S.lage = "spel";
    S.startad = false;
    $("ruta").hidden = true;
    ritaHud();
    ritaBricka();
    ritaTavla();
    setTimeout(function () { tala(nivaData(S.niva).mal); }, 260);
  }

  function koppla() {
    tavla = $("tavla");
    lagerWire = $("lager-wire");
    lagerPlats = $("lager-plats");
    lagerDel = $("lager-del");
    lagerKotten = $("lager-kotten");

    tavla.addEventListener("click", function (ev) {
      var t = ev.target;
      while (t && t !== tavla) {
        if (t.getAttribute && t.getAttribute("data-plats")) { tryckPlats(t.getAttribute("data-plats")); return; }
        t = t.parentNode;
      }
    });
    tavla.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var t = ev.target;
      if (t && t.getAttribute && t.getAttribute("data-plats")) {
        ev.preventDefault(); tryckPlats(t.getAttribute("data-plats"));
      }
    });

    $("spela").addEventListener("click", function () {
      $("startskarm").hidden = true;
      $("spelet").hidden = false;
      document.body.classList.add("spelar");
      kottensEvent("round_start");
      startaNiva(1);
    });

    $("rutaKnapp").addEventListener("click", function () {
      var sista = S.niva >= NIVAA.length;
      if (sista) { S.stjarnor = 0; kottensEvent("round_start"); startaNiva(1); }
      else startaNiva(S.niva + 1);
    });

    $("upprepa").addEventListener("click", function () {
      tala(nivaData(S.niva).mal);
      $("hjalp").textContent = nivaData(S.niva).mal;
    });

    $("ljud").addEventListener("click", function () {
      S.ljud = !S.ljud;
      this.setAttribute("aria-pressed", S.ljud ? "false" : "true");
      this.setAttribute("aria-label", S.ljud ? "Stäng av ljud" : "Sätt på ljud");
      if (!S.ljud) {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        kottensEvent("sound_off");
      } else klang(660, 0.1);
    });

    window.addEventListener("resize", function () { if (S.lage !== "start") ritaTavla(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", koppla);
  else koppla();

  /* Utvecklingshandtag: låter ett testprogram spela utan att spela. */
  window.__game = {
    S: S, NIVAA: NIVAA, PLATSER: PLATSER, DELAR: DELAR, LOOP: LOOP,
    startaNiva: startaNiva, tryckPlats: tryckPlats, valjDel: valjDel,
    utvardera: utvardera, tomPlacering: tomPlacering, ritaTavla: ritaTavla
  };
})();