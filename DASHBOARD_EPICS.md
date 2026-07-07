# GigSecure Dashboard Feature Epic

## Objective

Implement the protected GigSecure dashboard and authenticated app shell in Next.js App Router with TypeScript, React Query, Zustand-backed memory-only session flags, runtime-validated API data, accessible responsive navigation, faithful unassessed and assessed states, a conditional KYC reminder, and an adapter-ready notification experience.

This document is the implementation source of truth. Implementation must proceed in task order. The epic does not authorize dashboard feature code during this planning task.

Implementation status: Tasks 1–22 completed in order on 2026-07-07. The final implementation map, verification evidence, environmental blockers, and unresolved backend/product questions are recorded below and in `CONTEXT.md`.

## Scope Summary

- Replace the current protected-layout wrapper with the screenshot-aligned authenticated shell: skip link, persistent desktop sidebar, content-column navbar, responsive main area, and mobile navigation drawer.
- Replace the dashboard placeholder with API-driven unassessed and assessed overview states.
- Integrate `GET /api/v1/dashboard/overview`, `GET /api/v1/users/me`, and the corrected `GET /api/v1/risk/assessment` contract through the existing authenticated `apiClient`.
- Reuse the existing memory-only `kycVerified` and `riskAssessed` state, profile hydration, KYC flow, risk flow, marketplace route, API error parser, React Query, MSW, Vitest, and Playwright foundations.
- Build reusable dashboard metric, hero, prompt, chart, checklist, actions, notification, loading, empty, and error primitives.
- Support the persistent KYC reminder shown in `Banner (1).png` when `kycVerified === false`.
- Build the notification preview and accessible slide-over as a production-safe UI boundary without inventing notification feed endpoints.
- Verify accessibility, responsive behavior, performance, and visual fidelity at the required viewport widths.

Out of scope: Premiums Bought page implementation, Profile page implementation, Settings page implementation, policy purchase, claims, admin dashboard, marketplace redesign, a new authentication architecture, a new KYC or risk store, and undocumented notification APIs.

## Codebase Audit Summary (Historical Pre-Implementation Baseline)

Task 1 revalidation on 2026-07-06 confirmed that the audit below matched the live repository before dashboard implementation began. It is retained as historical evidence and is superseded for current file/state questions by the final implementation handoff below.

- `src/app/(app)/dashboard/page.tsx` exists under the protected `(app)` route group. It currently renders `KycDashboardBanner`, `KycRecommendationsAction`, a generic heading, and three animated placeholder cards. It does not implement either supplied dashboard state.
- `src/app/(app)/dashboard/loading.tsx` contains only a centered spinner. It does not reserve the screenshot layout or prevent dashboard-scale layout shift.
- `src/app/(app)/layout.tsx` wraps children in `ProtectedRoute`, generic padding, and the public `Footer`. It has no authenticated sidebar, navbar, skip link, drawer, or dashboard-aware content column.
- `src/components/kyc/dashboard/kyc-dashboard-banner.tsx` and its tests exist, but the current copy, CTA, card styling, and dismiss button do not match `Banner (1).png`. The supplied banner has no dismiss control and reads as a persistent verification requirement.
- `src/components/kyc/dashboard/kyc-recommendations-action.tsx` is a working KYC-gated risk-recommendations consumer. Its gate/modal and error-handling patterns can be reused, but the current standalone card is not the dashboard composition shown in the screenshots.
- No live `src/types/dashboard.ts`, `src/lib/validators/dashboard.ts`, `src/services/dashboard.service.ts`, `src/hooks/dashboard/useDashboard.ts`, `ENDPOINTS.DASHBOARD`, dashboard query key, or dashboard MSW handler exists. `CONTEXT.md` records that variants briefly existed during an earlier marketplace pass, but they were subsequently removed. The live repository is authoritative.
- `openapi.json` and `src/types/schema.d.ts` already contain `GET /api/v1/dashboard/overview`, `DashboardOverviewResponse`, and `IncomeStabilityPattern`. Those dashboard shapes are semantically aligned with the supplied OpenAPI.
- The repository OpenAPI does not match the supplied OpenAPI as a whole. In particular, the local `GET /api/v1/risk/assessment` response has no schema, the supplied `AssessmentResponse` and related schemas are absent, and `/api/v1/settings/notifications` plus its preference schemas are absent. Many additional supplied paths/schemas are also missing.
- Because `src/types/schema.d.ts` is generated from the incomplete local OpenAPI, it is current for the local file but stale relative to the supplied contract. OpenAPI synchronization and `npm run generate:types` are required before dashboard runtime implementation. The generated file must never be hand-edited.
- `src/lib/validators/risk.ts` currently validates the latest assessment as `{ id, user_id, score?: { score, level } }`. The supplied API returns `AssessmentResponse` with `applicant`, `category`, `pillar_scores`, `overall_score`, `risk_profile`, `recommendations`, optional `recommended_categories`, and `ai_insights`. `riskService.getLatestAssessment` therefore conflicts with the supplied contract and must be corrected before the assessed risk visualization is trusted.
- `src/store/auth-store.ts` stores the access token, `kycVerified`, and `riskAssessed` in memory-only Zustand state. Full sessions use `setSession`; `/users/me`, KYC success, and future risk completion use `setFlags`. `clearAuth` removes all flags and tokens.
- `src/hooks/auth/useUserFlags.ts` exposes nullable flags, resolved booleans, and an authenticated unresolved-flags loading state without requiring feature components to import the raw store.
- `src/hooks/user/useUser.ts`, `src/hooks/user/useUserProfile.ts`, and `src/services/user.service.ts` already fetch and runtime-validate `/users/me`, pass an `AbortSignal`, hydrate the user, and synchronize `kyc_verified` and `risk_assessed` through `setFlags`.
- `ProtectedRoute`, middleware refresh-cookie checks, silent refresh, browser-safe auth BFF responses, the refresh mutex, and `apiClient` must be reused unchanged as the session security boundary.
- Reusable primitives include `parseApiError`, existing buttons/spinners, KYC gate/modal patterns, marketplace public routing, risk-assessment routing, React Query providers, MSW registration, Testing Library helpers, and Playwright configuration.
- Existing tests cover auth initialization, route protection, memory-only tokens/flags, profile flag hydration, KYC states and modal focus behavior, marketplace public/auth boundaries, and the current dashboard KYC banner. Dashboard coverage itself is only two placeholder-era page tests and must be replaced because the intended behavior legitimately changes.

Authoritative screenshot data mapping:

| Screenshot value or behavior | Source of truth | Audit result |
|---|---|---|
| Greeting first name | `GET /api/v1/users/me` → `user.first_name` | Available through `useUserProfile` |
| Email-verification checklist state | `GET /api/v1/users/me` → `user.email_verified` | Available |
| KYC banner and KYC actions | Memory-only `kycVerified`, synchronized from auth and `/users/me` | Available; reuse existing architecture |
| Assessed/unassessed global flag | Memory-only `riskAssessed` | Available for gating and initialization |
| Dashboard assessed state | Dashboard overview `has_assessment` after query success | Available and authoritative for dashboard presentation |
| Premiums Bought | Dashboard overview `premiums_bought` | Available |
| Monthly Income | Dashboard overview `monthly_income_band` | Available, nullable |
| Safety Buffer | Dashboard overview `safety_buffer` | Available, nullable string |
| Recommended Plans | Dashboard overview `recommended_plans_count` | Available |
| Stability score/classification/line | Dashboard overview `income_stability` | Available, nullable |
| Financial Risk Level text/score | Latest `AssessmentResponse.risk_profile` and `overall_score` | Supplied contract available; current runtime contract is stale |
| Assessed recommendation copy | Latest `AssessmentResponse.recommendations` | Available after risk contract correction |
| Active-policy subtitle under Premiums Bought | Potentially `PolicySummary.active_count`, not dashboard overview | Do not fetch by default merely to decorate the metric; product decision required |
| Current date | Client/server clock only | Available as display-only; dashboard endpoint has no date parameter |
| Notification feed, unread count, grouping, read state | No documented endpoint | Unavailable; do not fabricate production data |
| Tour, product demo, notification read actions | No documented endpoint/destination | Unavailable; render non-deceptive placeholders or omit pending product decisions |

## API Contracts

### `GET /api/v1/dashboard/overview`

Authenticated through the existing `apiClient` and in-memory Bearer token.

`DashboardOverviewResponse`:

- `premiums_bought: number` — integer, default `0`.
- `monthly_income_band: string | null`.
- `safety_buffer: string | null`.
- `recommended_plans_count: number` — integer, default `0`.
- `income_stability: IncomeStabilityPattern | null`.
- `has_assessment: boolean` — default `false`.

`IncomeStabilityPattern`:

- `score: number` — integer.
- `classification: string`.
- `graph_points: number[]`.

The service must runtime-validate the complete response with Zod, accept an `AbortSignal`, and reject malformed data with the established invalid-response error pattern. The dashboard query must have one canonical query key and must not duplicate requests across widgets.

### `GET /api/v1/users/me`

Reuse `userService.getMe` and `useUserProfile`; do not add a dashboard-specific profile request. It provides `user.first_name`, `user.email_verified`, nullable `profile`, `kyc_verified`, and `risk_assessed` and synchronizes the shared flags.

### `GET /api/v1/risk/assessment`

The supplied contract returns the latest `AssessmentResponse`:

- `applicant: ApplicantProfile`.
- `category: string`.
- `pillar_scores: { income, client, safety, equipment, health }`, each `0..100`.
- `overall_score: number`, `0..100`.
- `risk_profile: string`.
- `recommendations: string[]`.
- `recommended_categories?: string[]`.
- `ai_insights: string`.

The dashboard uses `risk_profile` and `overall_score` for the accessible risk-level visualization and may use `recommendations` for assessed actions. It must not use the current stale `{ id, user_id, score }` runtime shape. The existing `useLatestAssessment` query key/service path should be corrected and reused rather than duplicated.

### Supporting contracts

- KYC status remains a fallback only when existing session/profile flags are unresolved or a KYC-specific screen needs authoritative verification detail. The dashboard must not make a redundant KYC status request solely to decide banner visibility.
- Dashboard metrics must use `DashboardOverviewResponse`; do not call policy list/summary to recalculate `premiums_bought`.
- `PolicySummary.active_count` may be used only if product explicitly requires the active-policy subtitle and accepts the extra authenticated request. Until then, omit or use neutral copy rather than infer it.
- `/api/v1/settings/notifications` in the supplied OpenAPI controls notification preferences only. It does not supply notification items or read state and is not a feed API.

### OpenAPI synchronization rule

Task 2 must synchronize the repository OpenAPI with the supplied source semantically, regenerate with `npm run generate:types`, and immediately run `npx tsc --noEmit`. `src/types/schema.d.ts` must never be edited manually. Formatting-only differences do not justify contract edits.

## Screenshot Analysis

All four files are 1512px wide. `Banner (1).png`, `Overview (4).png`, and `Overview (5).png` are 1512×1294; `Overview (6).png` is 1512×1133.

### Shared authenticated shell

- A 298px pale-teal desktop sidebar sits left of the content column. It contains the GigSecure mark, five generously spaced navigation rows, and a bottom marketplace promotion.
- Overview is active with a dark-teal row, a yellow 7px left rail, white icon, and white label.
- The content-column navbar is approximately 100px high and does not extend over the sidebar. It contains a menu button, 456px search field, circular bell, bordered premiums control, and teal tour button.
- Main content uses an off-white/very-light-gray canvas rather than the global yellow background. Cards are white with fine neutral/teal borders, modest radii, and restrained shadows.
- The marketplace promotion uses a pale-yellow card with teal umbrella/shield artwork and a yellow CTA. No matching repo asset currently exists; implementation needs an approved, optimized raster/SVG asset with explicit dimensions or a CSS/SVG treatment built from owned assets.
- On constrained screens, the sidebar must become a drawer. The navbar must prioritize menu, search, and bell without shrinking labels into illegibility. Disabled placeholder controls must not consume scarce mobile width.

### `Banner (1).png` — KYC-unverified dashboard

- A full-width pale-teal KYC reminder appears immediately below the navbar and above the dashboard heading.
- It contains a verification badge, “Verify your KYC”, supporting copy, and an outlined “Verify now” CTA. No dismiss icon is shown.
- Below it is the same unassessed overview as `Overview (4).png`; the KYC state is orthogonal to risk-assessment state.
- The banner must link to `/kyc` with a safe dashboard return target and must use the shared KYC flag. This design supersedes the existing session-dismissible banner behavior for this dashboard epic.

### `Overview (4).png` — unassessed, KYC-verified dashboard

- The page begins with “Dashboard”, personalized afternoon greeting, and a yellow-outlined date display aligned right.
- A wide dark-teal onboarding hero and a narrow risk prompt share the first content row.
- Hero copy is “Lets get you protected” with yellow risk-assessment and outlined product-demo CTAs.
- The prompt card uses a centered icon, explanatory copy, primary “Generate Risk Score” CTA, and secondary explanatory link.
- Four equal metric cards follow: Premiums Bought, Monthly Income, Safety Buffer, and Recommended Plans. Each has an icon tile, label, main value, supporting text, divider, and action row.
- The lower row contains an Income Stability Pattern card with a meaningful empty state and a “Lets get started” checklist. The empty chart grid is decorative only; the accessible message must state that assessment is required.

### `Overview (5).png` — assessed, KYC-verified dashboard

- The hero changes to “Here’s your financial snapshot.” and the primary CTA becomes Explore Marketplace.
- The right prompt becomes a Financial Risk Level donut reading “Moderate”. The donut uses teal and yellow, but text supplies the meaning so color is not the only signal.
- Metric cards contain populated income, safety-buffer, and plan-count values.
- Income Stability Pattern contains a curved line plus a “Moderate stability 42%” badge. The implementation must plot `graph_points`; it must not reproduce the screenshot curve when API points differ.
- The right lower column contains Recommended actions and a compact Notifications preview. Recommendation rows have distinct icon treatments and chevrons.
- The screenshot’s y-axis uses Naira labels, but `graph_points` has no documented unit. The implementation must not label points as currency until backend/product confirms the unit.

### `Overview (6).png` — notification slide-over

- The dashboard is dimmed under a right-side, full-height white panel approximately 670px wide.
- The panel contains “Notifications”, unread summary, Back control, divider, Today/Yesterday groups, pale-teal notification cards, and a “Mark all as read” control.
- It must be implemented as an accessible modal dialog: focus trap, focus restoration, Escape/backdrop/explicit close, body-scroll lock, labelled title/description, and reduced-motion-safe transition.
- The screenshot is a visual contract only. Production must show an unavailable/empty adapter state until a real feed contract exists; test fixtures may render the populated design without creating production endpoints.

## State Matrix

| State | Required behavior |
|---|---|
| Auth initialization pending | Preserve shell-sized loading space; do not flash dashboard or redirect content |
| Unauthenticated | Middleware/`ProtectedRoute` redirects to `/login?redirect=%2Fdashboard` using existing policy |
| Authenticated, flags unresolved | Show non-jumping dashboard skeleton; do not assume KYC or risk state |
| Unassessed + KYC verified | No KYC banner; onboarding hero, assessment prompt, null-safe metrics, stability empty state, getting-started checklist |
| Unassessed + KYC unverified | Persistent KYC banner plus the full unassessed state |
| Assessed + KYC verified | Snapshot hero, risk visualization, populated metrics, stability data, recommended actions, notification unavailable preview |
| Assessed + KYC unverified | Persistent KYC banner plus the full assessed state |
| Dashboard overview loading | Stable skeleton matching hero, four metrics, and lower grid; one overview request |
| Dashboard overview error | Accessible dashboard-level error with retry; keep authenticated shell usable |
| Overview success + `income_stability: null` | Render truthful empty state; do not fabricate line points, score, classification, or financial values |
| Overview success + populated stability | Render lightweight responsive SVG/CSS visualization plus textual/table equivalent from exact API points |
| `has_assessment` differs from `riskAssessed` | Use overview `has_assessment` for dashboard visual branch after success; retain shared flag for global gates, invalidate `/users/me`, and log/observe mismatch without inventing state |
| Latest assessment loading/error while assessed | Keep overview metrics visible; isolate risk card/actions loading or error with retry |
| Notification panel closed | No panel bundle/data work beyond lightweight trigger state; trigger remains keyboard accessible |
| Notification panel open | Trap focus, dim background, lock scroll, announce opening, restore focus on close |
| Notification feed contract unavailable | Render an honest unavailable/empty adapter state; make read controls unavailable; perform zero invented network calls |

## Open Questions

1. What production endpoint will provide notification items, unread count, grouping timestamps, mark-one-as-read, and mark-all-as-read? Notification preferences are not a feed.
2. Is the dashboard date element display-only, or will the backend add a date/range parameter to dashboard overview? Default: render a semantic `<time>` display without filter behavior.
3. What routes or actions should “Take A Tour”, “View Product Demo”, and “See what you will get” invoke? Default: omit or render clearly disabled coming-soon controls, never inert clickable buttons.
4. Should the Premiums Bought metric show `PolicySummary.active_count` as a subtitle? Default: avoid an extra policy request and show only dashboard-owned data.
5. What units and x-axis semantics do `income_stability.graph_points` use? Default: show an indexed trend with neutral numeric labels and an accessible value table, not Naira-labelled points.
6. Are `income_stability.score` values guaranteed to be `0..100`, and which classification strings are allowed? Runtime validation should enforce documented constraints only after backend confirmation.
7. Should missing `/premiums`, `/profile`, and `/settings` routes be added in separate epics? Default: show those sidebar destinations as visibly unavailable/coming soon rather than routing to 404 pages.
8. What is the approved source asset for the umbrella/shield marketplace promotion? Default: create an optimized owned asset during shell implementation only after visual/product approval.
9. Should recommended actions be backend-authored beyond `AssessmentResponse.recommendations`, or may profile/KYC/email flags produce deterministic completion actions? Default: derive only actions whose destination and completion state are authoritative.

## Product and Architecture Decisions

- The live repository overrides stale `CONTEXT.md` history. Removed dashboard foundations must be recreated deliberately and tested.
- The dashboard overview endpoint is the single source for dashboard metrics and the post-query assessed/unassessed visual branch. Shared `riskAssessed` remains the global memory-only gate and pre-query signal.
- Independent profile, overview, and latest-assessment queries should start together once authentication/flags permit; no sequential client waterfall is allowed.
- The App Router page remains a small server metadata/composition boundary. Interactive/query behavior belongs in focused client controllers and leaf components, not one monolithic dashboard client component.
- One dashboard overview query feeds all widgets. React Query data must not be copied into Zustand or mirrored into component state.
- Existing auth, profile, KYC, risk, marketplace, error, and routing primitives must be reused. No new global dashboard Zustand store is justified.
- The KYC banner is persistent while `kycVerified === false` and is not dismissible in this epic, matching the supplied design and verification requirement. It uses `/kyc?redirect=%2Fdashboard` or the existing safe redirect helper.
- The current standalone `KycRecommendationsAction` should be refactored into dashboard-composed actions where appropriate; verified recommendation fetching must continue to use the existing authenticated service path.
- The notification experience uses a typed UI adapter interface and test fixtures only. No production notification service, React Query hook, unread mutation, or endpoint constant is created until a backend contract exists.
- The date is display-only until the dashboard contract accepts a filter. It must not look like an enabled dropdown on mobile or desktop unless behavior exists.
- Missing sidebar destinations and undocumented tour/demo actions are non-deceptive disabled/coming-soon UI, not broken links.
- Simple risk and stability visuals use CSS and inline SVG. A chart library is not warranted for the supplied shapes.
- Every completed implementation task must append a WAT timestamped entry to `CONTEXT.md` using the exact protocol below. This requirement is binding for Tasks 1–22:

```text
### [DATE AND TIME WAT]

Task completed: Task [NUMBER] — [TASK NAME]

Files changed:
- [Full path]

Summary:
[What was built.]

Important decisions:
[Architecture, API, UX, performance, and accessibility decisions.]

Known follow-ups:
[Deferred work, backend gaps, and next-task requirements.]
```

## Performance Strategy

- Keep `src/app/(app)/dashboard/page.tsx` server-renderable for metadata and thin composition. Add `"use client"` only to the shell controls, query controller, drawer, interactive actions, and slide-over.
- Launch independent overview, profile, and latest-assessment work in parallel where enabled. Reuse canonical query keys so nested widgets never issue duplicate requests.
- Pass React Query `AbortSignal` through dashboard, user, and risk services. Keep an intentional dashboard `staleTime` and disable noisy focus refetch if product does not require near-real-time metrics.
- Do not mirror server data into local state. Derive greeting, labels, progress, checklist completion, and formatted values with pure helpers during render; memoize only genuinely expensive point/path calculations.
- Use lightweight CSS conic gradients or SVG for the risk ring and a small inline SVG path/polyline for stability. Do not introduce a chart dependency. If requirements later force one, dynamically import it and document bundle impact.
- Dynamically load the notification panel body when first opened if the split measurably reduces the authenticated shell bundle. Keep the bell trigger lightweight.
- Use direct icon imports. Avoid broad barrel imports and avoid sending large generated types or server-only data through client props.
- Reserve stable geometry in route loading, flag-resolution, overview-loading, and assessment-loading states to reduce cumulative layout shift.
- Use `next/image` for an approved marketplace promo raster with explicit dimensions and responsive sizes. Optimize any supplied asset before adding it to `public`.
- Apply `content-visibility` only if later notification lists become long; the current unavailable state does not warrant it.
- Final QA must include a production build, route bundle inspection, duplicate-request assertion, and a short before/after note for dashboard JS and layout stability.

## Accessibility and Responsive Strategy

- Add a “Skip to dashboard content” link as the first focusable authenticated-shell element. Use semantic `aside`/`nav`, `header`, `main`, and labelled dashboard sections with one page-level `h1`.
- All icon-only controls require accessible names, visible focus rings, and at least 44×44px touch targets.
- Desktop sidebar remains visible at the chosen large breakpoint. Tablet/mobile uses an accessible modal drawer with focus trap, focus restoration, Escape/backdrop/close dismissal, body-scroll lock, opening announcement, and `prefers-reduced-motion` support.
- Navbar controls collapse by priority: menu and bell remain; search becomes flexible or a labelled expand control; premiums/tour placeholders hide or move into secondary navigation rather than overflow.
- Main layout progresses from one column to two-column tablet arrangements to the desktop hero/prompt and lower-grid ratios. Metric cards use one, two, then four columns.
- KYC copy and hero CTA rows wrap without clipping. The date display moves into normal flow on small screens.
- Notification slide-over is full-screen or a bottom sheet on mobile, a bounded right panel on desktop, and never exceeds viewport width.
- SVG visuals include a concise accessible summary and a data table/list. Decorative grid lines and icons are hidden from assistive technology. Meaning is never conveyed by teal/yellow/red alone.
- Loading uses `role="status"`/`aria-live="polite"`; errors use an appropriate alert; async retry and completion updates are announced without duplicate chatter.
- Hydration-sensitive greeting/date content must use a stable server-safe fallback or update after hydration without mismatched markup. Tests must control time.
- Contrast must be verified against actual tokens. Add only the smallest named neutral/surface tokens needed to reproduce the dashboard canvas, borders, and text.
- Visual QA is mandatory at 320, 360, 390, 768, 1024, 1280, and 1440+ widths. At every width: no horizontal page overflow, legible text, stable cards, reachable controls, readable charts/actions, correct drawer/panel behavior, and no clipped KYC/hero content.
- Desktop screenshots must be compared at 1512px width against all four references, with pixel-level iteration based on rendered captures rather than source-code assumptions.

## Final Dashboard Implementation Handoff

This section describes the live implementation after Task 21. The earlier audit is a historical baseline only; files described there as absent, placeholder-only, or stale now have the roles below.

### Contracts, data, and state authority

- `openapi.json` and generated `src/types/schema.d.ts` contain the dashboard overview, corrected risk assessment, and notification-preference contracts. Notification preferences are not a feed contract.
- `src/types/dashboard.ts` exposes generated dashboard overview and income-stability types. `src/types/dashboard-notifications.ts` defines the UI-only notification adapter union and capabilities.
- `src/types/api.ts` exposes the corrected generated risk types used by the existing assessment flow.
- `src/lib/validators/dashboard.ts` and `src/lib/validators/risk.ts` runtime-validate dashboard and latest-assessment responses. `src/lib/api/endpoints.ts` and `src/lib/constants.ts` provide the documented endpoint and canonical query keys.
- `src/lib/dashboard/formatters.ts`, `chart.ts`, and `actions.ts` provide deterministic date/greeting/null formatting, O(n) neutral-unit SVG geometry, and authoritative checklist/action models.
- `src/services/dashboard.service.ts` fetches and validates one authenticated, cancellable overview response. `src/services/risk.service.ts` owns the corrected assessment, history, submission, and recommendation contracts.
- `src/hooks/dashboard/useDashboard.ts` exposes the single cached overview query. `src/hooks/risk/useRisk.ts` exposes the corrected latest-assessment query and existing risk operations.
- `src/hooks/user/useUser.ts`, `src/hooks/user/useUserProfile.ts`, and `src/hooks/auth/useUserFlags.ts` remain the only profile/flag hydration path. `src/store/auth-store.ts` remains the memory-only authority for the access token, `kycVerified`, and `riskAssessed`; none is persisted to `localStorage` or `sessionStorage`.
- `src/mocks/fixtures/dashboard.ts` supplies deterministic overview/profile/assessment data. `src/mocks/handlers/dashboard.ts` implements the documented authenticated overview mock; `src/mocks/handlers/domain.ts`, `index.ts`, `src/mocks/browser.ts`, and `src/mocks/server.ts` share corrected risk/dashboard registration.

### Protected shell and navigation

- `src/app/(app)/layout.tsx` composes the existing `ProtectedRoute` with `AuthenticatedAppShell`, `AppSidebar`, and `DashboardNavbar`; `src/components/auth/shared/protected-route.tsx` supplies the stable shell fallback during silent refresh.
- `src/app/globals.css` registers only the additional app canvas, sidebar, and border tokens required by the supplied visual contract.
- `src/components/dashboard/shell/authenticated-app-shell.tsx`, `app-skip-link.tsx`, and `app-shell-skeleton.tsx` provide semantic landmarks, the focusable `#dashboard-content` target, and stable initialization geometry.
- `src/components/dashboard/shell/app-sidebar.tsx`, `app-navigation.tsx`, `mobile-navigation-drawer.tsx`, and `marketplace-promo-card.tsx` provide the shared navigation model, persistent desktop sidebar, focus-trapped mobile drawer, honest unavailable destinations, and owned optimized promo artwork.
- `src/components/dashboard/shell/dashboard-navbar.tsx` and `dashboard-search.tsx` provide the content-column navbar and local-only labelled search. Premiums and tour controls remain explicitly unavailable.
- `public/assets/images/dashboard-marketplace-promo.webp` is the explicit-dimension 480×320, approximately 17 KiB marketplace promo asset.

### Route, controller, and dashboard widgets

- `src/app/(app)/dashboard/page.tsx`, `loading.tsx`, and `error.tsx` provide metadata, the thin server composition/date boundary, stable route loading, and resettable route error recovery.
- `src/components/dashboard/dashboard-overview-controller.tsx` coordinates flags, profile, overview, and assessment queries without mirroring server data. `dashboard-overview-content.tsx` composes the four KYC/assessment combinations and keeps assessment errors local.
- `src/components/kyc/dashboard/kyc-dashboard-banner.tsx` is the persistent, non-dismissible memory-flag-driven KYC reminder with a safe dashboard return target.
- `src/components/dashboard/overview/dashboard-section.tsx`, `metric-card.tsx`, `dashboard-date.tsx`, `dashboard-skeleton.tsx`, `dashboard-error-state.tsx`, and `dashboard-empty-state.tsx` provide reusable semantic card and async-state primitives.
- `src/components/dashboard/overview/unassessed-hero.tsx` and `risk-assessment-prompt.tsx` provide the unassessed branch and real assessment destination without inventing demo actions.
- `src/components/dashboard/overview/assessed-hero.tsx` and `risk-level-card.tsx` provide the assessed branch, real marketplace destination, and validated textual/visual risk summary.
- `src/components/dashboard/overview/income-stability-card.tsx`, `income-stability-chart.tsx`, and `income-stability-table.tsx` provide null/empty/populated states, a dependency-free SVG trend, and equivalent neutral-unit tabular values.
- `src/components/dashboard/overview/getting-started-checklist.tsx` and `recommended-actions.tsx` render authoritative flag/profile/recommendation actions without unsupported destinations.

### Notification adapter boundary

- `src/components/dashboard/notifications/notification-trigger.tsx` is the lightweight bell boundary.
- `notification-panel.tsx` is lazy-loaded on first open and owns modal labelling, focus trap/restoration, Escape/backdrop/back dismissal, body-scroll lock, reduced-motion-safe transitions, and full-screen mobile/bounded desktop geometry.
- `notification-preview.tsx`, `notification-list.tsx`, and `notification-unavailable-state.tsx` render ready, empty, populated, or production-unavailable adapter states.
- `src/mocks/fixtures/dashboard-notifications.ts` contains component-test-only Today/Yesterday examples. It is absent from production bundles, has no MSW handler, and does not imply a feed, unread-count, grouping, or read-mutation backend.

### Test map

- Contract/helper coverage: `src/__tests__/lib/dashboard-validators.test.ts`, `risk-validators.test.ts`, `dashboard-formatters.test.ts`, and `src/__tests__/mocks/dashboard-handlers.test.ts`.
- Service/hook coverage: `src/__tests__/services/dashboard.service.test.ts`, `risk.service.test.ts`, `src/__tests__/hooks/dashboard-hooks.test.tsx`, and `risk-hooks.test.tsx`.
- Shell/widget coverage: every file under `src/__tests__/components/dashboard/` covers the shell, navigation/drawer, navbar/search, primitives, both hero branches, stability visualization, actions, controller states, and notification panel. `src/__tests__/components/kyc/kyc-dashboard-banner.test.tsx`, `src/__tests__/components/auth/route-guards.test.tsx`, `src/__tests__/pages/dashboard.test.tsx`, and `src/__tests__/store/auth-store.test.ts` cover the shared banner, protected boundary, route composition, and memory-only security regression.
- Browser coverage: `e2e/dashboard/dashboard-flow.spec.ts` covers 11 deterministic dashboard scenarios. Task 21 also updated `e2e/auth/auth-flows.spec.ts`, `e2e/kyc/kyc-flow.spec.ts`, and `e2e/marketplace/marketplace-flow.spec.ts` so the full browser matrix reflects the completed dashboard route. `playwright.config.ts` uses one worker for stable compilation against one Next development server.

### Final verification, performance, and accessibility evidence

- Focused dashboard/unit validation passed: 20 files and 161 tests. Full Vitest passed: 96 files and 592 tests. ESLint passed with 0 errors and 15 pre-existing non-dashboard warnings. `npx tsc --noEmit` and `git diff --check` passed.
- Task 22's documentation-only verification passed after the handoff edit: the focused dashboard/security slice passed 21 files and 172 tests, `npm run lint` passed with 0 errors and the same 15 pre-existing warnings, `npx tsc --noEmit` passed, and `git diff --check` passed.
- The focused dashboard Chromium suite passed 11 tests and the full Chromium matrix passed 35 tests in an isolated copy using the same source/specs and a temporary webpack development-server flag. The exact workspace commands remain blocked because unresponsive PID 66527 owns `.next/dev/lock`; no process or lock was removed without approval.
- The exact production build was blocked by restricted DNS to `fonts.googleapis.com`, and the network-escalated retry did not complete. An isolated fallback with only the Google font loader temporarily omitted and webpack selected compiled, typechecked, generated 36 static pages, and emitted `/dashboard`; the real source font configuration was not changed.
- `/dashboard` is statically generated. Its page chunk is 44 KiB raw/9,967 bytes gzip; the dashboard route entry set is 148 KiB raw/46,018 bytes gzip excluding global/app shared runtime; the authenticated layout entry is 16 KiB raw/4,178 bytes gzip. The panel is a separate 12 KiB raw/3,021 bytes gzip lazy chunk and is absent from the initial page client-reference set. No chart dependency, notification fixture, or notification feed/read API entered production chunks.
- Integration/E2E evidence confirms one overview request, canonical query deduplication, parallel profile/overview/assessment starts, stable shell/overview skeletons, no protected-content flash, and zero notification feed/read requests. Numeric CLS thresholds were not invented; stable reserved geometry and rendered transition observations are the recorded CLS evidence.
- Rendered unassessed dashboard checks covered 320, 360, 390, 768, 1024, 1280, 1440, and 1512px with no horizontal overflow. Keyboard coverage confirms skip-link transfer, drawer and notification-panel focus traps/restoration, Escape/backdrop/explicit close, body-scroll lock, visible focus, 44px targets, and error retry. Loading, error, null/empty, KYC, assessed/unassessed, reduced-motion, chart-equivalent, and mobile states remain covered by integration/browser tests.

### Unresolved backend and product decisions

- A production notification feed contract is still absent: item shape, timestamps/grouping, unread count, mark-one-as-read, and mark-all-as-read remain unavailable. Notification preference settings do not fill this gap.
- The dashboard date remains display-only because the overview endpoint accepts no date/range parameter.
- `income_stability.graph_points` units and x-axis semantics remain undocumented; values remain neutral indexed observations rather than Naira-labelled data.
- “Take A Tour,” “View Product Demo,” and “See what you will get” have no supported destinations and remain disabled/omitted.
- Premiums Bought has no dashboard-owned active-policy subtitle; no extra policy request is made. Premiums, Profile, and Settings routes remain outside this epic and their navigation rows stay unavailable.
- Backend/product confirmation is still required for score-range/classification guarantees beyond the documented runtime contract and for any additional backend-authored recommended-action destinations.

### Task completion ledger

Tasks 1–22 are complete. Each task has a timestamped `CONTEXT.md` entry; Task 20's workspace runtime blocker was closed by Task 21's isolated 11/11 and 35/35 browser verification, while the workspace lock and Google-font network limitations remain recorded as environment-specific exact-command blockers rather than hidden successes.

## Epic Tasks

### Task 1: Dashboard Codebase Audit and Contract Lock

Status: complete on 2026-07-06. The live-tree audit, contract gaps, state authority, performance boundary, and screenshot requirements are locked; implementation must continue with Task 2.

**Goal**

Confirm the live dashboard, authenticated shell, contracts, reusable primitives, screenshot states, and backend gaps before implementation.

**Files likely touched**

- `DASHBOARD_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Re-run the audit against the live branch before coding. Confirm that dashboard runtime/service/hook files remain absent, record current KYC banner behavior, verify auth/profile/risk contracts, and lock the state/data authority rules from this epic. Append the required `CONTEXT.md` entry; do not create UI or API code in this task.

**Acceptance criteria**

- Audit findings match the live repository rather than historical documentation.
- API mismatches and notification/date/demo gaps remain explicit.
- The assessed/unassessed and KYC state authority rules are documented.
- No feature code or test behavior changes are introduced.

**Testing**

- Run `git diff --check`.
- No feature test is required for this documentation-only task.

**Performance considerations**

- Lock the one-overview-query and no-global-dashboard-store decisions before implementation.

**Accessibility and responsive requirements**

- Confirm all four screenshots and required viewport sizes remain in the acceptance plan.

**Dependencies**

- None.

### Task 2: OpenAPI Synchronization and Generated Types

Status: complete on 2026-07-06. The supplied risk-assessment and notification-preference contracts are synchronized, marketplace access boundaries are preserved, and generated declarations are current.

**Goal**

Make the repository OpenAPI and generated declarations reflect the supplied dashboard, risk-assessment, and notification-preference contracts.

**Files likely touched**

- `openapi.json`
- `src/types/schema.d.ts`
- `CONTEXT.md`

**Implementation details**

Semantically synchronize the supplied OpenAPI, including the corrected latest-assessment response and settings notification preferences. Preserve intentionally public marketplace security boundaries already established in the repo. Regenerate declarations through the script; never hand-edit the generated file.

**Acceptance criteria**

- Dashboard overview schemas remain semantically unchanged where already correct.
- `AssessmentResponse` and referenced schemas are present and wired to `GET /api/v1/risk/assessment`.
- Notification preference schemas/path are present but are not misrepresented as a notification feed.
- Existing marketplace public/auth security semantics are not regressed.

**Testing**

- Run `npm run generate:types`.
- Run `npx tsc --noEmit` immediately after generation.
- Run `git diff --check` and inspect the generated diff.

**Performance considerations**

- Generated declarations are type-only and must not enter the client runtime bundle.

**Accessibility and responsive requirements**

- No UI is added; contract names must support later accessible labels without inventing fields.

**Dependencies**

- Task 1.

### Task 3: Dashboard Runtime Types, Validators, Endpoints, Query Keys, and Helpers

Status: complete on 2026-07-06.

**Goal**

Create the accurate runtime/type foundation for dashboard and corrected latest-assessment data.

**Files likely touched**

- `src/types/dashboard.ts`
- `src/lib/validators/dashboard.ts`
- `src/lib/validators/risk.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/constants.ts`
- `src/lib/dashboard/formatters.ts`
- `src/lib/dashboard/chart.ts`
- `src/__tests__/lib/dashboard-validators.test.ts`
- `src/__tests__/lib/risk-validators.test.ts`
- `src/__tests__/lib/dashboard-formatters.test.ts`
- `CONTEXT.md`

**Implementation details**

Add Zod schemas for dashboard overview and income stability, align risk assessment validation to generated `AssessmentResponse`, add `ENDPOINTS.DASHBOARD.OVERVIEW`, canonical dashboard query keys, and pure helpers for greeting, date, nullable displays, classification labels, percentages, and SVG point normalization. Do not encode undocumented currency units or classification enums.

**Acceptance criteria**

- Valid nullable/unassessed and populated/assessed overview payloads parse.
- Negative counts, fractional count fields, non-array points, and malformed assessment scores fail validation.
- Optional generated fields are handled exactly as documented.
- Helpers are deterministic under a supplied date/time and never emit `NaN`, `undefined`, or fabricated financial values.
- Existing risk submission/report code remains type-safe after the contract correction.

**Testing**

- Add focused validator/helper Vitest coverage, including malformed payload failures.
- Run `npm test -- --run src/__tests__/lib/dashboard-validators.test.ts src/__tests__/lib/risk-validators.test.ts src/__tests__/lib/dashboard-formatters.test.ts`.
- Run `npx tsc --noEmit`.

**Performance considerations**

- Helpers remain small, pure, and tree-shakeable; chart path calculation is O(n).

**Accessibility and responsive requirements**

- Helpers provide textual equivalents for every visual score/chart and locale-safe date output.

**Dependencies**

- Task 2.

### Task 4: Dashboard MSW Fixtures and Contract Tests

Status: complete on 2026-07-06.

**Goal**

Provide deterministic dashboard and corrected assessment network fixtures for tests without inventing notification APIs.

**Files likely touched**

- `src/mocks/handlers/dashboard.ts`
- `src/mocks/handlers/domain.ts`
- `src/mocks/fixtures/dashboard.ts`
- `src/mocks/fixtures/dashboard-notifications.ts`
- `src/mocks/browser.ts`
- `src/mocks/server.ts`
- `src/__tests__/mocks/dashboard-handlers.test.ts`
- `CONTEXT.md`

**Implementation details**

Add overview fixtures for unassessed/null stability, assessed/populated stability, malformed response, authenticated failure, and delayed loading. Replace stale latest-assessment mock shapes. Notification items may exist only as component-test fixture objects behind a UI adapter; do not register a fake production route.

**Acceptance criteria**

- Dashboard handler matches the real authenticated endpoint and validates expected Bearer behavior in tests.
- Fixtures cover both assessment states, KYC-independent profile flags, null fields, populated points, and errors.
- No `/notifications`, unread, or read-state handler is added.
- Browser and Node MSW registrations use the same dashboard handler.

**Testing**

- Run `npm test -- --run src/__tests__/mocks/dashboard-handlers.test.ts`.
- Assert malformed fixtures are rejected by runtime validation in the service layer task.

**Performance considerations**

- Keep fixtures test-only and avoid importing them into production components.

**Accessibility and responsive requirements**

- Fixtures include long names/labels and empty values needed to exercise wrapping and accessible states.

**Dependencies**

- Task 3.

### Task 5: Dashboard Service and React Query Hooks

Status: complete on 2026-07-06.

**Goal**

Integrate dashboard overview and corrected latest assessment through existing authenticated data patterns.

**Files likely touched**

- `src/services/dashboard.service.ts`
- `src/services/risk.service.ts`
- `src/hooks/dashboard/useDashboard.ts`
- `src/hooks/risk/useRisk.ts`
- `src/__tests__/services/dashboard.service.test.ts`
- `src/__tests__/services/risk.service.test.ts`
- `src/__tests__/hooks/dashboard-hooks.test.tsx`
- `src/__tests__/hooks/risk-hooks.test.tsx`
- `CONTEXT.md`

**Implementation details**

Create a runtime-validating dashboard service that accepts `AbortSignal`, and one canonical overview query with an intentional `staleTime`. Correct the existing latest-assessment service/hook without adding a parallel query. Keep normal query errors representable to the dashboard controller rather than forcing a route-level throw for every widget.

**Acceptance criteria**

- Authenticated calls use `apiClient`, memory Bearer token, endpoint constants, and `AbortSignal`.
- One mounted controller produces one overview request even when many widgets consume the data.
- Malformed overview and assessment responses fail runtime validation.
- Expected 4xx errors are not repeatedly retried; transient policy follows existing query conventions.
- Profile data continues through `useUserProfile` with no duplicate `/users/me` request.

**Testing**

- Run focused service/hook tests with MSW.
- Assert Authorization, cancellation, cache-key reuse, malformed response handling, error/retry behavior, and no duplicate overview requests.
- Run `npx tsc --noEmit`.

**Performance considerations**

- Start overview/profile/assessment requests without avoidable waterfalls and deduplicate through React Query.

**Accessibility and responsive requirements**

- Hooks expose loading/error/refetch state so UI can announce each state accurately.

**Dependencies**

- Tasks 3 and 4.

### Task 6: Authenticated App Shell Foundation

Status: complete on 2026-07-06.

**Goal**

Replace generic protected layout chrome with a semantic, stable authenticated shell.

**Files likely touched**

- `src/app/(app)/layout.tsx`
- `src/components/dashboard/shell/authenticated-app-shell.tsx`
- `src/components/dashboard/shell/app-skip-link.tsx`
- `src/components/dashboard/shell/app-shell-skeleton.tsx`
- `src/__tests__/components/dashboard/authenticated-app-shell.test.tsx`
- `CONTEXT.md`

**Implementation details**

Keep `ProtectedRoute` as the session boundary, remove the public footer from the screenshot-aligned shell, establish sidebar/header/main slots, add the skip link and stable content-column geometry, and ensure existing `/kyc` and `/change-password` content still renders inside the shell.

**Acceptance criteria**

- Protected routes retain silent-refresh/no-flicker behavior.
- Shell uses semantic landmarks and a unique main target.
- Desktop geometry matches the content-column relationship in screenshots.
- Existing protected pages do not gain horizontal overflow or lose access to their content.

**Testing**

- Add shell composition and protected-route regression tests.
- Run `npm test -- --run src/__tests__/components/dashboard/authenticated-app-shell.test.tsx src/__tests__/components/auth/route-guards.test.tsx`.

**Performance considerations**

- Keep the shell mostly server-renderable/static; interactive state stays in leaf controls.

**Accessibility and responsive requirements**

- Skip link is first focusable, visible on focus, and moves focus to `main`; landmarks are uniquely labelled.

**Dependencies**

- Task 1 and existing `ProtectedRoute`.

### Task 7: Persistent App Sidebar and Mobile Navigation Drawer

Status: complete on 2026-07-06.

**Goal**

Build the screenshot-aligned desktop sidebar and a production-grade mobile drawer.

**Files likely touched**

- `src/components/dashboard/shell/app-sidebar.tsx`
- `src/components/dashboard/shell/app-navigation.tsx`
- `src/components/dashboard/shell/mobile-navigation-drawer.tsx`
- `src/components/dashboard/shell/marketplace-promo-card.tsx`
- `public/assets/images/dashboard-marketplace-promo.png`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `CONTEXT.md`

**Implementation details**

Implement logo, five screenshot navigation rows, active-path styling, yellow active rail, and bottom marketplace promo. Route Overview to `/dashboard`, Risk assessment to `/assessment`, and marketplace promo to `/marketplace`. Keep missing Premiums/Profile/Settings destinations visibly unavailable until their routes exist. Build the constrained-screen drawer from the same navigation model.

**Acceptance criteria**

- Desktop sidebar is persistent, active Overview state is exact, and navigation uses one data model.
- Promo asset is approved, optimized, and rendered with explicit dimensions.
- Drawer traps/restores focus, locks body scroll, closes by Escape/backdrop/close/navigation, and announces state.
- Missing feature destinations do not route to 404 or masquerade as working links.

**Testing**

- Test active state, real destinations, unavailable items, keyboard order, drawer focus trap/restoration, Escape/backdrop close, and scroll lock.
- Run the focused navigation test suite.

**Performance considerations**

- Direct-import icons; share markup/data; do not ship duplicate desktop/mobile navigation trees with independent state logic.

**Accessibility and responsive requirements**

- 44px targets, visible focus, `aria-current="page"`, labelled drawer dialog, reduced motion, and no overflow at 320/360/390/768px.

**Dependencies**

- Task 6.

### Task 8: Dashboard Navbar and Responsive Control Strategy

Status: complete on 2026-07-06.

**Goal**

Implement the content-column navbar with prioritized responsive controls.

**Files likely touched**

- `src/components/dashboard/shell/dashboard-navbar.tsx`
- `src/components/dashboard/shell/dashboard-search.tsx`
- `src/components/dashboard/notifications/notification-trigger.tsx`
- `src/__tests__/components/dashboard/dashboard-navbar.test.tsx`
- `CONTEXT.md`

**Implementation details**

Add drawer trigger, labelled search, notification trigger, and screenshot placeholders for premiums/tour. Search remains local/non-submitting until a search contract exists. Placeholder controls must be disabled with explanatory accessible text or omitted at constrained widths.

**Acceptance criteria**

- Navbar occupies only the content column and matches desktop alignment.
- Menu controls the drawer; bell controls the notification shell in Task 15.
- Search is usable and labelled without implying server search results.
- Premium/tour placeholders are non-deceptive and collapse intentionally.

**Testing**

- Test names, disabled semantics, search keyboard behavior, drawer trigger wiring, and responsive class/visibility contracts.

**Performance considerations**

- No query or heavy panel code loads because text is typed or the navbar renders.

**Accessibility and responsive requirements**

- Touch targets, focus rings, icon names, and overflow checks at all required widths.

**Dependencies**

- Task 7. Define a lightweight trigger callback contract now for Task 15; do not implement or depend on the later panel yet.

### Task 9: Reusable Dashboard Cards and State Primitives

Status: complete on 2026-07-06.

**Goal**

Create composable visual primitives for dashboard metrics and async states.

**Files likely touched**

- `src/components/dashboard/overview/dashboard-section.tsx`
- `src/components/dashboard/overview/metric-card.tsx`
- `src/components/dashboard/overview/dashboard-date.tsx`
- `src/components/dashboard/overview/dashboard-skeleton.tsx`
- `src/components/dashboard/overview/dashboard-error-state.tsx`
- `src/components/dashboard/overview/dashboard-empty-state.tsx`
- `src/__tests__/components/dashboard/dashboard-primitives.test.tsx`
- `CONTEXT.md`

**Implementation details**

Build metric card slots for icon, label, value, supporting copy, and action; semantic date display; stable skeletons; and reusable retry/empty messaging. Keep domain logic outside primitives.

**Acceptance criteria**

- Metric cards handle null, zero, long, and populated values without overflow.
- Date is a semantic display, not a fake filter.
- Skeleton geometry approximates final layout and respects reduced motion.
- Error/empty states expose user-visible retry or next action.

**Testing**

- Test null/zero distinction, long text, semantic date, loading status, reduced-motion classes, and retry behavior.

**Performance considerations**

- Static primitives stay server-compatible where possible and avoid unnecessary memoization.

**Accessibility and responsive requirements**

- Correct heading hierarchy, labelled actions, live loading/error text, and one/two/four-column behavior without overflow.

**Dependencies**

- Tasks 3 and 6.

### Task 10: Unassessed Onboarding Hero and Risk-Assessment Prompt

Status: complete on 2026-07-07.

**Goal**

Implement the complete unassessed first-row experience.

**Files likely touched**

- `src/components/dashboard/overview/unassessed-hero.tsx`
- `src/components/dashboard/overview/risk-assessment-prompt.tsx`
- `src/__tests__/components/dashboard/unassessed-overview.test.tsx`
- `CONTEXT.md`

**Implementation details**

Build the teal onboarding hero, `/assessment` CTA, marketplace/demo secondary behavior, and narrow assessment prompt. Keep product-demo and explanatory actions disabled/omitted until destinations exist.

**Acceptance criteria**

- Copy and primary actions match `Overview (4).png`.
- Risk CTA reaches the existing assessment route.
- No undocumented product-demo action fires.
- Hero and prompt accept no server data beyond explicit props.

**Testing**

- Test content, real route, disabled placeholder behavior, focus order, and long-copy wrapping.

**Performance considerations**

- Use CSS decoration rather than raster hero backgrounds or animation libraries.

**Accessibility and responsive requirements**

- CTA row wraps, headings remain ordered, and cards stack without overflow at small/tablet widths.

**Dependencies**

- Task 9.

### Task 11: Assessed Financial Snapshot and Risk-Level Visualization

Status: complete on 2026-07-07.

**Goal**

Implement the assessed hero and authoritative risk profile card.

**Files likely touched**

- `src/components/dashboard/overview/assessed-hero.tsx`
- `src/components/dashboard/overview/risk-level-card.tsx`
- `src/__tests__/components/dashboard/assessed-overview.test.tsx`
- `CONTEXT.md`

**Implementation details**

Render snapshot hero, real `/marketplace` CTA, non-functional demo placeholder, and a CSS/SVG risk ring from `risk_profile` and `overall_score`. Clamp only for visual geometry while exposing invalid server data as validation errors upstream.

**Acceptance criteria**

- Risk profile text and numeric score come only from validated latest assessment.
- Visual and textual representations agree.
- Assessment loading/error is isolated from overview metric success.
- Color is supplemental; profile/score text remains visible.

**Testing**

- Test low/moderate/high-like strings without assuming a closed enum, score boundaries, loading/error/retry, and marketplace navigation.

**Performance considerations**

- Use CSS conic gradient or tiny SVG; no chart library and no client animation requirement.

**Accessibility and responsive requirements**

- Provide an accessible score/profile summary and reduced-motion-safe presentation; stack beside/below hero responsively.

**Dependencies**

- Tasks 5 and 9.

### Task 12: Income-Stability Empty and Populated Visualization

Status: complete on 2026-07-07.

**Goal**

Render truthful null and populated stability states from dashboard overview.

**Files likely touched**

- `src/components/dashboard/overview/income-stability-card.tsx`
- `src/components/dashboard/overview/income-stability-chart.tsx`
- `src/components/dashboard/overview/income-stability-table.tsx`
- `src/__tests__/components/dashboard/income-stability.test.tsx`
- `CONTEXT.md`

**Implementation details**

For null stability, show an accessible no-data state and optional decorative empty grid. For populated stability, calculate a responsive SVG path/polyline from exact points, show score/classification, and expose a compact textual table/list. Use neutral numeric labels until point units are confirmed.

**Acceptance criteria**

- Null state creates no fabricated points, score, classification, or currency axis.
- Empty/single/many-point arrays render safely according to validator policy.
- Populated path uses the complete ordered `graph_points` array.
- Chart has an equivalent accessible data representation.

**Testing**

- Test null, empty, one-point, varied, flat, and long arrays; assert no `NaN` path data.
- Test accessible summary/table and responsive viewBox behavior.

**Performance considerations**

- O(n) pure SVG computation, memoized only by primitive point input if profiling justifies it; no dependency.

**Accessibility and responsive requirements**

- Responsive viewBox, readable fallback list, hidden decorative grid, no sideways page scrolling.

**Dependencies**

- Tasks 3 and 9.

### Task 13: Getting-Started and Recommended-Actions Components

Status: complete on 2026-07-07.

**Goal**

Implement unassessed checklist and assessed action list from authoritative user/risk state.

**Files likely touched**

- `src/components/dashboard/overview/getting-started-checklist.tsx`
- `src/components/dashboard/overview/recommended-actions.tsx`
- `src/lib/dashboard/actions.ts`
- `src/__tests__/components/dashboard/dashboard-actions.test.tsx`
- `CONTEXT.md`

**Implementation details**

Derive assessment, marketplace, and email-verification checklist rows from flags/profile and real routes. Derive KYC/profile completion actions only where state and destination are authoritative; incorporate assessment recommendation strings without inventing destinations. Non-actionable recommendations render as information, not fake links.

**Acceptance criteria**

- Completion status derives from `riskAssessed`, `email_verified`, and `kycVerified` without local persistence.
- Real actions reach `/assessment`, `/marketplace`, or `/kyc` as appropriate.
- Unsupported “See all” and update destinations are absent/disabled.
- Recommendation copy tolerates long backend strings.

**Testing**

- Cover all flag combinations, email verified/unverified, empty recommendations, long recommendations, and real/unavailable destinations.

**Performance considerations**

- Derive action models through small pure helpers; do not add requests or global state.

**Accessibility and responsive requirements**

- Use semantic lists, non-color completion labels, descriptive links, and wrapping action rows.

**Dependencies**

- Tasks 5 and 9.

### Task 14: KYC Dashboard Banner Integration

Status: complete on 2026-07-07.

**Goal**

Align the existing KYC dashboard reminder with the supplied persistent banner design and dashboard composition.

**Files likely touched**

- `src/components/kyc/dashboard/kyc-dashboard-banner.tsx`
- `src/__tests__/components/kyc/kyc-dashboard-banner.test.tsx`
- `src/__tests__/pages/dashboard.test.tsx`
- `CONTEXT.md`

**Implementation details**

Reuse `useKycGate`/`useUserFlags`, replace copy and visual structure to match `Banner (1).png`, remove session dismissal for this persistent required reminder, and route safely to KYC with dashboard return context. Do not add storage or a second KYC source.

**Acceptance criteria**

- Banner renders only after resolved `kycVerified === false`.
- Banner is absent for verified users and does not flash while flags resolve.
- Copy/CTA match the screenshot; no dismiss control exists.
- CTA preserves a safe dashboard return target supported by existing redirect utilities.

**Testing**

- Legitimately update old dismissal assertions to the new persistent product contract; do not weaken unrelated tests.
- Test unresolved, unverified, verified, CTA, and remount behavior.

**Performance considerations**

- Consume existing flags only; no KYC status request or layout-shifting client persistence.

**Accessibility and responsive requirements**

- Labelled status/region semantics, sensible announcement timing, wrapping content, and 44px CTA at all widths.

**Dependencies**

- Tasks 6 and 9; existing KYC architecture.

### Task 15: Notification Preview and Accessible Slide-Over Shell

Status: complete on 2026-07-07.

**Goal**

Build the screenshot-faithful notification UI boundary without claiming unsupported production data behavior.

**Files likely touched**

- `src/types/dashboard-notifications.ts`
- `src/components/dashboard/notifications/notification-preview.tsx`
- `src/components/dashboard/notifications/notification-panel.tsx`
- `src/components/dashboard/notifications/notification-list.tsx`
- `src/components/dashboard/notifications/notification-unavailable-state.tsx`
- `src/__tests__/components/dashboard/notification-panel.test.tsx`
- `CONTEXT.md`

**Implementation details**

Define a UI-only adapter model for item/group rendering and use test fixtures to exercise populated visuals. Production receives an unavailable adapter state and makes zero feed requests. Implement trigger integration, overlay, panel, grouped cards, and read-control slots; disable/omit read actions when adapter capabilities are absent.

**Acceptance criteria**

- Production does not call an invented notification endpoint.
- Unavailable state is honest and useful; fake unread counts are never shown.
- Fixture-driven component tests can reproduce Today/Yesterday groups and screenshot layout.
- Dialog traps/restores focus, locks scroll, closes by explicit control/Escape/backdrop, and restores bell focus.

**Testing**

- Test closed/open, focus lifecycle, tab loop, dismissal paths, body lock, reduced motion, unavailable adapter, populated fixture, and disabled read capabilities.
- Assert no network call occurs when opening the panel.

**Performance considerations**

- Lazy-load panel body on first open if bundle measurement supports it; keep fixture data out of production imports.

**Accessibility and responsive requirements**

- `role="dialog"`, `aria-modal`, labelled title/summary, live open announcement, full-screen mobile treatment, bounded desktop width, and no overflow.

**Dependencies**

- Task 8.

### Task 16: Dashboard Overview State Controller

Status: complete on 2026-07-07.

**Goal**

Create the focused client orchestration layer for flags, profile, overview, assessment, and panel state.

**Files likely touched**

- `src/components/dashboard/dashboard-overview-controller.tsx`
- `src/components/dashboard/dashboard-overview-content.tsx`
- `src/__tests__/components/dashboard/dashboard-overview-controller.test.tsx`
- `CONTEXT.md`

**Implementation details**

Coordinate existing session/flag/profile hooks and the new dashboard/assessment queries. Render loading/error/success branches, choose unassessed/assessed from validated `has_assessment`, compose KYC orthogonally, and isolate latest-assessment failure. Do not mirror query data or flags into component/global state. Notification open state may remain local to the shell/controller.

**Acceptance criteria**

- Every state-matrix row has deterministic output.
- Exactly one overview and one profile request occur per normal mount/cache cycle.
- Assessed and KYC states combine independently.
- Overview errors retry without discarding the authenticated shell.
- Flag/overview mismatch follows the documented reconciliation policy.

**Testing**

- MSW-backed integration tests cover auth/flags unresolved, four dashboard variants, loading, overview error/retry, null/populated stability, assessment sub-error, and request counts.

**Performance considerations**

- Independent requests run in parallel; no monolithic component subscriptions; derive only needed booleans and props.

**Accessibility and responsive requirements**

- Focus remains stable across async branches; status/error updates announce once; skeleton and content geometry stay aligned.

**Dependencies**

- Tasks 5 and 9–15.

### Task 17: Dashboard Page Composition, Metadata, Loading, and Error Boundaries

Status: complete on 2026-07-07.

**Goal**

Replace the placeholder route with the complete thin server page and route-level states.

**Files likely touched**

- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/dashboard/loading.tsx`
- `src/app/(app)/dashboard/error.tsx`
- `src/__tests__/pages/dashboard.test.tsx`
- `CONTEXT.md`

**Implementation details**

Export meaningful metadata, compose the dashboard controller, upgrade route loading to the stable dashboard skeleton, and add a resettable route error boundary for unexpected rendering errors. Remove placeholder cards and the standalone recommendations card if its behavior has been incorporated into the new action model.

**Acceptance criteria**

- Page is a small server boundary with no unnecessary `"use client"`.
- Metadata, heading, greeting, date, hero, metrics, lower sections, KYC banner, and notification boundary compose correctly.
- Route loading/error states retain shell geometry and accessible recovery.
- No placeholder-era pulse cards remain in success output.

**Testing**

- Update dashboard page tests for intended user-visible behavior, not implementation snapshots.
- Run the focused dashboard page/controller/component suite and `npx tsc --noEmit`.

**Performance considerations**

- Keep serialized props minimal and confirm notification/chart code splitting decisions.

**Accessibility and responsive requirements**

- One `h1`, correct sections/landmarks, skip target, focusable error retry, and no overflow at required widths.

**Dependencies**

- Task 16.

### Task 18: Accessibility, Responsive, and Pixel-Perfect Visual QA

Status: complete on 2026-07-07.

**Goal**

Iterate the implemented dashboard against every screenshot and required viewport until behavior and visuals are production-ready.

**Files likely touched**

- `src/app/globals.css`
- `src/components/dashboard/shell/authenticated-app-shell.tsx`
- `src/components/dashboard/shell/app-sidebar.tsx`
- `src/components/dashboard/shell/mobile-navigation-drawer.tsx`
- `src/components/dashboard/shell/dashboard-navbar.tsx`
- `src/components/dashboard/overview/metric-card.tsx`
- `src/components/dashboard/overview/unassessed-hero.tsx`
- `src/components/dashboard/overview/assessed-hero.tsx`
- `src/components/dashboard/overview/risk-level-card.tsx`
- `src/components/dashboard/overview/income-stability-card.tsx`
- `src/components/dashboard/overview/recommended-actions.tsx`
- `src/components/dashboard/notifications/notification-panel.tsx`
- `src/components/kyc/dashboard/kyc-dashboard-banner.tsx`
- `CONTEXT.md`

**Implementation details**

Use rendered browser screenshots, not source inspection, to tune spacing, typography, surfaces, borders, shadows, icon sizes, sidebar width, navbar height, grid ratios, and overlay width. Add the smallest named surface/neutral tokens only where existing tokens cannot express the screenshots. Audit keyboard and screen reader behavior.

**Acceptance criteria**

- Visual comparison covers all four screenshots at 1512px width.
- Viewports 320, 360, 390, 768, 1024, 1280, and 1440+ have no horizontal page overflow.
- Drawer, navbar prioritization, cards, KYC banner, hero CTAs, chart, actions, and notification panel behave as specified.
- Contrast, focus visibility, heading order, live regions, modal behavior, and reduced motion pass manual audit.

**Testing**

- Run focused component tests after legitimate styling/behavior changes.
- Add automated viewport overflow assertions where stable.
- Capture and compare browser screenshots for documented QA evidence.

**Performance considerations**

- Recheck image dimensions/optimization, animation cost, CLS, and mobile rendering while tuning visuals.

**Accessibility and responsive requirements**

- This task owns the full strategy checklist and must not be marked complete with known focus, contrast, clipping, or overflow defects.

**Dependencies**

- Task 17.

### Task 19: Unit and Integration Test Completion

Status: complete on 2026-07-07.

**Goal**

Close meaningful behavior coverage across dashboard contracts, services, hooks, shell, widgets, state orchestration, and regressions.

**Files likely touched**

- `src/__tests__/lib/dashboard-validators.test.ts`
- `src/__tests__/lib/dashboard-formatters.test.ts`
- `src/__tests__/lib/risk-validators.test.ts`
- `src/__tests__/services/dashboard.service.test.ts`
- `src/__tests__/hooks/dashboard-hooks.test.tsx`
- `src/__tests__/components/dashboard/authenticated-app-shell.test.tsx`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `src/__tests__/components/dashboard/dashboard-navbar.test.tsx`
- `src/__tests__/components/dashboard/dashboard-primitives.test.tsx`
- `src/__tests__/components/dashboard/unassessed-overview.test.tsx`
- `src/__tests__/components/dashboard/assessed-overview.test.tsx`
- `src/__tests__/components/dashboard/income-stability.test.tsx`
- `src/__tests__/components/dashboard/dashboard-actions.test.tsx`
- `src/__tests__/components/dashboard/notification-panel.test.tsx`
- `src/__tests__/components/dashboard/dashboard-overview-controller.test.tsx`
- `src/__tests__/pages/dashboard.test.tsx`
- `src/__tests__/components/kyc/kyc-dashboard-banner.test.tsx`
- `src/__tests__/components/auth/route-guards.test.tsx`
- `CONTEXT.md`

**Implementation details**

Audit the suite against acceptance criteria. Tests must validate intended behavior first, use MSW at network boundaries, avoid mocking the component under test, and change old assertions only when product behavior legitimately changed (such as persistent KYC banner behavior).

**Acceptance criteria**

- Coverage includes malformed responses, Bearer auth, no duplicate overview calls, all four KYC/risk combinations, loading/error/null/populated states, shell/drawer/panel keyboard behavior, and no invented notification calls.
- Existing auth, KYC, risk, marketplace, middleware, and session-security tests remain green.
- Tests continue to prove flags/tokens are memory-only.

**Testing**

- Run focused dashboard suites throughout.
- Run `npm test -- --run`.
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `git diff --check`.

**Performance considerations**

- Include a request-count assertion and avoid test-only production abstractions.

**Accessibility and responsive requirements**

- Prefer role/name/focus/live-region assertions and viewport overflow behavior over brittle class snapshots.

**Dependencies**

- Tasks 3–18.

### Task 20: Dashboard Playwright E2E Coverage

Status: complete on 2026-07-07 after Task 21's isolated run passed the focused 11-test dashboard suite and the 35-test full Chromium matrix; the original workspace lock remains documented.

**Goal**

Verify protected dashboard flows, visual states, navigation, drawer, and notification shell in a real browser.

**Files likely touched**

- `e2e/dashboard/dashboard-flow.spec.ts`
- `playwright.config.ts`
- `CONTEXT.md`

**Implementation details**

Use route-level deterministic mocks matching validated contracts and credentialed auth patterns from existing auth/KYC specs. Cover unauthenticated redirect, silent refresh, four KYC/risk variants, overview loading/error/retry, assessed risk/stability, null stability, sidebar/drawer, and notification unavailable panel.

**Acceptance criteria**

- Auth initialization does not flash protected content.
- Dashboard states match fixtures and issue one overview request.
- KYC CTA, assessment CTA, marketplace CTA, drawer focus, and panel focus/dismissal work end to end.
- No notification feed/read request is made.
- Small viewport runs detect no horizontal overflow.

**Testing**

- Run `npm run test:e2e -- --project=chromium e2e/dashboard/dashboard-flow.spec.ts`.
- Run `npm run test:e2e -- --project=chromium`.
- Document exact dev-lock, browser-install, port, or environment blockers rather than weakening coverage.

**Performance considerations**

- Capture request counts and basic layout-shift/initial-bundle observations where Playwright can do so reliably.

**Accessibility and responsive requirements**

- Exercise keyboard-only drawer/panel flows and viewports 320, 390, 768, 1024, and 1512px.

**Dependencies**

- Tasks 18 and 19.

### Task 21: Performance, Build, and Final QA

Status: complete on 2026-07-07. The full unit, static, and isolated-browser matrices pass; production chunk inspection confirms the dashboard remains lightweight and the exact Google-font build blocker is documented.

**Goal**

Complete production validation and verify the dashboard adds no unjustified runtime or bundle cost.

**Files likely touched**

- `DASHBOARD_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Run the complete validation matrix, inspect the production build output and dashboard route chunks, verify no chart library or notification fixture entered production, and record bundle/layout/request findings. Resolve new warnings introduced by the epic.

**Acceptance criteria**

- Full unit, e2e, lint, typecheck, build, and whitespace checks pass or exact environmental blockers are documented.
- Dashboard uses one overview request, parallel independent data work, stable skeletons, optimized promo imagery, and no unnecessary global state.
- Initial dashboard bundle does not eagerly include panel-only or test-fixture code.
- No acceptance, accessibility, responsive, or security regression remains.

**Testing**

- Run `npm test -- --run`.
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run test:e2e -- --project=chromium`.
- Run `npm run build`.
- Run `git diff --check`.

**Performance considerations**

- Record route bundle size, lazy chunks, image output, CLS observations, and request deduplication evidence in the handoff.

**Accessibility and responsive requirements**

- Reconfirm the complete accessibility/responsive strategy after the production build, not only in dev mode.

**Dependencies**

- Task 20.

### Task 22: CONTEXT.md and Epic Handoff Update

Status: complete on 2026-07-07. The live implementation map, final verification evidence, environmental blockers, security invariants, and unresolved backend/product questions are recorded in this epic and `CONTEXT.md`.

**Goal**

Leave an accurate implementation map, decisions, verification output, and unresolved backend questions for the next engineer.

**Files likely touched**

- `DASHBOARD_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Add final file maps for contracts/data, shell/navigation, dashboard widgets, notification adapter, and tests. Mark tasks complete only when acceptance criteria and required commands are satisfied. Preserve unresolved notification/date/units/destination questions and remove stale statements that claim deleted dashboard files exist.

**Acceptance criteria**

- Handoff identifies every created/changed dashboard file and its role.
- Final commands and exact results are recorded.
- Backend/product gaps remain explicit and no unsupported feature is described as production-backed.
- Security invariants and memory-only flag behavior are reaffirmed.

**Testing**

- Run `git diff --check` after documentation edits.
- Re-run any command affected by a final corrective change.

**Performance considerations**

- Include the final bundle/request/CLS summary from Task 21.

**Accessibility and responsive requirements**

- Include final viewport and keyboard/modal/drawer QA outcomes.

**Dependencies**

- Task 21.

## Final QA Requirements

The dashboard epic is complete only when all of the following are true:

- Tasks 1–22 were implemented in order and every task appended the required WAT entry to `CONTEXT.md`.
- `openapi.json` is synchronized semantically with the supplied source and `src/types/schema.d.ts` was regenerated, never hand-edited.
- Dashboard overview and latest assessment responses are runtime-validated, authenticated, cancellable, and cache-deduplicated.
- The protected shell, desktop sidebar, mobile drawer, navbar, four dashboard KYC/risk variants, null/populated stability, and error/loading states meet their acceptance criteria.
- The KYC banner is persistent while unverified and uses the existing memory-only flag architecture.
- The notification panel is accessible and visually complete as a shell, while production truthfully reports feed unavailability and performs no invented API calls.
- Tests were written from intended behavior; no assertion was removed merely to make the suite pass, and no component under test is mocked.
- Auth/session security, profile flag hydration, KYC, risk, marketplace, middleware, and existing protected-route behavior remain intact.
- Accessibility audit confirms semantic landmarks, skip link, keyboard operation, visible focus, touch targets, live states, chart equivalents, non-color meaning, focus trapping/restoration, scroll lock, and reduced-motion support.
- Responsive/browser audit confirms no horizontal overflow and stable usable layouts at 320, 360, 390, 768, 1024, 1280, and 1440+ widths, plus screenshot comparison at 1512px.
- Performance audit confirms one overview request, parallel independent queries, stable loading geometry, lightweight visuals, optimized imagery, no unnecessary dashboard Zustand state, and no eager notification fixture/panel cost.
- Required commands pass, or exact blockers and successful alternative verification are recorded:
  - `npm run generate:types` when OpenAPI changes
  - focused Vitest suites after each task
  - `npm test -- --run`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test:e2e -- --project=chromium`
  - `npm run build`
  - `git diff --check`
