import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_STAFF_EMAIL;
const password = process.env.E2E_STAFF_PASSWORD;

async function openAppointmentDialog(page: Page) {
  const button = page.getByRole("button", { name: /new appointment/i });
  await expect(button).toBeVisible();
  await button.click();
  const dialog = page.getByRole("dialog", { name: /appointment details/i });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("appointment management", () => {
  test.skip(!email || !password, "E2E staff credentials are not configured.");

  test("staff can sign in, navigate dates, and confirm an overlap", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15_000,
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="appointment-manager-ready"]')
          ?.getAttribute("data-ready") === "true",
    );
    await expect(
      page.getByRole("heading", { name: /day.?s flow/i }),
    ).toBeVisible();

    const testDate = `2099-12-${String((Date.now() % 27) + 1).padStart(2, "0")}`;
    await page.goto(`/?date=${testDate}`);
    await expect(page).toHaveURL(new RegExp(`\\?date=${testDate}`));
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="appointment-manager-ready"]')
          ?.getAttribute("data-ready") === "true",
    );

    const clientName = `E2E ${Date.now()}`;
    const dialog = await openAppointmentDialog(page);
    await dialog.getByLabel("Client name").fill(clientName);
    await dialog.getByLabel("Service").fill("Nail appointment");
    await dialog.getByLabel("Start time").fill("09:00");
    await dialog.getByLabel("End time").fill("10:00");
    await dialog.getByLabel("Booking amount").fill("500");
    await dialog.getByLabel("Pending amount").fill("250");
    await dialog.getByRole("button", { name: /book appointment/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: clientName })).toBeVisible();

    const overlapDialog = await openAppointmentDialog(page);
    await overlapDialog.getByLabel("Client name").fill(`${clientName} overlap`);
    await overlapDialog.getByLabel("Service").fill("Lash appointment");
    await overlapDialog.getByLabel("Start time").fill("09:50");
    await overlapDialog.getByLabel("End time").fill("10:30");
    await overlapDialog.getByLabel("Booking amount").fill("400");
    await overlapDialog.getByLabel("Pending amount").fill("100");
    await overlapDialog.getByRole("button", { name: /book appointment/i }).click();

    await expect(page.getByText(/10 minutes/i)).toBeVisible();
    await page.getByRole("button", { name: /book anyway/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: `${clientName} overlap` }),
    ).toBeVisible();
  });
});
