# NewJaisa Sales Link Generator

An internal web tool for the NewJaisa Technologies Sales Team. A salesperson
pastes any page link from [newjaisa.com](https://newjaisa.com/) (a product,
collection, landing page or blog post) and gets back the same link with the
standard Sales Team UTM tracking parameters, ready to share on WhatsApp.

Every salesperson uses the same tracking values, so visits and orders from these
links can be grouped as "Sales Team" traffic in Shopify and Google Analytics 4.

- Runs entirely in the browser. It has no database, no backend, no API keys
  and no environment variables.
- It makes no network requests to check the URL you paste.
- It does not connect to Shopify.

## Technology stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4
- [Lucide React](https://lucide.dev) icons
- Browser-native `URL` / `URLSearchParams` for URL handling
- [Vitest](https://vitest.dev) for unit tests

## Getting started

Requirements: Node.js 20.9 or newer (developed on Node 24) and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Commands

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the development server              |
| `npm test`          | Run the unit tests once                   |
| `npm run test:watch`| Run the unit tests in watch mode          |
| `npm run typecheck` | TypeScript type-check (`tsc --noEmit`)    |
| `npm run lint`      | ESLint                                    |
| `npm run build`     | Production build                          |
| `npm start`         | Serve the production build                |

## Changing the UTM configuration

All tracking values live in one file: [`src/config/utm.ts`](src/config/utm.ts).

```ts
export const SALES_UTM_PARAMS = {
  utm_source: "sales_team",
  utm_medium: "direct_sales",
  utm_campaign: "sales_assisted",
} as const;
```

Edit the values, run `npm test`, and redeploy. The same file holds
`ALLOWED_HOSTNAMES`, the exact list of website hostnames that are accepted
(`newjaisa.com` and `www.newjaisa.com`).

Note: changing these values starts a new series in GA4 and Shopify reports.
Older links keep their old values.

## How links are generated

The logic is in [`src/lib/tracking-url.ts`](src/lib/tracking-url.ts) and is
covered by [`src/lib/tracking-url.test.ts`](src/lib/tracking-url.test.ts).

1. The input is trimmed and parsed with the browser's `URL` API.
2. It is rejected unless all of these are true:
   - The protocol is `https:`. `http:`, `javascript:` and `data:` links are rejected.
   - It has no embedded username or password.
   - The hostname is exactly `newjaisa.com` or `www.newjaisa.com` (not a
     substring match), with no custom port.
3. Any existing `utm_*` parameters are removed, in any letter case and
   including duplicates. The three Sales Team parameters are then added once each.
4. All other query parameters (Shopify `variant`, `sort_by`, collection
   `filter.*`, `gclid`, `fbclid`, and so on) and the `#fragment` are kept.

### Examples

| Input | Generated link |
| ----- | -------------- |
| `https://newjaisa.com/products/refurbished-dell-latitude` | `https://newjaisa.com/products/refurbished-dell-latitude?utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted` |
| `https://newjaisa.com/collections/refurbished-laptops` | `https://newjaisa.com/collections/refurbished-laptops?utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted` |
| `https://newjaisa.com/collections/refurbished-laptops?sort_by=price-ascending` | `https://newjaisa.com/collections/refurbished-laptops?sort_by=price-ascending&utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted` |
| `https://newjaisa.com/products/x?variant=123&utm_source=google` | `https://newjaisa.com/products/x?variant=123&utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted` |
| `https://newjaisa.com/pages/faq#warranty` | `https://newjaisa.com/pages/faq?utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted#warranty` |

Rejected examples: `http://newjaisa.com/...`, `https://newjaisa.com.example.org/...`,
`https://newjaisa.co/...`, `https://user:pass@newjaisa.com/...`,
`javascript:alert(1)`, `https://google.com/`.

## Deployment (Vercel)

The app is a standard Next.js project and needs no environment variables.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Next.js**. Root directory: the repository root.
   Build command: `npm run build` (default). Output: default.
4. Click **Deploy**. Later pushes to `main` redeploy automatically.

Or deploy from this folder with the Vercel CLI: `npx vercel` (preview), then
`npx vercel --prod`.

The page sets `robots: noindex` so search engines don't list it. It does not
require a login. If the link must stay private to employees, turn on Vercel
Deployment Protection or put it behind your SSO.

## Limitations: Shopify and GA4 attribution

- This tool **only creates links**. It does not record visits, orders or
  revenue, and it does not know how many orders came from Sales Team links.
- Attribution is measured by Shopify (order attribution / "Sessions by UTM"
  reports) and Google Analytics 4 (session source / medium / campaign). Check
  the numbers there.
- UTM attribution depends on the customer opening the exact link shared. If they
  search for the product instead, retype the address, or the link is stripped by
  an app or browser, the visit is not attributed to the Sales Team.
- Ad blockers, consent choices, cross-device journeys and attribution windows
  can cause under-counting in GA4 and Shopify.
- Individual salespeople are intentionally not tracked.
- Query parameters are re-serialised by `URLSearchParams`, so encodings may
  change (e.g. a space becomes `+`, a comma becomes `%2C`). The meaning stays
  the same.
