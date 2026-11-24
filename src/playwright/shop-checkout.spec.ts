import { test, expect } from '@playwright/test';

test('add a product to the cart and reach signup', async ({ page }) => {
  // The site shows full-page ads between pages. An ad covers the page and the
  // next step can't find its element. Ads aren't what this check monitors, so
  // requests to the ad network are blocked.
  const adNetwork = /googlesyndication\.com|doubleclick\.net|googleadservices\.com/;
  await page.route(adNetwork, (route) => route.abort());

  // The GDPR consent banner shows in EU locations. This clicks it away
  // whenever it gets in the way of a later step. With the ad network blocked
  // above, the banner doesn't load, so this is a safety net.
  const consentButton = page.getByRole('button', { name: 'Consent' });
  await page.addLocatorHandler(consentButton, async () => {
    await consentButton.click();
  });

  // The buttons on this site only work once the page's own scripts have run.
  // 'domcontentloaded' waits for those scripts. It doesn't wait for every
  // image and third-party request, which can be slow or never finish.
  const pageReady = { waitUntil: 'domcontentloaded' } as const;

  await page.goto('https://www.automationexercise.com/', pageReady);

  await page.getByRole('link', { name: 'Products' }).click();
  await page.waitForURL('**/products', pageReady);
  await expect(page.getByPlaceholder('Search Product')).toBeVisible();

  await page.locator('div.productinfo a[data-product-id="1"]').click();
  await expect(page.getByRole('heading', { name: 'Added!' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Shopping' }).click();

  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForURL('**/view_cart', pageReady);
  await page.getByText('Proceed To Checkout').click();
  await page.getByRole('link', { name: 'Register / Login' }).click();
  await expect(page.getByRole('heading', { name: 'New User Signup!' })).toBeVisible();
});
