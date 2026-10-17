# End-to-end tests

Browser tests for the whole app: navigation, Home, Transactions and purchase
pages, Holdings, Metal rates, Profile/Settings, theme, and an axe
accessibility scan (WCAG 2.1 A/AA) of every page in both themes.

They run against your **real Supabase project** through the running API, as a
throwaway user (`e2e-…@mintfolio.test`) with sample purchases. Teardown deletes
that user with all its rows, receipts and photo — your own data is never touched.

## One-time setup

```bash
npx playwright install chromium        # browser for the tests
cp .env.e2e.example .env.e2e           # then set SUPABASE_SERVICE_ROLE_KEY
```

## Run

Start both servers, then the suite:

```bash
# mintfolio-api
uvicorn app.main:app --reload --port 8000
# mintfolio-web
npm run dev
npm run test:e2e                       # all specs (~5–10 min against a remote DB)
npx playwright test e2e/home.spec.ts   # one file
npx playwright show-report             # HTML report, with traces of failures
```

Tests share one user, so they run one at a time; specs that change settings
(weight unit, name, theme) put them back. If a run is interrupted before
teardown, delete the leftover `e2e-…@mintfolio.test` user from Supabase Auth.
