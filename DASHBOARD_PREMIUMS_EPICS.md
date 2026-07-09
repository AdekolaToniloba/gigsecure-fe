# GigSecure Dashboard Premiums Bought Feature Epic

## Objective

Implement the protected Dashboard Premiums Bought page in the existing authenticated GigSecure app shell with TypeScript, React Query, Zod runtime validation, accessible filters, policy cards, empty state, policy detail slide-over, and policy report download support where the backend contract is authoritative.

This document is the implementation source of truth for the Premiums Bought feature. It is planning-only and does not authorize feature code during this task. Implementation must proceed in task order, and every completed task must append a timestamped entry to `CONTEXT.md`.

## Scope Summary

- Add a protected Premiums Bought destination under the authenticated dashboard route tree.
- Enable the existing sidebar Premiums Bought item only when the route exists.
- Build the overview summary card from real policy summary/dashboard values.
- Build the policies list with `All`, `All Active`, `Due Soon`, and `Expired` filters.
- Build the no-policies empty state with CTAs to existing marketplace and dashboard risk-assessment routes.
- Build an accessible policy detail slide-over with focus trap, focus restoration, Escape, backdrop, and explicit close behavior.
- Integrate policy list, summary, detail, and report download through the existing Bearer-authenticated `apiClient`.
- Add/update generated types, hand-written domain types where useful, Zod validators, endpoint constants, query keys, services, hooks, MSW handlers, UI primitives, route composition, and tests.
- Reuse the existing authenticated app shell, sidebar, navbar, auth guard, API client, error parser, React Query provider, MSW setup, and dashboard/marketplace visual patterns.

Out of scope: policy purchase, mock payment, renewal payment flow, claims, settings tabs, profile editing, new auth architecture, a new global policy store, invented notification behavior, fabricated policy fields, and report behavior not backed by a real endpoint or confirmed response shape.

## Codebase Audit Summary

The required planning inputs were reviewed before creating this document:

- `RULES.md`
- `CONTEXT.md`
- `DASHBOARD_EPICS.md`
- `MARKETPLACE_EPICS.md`
- `DASHBOARD_SETTINGS_EPICS.md`
- `AUTH_EPICS.md`
- `KYC_EPICS.md`
- `src/app/globals.css`
- `openapi.json`
- `src/types/schema.d.ts`

No required planning file was missing.

Current architecture to reuse:

- `src/app/(app)/layout.tsx` already wraps protected app routes in `ProtectedRoute`, `AuthenticatedAppShell`, `AppSidebar`, and `DashboardNavbar`.
- `src/components/dashboard/shell/` already provides the persistent desktop sidebar, mobile navigation drawer, skip link, dashboard navbar, search, notification trigger, and marketplace promo card.
- `src/components/dashboard/shell/app-navigation.tsx` already contains a `Premiums Bought` nav item, but it is currently `available: false` and renders as disabled "Soon". Premiums implementation must enable it and point it to the protected route.
- `src/components/auth/shared/protected-route.tsx`, `src/lib/auth/redirects.ts`, and `src/middleware.ts` already protect `/dashboard` paths through refresh-cookie hints and client full-session initialization. A `/dashboard/premiums` route inherits that protection.
- `src/lib/api/client.ts` is the authenticated Axios client. It attaches the memory-only access token, sends `X-Requested-With`, uses the auth BFF refresh route for 401 recovery, and must be reused for policy requests.
- `src/lib/api/errors.ts` exposes `parseApiError`, which must drive user-facing loading/error/retry states.
- `src/providers/QueryProvider.tsx` provides React Query defaults. Premiums hooks should use feature-specific keys and avoid copying server state into Zustand.
- `src/app/globals.css` defines the relevant design tokens: primary teal, accent yellow, app canvas, app sidebar, and app border.
- The marketplace `ProductDetailPanel` and dashboard notification/mobile drawer/settings modal code demonstrate local focus-trap, scroll-lock, backdrop, Escape, and focus-restoration patterns that the policy slide-over should reuse or extract only if it reduces real duplication.

Current gaps:

- There is no `src/app/(app)/dashboard/premiums/page.tsx`, loading state, or premiums page controller.
- Existing policy code is legacy and stale relative to OpenAPI:
  - `src/lib/validators/policies.ts` expects an array of policies with `user_id`, `product_id`, `premium`, and `currency`.
  - Current OpenAPI says the list response is `PolicyListResponse { items: PolicyOut[] }` and each `PolicyOut` contains `coverage_amount`, `premium_amount`, `premium_currency`, `renewal_frequency`, `display_status`, dates, and nested `product`.
  - `src/services/policies.service.ts` returns `Policy[]`, has no summary call, no report download call, no status filter support, and uses trailing-slash policy list/create endpoints.
  - `src/hooks/policies/usePolicies.ts` uses non-parameterized `QUERY_KEYS.POLICIES`, has no summary/detail/report hooks for this UI, and uses `throwOnError: true`, which does not match the desired in-page retry states.
  - `src/lib/api/endpoints.ts` has `POLICIES.LIST`, `CREATE`, and `DETAIL`, but lacks `SUMMARY`, `REPORT`, and a documented `status_filter` list helper.
  - `src/lib/constants.ts` has only coarse `POLICIES` and `POLICY(id)` query keys. It lacks keys for summary, filtered list, and report actions.
- MSW currently serves legacy policy fixtures from `src/mocks/handlers/domain.ts`, not a dedicated policy handler with OpenAPI-shaped payloads, summary, detail, report, empty, malformed, unauthorized, and error scenarios.
- There are no focused policy validator, service, hook, page, component, or e2e tests.

## OpenAPI And Schema Audit Summary

Local and supplied contracts both include the core authenticated policy endpoints:

- `GET /api/v1/policies`
- `GET /api/v1/policies/summary`
- `GET /api/v1/policies/{policy_id}`
- `GET /api/v1/policies/{policy_id}/report`
- `GET /api/v1/dashboard/overview`

Local and supplied schemas both include:

- `PolicyOut`
- `PolicyListResponse`
- `PolicySummary`
- `PolicyProductSummary`
- `DashboardOverviewResponse`

Important drift and gaps:

- The supplied OpenAPI documents `GET /api/v1/policies` with optional query param `status_filter?: string | null` and a 422 validation response. The generated local type includes `status_filter`, but existing service/hooks do not use it.
- The supplied OpenAPI describes `GET /api/v1/policies/{policy_id}/report` as returning a minimal PDF report, but its response content is `application/json` with an empty schema. The local OpenAPI has no response content for the same endpoint, and generated `src/types/schema.d.ts` has `content?: never`. The report endpoint exists, but response content type, filename headers, and binary semantics are not fully documented.
- `PolicyOut.product` provides product `id`, `name`, `category`, `provider_name`, and `provider_slug` only. It does not provide provider logo URL, product icon, product description, coverage bullets, payout type, or document URL.
- `PolicyOut` provides `start_date`, `end_date`, `purchased_at`, `created_at`, `status`, and `display_status`. It does not provide `next_payment_date`, "in 3 days", payment due amount, or a separate renewal/payment schedule object.
- `PolicyListResponse` contains only `items`. It does not provide pagination metadata, totals, or facets.
- `PolicySummary` provides `total_coverage`, `active_count`, and `due_soon_count`, which can power the overview card.
- `DashboardOverviewResponse.premiums_bought` can support the navbar/sidebar count if product wants it, but the Premiums Bought page overview itself should prefer `PolicySummary` for coverage/active/due-soon metrics.

Implementation rule:

Task 2 must synchronize local `openapi.json` with the supplied policy/report contract if the local file is stale, then run `npm run generate:types`. `src/types/schema.d.ts` must only change through generation. If backend changes the schema before implementation, the newer backend-approved schema wins and this epic must be updated with the exact conflict.

## API Contracts And Schemas Used

All policy endpoints require Bearer authentication through the existing `apiClient`.

### `GET /api/v1/policies`

Query:

- `status_filter?: string | null`

Returns `PolicyListResponse`:

- `items: PolicyOut[]`

Frontend rules:

- Use the documented query param only for backend-understood raw statuses.
- Include the selected UI filter in the React Query key.
- Do not invent pagination. If the backend later adds pagination, update the OpenAPI and generated types first.

### `GET /api/v1/policies/summary`

Returns `PolicySummary`:

- `total_coverage: string`
- `active_count: number`
- `due_soon_count: number`

Frontend rules:

- Format `total_coverage` as money using `premium_currency` fallback only if the summary contract later provides currency. Until then, default display can use `NGN` only if the product accepts the app-wide Nigerian currency assumption already present in marketplace/policy contracts.
- Use zero-safe states if the summary succeeds with `"0"` and counts `0`.

### `GET /api/v1/policies/{policy_id}`

Returns `PolicyOut`:

- `id`
- `status`
- `display_status`
- `coverage_amount`
- `premium_amount`
- `premium_currency`
- `renewal_frequency`
- `start_date?: string | null`
- `end_date?: string | null`
- `purchased_at?: string | null`
- `external_policy_id?: string | null`
- `created_at`
- `product: PolicyProductSummary`

`PolicyProductSummary`:

- `id`
- `name`
- `category`
- `provider_name`
- `provider_slug`

Frontend rules:

- Use `product.name`, `product.provider_name`, and `product.category` for card/panel identity.
- Use `display_status` for the human-readable badge.
- Use `purchased_at ?? start_date ?? created_at` for "Bought on" only if the label makes sense. If `purchased_at` is absent, use a neutral `Start date` label instead of pretending a purchase timestamp exists.
- Do not render next payment dates, due countdowns, policy descriptions, coverage bullets, or payout type unless a real field exists or the derivation is documented in code and accepted by product.

### `GET /api/v1/policies/{policy_id}/report`

Endpoint exists, but content semantics are under-documented.

Frontend rules:

- Add an authenticated service method for report download only after Task 2 locks whether the endpoint returns `application/pdf`, empty JSON, or another backend-approved shape.
- If confirmed PDF/blob, request with `responseType: 'blob'`, validate successful status and non-empty blob where possible, use `Content-Disposition` filename when present, and fall back to a safe filename such as `gigsecure-policy-{policy_id}-report.pdf`.
- If the contract remains JSON-empty or returns no downloadable content, render a truthful unavailable state and keep the gap in `CONTEXT.md`.
- Report errors must go through `parseApiError`.

### `GET /api/v1/dashboard/overview`

Reuse existing dashboard types/service only if the navbar premiums count needs to become live.

Relevant field:

- `premiums_bought: number`

Frontend rule:

- Do not make a redundant dashboard overview call from the Premiums page if the app shell does not already own live navbar metrics. Prefer leaving the existing navbar placeholder unchanged unless product explicitly requires a live count in this epic.

## Screenshot And UI Analysis

The supplied Premiums Bought screenshots show the completed authenticated dashboard shell:

- Persistent pale-teal left sidebar with GigSecure branding, active `Premiums Bought` row, and marketplace promo card.
- Top navbar over the content column with menu icon, search input, bell trigger, premiums placeholder, and `Take A Tour` placeholder.
- Main content below the navbar on the app canvas.
- Page heading: `Premiums Bought`.
- Subtitle: `Manage your Active protection and upcoming payments`.

The screenshot files and pasted request use "Preniums" in places. The UI requirement in the brief says `Premiums Bought`; implementation should use the corrected spelling unless product explicitly asks to preserve the screenshot typo.

### Overview Summary Card

The top card shows:

- Shield icon in a circular/outlined treatment.
- Heading: `Your Protection Overview`.
- Copy: `Here's a quick look at your insurance protection.`
- Metrics: `Total Coverage`, `Active Plans`, and `Due Soon`.

Data mapping:

- `Total Coverage` -> `PolicySummary.total_coverage`.
- `Active Plans` -> `PolicySummary.active_count`.
- `Due Soon` -> `PolicySummary.due_soon_count`.

Do not calculate this card from the policy list if the summary endpoint succeeds. List fallback can be considered only for resilient degraded UI and must be documented as fallback behavior.

### Premiums List State

When policies exist:

- Section heading: `Premiums`.
- Filter buttons: `All`, `All Active`, `Due Soon`, and `Expired`.
- Active filter uses the accent yellow treatment.
- Cards show the data the API actually provides:
  - Product icon treatment derived from category/provider slug, not from an undocumented logo URL.
  - Product name from `policy.product.name`.
  - Company/provider from `policy.product.provider_name`.
  - Category from `policy.product.category`.
  - Status badge from `policy.display_status`.
  - Coverage amount from `policy.coverage_amount`.
  - Premium from `policy.premium_amount` and `policy.premium_currency`.
  - Start/bought date from `purchased_at`, `start_date`, or `created_at` with an honest label.
  - Expiry date from `end_date` if present.
  - Renewal frequency from `renewal_frequency`.
  - Short coverage description only if a backend field is added. Do not fabricate "Covers your car insurance" from category alone unless product accepts a documented mapping.
  - `View Details` button.
  - `Download Report` button only when the report contract is usable; otherwise render a disabled/unavailable state with clear accessible copy.

Filter behavior:

- `All` shows all returned policies.
- `All Active` may send `status_filter=active`.
- `Expired` may send `status_filter=expired`.
- `Due Soon` should use authoritative `display_status` or a future backend filter. Do not infer due-soon by comparing dates unless backend/product defines the threshold.

### Empty State

When the policy list is empty:

- Overview card still renders with zero values if summary succeeds.
- Large bordered empty-state panel.
- Illustration placeholder using existing asset patterns or a small owned SVG/CSS illustration added during implementation.
- Heading: `You haven't activated any protection plans yet`.
- Body: recommended plans copy from the screenshot.
- Primary CTA: `Explore Recommended Plans`.
- Secondary CTA: `View My Risk Assessment`.

Routing:

- `Explore Recommended Plans` should link to `/marketplace` unless an existing recommendations URL state is implemented by that task.
- `View My Risk Assessment` should link to `/dashboard/risk-assessment`.

### Policy Detail Slide-Over

Clicking `View Details` opens a right-side full-height slide-over on desktop and a full-screen or bottom-sheet style panel on mobile.

It includes only authoritative data:

- Provider/product icon treatment.
- Product name.
- Company/category subtitle.
- Status badge.
- Back/close control.
- Summary row:
  - Coverage amount.
  - Premium amount and renewal period.
  - Next payment only if a real field exists. Current `PolicyOut` does not provide one.
- Description only if a real field exists. Current `PolicyOut` does not provide one.
- `What this plan covers` only if backend adds structured coverage content, or product accepts a documented mapping from product/category.
- Coverage details box:
  - Coverage Limit from `coverage_amount`.
  - Payout Type only if backend adds the field or product accepts a documented derivation from `renewal_frequency`.
- Plan timeline:
  - Start Date from `start_date`.
  - Expire Date from `end_date`.
  - Renews from `renewal_frequency`.
- Policy/document section:
  - `View Policy` only if a policy URL/document endpoint exists.
  - `Download Report` only if the report endpoint returns downloadable content.

Accessibility:

- The slide-over must be a modal dialog with labelled title and useful description.
- It must trap focus, restore focus to the opener, lock body scroll, and close via Escape, backdrop, and explicit close/back button.
- It must not allow background controls to remain reachable by keyboard while open.

## Architecture Decisions

- Premiums Bought lives under `src/app/(app)/dashboard/premiums/page.tsx`, so middleware and `ProtectedRoute` cover it through the existing `/dashboard` prefix.
- Enable the existing `Premiums Bought` sidebar item only after the route exists. Prefer a direct lucide icon import such as `Gem` if product wants the screenshot diamond; otherwise use the existing app navigation style consistently.
- The App Router page remains a small server metadata/composition boundary. Interactive behavior belongs in a client controller and focused child components.
- Rework the existing policy domain layer instead of creating a parallel premiums API client. The feature should own `src/types/policies.ts`, `src/lib/validators/policies.ts`, `src/services/policies.service.ts`, and `src/hooks/policies/usePolicies.ts` using generated OpenAPI aliases where useful.
- React Query owns policy server state. Do not copy policies, summary, selected policy detail, or report state into Zustand.
- Filter state can remain local UI state unless a URL-filter requirement is added. Query keys must include selected filter/status and policy IDs where applicable.
- Summary and list queries should start independently once the protected route renders. Detail query should start only when a policy is selected or the panel is opened.
- `PolicyOut` values should be formatted at render time through pure helpers. Monetary API fields remain strings at the boundary.
- Runtime validation is mandatory for JSON policy responses. Blob report responses cannot be Zod-validated like JSON; validate status/content metadata and handle errors through `parseApiError`.
- Use existing `Button`, dashboard tokens, shell spacing, marketplace detail-panel interaction patterns, settings modal focus patterns, and MSW/test conventions.
- Add feature-local UI primitives first. Extract a shared dashboard slide-over shell only if both marketplace and premiums can use it cleanly without broad refactors.
- Mobile must have no horizontal overflow and must preserve usable touch targets, wrapped card actions, and reachable filter buttons.
- Every completed implementation task must append a WAT timestamped entry to `CONTEXT.md` with files changed, summary, important decisions, known follow-ups, and validation.

## Open Questions

1. Should the route be `/dashboard/premiums`, `/dashboard/premiums-bought`, or `/dashboard/policies`? Default: `/dashboard/premiums` because the sidebar label is Premiums Bought and the route remains short under the protected dashboard tree.
2. Should the navbar "0 Premiums" control become live for this epic? Default: leave the existing placeholder unchanged unless product asks for live shell counts.
3. What exact backend value should drive the `Due Soon` filter? Current contract has `display_status` and `due_soon_count`, but no documented raw status or due-soon threshold.
4. Does the report endpoint return `application/pdf`, a JSON stub, or another shape in deployed environments? OpenAPI must document content type and filename headers before the frontend treats it as a full download.
5. Is there a real "View Policy" document URL or endpoint? Current contract has only `external_policy_id` and report.
6. Should policy detail show product description and coverage bullets? Current `PolicyOut` does not expose those fields, though marketplace `ProductOut` has `description`. Default: omit rather than fetch public marketplace detail by product ID unless backend/product confirms that relation and permission model.
7. Should payout type be a backend-authored field, derived from `renewal_frequency`, or omitted? Default: omit or document the derivation explicitly in a helper if product accepts it.
8. Should money use Naira by default when summary lacks currency? Current policy rows include `premium_currency`, but `PolicySummary.total_coverage` does not. Default: format summary as Nigerian Naira only if the product confirms NGN is app-wide.
9. Should active/expired filters be server-backed via `status_filter` while due-soon is client-derived, or should all filters be client-only after fetching all policies? Default: use the documented backend filter where authoritative and keep due-soon derivation truthful from `display_status`.
10. What asset should be used for the empty-state illustration? Default: create a small owned illustration consistent with the existing dashboard asset style during implementation.

## Ordered Implementation Tasks

### Task 1: Premiums Audit And Contract Lock

Goal: Revalidate the live codebase, screenshots, supplied OpenAPI, local OpenAPI, and generated schema before feature implementation starts.

Files likely touched:

- `DASHBOARD_PREMIUMS_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- Current route tree, app shell, sidebar, navbar, auth guard, API client, error parser, React Query setup, MSW setup, test patterns, and legacy policy code are documented.
- Screenshot requirements are mapped to real `PolicySummary`, `PolicyOut`, `PolicyProductSummary`, and `DashboardOverviewResponse` fields.
- Missing or insufficient fields are recorded without invented frontend data.
- No feature implementation is started.

Testing:

- No tests required for planning-only task.

Dependencies:

- None.

### Task 2: Policy OpenAPI Sync And Generated Types

Goal: Ensure local `openapi.json` and generated declarations match the backend-approved policy contracts.

Files likely touched:

- `openapi.json`
- `src/types/schema.d.ts`
- `CONTEXT.md`

Acceptance criteria:

- `GET /api/v1/policies` includes `status_filter` and documented validation responses if supplied backend schema remains authoritative.
- `GET /api/v1/policies/summary`, `GET /api/v1/policies/{policy_id}`, and `GET /api/v1/policies/{policy_id}/report` match the backend-approved contract.
- `PolicyOut`, `PolicyListResponse`, `PolicySummary`, and `PolicyProductSummary` exist in generated types.
- Report endpoint response content drift is resolved or documented as an open backend gap.
- `src/types/schema.d.ts` is regenerated with `npm run generate:types` and not hand-edited.

Testing:

- `npm run generate:types`
- `npx tsc --noEmit`

Dependencies:

- Task 1.

### Task 3: Policy Domain Types, Validators, Endpoints, Query Keys, And MSW

Goal: Replace stale policy runtime contracts with OpenAPI-aligned policy foundations.

Files likely touched:

- `src/types/policies.ts`
- `src/lib/validators/policies.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/constants.ts`
- `src/mocks/fixtures/policies.ts`
- `src/mocks/handlers/policies.ts`
- `src/mocks/handlers/index.ts`
- `src/__tests__/lib/policies-validators.test.ts`
- `src/__tests__/mocks/policies-handlers.test.ts`
- `CONTEXT.md`

Acceptance criteria:

- Policy validators match `PolicyOut`, `PolicyListResponse`, `PolicySummary`, and `PolicyProductSummary`.
- Decimal strings remain strings at the API boundary.
- Endpoint constants include list with optional `status_filter`, summary, detail, and report.
- Query keys include summary, filtered list, detail ID, and report action scope where applicable.
- MSW handlers return OpenAPI-shaped policies, empty list, summary, detail, report success/error, unauthorized, malformed, and failure scenarios.
- Legacy `domainHandlers` policy responses are removed or superseded so tests do not accidentally use stale shapes.

Testing:

- Validator tests for valid/invalid summary, list, detail, nullable dates, and decimal strings.
- MSW handler tests for auth requirement, filter behavior, empty state, detail not found, malformed payload, and report scenarios.

Dependencies:

- Task 2.

### Task 4: Policy Services And React Query Hooks

Goal: Add authenticated service methods and hooks for summary, filtered list, detail, and report download.

Files likely touched:

- `src/services/policies.service.ts`
- `src/hooks/policies/usePolicies.ts`
- `src/__tests__/services/policies.service.test.ts`
- `src/__tests__/hooks/policies-hooks.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Services use existing `apiClient` and pass `AbortSignal`.
- JSON responses are runtime-validated.
- User-facing errors can be parsed by `parseApiError`.
- `usePolicySummary`, `usePoliciesList`, and `usePolicyDetail` use canonical keys and do not throw into route boundaries for normal page errors.
- List query key includes the selected filter/status.
- Detail query is disabled until a policy ID exists.
- Report action is a mutation or explicit async action with loading, success, and error states; it does not pollute server-state cache.
- Mutations/actions use `retry: false` where repeated user actions could duplicate downloads.

Testing:

- Service tests cover summary, filtered list params, detail, invalid payloads, 401/500 error propagation, and report behavior.
- Hook tests cover enabled/disabled detail, filter query keys, retry/refetch, loading, success, error, and report mutation states.

Dependencies:

- Task 3.

### Task 5: Shared Premiums UI Primitives

Goal: Build focused, reusable primitives for the Premiums Bought page.

Files likely touched:

- `src/components/dashboard/premiums/policy-status-badge.tsx`
- `src/components/dashboard/premiums/policy-filter-chips.tsx`
- `src/components/dashboard/premiums/policy-card.tsx`
- `src/components/dashboard/premiums/premiums-empty-state.tsx`
- `src/components/dashboard/premiums/report-download-button.tsx`
- `src/components/dashboard/premiums/policy-detail-slide-over.tsx`
- `src/components/dashboard/premiums/premiums-formatters.ts`
- `src/__tests__/components/dashboard/premiums-primitives.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Status badges use `display_status` and accessible text, not color alone.
- Filter chips are native buttons with `aria-pressed` or equivalent selected state.
- Policy cards expose a keyboard-accessible `View Details` action and do not make nested interactive regions invalid.
- Empty state uses existing route links and no horizontal overflow.
- Report button handles unavailable, idle, loading, success, and error states.
- Slide-over shell traps focus, restores focus, locks body scroll, closes via Escape/backdrop/close, and has mobile full-screen or bottom-sheet behavior.
- Components use existing tokens and lucide icons with accessible labels.

Testing:

- Component tests for keyboard interaction, selected filters, status labels, card actions, report states, focus trap, focus restoration, Escape close, backdrop close, and mobile class/structure expectations.

Dependencies:

- Task 4.

### Task 6: Premiums Overview Summary Card

Goal: Implement the "Your Protection Overview" summary card using `PolicySummary`.

Files likely touched:

- `src/components/dashboard/premiums/premiums-overview-card.tsx`
- `src/components/dashboard/premiums/premiums-overview-skeleton.tsx`
- `src/__tests__/components/dashboard/premiums-overview-card.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Card renders shield icon, heading, copy, total coverage, active plans, and due soon.
- Loading state reserves stable geometry.
- Error state is accessible and offers retry without breaking the rest of the page.
- Zero values render correctly.
- Summary currency formatting is documented, especially if summary lacks currency.

Testing:

- Tests cover loading, success, zero, malformed/error, retry, and responsive wrapping.

Dependencies:

- Tasks 4 and 5.

### Task 7: Premiums List And Filter State

Goal: Build the list section with filter behavior and policy cards.

Files likely touched:

- `src/components/dashboard/premiums/premiums-list.tsx`
- `src/components/dashboard/premiums/premiums-list-skeleton.tsx`
- `src/__tests__/components/dashboard/premiums-list.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- `All`, `All Active`, `Due Soon`, and `Expired` filters update visible results and selected state.
- Server `status_filter` is used only for documented raw statuses.
- Due-soon behavior is driven by `display_status` or a backend-approved filter, not date guessing.
- Empty list after filtering is distinct from no-policies account empty state.
- List loading, error, retry, and success states are accessible.
- Cards render only fields available from the API or documented helpers.

Testing:

- Tests cover each filter, query key/param behavior, no-results state, loading, error/retry, keyboard actions, and mobile wrapping.

Dependencies:

- Tasks 4 and 5.

### Task 8: No-Policies Empty State

Goal: Build the large empty-state panel for users with no protection plans.

Files likely touched:

- `src/components/dashboard/premiums/premiums-empty-state.tsx`
- `src/__tests__/components/dashboard/premiums-empty-state.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Empty state appears only when the unfiltered policy list is empty.
- Overview card remains visible with zero values.
- Copy matches the brief.
- Primary CTA routes to `/marketplace` or an implemented recommendations route.
- Secondary CTA routes to `/dashboard/risk-assessment`.
- Illustration follows existing asset patterns and has correct decorative/accessible treatment.

Testing:

- Tests cover empty rendering, absence when policies exist, CTA hrefs, accessible headings, and mobile no-overflow.

Dependencies:

- Tasks 5, 6, and 7.

### Task 9: Policy Detail Slide-Over Content

Goal: Wire `View Details` to a policy detail query and render the detail panel truthfully.

Files likely touched:

- `src/components/dashboard/premiums/policy-detail-slide-over.tsx`
- `src/components/dashboard/premiums/policy-detail-content.tsx`
- `src/__tests__/components/dashboard/premiums-policy-detail.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Opening a card starts the detail query for that policy ID.
- Fallback list-card data may render immediately while detail loads if it matches the selected ID.
- Panel title, company/category, status, coverage, premium, dates, and renewal frequency use `PolicyOut`.
- Next payment, description, coverage bullets, payout type, and view-policy action are omitted or marked unavailable unless authoritative fields exist.
- Detail loading, error, retry, and not-found states are accessible within the panel.
- Focus behavior, scroll lock, and close behavior meet modal requirements.

Testing:

- Tests cover open from click and keyboard, detail fetch, loading, error/retry, close by Escape/backdrop/button, focus restoration, unavailable fields, and mobile presentation.

Dependencies:

- Tasks 4 and 5.

### Task 10: Report Download Integration

Goal: Integrate policy report download where the backend endpoint returns a usable downloadable response.

Files likely touched:

- `src/services/policies.service.ts`
- `src/hooks/policies/usePolicies.ts`
- `src/components/dashboard/premiums/report-download-button.tsx`
- `src/__tests__/services/policies.service.test.ts`
- `src/__tests__/hooks/policies-hooks.test.tsx`
- `src/__tests__/components/dashboard/premiums-report-download.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Download action calls `GET /api/v1/policies/{policy_id}/report` with authentication.
- If backend returns PDF/blob, the browser downloads it with a safe filename and announces success.
- If backend returns an unusable or undocumented shape, the UI shows a truthful unavailable/error state.
- Loading state disables duplicate downloads for the same policy.
- Errors are parsed with `parseApiError`.
- Object URLs are revoked after use.
- Missing content type or unclear response headers are documented in `CONTEXT.md`.

Testing:

- Tests cover successful blob download, filename fallback, loading state, duplicate-click prevention, API error, malformed/empty response, and unavailable contract branch.

Dependencies:

- Tasks 2 and 4.

### Task 11: Premiums Page Composition Under Authenticated Dashboard Route

Goal: Compose the protected Premiums Bought route inside the existing dashboard shell.

Files likely touched:

- `src/app/(app)/dashboard/premiums/page.tsx`
- `src/app/(app)/dashboard/premiums/loading.tsx`
- `src/app/(app)/dashboard/premiums/error.tsx`
- `src/components/dashboard/premiums/premiums-page-controller.tsx`
- `src/components/dashboard/shell/app-navigation.tsx`
- `src/lib/constants.ts`
- `src/__tests__/pages/dashboard-premiums.test.tsx`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Page metadata is defined.
- Route is protected by the existing app layout and auth flow.
- Sidebar Premiums Bought item is enabled and active on `/dashboard/premiums`.
- Page heading and subtitle match the brief.
- Summary, list, empty state, detail panel, and report action compose without duplicate policy requests.
- Route-level loading reserves stable dashboard geometry.
- Page-level error boundaries remain friendly and recoverable.

Testing:

- Page tests cover protected composition, active navigation, metadata-adjacent render expectations where practical, summary/list composition, and route loading.

Dependencies:

- Tasks 6 through 10.

### Task 12: Responsive And Accessibility Pass

Goal: Verify and refine layout, keyboard behavior, and assistive technology semantics across supported viewport sizes.

Files likely touched:

- Premiums components from previous tasks
- `src/__tests__/components/dashboard/premiums-accessibility.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- No horizontal overflow at 320, 360, 390, 768, 1024, 1280, and 1440+ widths.
- Filter chips remain reachable and legible on small screens.
- Policy card action rows wrap without clipped text.
- Slide-over is full-screen or bottom-sheet style on mobile and bounded right panel on desktop.
- Only one page-level `h1` exists.
- Async states use `role="status"`/`aria-live` or `role="alert"` appropriately.
- Icon-only controls have accessible names and visible focus rings.
- Color is not the only status indicator.

Testing:

- Testing Library assertions for roles, names, focus order, and async announcements.
- Playwright mobile/desktop overflow checks as part of Task 14.

Dependencies:

- Task 11.

### Task 13: Unit And Integration Test Coverage

Goal: Add focused automated coverage for validators, services, hooks, and components.

Files likely touched:

- `src/__tests__/lib/policies-validators.test.ts`
- `src/__tests__/services/policies.service.test.ts`
- `src/__tests__/hooks/policies-hooks.test.tsx`
- `src/__tests__/components/dashboard/premiums-*.test.tsx`
- `src/__tests__/pages/dashboard-premiums.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Tests cover loading, success, error, malformed response, empty, retry, filters, keyboard navigation, detail panel, report action, and mobile-friendly structure.
- Tests assert real user-visible behavior, not implementation trivia.
- Existing dashboard, marketplace, settings, and auth tests remain passing.

Testing:

- Focused premiums test files.
- Relevant existing shell/navigation tests.

Dependencies:

- Tasks 3 through 12.

### Task 14: E2E Coverage

Goal: Add Playwright coverage for critical Premiums Bought user flows.

Files likely touched:

- `e2e/dashboard/premiums-flow.spec.ts`
- Playwright helpers/fixtures if needed
- `CONTEXT.md`

Acceptance criteria:

- Unauthenticated direct entry redirects to login without protected content.
- Authenticated user can open `/dashboard/premiums`.
- Existing-policies state renders summary, filters, and cards from mocked API data.
- Filtering policies works for active, due soon, and expired scenarios.
- `View Details` opens the panel; Escape/backdrop/close dismiss it and restore focus.
- Empty state renders when policy list is empty and CTAs navigate to expected routes.
- Report action is covered where mockable under the locked backend response shape.
- Mobile viewport has no horizontal overflow.

Testing:

- `npm run test:e2e -- e2e/dashboard/premiums-flow.spec.ts`

Dependencies:

- Task 13.

### Task 15: Final QA And Handoff

Goal: Complete verification, document outcomes, and hand off the implemented Premiums Bought feature.

Files likely touched:

- `CONTEXT.md`
- `DASHBOARD_PREMIUMS_EPICS.md` only if implementation discoveries require plan updates

Acceptance criteria:

- `CONTEXT.md` includes a final Premiums Bought summary with files changed, important decisions, known follow-ups, and validation results.
- Any unresolved backend/product gaps are listed clearly, especially report payload shape, due-soon semantics, next-payment data, document URLs, and missing description/coverage fields.
- Generated files were regenerated only through scripts.
- No unrelated refactors or stale debug code remain.

Testing:

- `npm run generate:types` if OpenAPI changed.
- Focused premiums unit/integration tests.
- Relevant existing dashboard/shell/navigation tests.
- `npm test -- --run`
- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`
- Premiums Playwright spec.
- `npm run build` when environment/network allows.

Dependencies:

- Task 14.

## Testing And QA Strategy

- Validator tests prove runtime contracts match generated OpenAPI aliases and reject stale legacy policy shapes.
- Service tests prove authenticated requests use the right endpoints, params, signals, response parsing, and report handling.
- Hook tests prove React Query keys include filters and IDs, detail queries are disabled until selected, and retry/error states stay in-page.
- Component tests prove accessible filters, policy cards, overview card, empty state, slide-over behavior, and report button states.
- Page tests prove route composition under the authenticated shell and active sidebar behavior.
- MSW tests prove mocks stay aligned with the real contracts and do not regress to legacy array-shaped policies.
- Playwright proves the main user flows at desktop and mobile sizes: open page, filter policies, open/close details, empty state, report action where mockable, and no horizontal overflow.
- Final QA should include full unit suite, lint, typecheck, diff check, and a production build where the environment permits.

## Final Handoff And Update Requirements

Every implementation task must update `CONTEXT.md` with:

- Date/time in WAT.
- Task number and name completed.
- Files changed.
- Summary of what changed.
- Important decisions, especially API/UX/accessibility/security decisions.
- Known follow-ups and backend gaps.
- Validation commands and results.

The final handoff must explicitly state:

- The protected route implemented.
- Which policy endpoints are used.
- Whether report download is enabled or shown as unavailable, and why.
- Which screenshot details could not be implemented from current API fields.
- Test commands run and any commands not run.
