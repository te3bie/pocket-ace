import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const nav = async (name) =>
  page.getByRole("link", { name, exact: true }).click();
await page.goto("http://127.0.0.1:8081");
await page.getByRole("button", { name: "Explore the fictional demo" }).click();
await page.getByRole("button", { name: "Edit Details", exact: false }).click();
await page.getByLabel("Balance (CAD)", { exact: true }).fill("14500.25");
await page.getByRole("button", { name: "Update balance" }).click();
await expect(page.getByText("$14,500.25", { exact: true })).toBeVisible();
await nav("Calendar");
await page.getByRole("button", { name: "+ Add a payment" }).click();
await page.getByLabel("Payment name").fill("Journey test books");
await page.getByLabel("Amount (CAD)", { exact: true }).fill("82.35");
await page.getByRole("button", { name: "Save expense" }).click();
await page.getByRole("button", { name: /^Journey test books/ }).click();
await page.getByLabel("Amount (CAD)", { exact: true }).fill("90.25");
await page.getByRole("button", { name: "Save expense" }).click();
await expect(
  page.getByRole("button", { name: /^Journey test books/ }),
).toContainText("$90.25");
await page
  .getByRole("button", { name: "Mark paid", exact: true })
  .first()
  .click();
await expect(
  page.getByRole("button", { name: "Undo paid" }).first(),
).toBeVisible();
await page.getByRole("button", { name: "Undo paid" }).first().click();
await page.getByRole("button", { name: /^Journey test books/ }).click();
await page.getByRole("button", { name: "Delete expense", exact: true }).click();
await page
  .getByRole("button", {
    name: "Confirm delete expense and its payment history",
  })
  .click();
await expect(
  page.getByRole("button", { name: /^Journey test books/ }),
).toHaveCount(0);
await nav("Discover");
await page.getByRole("button", { name: "Save +", exact: true }).first().click();
await page.getByRole("button", { name: "Saved", exact: true }).click();
await expect(
  page.getByText("Business & Economics", { exact: true }),
).toBeVisible();
await page.getByRole("button", { name: "View details" }).click();
await page.getByRole("button", { name: "Applied", exact: true }).click();
await page.getByRole("button", { name: "Close ×" }).click();
await nav("Profile");
await page.getByRole("button", { name: "Edit Profile", exact: true }).click();
await page.getByLabel("Name", { exact: true }).fill("Jamie Student");
await page.getByRole("button", { name: "Save profile" }).click();
await expect(page.getByText("Jamie Student", { exact: true })).toBeVisible();
await page.waitForTimeout(500);
await page.reload();
await expect(page.getByText("Jamie Student", { exact: true })).toBeVisible();
await page.getByRole("button", { name: "Talk to PocketPal" }).click();
await page
  .getByRole("button", { name: "How can I plan a semester budget?" })
  .click();
await expect(page.getByText(/Demo budget guide \(not live AI\)/)).toBeVisible();
await page.getByRole("button", { name: "Delete conversation history" }).click();
await expect(page.getByText(/Demo budget guide \(not live AI\)/)).toHaveCount(
  0,
);
await page.goto("http://127.0.0.1:8081/settings");
await page
  .getByLabel("Or paste CSV")
  .fill(
    "id,date,name,amount,category\ncsv-1,2026-11-03,Library printing,2.50,Education",
  );
await page.getByRole("button", { name: "Preview import" }).click();
await page.getByRole("button", { name: "Confirm import" }).click();
await expect(page.getByLabel("Category for Library printing")).toBeVisible();
await page
  .getByLabel("Or paste CSV")
  .fill(
    "id,date,name,amount,category\ncsv-1,2026-11-03,Library printing,2.50,Education",
  );
await page.getByRole("button", { name: "Preview import" }).click();
await expect(page.getByText("1 rows · 0 new")).toBeVisible();
console.log(
  "PASS: balance edit, expense create/edit/paid/undo/delete, save application/status, profile persistence, demo chat/delete, CSV import/dedup",
);
console.log("Runtime errors:", errors);
await browser.close();
if (errors.length) process.exit(1);
