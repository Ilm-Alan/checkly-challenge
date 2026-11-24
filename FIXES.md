# What changed in your two tests

Line numbers refer to the two tests as you sent them. Each change shows the wrong code, the correct code, and the reason.

## Shop checkout (`src/playwright/shop-checkout.spec.ts`)

### What made it fail

#### Line 11: a full-page ad covers the site

After the click on Products, the site can show an ad over the whole page. The next line looks for the search box and can't find it. The test now starts with two new lines that block requests to the ad network, so the ad never loads:

```ts
// added above line 4
const adNetwork = /googlesyndication\.com|doubleclick\.net|googleadservices\.com/;
await page.route(adNetwork, (route) => route.abort());
```

One tradeoff: with the ad network blocked, this check won't notice a problem that an ad causes on the page. Checkly's docs cover when blocking a third-party script is reasonable in [Avoid network interception in synthetic monitoring](https://www.checklyhq.com/docs/learn/playwright/intercept-requests/).

#### Line 18: "Continue Shopping" is a button

On the site it is a button. The test looked for a link, so it waited for a link that never appeared.

```ts
// wrong
await page.getByRole('link', { name: 'Continue Shopping' }).click();

// correct
await page.getByRole('button', { name: 'Continue Shopping' }).click();
```

#### Line 21: the checkout link reads "Register / Login"

```ts
// wrong
await page.getByRole('link', { name: 'Register / Signup'}).click();

// correct
await page.getByRole('link', { name: 'Register / Login' }).click();
```

### What made it unreliable

#### Lines 13, 17 and 23: three checks never ran

`toBeVisible` is a function. Without `()` it is never called, so the line checked nothing and the test carried on even when the element was missing. It also needs `await`, because Playwright keeps looking for the element for a few seconds.

```ts
// wrong (line 13)
expect(searchBar).toBeVisible;

// correct
await expect(page.getByPlaceholder('Search Product')).toBeVisible();
```

Lines 17 and 23 get the same fix, for the "Added!" heading and the "New User Signup!" heading.

#### Lines 5 to 10: the consent banner

The code looked for the Consent button once, right after the page opened. If the banner appeared a moment later, it covered the page and the next click failed. The banner only shows in some regions, so the test could pass from one Checkly location and fail from another.

```ts
// wrong
const consentButton = page.getByRole('button', { name: 'Consent' });
if (await consentButton.isVisible()) {
  await consentButton.click();
} else {
  console.log('GDPR does not apply.');
}

// correct
const consentButton = page.getByRole('button', { name: 'Consent' });
await page.addLocatorHandler(consentButton, async () => {
  await consentButton.click();
});
```

The handler clicks the button whenever the banner gets in the way of a step. If the banner never shows, the handler does nothing. Run against the live banner from an EU location, the handler fired once and the test carried on.

In runs from two EU locations, the banner showed with ads allowed and did not show with ads blocked. Since this test blocks the ad network, the handler is a safety net here.

#### Lines 15 and 20: buttons could be clicked before they worked

"Add to cart" and "Proceed To Checkout" only work once the page's own scripts have run. Those scripts load at the end of the page, so the button is visible first. A click in that gap does nothing, and the pop-up the test expects never opens.

This happened once in eleven runs. Slowing the scripts down on purpose made it happen every time, on both buttons. The test now waits for each page's scripts before it clicks:

```ts
const pageReady = { waitUntil: 'domcontentloaded' } as const;

// line 4
await page.goto('https://www.automationexercise.com/', pageReady);

// added after line 11
await page.waitForURL('**/products', pageReady);

// added after line 19
await page.waitForURL('**/view_cart', pageReady);
```

`domcontentloaded` waits for the page's HTML and its own scripts. It doesn't wait for every image and third-party request. The default, `load`, does, and one request that never finishes then times the test out. Checkly's [troubleshooting guide](https://www.checklyhq.com/docs/detect/synthetic-monitoring/browser-checks/troubleshooting/) recommends the same thing.

#### Line 11: an invisible character in the Products link

The link name began with an invisible icon character. If the site changes that icon, the test breaks. The correct line matches on the word alone:

```ts
// correct
await page.getByRole('link', { name: 'Products' }).click();
```

### What the test can't fix

#### The shop site is sometimes overloaded

The site is a public practice site. In three runs over two days it showed a page that says "This website is under heavy load (queue full)" in place of the shop. The one response we inspected had status 503. The Products link isn't on that page, so the test waits 30 seconds for it and fails. Nothing in the test is wrong when this happens. The README's troubleshooting section shows how to recognize it.

## Pokémon type (`src/playwright/pokemon-type.spec.ts`)

### What made it fail

#### Line 23: `forms` is a list

The API returns `forms` as a list with one entry. Asking a list for `.url` gives `undefined`, and the next request failed with `Invalid URL`.

```ts
// wrong
pokemonFormURL = pokemonForm.forms.url

// correct
pokemonFormURL = pokemonForm.forms[0].url;
```

#### Line 31: `type` is an object

`types[0].type` looks like `{ name: 'electric', url: '...' }`. Comparing that whole object to the word `'electric'` always fails.

```ts
// wrong
const pokemonType = pokemonForm.types[0].type

// correct
const pokemonType = pokemonForm.types[0].type.name;
```

### What made it unreliable

#### Lines 12, 20 and 28: `toBeOK()` without `await`

Without `await`, the test moves on before the check finishes. A failed request could then show up as a confusing error on a later line, or go unreported.

```ts
// wrong
expect(response).toBeOK()

// correct
await expect(response).toBeOK();
```
