import { chromium } from "playwright";
import fs from "node:fs";

const REF = "htmsgnnqnmaqxuzlcsld";
const SUPA = `https://${REF}.supabase.co`;
const APP = process.env.APP_URL || "https://inksight-omega.vercel.app";
const EMAIL = process.env.TEST_EMAIL || "inksight.audit@example.com";
const SR = process.env.SR;
const ANON = process.env.ANON;
const MODE = process.env.MODE || "discover";

async function getSession() {
  const gl = await fetch(`${SUPA}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email: EMAIL }),
  });
  const glj = await gl.json();
  const v = await fetch(`${SUPA}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: glj.hashed_token }),
  });
  const session = await v.json();
  if (!session.access_token) throw new Error("no session: " + JSON.stringify(session).slice(0, 300));
  return session;
}

const session = await getSession();
const storageKey = `sb-${REF}-auth-token`;
const storageVal = JSON.stringify(session);

const OUT = "audit/shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });

async function newCtx(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1.5, ignoreHTTPSErrors: true });
  await ctx.addInitScript(
    ([k, v]) => {
      try { localStorage.setItem(k, v); } catch (e) {}
    },
    [storageKey, storageVal]
  );
  return ctx;
}

async function settle(page, ms = 2600) {
  await page.waitForTimeout(ms);
}

async function tryClick(page, sel, ms = 1500) {
  try {
    const loc = page.locator(sel).filter({ hasNot: page.locator("[hidden]") }).first();
    await loc.click({ timeout: ms });
    return true;
  } catch (e) {
    try { await page.locator(sel).first().click({ timeout: ms }); return true; } catch (e2) { return false; }
  }
}
async function paintAll(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += 500;
        if (y < document.body.scrollHeight) setTimeout(step, 50);
        else { window.scrollTo(0, 0); setTimeout(res, 350); }
      };
      step();
    });
  });
  await page.waitForTimeout(250);
}
async function shot(page, name) {
  await paintAll(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot", name);
}

async function captureFlow(label, width, height) {
  const ctx = await newCtx(width, height);
  const page = await ctx.newPage();
  await page.goto(APP, { waitUntil: "networkidle" });
  await settle(page, 3500);
  await shot(page, `${label}-01-analysis`);

  // Go to Stats & historique
  await tryClick(page, '.app-nav [data-app-view="performances"]', 2500);
  await tryClick(page, '[data-app-view="performances"]:visible', 2500);
  await settle(page, 3000);
  await tryClick(page, '[data-performance-view="stats"]', 1500);
  await settle(page, 2500);
  await shot(page, `${label}-02-stats-overview-unscoped`);

  // Open filters (collapsed by default), select a bicolor to unlock deck-scoped panels
  await tryClick(page, '[data-filter-toggle="performance"]', 1500);
  await settle(page, 800);
  await tryClick(page, '#performanceColorPills .filter-pill:not([data-value="all"])', 1500);
  await settle(page, 3000);
  await shot(page, `${label}-03-stats-overview-scoped`);

  for (const tab of ["cards", "mulligan", "matchups", "curves", "data"]) {
    const ok = await tryClick(page, `[data-performance-detail="${tab}"]`, 1500);
    await settle(page, 2200);
    if (ok) await shot(page, `${label}-04-stats-${tab}`);
  }

  // History sub-view
  await tryClick(page, '[data-performance-view="history"]', 1500);
  await settle(page, 2600);
  await shot(page, `${label}-05-history`);

  // Account
  await tryClick(page, '[data-app-view="account"]:visible', 1500);
  await tryClick(page, '.app-nav [data-app-view="account"]', 1500);
  await settle(page, 2600);
  await shot(page, `${label}-06-account`);

  await ctx.close();
}

if (MODE === "capture") {
  await captureFlow("desktop", 1440, 900);
  await captureFlow("mobile", 390, 844);
}

async function findScroller(page) {
  return await page.evaluateHandle(() => {
    let el = document.scrollingElement || document.body;
    let best = el.scrollHeight - el.clientHeight;
    document.querySelectorAll("body *").forEach((e) => {
      const oy = getComputedStyle(e).overflowY;
      const d = e.scrollHeight - e.clientHeight;
      if ((oy === "auto" || oy === "scroll") && d > best) { best = d; el = e; }
    });
    return el;
  });
}
async function shotSlices(page, name) {
  const vh = page.viewportSize().height;
  const total = await page.evaluate(() => document.body.scrollHeight);
  let i = 0;
  for (let y = 0; y < total && i < 9; y += vh - 70) {
    await page.evaluate((yy) => document.body.scrollTo(0, yy), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}-s${String(i).padStart(2, "0")}.png` });
    i++;
  }
  await page.evaluate(() => document.body.scrollTo(0, 0));
  console.log("slices", name, i, "total", total);
}

if (MODE === "mslice") {
  const ctx = await newCtx(390, 844);
  const page = await ctx.newPage();
  await page.goto(APP, { waitUntil: "networkidle" });
  await settle(page, 3000);
  await tryClick(page, '[data-app-view="performances"]:visible', 2500);
  await settle(page, 2500);
  await tryClick(page, '[data-performance-view="stats"]', 1500);
  await tryClick(page, '[data-filter-toggle="performance"]', 1500);
  await settle(page, 800);
  await tryClick(page, '#performanceColorPills .filter-pill:not([data-value="all"])', 1500);
  await settle(page, 2500);
  await tryClick(page, '[data-filter-toggle="performance"]', 1200);
  await settle(page, 1500);
  await shotSlices(page, "m-overview");
  await tryClick(page, '[data-performance-detail="cards"]', 1500);
  await settle(page, 1800);
  await shotSlices(page, "m-cards");
  await tryClick(page, '[data-performance-detail="matchups"]', 1500);
  await settle(page, 1800);
  await shotSlices(page, "m-matchups");
  await tryClick(page, '[data-performance-view="history"]', 1500);
  await settle(page, 2000);
  await shotSlices(page, "m-history");
  await tryClick(page, '[data-app-view="account"]:visible', 1500);
  await settle(page, 2000);
  await shotSlices(page, "m-account");
  await ctx.close();
  await browser.close();
  console.log("DONE mode=mslice");
  process.exit(0);
}

if (MODE === "mdebug") {
  const ctx = await newCtx(390, 844);
  const page = await ctx.newPage();
  await page.goto(APP, { waitUntil: "networkidle" });
  await settle(page, 3000);
  await tryClick(page, '[data-app-view="performances"]:visible', 2500);
  await settle(page, 2500);
  await tryClick(page, '[data-performance-view="stats"]', 1500);
  await tryClick(page, '#performanceColorPills .filter-pill:not([data-value="all"])', 1500);
  await settle(page, 2500);
  const geo = await page.evaluate(() => {
    const g = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return { top: Math.round(r.top + scrollY), h: Math.round(r.height), disp: cs.display, vis: cs.visibility, pos: cs.position, mb: cs.marginBottom };
    };
    return {
      bodyH: document.body.scrollHeight,
      docH: document.documentElement.scrollHeight,
      viewPerf: g("#view-performances"),
      perfStats: g("#performance-stats"),
      filterBar: g(".performance-filter-bar"),
      detailTabs: g(".performance-detail-tabs"),
      overview: g("#perf-detail-overview"),
      kpis: g(".performance-kpis"),
      coach: g("#performanceDeckCoach"),
      miniGrid: g(".overview-mini-grid"),
      bottomNav: g(".app-nav, .mobile-nav, nav[class*='nav']"),
    };
  });
  const cands = await page.evaluate(() => {
    const out = [];
    const all = [document.documentElement, document.body, ...document.querySelectorAll("body *")];
    for (const e of all) {
      const d = e.scrollHeight - e.clientHeight;
      if (d > 200) {
        const cs = getComputedStyle(e);
        out.push({ tag: e.tagName, cls: (e.className || "").toString().slice(0, 40), oy: cs.overflowY, sh: e.scrollHeight, ch: e.clientHeight, h: cs.height });
      }
    }
    return out.slice(0, 15);
  });
  console.log(JSON.stringify(geo, null, 2));
  console.log("SCROLLERS:", JSON.stringify(cands, null, 2));
  await ctx.close();
  await browser.close();
  console.log("DONE mode=mdebug");
  process.exit(0);
}

if (MODE === "discover") {
  const ctx = await newCtx(1440, 900);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("PAGE-ERR:", m.text().slice(0, 160)); });
  await page.goto(APP, { waitUntil: "networkidle" });
  await settle(page, 3500);

  const info = await page.evaluate(() => {
    const txt = (e) => (e.textContent || "").trim().slice(0, 30);
    const grab = (sel, attr) => [...document.querySelectorAll(sel)].map((e) => ({ v: e.getAttribute(attr), t: txt(e), vis: !!(e.offsetParent || e.getClientRects().length) }));
    const visiblePanels = [...document.querySelectorAll("[data-app-panel]")].filter((e) => !e.hidden).map((e) => e.getAttribute("data-app-panel"));
    return {
      appViews: grab("[data-app-view]", "data-app-view"),
      perfViews: grab("[data-performance-view]", "data-performance-view"),
      perfDetail: grab("[data-performance-detail]", "data-performance-detail"),
      teamCtx: grab("[data-team-ctx]", "data-team-ctx"),
      visiblePanels,
      hasUser: !!localStorage.getItem("sb-" + "htmsgnnqnmaqxuzlcsld" + "-auth-token"),
      title: document.title,
      bodyStart: document.body.innerText.slice(0, 200),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: `${OUT}/00-discover-desktop.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
console.log("DONE mode=" + MODE);
