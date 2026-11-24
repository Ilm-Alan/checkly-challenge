# Raccoon Synthetics

This is your Checkly monitoring, set up with the Checkly CLI.

Every 10 minutes it runs your two Playwright tests and checks each user profile listed in a JSON file. If anything fails, it emails `raccoon@checklyhq.com`.

Both of your Playwright tests pass now. [FIXES.md](FIXES.md) shows every line that changed and why.

## Get it running

You need [Node.js](https://nodejs.org) 22.13 or newer and your Checkly account. Run each command from this folder.

### 1. Install

```bash
npm install
```

### 2. Log in to Checkly

```bash
npx checkly login
```

It prints a link and a code. Open the link, sign in to Checkly, and enter the code.

To check that it worked, run `npx checkly whoami`. It prints your account name.

### 3. Add your API token

```bash
cp .env.example .env
```

Open the new `.env` file and paste your token after the `=`. Leave out the word `Bearer`:

```
CHECKLY_SECRET_USERS_API_TOKEN=your-token-here
```

Git ignores `.env`, so the token stays on your machine and out of the repository.

### 4. Test it

```bash
npx checkly test
```

This runs every check once on Checkly's servers. It takes about 20 seconds. It saves nothing to your account and sends no alerts, so you can run it as often as you like.

When everything works, the output ends like this:

```
src/api/user-check-builder.ts
  ✔ User profile: John Doe (id 42) (204ms)
  ✔ User profile: Ruby Smith (id 64) (165ms)
  ✔ User profile: Tina Johnson (id 28) (199ms)
src/playwright.check.ts
  ✔ playwright/pokemon-type.spec.ts (5s)
  ✔ playwright/shop-checkout.spec.ts (13s)

5 passed, 5 total
```

If you see a `✖`, go to [If something goes wrong](#if-something-goes-wrong).

### 5. Go live

```bash
npx checkly deploy
```

The CLI lists what it will create and asks you to confirm. When it finishes, it prints:

```
Successfully deployed project "Raccoon Synthetics" to account "your-account"
```

The checks now run every 10 minutes. You can watch them at https://app.checklyhq.com.

## If something goes wrong

Find the message you see below. If none of them match, send us the command you ran and everything it printed, and we'll take it from there.

### `Missing value for secret 'USERS_API_TOKEN'`

The CLI can't find your token. Do step 3 again: copy `.env.example` to `.env` and paste the token in.

### `Value must not be empty`

Your `.env` file has the variable name but nothing after the `=`. Paste the token there.

### The three "User profile" checks fail with status `401`

The token in `.env` is wrong. Check that it doesn't start with the word `Bearer`. `.env` should hold the token alone.

After you fix it, run `npx checkly test` again. If the checks are already live, also run `npx checkly deploy` so Checkly gets the new token.

### `Error: Conflict` after `npx checkly login`

You signed in a different way from how you created your Checkly account, for example with Google when the account uses an email and password. Open https://app.checklyhq.com, sign out, sign in the way you first signed up, and run `npx checkly login` again.

### The shop check fails now and then, and the others pass

That test runs against a public practice site, and the site is sometimes overloaded. When it is, the site shows a page that says "This website is under heavy load (queue full)" in place of the shop. The test then waits 30 seconds for the Products link and fails with:

```
Test timeout of 30000ms exceeded.
waiting for getByRole('link', { name: 'Products' })
```

To confirm, open the failed run in Checkly and watch its video. If it shows the "heavy load" page, the test is fine and the site was down for a moment. Checkly retries once from the other location before it alerts you, so you only get an email if the site is still down on the second try.

### No alert emails arrive

Look in your spam folder first. If they are there, mark `no-reply@checklyhq.com` as a safe sender.

### `npx playwright install` downloads the browser and then hangs

This is a [Playwright bug](https://github.com/microsoft/playwright/issues/40724) on Node.js 24.16 and newer and on Node.js 26. It only affects running the tests on your own machine. Run the install once with an older Node.js:

```bash
npx -y node@24.15.0 node_modules/@playwright/test/cli.js install chromium
```

## Common changes

After any change below, run `npx checkly test` to try it and `npx checkly deploy` to make it live.

### Add a Playwright test

Put a new file ending in `.spec.ts` in `src/playwright/`. The CLI finds it and adds it to the "Playwright checks" group. You don't need to register it anywhere.

Deleting a file removes its check. Renaming a file removes the old check and creates a new one, so that check's history starts over.

### Add a user to the API checks

Add an entry to `src/api/users.json`:

```json
{
  "id": 99,
  "name": "New User",
  "profile_url": "https://jsonmap-faiy.onrender.com/api/v1/items/user99"
}
```

Each entry becomes one check in the "User API checks" group. The check passes when the response status is `200`, and the `id` and `name` in the response equal the ones in the file.

Checkly tells these checks apart by `id`. If you change an `id`, you get a new check and its history starts over.

### Change who gets the alerts

Edit the address in `src/alert-channels.ts`.

### Change the API token

Edit `.env`. You never need to touch the code for this.

### Change how often the checks run, or where from

Edit `frequency` and `locations` in `checkly.config.ts`.

### Run a Playwright test on your own machine

```bash
npx playwright install chromium
npx playwright test
```

This is quicker than `npx checkly test` while you are writing a test. The project uses Playwright 1.58.2, the same version Checkly runs, so a test behaves the same in both places.

### Stop everything

```bash
npx checkly destroy
```

This deletes the checks, the groups, and the alert that this project created in your Checkly account. It can't be undone, so the CLI asks you to type the project name first.

## How it works

```
checkly.config.ts             Project settings: schedule, locations, alerts
src/
  alert-channels.ts           The email alert
  playwright.check.ts         Group 1: "Playwright checks"
  playwright/                 All Playwright tests live here
    shop-checkout.spec.ts
    pokemon-type.spec.ts
  api/
    users.json                The list of users to check
    user-check-builder.ts     The reusable function that builds one API check
    users.check.ts            Group 2: "User API checks"
.env.example                  Shows the one secret you need to set
FIXES.md                      What changed in your two tests
```

### The two groups

"Playwright checks" holds every test in `src/playwright/`. "User API checks" holds one check per entry in `users.json`.

The function that builds a user check is `createUserApiCheck` in `src/api/user-check-builder.ts`. It takes a user and a group, so you can call it for another list or another group.

Every file in `src/playwright/` runs as a Browser check. That includes `pokemon-type.spec.ts`, which only makes API requests and never opens a page. If you add many tests like it, Checkly's [Multistep check](https://www.checklyhq.com/docs/detect/synthetic-monitoring/multistep-checks/overview/) type runs them without starting a browser.

### Alerts

Every check emails `raccoon@checklyhq.com` when it fails and again when it recovers. The alert is set once for the whole project in `checkly.config.ts`, so tests and users you add later get it too.

Checkly retries a failed check once from the other location before it sends an alert, so one network blip won't email you.

### Your token

The code contains the placeholder `{{USERS_API_TOKEN}}` and never the token. Checkly fills in the value when a check runs.

When you run the CLI, it reads the token from `.env` and stores it in Checkly as a secret on the "User API checks" group. The Playwright checks are in the other group and don't receive it. The CLI prints the token as `*********` in its output.

If you run the CLI from CI, set `CHECKLY_SECRET_USERS_API_TOKEN` in your CI's secret store and skip the `.env` file.

## Checkly docs

- [Checkly CLI overview](https://www.checklyhq.com/docs/cli/overview/)
- [Creating checks automatically from files](https://www.checklyhq.com/docs/constructs/including-checks/)
- [Creating checks from a list](https://www.checklyhq.com/docs/constructs/dynamic-monitor-creation/)
- [Environment variables and secrets](https://www.checklyhq.com/docs/cli/environment-variables/)
- [Check groups](https://www.checklyhq.com/docs/constructs/check-group-v2/), [API checks](https://www.checklyhq.com/docs/constructs/api-check/), and [email alerts](https://www.checklyhq.com/docs/constructs/email-alert-channel/)
