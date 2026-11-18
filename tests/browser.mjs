import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1512, height: 1100 },
  deviceScaleFactor: 1,
  extraHTTPHeaders: { "CF-Connecting-IP": "ui-" + Date.now() },
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8788");
await page.waitForSelector("text=Welcome back.");
await page.screenshot({
  path: "/downloads/sherkty-signin.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Explore a demo workspace" }).click();
await page.waitForSelector("text=A good day to move forward.");
await page.waitForTimeout(2000);
await page.screenshot({
  path: "/downloads/sherkty-overview.png",
  fullPage: true,
});
const modules = [
  ["People & HR", "hr"],
  ["Payroll", "payroll"],
  ["Recruitment", "recruitment"],
  ["Finance", "finance"],
  ["Projects", "projects"],
  ["Inventory & assets", "inventory"],
  ["Procurement", "procurement"],
  ["Customers & sales", "crm"],
  ["Documents", "documents"],
  ["Announcements", "communication"],
  ["Reports & analytics", "reports"],
  ["Administration", "admin"],
];
for (const [name, key] of modules) {
  await page
    .locator("aside nav")
    .getByRole("button", { name, exact: true })
    .click();
  await page.waitForTimeout(450);
  await page.screenshot({
    path: "/downloads/sherkty-" + key + ".png",
    fullPage: true,
  });
  assert.equal(
    await page.locator('[data-app-error="true"]').count(),
    0,
    key + " should have no errors",
  );
}
// Create and edit through the actual UI.
await page
  .locator("aside nav")
  .getByRole("button", { name: "People & HR", exact: true })
  .click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Add employee", exact: true }).click();
let dialog = page.getByRole("dialog");
await dialog
  .getByLabel("Name", { exact: false })
  .first()
  .fill("Browser QA Employee");
await dialog.getByLabel("Work email").fill("browser.qa@example.invalid");
await dialog.getByRole("button", { name: "Save record" }).click();
await page.waitForTimeout(700);
assert.equal(
  await page.getByText("Browser QA Employee", { exact: true }).count(),
  1,
);
await page.getByText("Browser QA Employee", { exact: true }).click();
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Edit", exact: true })
  .click();
dialog = page.getByRole("dialog").last();
await dialog
  .getByLabel("Name", { exact: false })
  .first()
  .fill("Browser QA Updated");
await dialog.getByRole("button", { name: "Save record" }).click();
await page.waitForTimeout(600);
assert.equal(
  await page.getByText("Browser QA Updated", { exact: true }).count(),
  1,
);
// CSV and Excel exports must download real, nonempty files.
await page.getByLabel("Export").click();
let download = page.waitForEvent("download");
await page.getByRole("button", { name: "Export CSV", exact: true }).click();
let file = await download;
await file.saveAs("/downloads/sherkty-employees.csv");
await page.getByLabel("Export").click();
await page.getByLabel("Export").click();
download = page.waitForEvent("download");
await page.getByRole("button", { name: "Export Excel", exact: true }).click();
file = await download;
await file.saveAs("/downloads/sherkty-employees.xlsx");
const popupReady = page.waitForEvent("popup");
await page.getByRole("button", { name: "Export PDF", exact: true }).click();
const printPage = await popupReady;
await printPage.waitForTimeout(1200);
assert.match(await printPage.locator("body").innerText(), /Browser QA Updated/);
await printPage.pdf({
  path: "/downloads/sherkty-employee-report.pdf",
  format: "A4",
  landscape: true,
  printBackground: true,
});
await printPage.screenshot({
  path: "/downloads/sherkty-report-print.png",
  fullPage: true,
});
await printPage.close();
// A fresh isolated demo keeps presentation captures free of QA-created records.
await page.request.post("http://localhost:8788/api/auth/demo", { data: {} });
await page.reload();
await page.waitForSelector("text=A good day to move forward.");
// Arabic layout, followed by narrow mobile layout.
await page.getByLabel("Switch language").click();
await page
  .locator("aside nav")
  .getByRole("button", { name: "نظرة عامة", exact: true })
  .click();
await page.waitForTimeout(700);
await page.screenshot({
  path: "/downloads/sherkty-arabic.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
  "No mobile overflow",
);
await page.screenshot({
  path: "/downloads/sherkty-mobile.png",
  fullPage: true,
});
await page.getByLabel("Menu", { exact: true }).click();
await page.waitForTimeout(250);
await page.screenshot({
  path: "/downloads/sherkty-mobile-menu.png",
  fullPage: true,
});
console.log("UI smoke tests passed. Runtime errors:", errors);
assert.deepEqual(errors, []);
await browser.close();
