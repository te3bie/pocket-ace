import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const errors = [];
async function lower(name, anchor) {
  await page
    .getByText(anchor, { exact: true })
    .filter({ visible: true })
    .first()
    .evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(100);
  await page.screenshot({ path: `docs/screenshots/${name}-lower.png` });
}

page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8081");
await page.getByRole("button", { name: "Explore the fictional demo" }).click();
await page.getByText("Your future starts here.").waitFor();
await page.screenshot({
  path: "docs/screenshots/home-390.png",
  fullPage: true,
});
await lower("home-390", "Monthly Expenses");
console.log(
  "home text",
  (await page.locator("body").innerText()).slice(0, 800),
);
await page.getByRole("link", { name: "Calendar" }).click();
await page.getByText("Your payment plan").waitFor();
await page.screenshot({
  path: "docs/screenshots/calendar-390.png",
  fullPage: true,
});
await page.getByRole("link", { name: "Discover" }).click();
await page.getByText("Find your opportunity").waitFor();
await page.screenshot({
  path: "docs/screenshots/discover-390.png",
  fullPage: true,
});
await lower("discover-390", "Scholarship and Bursary Finder");
await page.getByRole("link", { name: "Profile" }).click();
await page.getByText("My profile").waitFor();
await page.screenshot({
  path: "docs/screenshots/profile-390.png",
  fullPage: true,
});
await lower("profile-390", "Projected Spending");
await page.setViewportSize({ width: 280, height: 570 });
await page.getByRole("link", { name: "Home", exact: true }).click();
await page.screenshot({ path: "docs/screenshots/home-reference-280.png" });
await page.getByRole("link", { name: "Profile", exact: true }).click();
await page.screenshot({ path: "docs/screenshots/profile-reference-280.png" });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("link", { name: "Home" }).click();
await page.screenshot({
  path: "docs/screenshots/home-desktop.png",
  fullPage: true,
});
console.log("Runtime errors", errors);
await browser.close();
if (errors.length) process.exit(1);
