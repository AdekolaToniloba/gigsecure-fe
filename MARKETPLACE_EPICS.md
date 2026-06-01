# GigSecure Public Marketplace Feature Epic

Created: 2026-06-01 12:20 WAT  
Corrected: 2026-06-01 16:55 WAT

## Objective

Implement the public GigSecure insurance marketplace in Next.js App Router with TypeScript, React Query, accessible URL-driven filtering, responsive product cards, authenticated risk-based recommendations, and a product-detail slide-over. Marketplace browsing and product detail are public. This epic does not implement Premiums Bought, policies, dashboard integration, or authenticated app navigation.

## Scope Summary

- Add the public `/marketplace` page using the upside-down L layout from the first screenshot.
- Add public product listing and public product-detail API integration.
- Add authenticated recommendations integration with login and risk-assessment redirects.
- Add marketplace types, Zod validators, endpoint constants, MSW handlers, services, and React Query hooks.
- Build filter sidebar, marketplace navbar, risk-level controls, product cards, responsive grid, pagination, and product-detail slide-over.
- Use the second screenshot only as the visual reference for the right-hand product-detail slide-over. The panel opens above the marketplace page from the first screenshot.
- Cover public access, accessibility, loading/error/empty states, filtering, slide-over behavior, recommendation redirects, and Playwright e2e flows.

## Codebase Audit Summary

- `src/lib/api/client.ts` is the authenticated Axios client. It attaches the memory-only access token and participates in refresh handling. It must be used only for `GET /api/v1/marketplace/recommendations`.
- Public catalog requests use a dedicated public Axios instance without Bearer-token attachment or refresh behavior.
- `src/store/auth-store.ts` already owns memory-only auth state plus `riskAssessed`.
- `src/hooks/auth/useUserFlags.ts` exposes authentication and assessment state. Recommendation actions reuse it instead of introducing another store.
- `src/app/(app)/layout.tsx` is protected and therefore is not the correct route tree for the public marketplace page.
- The existing public route group under `src/app/(public)` is the correct location for `/marketplace`.
- Existing legacy product/policy modules remain outside this epic and are not refactored.
- Local `openapi.json` and generated `src/types/schema.d.ts` were stale for marketplace products and recommendations. They must reflect that only recommendations require Bearer authentication.

## New API Contracts

### Public Product List

`GET /api/v1/marketplace/products`

- Public endpoint. No Bearer token is required.
- Accepts repeated `category`, `provider_slug`, and `risk_level` query params.
- Accepts optional `q`, `min_premium`, `max_premium`, `limit`, and `offset`.
- Returns `ProductListResponse { items: ProductOut[], total, limit, offset }`.

### Authenticated Recommendations

`GET /api/v1/marketplace/recommendations`

- Requires Bearer authentication.
- Accepts `per_category` from `1` to `10`, default `3`.
- Returns `RecommendedProductsResponse { recommended_categories, items }`.
- If the user is unauthenticated, recommendation actions route to `/login?redirect=/marketplace`.
- If the user is authenticated but `risk_assessed = false`, recommendation actions route to `/assessment`.
- If the user is authenticated and assessed, the frontend requests and renders recommended products.

### Public Product Detail

`GET /api/v1/marketplace/products/{product_id}`

- Public endpoint. No Bearer token is required.
- Returns `ProductOut`.

### Main Shapes

- `ProviderRef`: `id`, `slug`, `name`, nullable `logo_url`.
- `ProductOut`: product identity, category, description, decimal-string premium and coverage, currency, renewal frequency, nullable risk level, active state, and provider.
- `ProductListResponse`: `items`, `total`, `limit`, and `offset`.
- `RecommendedProductsResponse`: `recommended_categories` and recommended product `items`.
- Decimal monetary fields remain strings at the API boundary and are formatted only by presentation helpers.

## Screenshot Analysis

### Marketplace Page

- The public marketplace uses a dedicated upside-down L layout: a full-height fixed-width filter sidebar on the left and a top navbar only over the right-hand content region.
- The left sidebar contains logo, Filters/Clear all row, category checkboxes, monthly premium slider, searchable provider checkboxes with four-item collapsed view, Apply Filters button, and Need Help Choosing card.
- The navbar contains centered search, bell placeholder, premiums placeholder, and teal pill Take A Tour placeholder. Authenticated premiums behavior is deferred.
- The content header contains All, Low Risk, Moderate Risk, and High Risk buttons. The dashboard-return action should only render when an authenticated-user navigation design is approved; it is not required for the public MVP.
- The catalog uses a dense four-column desktop grid with bordered white cards, warm beige icon tiles, provider identity, clamped description, coverage/premium summary, and outlined Explore Plan CTA.

### Product Detail Slide-Over

- The second screenshot is a reference for the right-side slide-over only. Its shown Premiums Bought background is not part of this epic.
- Clicking a marketplace card or Explore Plan opens the panel above the marketplace page from the first screenshot.
- The page behind the panel is dimmed while the full-height right-side panel is visible.
- The panel contains provider icon, product name, company/category subtitle, summary stats derived from product data, description, coverage bullets, coverage details, document copy, and CTA row.
- Policy-only timeline, status, next-payment, and View Policy behavior are omitted unless future marketplace purchase requirements add the required contracts.
- Mobile uses a full-screen or bottom-sheet presentation.

## Open Questions

1. What should the public product-detail CTA do before policy purchase is in scope? Default: render a disabled or informational `Get Covered` control with clear coming-soon copy.
2. Backend should add structured coverage benefits. Frontend fallback: split non-empty description lines, or render the description as one bullet.
3. Backend should add payout type if the product panel needs a backend-authored label. Frontend fallback: derive display copy from renewal cadence.
4. Backend should consider category/provider facet metadata because loaded-page derivation can omit values that exist only on later pages.
5. Bell, premiums, and Take A Tour remain accessible non-functional placeholders for the public marketplace MVP.

## Architecture Decisions

- `/marketplace` lives under `src/app/(public)/marketplace/page.tsx`; it is not added to middleware protected paths and is not wrapped in `ProtectedRoute`.
- Public product list and product detail use a public Axios client without authentication or refresh behavior.
- Recommendations use the existing authenticated `apiClient`.
- Recommendation action gating composes existing session state:
  - unauthenticated: route to `/login?redirect=/marketplace`;
  - authenticated and unassessed: route to `/assessment`;
  - authenticated and assessed: enable the recommendations query.
- Filter controls keep pending local state until Apply Filters is activated. Applied state is encoded in URL search params and resets `offset=0`.
- Search is the exception: it debounces directly into `q`.
- Repeated category/provider/risk filters use repeated URL params to match backend semantics.
- Risk-level buttons update the applied `risk_level` URL param immediately; All removes it.
- Card details remain public and use the shared slide-over pattern with focus management, Escape close, backdrop close, close button, and body-scroll lock.

## Epic Tasks

### Task 1: Public Marketplace Audit and Contract Lock

Goal: Record the corrected public marketplace scope before UI implementation.

Files likely touched/created:

- `MARKETPLACE_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- Marketplace browsing and product detail are explicitly public.
- Recommendations are explicitly authenticated and risk-assessment-gated.
- Premiums, policies, dashboard integration, persistent app sidebar, and protected marketplace routing are explicitly out of scope.
- Screenshot 2 is documented only as the marketplace detail-panel reference.

Testing requirements:

- No tests required for planning correction.

Dependencies/blockers:

- None.

### Task 2: Marketplace OpenAPI Sync and Generated Types

Goal: Synchronize marketplace paths and regenerate declarations.

Files likely touched/created:

- `openapi.json`
- `src/types/schema.d.ts`

Acceptance criteria:

- Product list and product-detail paths have no `security` requirement.
- Recommendations retains `HTTPBearer`.
- `ProductOut`, `ProviderRef`, `ProductListResponse`, and `RecommendedProductsResponse` exist locally.
- Generated declarations are refreshed through `npm run generate:types`.

Testing requirements:

- `npm run generate:types`
- `npx tsc --noEmit`

Dependencies/blockers:

- Task 1.

### Task 3: Marketplace Runtime Contracts, Service, Hooks, and MSW

Goal: Add the public catalog data foundation and authenticated recommendations integration.

Files likely touched/created:

- `src/types/marketplace.ts`
- `src/lib/validators/marketplace.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/constants.ts`
- `src/mocks/handlers/marketplace.ts`
- `src/services/marketplace.service.ts`
- `src/hooks/marketplace/useMarketplace.ts`

Acceptance criteria:

- List/detail use a public Axios client.
- Recommendations use authenticated `apiClient`.
- Validators cover all marketplace response shapes and filter params.
- MSW covers filters, pagination, detail, recommendations, and not-found detail.
- Existing legacy product/policy modules remain unchanged.

Testing requirements:

- Validator and service tests cover filters, public requests, detail, recommendations, and invalid payloads.

Dependencies/blockers:

- Task 2.

### Task 4: Recommendation Access Gate

Goal: Add a reusable recommendation-action controller.

Files likely touched/created:

- `src/hooks/marketplace/useMarketplaceRecommendationsGate.ts`
- marketplace recommendation CTA component and tests

Acceptance criteria:

- Gate reads existing auth/session flag hooks only.
- Unauthenticated action routes to `/login?redirect=/marketplace`.
- Authenticated unassessed action routes to `/assessment`.
- Authenticated assessed action enables recommendation loading.
- Loading and error states are accessible.

Testing requirements:

- Hook/component tests cover all three branches.

Dependencies/blockers:

- Task 3 and existing auth flags.

### Task 5: Marketplace Controls and URL Filter State

Goal: Build the upside-down L controls from screenshot 1.

Files likely touched/created:

- `src/components/marketplace/marketplace-navbar.tsx`
- `src/components/marketplace/filter-sidebar/*`
- `src/components/marketplace/risk-level-filter.tsx`

Acceptance criteria:

- Search debounces into `q`.
- Sidebar filters apply only on Apply Filters and survive refresh.
- Provider search/View More, Clear all, premium bounds, and risk controls work accessibly.
- Navbar placeholders are clearly non-functional.

Testing requirements:

- URL encoding, hydration, debounce, reset, provider search, expand/collapse, and risk-filter tests.

Dependencies/blockers:

- Task 3.

### Task 6: Product Cards and Responsive Grid

Goal: Build the public catalog presentation.

Files likely touched/created:

- `src/components/marketplace/product-card.tsx`
- `src/components/marketplace/product-card-skeleton.tsx`
- `src/components/marketplace/product-grid.tsx`

Acceptance criteria:

- Cards format product/provider data and open details by click, Enter, or Space.
- Grid supports desktop four-column, tablet two-column, mobile one-column, loading, empty, error/retry, and offset-based Load More states.

Testing requirements:

- Card and grid tests.

Dependencies/blockers:

- Tasks 3 and 5.

### Task 7: Public Product Detail Slide-Over

Goal: Implement the marketplace-card panel using screenshot 2 as the panel reference.

Files likely touched/created:

- `src/components/marketplace/product-detail-panel.tsx`
- panel helpers and tests

Acceptance criteria:

- Panel opens above the marketplace page, dims the marketplace background, animates from the right, traps focus, restores focus, locks scroll, and closes by Escape, backdrop, or close button.
- Panel renders public product data only.
- Coverage bullets use the description fallback until structured benefits exist.
- Policy-only fields are omitted.
- Mobile uses full-screen or bottom-sheet layout.

Testing requirements:

- Accessibility, dismissal, product rendering, fallback, and responsive-state tests.

Dependencies/blockers:

- Task 6.

### Task 8: Public Marketplace Page Composition

Goal: Add public `/marketplace`.

Files likely touched/created:

- `src/app/(public)/marketplace/page.tsx`
- `src/components/marketplace/marketplace-page.tsx`

Acceptance criteria:

- Page defines metadata.
- Page is publicly reachable without a refresh cookie or session.
- Compose filter sidebar, navbar, risk controls, grid, recommendation action, and detail panel.
- Marketplace is not added to protected route constants or middleware checks.

Testing requirements:

- Page composition and anonymous-browsing tests.

Dependencies/blockers:

- Tasks 4 through 7.

### Task 9: Unit, Integration, and E2E Completion

Goal: Cover public marketplace behavior end to end.

Files likely touched/created:

- marketplace-focused tests
- `e2e/marketplace/marketplace-flow.spec.ts`

Acceptance criteria:

- Cover anonymous catalog load, filtering, search debounce, pagination, public detail panel, panel dismissal, unauthenticated recommendation redirect, authenticated-unassessed wizard redirect, and authenticated-assessed recommendation loading.

Testing requirements:

- `npm test -- --run`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:e2e -- --project=chromium e2e/marketplace/marketplace-flow.spec.ts`
- `git diff --check`

Dependencies/blockers:

- Tasks 1 through 8.

### Task 10: Final QA and Documentation Update

Goal: Verify the public marketplace epic and update living context.

Files likely touched/created:

- `MARKETPLACE_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- Record the final public marketplace file map, test output, and remaining backend questions.
- Confirm browsing does not require authentication and recommendations do.

Dependencies/blockers:

- Tasks 1 through 9.
