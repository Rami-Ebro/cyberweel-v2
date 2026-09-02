import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const PASSWORD = "CwMobileE2E!2026-Safe";
const ARTIFACT_DIR = path.resolve("artifacts/mobile-e2e");
const widths = [320, 375, 390, 430];
const roles = [
  { key: "owner", email: "e2e-owner@cyberweel.test", expected: /\/admin\/partners/ },
  { key: "client", email: "e2e-client@cyberweel.test", expected: /\/client\/dashboard/ },
  { key: "partner", email: "e2e-partner@cyberweel.test", expected: /\/partner\/dashboard/ },
  { key: "ambassador", email: "e2e-ambassador@cyberweel.test", expected: /\/ambassador\/dashboard/ },
];

await fs.mkdir(ARTIFACT_DIR, { recursive: true });

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyOverflow: document.body.style.overflow,
  }));
}

function assertNoRootOverflow(metrics, label) {
  const widest = Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth);
  requireCondition(
    widest <= metrics.innerWidth + 2,
    `${label}: root horizontal overflow (${widest}px > ${metrics.innerWidth}px)`,
  );
}

async function localizedScrollInfo(locator, label) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  const info = await locator.evaluate((element) => ({
    tabIndex: element.tabIndex,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  requireCondition(info.tabIndex === 0, `${label}: scroll region is not keyboard focusable`);
  requireCondition(info.scrollWidth > info.clientWidth + 10, `${label}: expected localized horizontal scroll is absent`);
  return info;
}

async function login(page, role) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator('input[name="identifier"]').fill(role.email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('form button[aria-busy]').click();
  await page.waitForURL(role.expected, { timeout: 20_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(700);
  const bodyText = await page.locator("body").innerText();
  requireCondition(!/تعذر تحميل/.test(bodyText), `${role.key}: dashboard reported a load failure`);
  requireCondition(!/Application error|Internal Server Error/i.test(bodyText), `${role.key}: fatal application error visible`);
}

async function checkAdmin(page, width) {
  const sidebar = page.locator('main[data-admin-shell-root="true"] aside').first();
  await sidebar.waitFor({ state: "attached" });
  requireCondition((await sidebar.getAttribute("aria-hidden")) === "true", `owner-${width}: closed sidebar missing aria-hidden`);
  requireCondition(await sidebar.evaluate((element) => element.inert === true), `owner-${width}: closed sidebar is not inert`);

  const menu = page.getByRole("button", { name: "فتح قائمة الإدارة" });
  await menu.click();
  await page.waitForTimeout(150);
  requireCondition((await menu.getAttribute("aria-expanded")) === "true", `owner-${width}: menu trigger not expanded`);
  requireCondition(await sidebar.evaluate((element) => element.inert === false), `owner-${width}: open sidebar remains inert`);
  requireCondition((await page.evaluate(() => document.body.style.overflow)) === "hidden", `owner-${width}: body scroll not locked`);
  assertNoRootOverflow(await pageMetrics(page), `owner-${width}-menu-open`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `owner-${width}-menu.png`), fullPage: true });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  requireCondition((await menu.getAttribute("aria-expanded")) === "false", `owner-${width}: Escape did not close menu`);
  requireCondition(await sidebar.evaluate((element) => element.inert === true), `owner-${width}: closed sidebar did not become inert`);
  requireCondition((await page.evaluate(() => document.body.style.overflow)) !== "hidden", `owner-${width}: body scroll lock was not restored`);
}

async function checkClient(page, width) {
  const trigger = page.locator('[aria-controls="client-notifications-popover"]');
  await trigger.waitFor({ state: "visible" });
  requireCondition((await trigger.getAttribute("aria-haspopup")) === "dialog", `client-${width}: notification trigger semantics mismatch`);
  await trigger.click();
  const dialog = page.locator('#client-notifications-popover[role="dialog"]');
  await dialog.waitFor({ state: "visible" });
  requireCondition((await trigger.getAttribute("aria-expanded")) === "true", `client-${width}: notification trigger not expanded`);
  assertNoRootOverflow(await pageMetrics(page), `client-${width}-notifications-open`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `client-${width}-notifications.png`), fullPage: true });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });

  await page.locator("aside button").filter({ hasText: "الفواتير" }).first().click();
  const invoiceRegion = page.locator('[role="region"][aria-label="جدول فواتير العميل"]');
  const scroll = await localizedScrollInfo(invoiceRegion, `client-${width}-invoice-table`);
  assertNoRootOverflow(await pageMetrics(page), `client-${width}-invoices`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `client-${width}-invoices.png`), fullPage: true });
  return { invoiceScroll: scroll };
}

async function openMobileDrawer(page, width, id, roleKey) {
  const sidebar = page.locator(`#${id}`);
  const trigger = page.locator(`[aria-controls="${id}"]`);
  await trigger.waitFor({ state: "visible" });
  requireCondition((await sidebar.getAttribute("aria-hidden")) === "true", `${roleKey}-${width}: closed drawer missing aria-hidden`);
  requireCondition(await sidebar.evaluate((element) => element.inert === true), `${roleKey}-${width}: closed drawer is not inert`);
  requireCondition((await trigger.getAttribute("aria-expanded")) === "false", `${roleKey}-${width}: closed trigger is unexpectedly expanded`);

  await trigger.click();
  await page.waitForTimeout(150);
  requireCondition((await trigger.getAttribute("aria-expanded")) === "true", `${roleKey}-${width}: trigger did not expand`);
  requireCondition(await sidebar.evaluate((element) => element.inert === false), `${roleKey}-${width}: open drawer remains inert`);
  requireCondition((await page.evaluate(() => document.body.style.overflow)) === "hidden", `${roleKey}-${width}: body scroll not locked`);
  const logout = sidebar.getByRole("button", { name: "تسجيل الخروج" });
  requireCondition(await logout.isVisible(), `${roleKey}-${width}: mobile logout is not visible in drawer`);
  assertNoRootOverflow(await pageMetrics(page), `${roleKey}-${width}-drawer-open`);
  return { sidebar, trigger };
}

async function closeDrawerWithEscape(page, width, sidebar, trigger, roleKey) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  requireCondition((await trigger.getAttribute("aria-expanded")) === "false", `${roleKey}-${width}: Escape did not close drawer`);
  requireCondition(await sidebar.evaluate((element) => element.inert === true), `${roleKey}-${width}: closed drawer did not become inert`);
  requireCondition((await page.evaluate(() => document.body.style.overflow)) !== "hidden", `${roleKey}-${width}: body scroll lock was not restored`);
}

async function checkPartner(page, width) {
  let drawer = await openMobileDrawer(page, width, "partner-dashboard-menu", "partner");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `partner-${width}-menu.png`), fullPage: true });
  await closeDrawerWithEscape(page, width, drawer.sidebar, drawer.trigger, "partner");

  drawer = await openMobileDrawer(page, width, "partner-dashboard-menu", "partner");
  await drawer.sidebar.getByRole("button", { name: "مستحقات المشاريع" }).click();
  const duesRegion = page.locator('[role="region"][aria-label="جدول مستحقات المشاريع"]');
  const scroll = await localizedScrollInfo(duesRegion, `partner-${width}-dues-table`);
  assertNoRootOverflow(await pageMetrics(page), `partner-${width}-dues`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `partner-${width}-dues.png`), fullPage: true });
  return { duesScroll: scroll };
}

async function checkAmbassador(page, width) {
  let drawer = await openMobileDrawer(page, width, "ambassador-dashboard-menu", "ambassador");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `ambassador-${width}-menu.png`), fullPage: true });
  await closeDrawerWithEscape(page, width, drawer.sidebar, drawer.trigger, "ambassador");

  drawer = await openMobileDrawer(page, width, "ambassador-dashboard-menu", "ambassador");
  await drawer.sidebar.getByRole("button", { name: "إحالاتي" }).click();
  const referralsRegion = page.locator('[role="region"][aria-label="جدول إحالات السفير"]');
  const referralScroll = await localizedScrollInfo(referralsRegion, `ambassador-${width}-referrals-table`);
  assertNoRootOverflow(await pageMetrics(page), `ambassador-${width}-referrals`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `ambassador-${width}-referrals.png`), fullPage: true });

  drawer = await openMobileDrawer(page, width, "ambassador-dashboard-menu", "ambassador");
  await drawer.sidebar.getByRole("button", { name: "مكافآتي" }).click();
  const rewardsRegion = page.locator('[role="region"][aria-label="جدول مكافآت السفير"]');
  const rewardScroll = await localizedScrollInfo(rewardsRegion, `ambassador-${width}-rewards-table`);
  assertNoRootOverflow(await pageMetrics(page), `ambassador-${width}-rewards`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `ambassador-${width}-rewards.png`), fullPage: true });
  return { referralScroll, rewardScroll };
}

const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const width of widths) {
    for (const role of roles) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const row = { role: role.key, width, status: "PASS", metrics: null, checks: {}, consoleErrors, pageErrors };
      try {
        await login(page, role);
        const metrics = await pageMetrics(page);
        row.metrics = metrics;
        assertNoRootOverflow(metrics, `${role.key}-${width}-overview`);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `${role.key}-${width}-overview.png`), fullPage: true });

        if (role.key === "owner") await checkAdmin(page, width);
        if (role.key === "client") row.checks = await checkClient(page, width);
        if (role.key === "partner") row.checks = await checkPartner(page, width);
        if (role.key === "ambassador") row.checks = await checkAmbassador(page, width);

        requireCondition(pageErrors.length === 0, `${role.key}-${width}: page errors: ${pageErrors.join(" | ")}`);
        const relevantConsoleErrors = consoleErrors.filter((value) => !/favicon|Failed to load resource.*404/i.test(value));
        requireCondition(relevantConsoleErrors.length === 0, `${role.key}-${width}: console errors: ${relevantConsoleErrors.join(" | ")}`);
      } catch (error) {
        row.status = "FAIL";
        row.error = error instanceof Error ? error.message : String(error);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `${role.key}-${width}-FAIL.png`), fullPage: true }).catch(() => {});
      } finally {
        report.push(row);
        await context.close();
      }
    }
  }

  for (const role of roles) {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
      const blocked = () => { throw new DOMException("localStorage blocked for E2E", "SecurityError"); };
      Storage.prototype.getItem = blocked;
      Storage.prototype.setItem = blocked;
      Storage.prototype.removeItem = blocked;
    });
    const page = await context.newPage();
    const row = { role: role.key, width: 320, storageBlocked: true, status: "PASS" };
    try {
      await login(page, role);
      assertNoRootOverflow(await pageMetrics(page), `${role.key}-320-storage-blocked`);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${role.key}-320-storage-blocked.png`), fullPage: true });
    } catch (error) {
      row.status = "FAIL";
      row.error = error instanceof Error ? error.message : String(error);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${role.key}-320-storage-blocked-FAIL.png`), fullPage: true }).catch(() => {});
    } finally {
      report.push(row);
      await context.close();
    }
  }
} finally {
  await browser.close();
  await fs.writeFile(path.join(ARTIFACT_DIR, "report.json"), JSON.stringify(report, null, 2));
  const lines = [
    "# Group 11 Mobile E2E",
    "",
    `Base URL: ${BASE_URL}`,
    "",
    "| Role | Width | Storage blocked | Status | Error |",
    "| --- | ---: | :---: | :---: | --- |",
    ...report.map((row) => `| ${row.role} | ${row.width} | ${row.storageBlocked ? "yes" : "no"} | ${row.status} | ${(row.error || "").replaceAll("|", "\\|")} |`),
  ];
  await fs.writeFile(path.join(ARTIFACT_DIR, "report.md"), lines.join("\n"));
}

const failures = report.filter((row) => row.status !== "PASS");
console.log(JSON.stringify({ total: report.length, passed: report.length - failures.length, failed: failures.length, failures }, null, 2));
if (failures.length) process.exit(1);
