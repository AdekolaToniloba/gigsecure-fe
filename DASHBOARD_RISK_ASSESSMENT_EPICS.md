# GigSecure Dashboard Risk Assessment Feature Epic

## Objective

Preserve GigSecure’s public risk-assessment acquisition funnel while adding a separate authenticated dashboard risk-assessment experience. `/risk-assessment` remains public information, `/waitlist` continues issuing the in-memory Bearer token used by public `/assessment`, and `/dashboard/risk-assessment` provides empty, embedded-wizard, assessed-report, and reassessment states inside the completed app shell. Every valid in-memory access token may call `/api/v1/risk/*` through the same `riskService`/`apiClient`; route mode controls surrounding session capabilities and recovery, not risk-endpoint authorization.

This document is the implementation source of truth. Tasks must be completed in order and each completed task must append the required WAT entry to `CONTEXT.md`.

Implementation status: Tasks 1–22 completed in order on 2026-07-08. The final dual-journey implementation map, verification evidence, environment-specific notes, and unresolved backend/product questions are recorded below and in `CONTEXT.md`.

## Scope Summary

- Preserve `/risk-assessment` as the public informational page and `/assessment` as the waitlist-issued-Bearer acquisition wizard under `(wizard)`.
- Keep anonymous visitors without a valid assessment token on the existing `/waitlist` onboarding path; never force this funnel through full account login.
- Add `/dashboard/risk-assessment` under `(app)` for fully authenticated users and update authenticated dashboard links to that route.
- Reuse `AuthenticatedAppShell`, `AppSidebar`, `AppNavigation`, `MobileNavigationDrawer`, `DashboardNavbar`, skip link, notification panel, marketplace promo, and protected-route behavior.
- Extract one shell-neutral `RiskAssessmentWizard` shared by the public and dashboard route adapters.
- Preserve the current public completion report while building the screenshot-aligned dashboard report; both consume the same validated response/display model and PDF logic.
- Render an authenticated unassessed empty state, embedded workflow, assessed report, and explicit reassessment flow on the dashboard route.
- Correct risk, profile, and recommendation contracts before composing UI.
- Reuse question controls, step validation, session-scoped progress, insight parsing, risk report data, PDF rendering, marketplace recommendations, product cards, and product details where their contracts are valid.
- Add runtime validation, resilient state handling, accessibility, responsive layouts, visual QA, and meaningful unit/integration/E2E coverage.

Out of scope: making `/assessment` a full-session-only route, adding it to protected middleware paths, a second dashboard shell, new authentication architecture, profile store, second risk flag store, browser-readable token persistence, arbitrary scoring or benchmarking, notification work, policy purchase/payment, premiums/profile/settings pages, admin/claims, hard-coded products, and an undocumented share-link backend.

## Codebase Audit Summary

> **Task 1 audit status — complete (2026-07-07 16:35 WAT).** The findings below were revalidated against the live routes, middleware, BFF handlers, auth store/session initialization, shared API client, risk/profile/marketplace services and hooks, wizard/report/PDF implementation, OpenAPI inputs, mocks, tests, and both supplied references. This task changes planning documentation only; it does not create the dashboard route or alter either journey.

### Completed shell and current routes

- `src/app/(app)/layout.tsx` already composes `AuthenticatedAppShell`, `AppSidebar`, `DashboardNavbar`, `ProtectedRoute`, and `AppShellSkeleton`.
- `src/components/dashboard/shell/` provides the semantic desktop shell, 298px sidebar, skip link, shared navigation, mobile focus-trapped drawer, marketplace promo, responsive navbar/search, and stable protected loading geometry.
- `src/components/dashboard/notifications/` provides the navbar notification trigger and lazy accessible panel. Risk assessment must consume the existing navbar; it must not create another bell or panel.
- `src/app/(public)/risk-assessment/page.tsx` is the public informational route. Public navigation points to `/risk-assessment`, and its conversion CTAs route visitors into `/waitlist`.
- `src/app/(wizard)/waitlist/page.tsx` posts to the waitlist BFF, stores the returned access token in the memory-only auth store through `useWaitlistSignup`, records only non-sensitive timing metadata in session storage, and pushes `/assessment`.
- `src/app/(wizard)/assessment/page.tsx` is the public acquisition wizard. It inherits the standalone wizard header and redirects an absent in-memory token to `/waitlist`; this route and behavior must remain available.
- `PROTECTED_APP_PATHS` currently protects `/dashboard`, `/app`, `/change-password`, and `/kyc`. Because prefix matching already protects all `/dashboard/*` routes, `/dashboard/risk-assessment` will be protected without adding `/assessment` to middleware.
- `AppNavigation` currently points authenticated users to `/assessment`. Dashboard hero, checklist, stability, marketplace-gate, and E2E callers also contain that path. Dashboard-owned links must change to `/dashboard/risk-assessment`; public waitlist/acquisition links must remain `/assessment`.
- The two final route owners are intentionally distinct: public `/assessment` under `(wizard)` and authenticated `/dashboard/risk-assessment` under `(app)`. No route-group collision or redirect between them is required.

### Existing wizard

- `RiskWizard` is a monolithic client controller that owns waitlist-token redirection, full-viewport shells, waitlist handoff analytics, loading/errors, resume banner, question composition, payload construction, submission, and mutation-only public report display.
- Step 0 loads categories via `useRiskCategories`. Selecting occupation stores `selectedCategory`; `useRiskQuestions` then loads category questions once with an infinite stale time. API steps are preceded by the frontend personal-details step.
- Question renderers, `buildStepSchema`, step components, consent gate, sidebar progress, focus-on-step-change, and session-scoped Zustand progress are reusable.
- Direct dashboard embedding is unsafe: the wizard assumes the public standalone header offset, redirects missing tokens to `/waitlist`, sends cancel to `/`, resets on cancel, directly renders `ReportScreen`, and has no explicit token/session mode or parent callbacks for cancel/success/report selection.
- `StepYourWork` incorrectly marks itself as a first step, some sidebar help links point to `#`, form errors are not consistently associated/focused, and animation does not consistently honor reduced motion.
- Resume/start-over is backed by `gigsecure-wizard` in session storage. True progress belongs there; tokens and server responses must not. The implementation must decide whether public and dashboard attempts use namespaced progress records so one journey cannot resume the other accidentally. Reassessment deliberately resets old dashboard answers only after confirmation, while an incomplete attempt in the same mode remains resumable.

### Risk API authentication and acquisition audit

- `POST /api/v1/auth/waitlist/signup` is proxied by `src/app/api/auth/waitlist/route.ts`. It does **not** issue a full authenticated session and returns `access_token`, `user_id`, `message`, and `token_type`. The BFF sets no refresh cookie and returns no refresh token.
- `useWaitlistSignup` calls `setAccessToken`, so the waitlist-issued token is memory-only. The auth store has no persistence middleware. Refresh tokens for full sessions remain httpOnly BFF cookies. Wizard answers/timing may use session storage, but neither access-token type may be written to local/session storage.
- Every `/api/v1/risk/*` endpoint uses HTTP Bearer authentication. `riskService` must always use the existing `apiClient`, which attaches whichever access token is currently in memory. The frontend must not inspect JWT scope, create endpoint-specific token allowlists, or reject a present token before the backend responds.
- The backend is authoritative for validity and authorization. A public risk request receiving the backend’s authentication failure returns to `/waitlist?expired=true`; dashboard authentication failure follows the shared refresh/logout path.
- Session capabilities remain route-owned. Public `/assessment` may perform its risk workflow but does not call `/users/me`, dashboard overview, KYC, or authenticated marketplace recommendations. Dashboard mode is protected by refresh-cookie/`ProtectedRoute` and may call those full-session APIs.
- Existing client scope introspection used by profile-query and refresh handling must be audited for compatibility with this decision. It must not become a prerequisite for risk API calls. Route context, not an invented risk-endpoint permission matrix, determines recovery and non-risk query enablement.
- Live security blocker for Task 6: direct navigation to any `/dashboard/*` route without `gs_refresh_token` is rejected by middleware, but client-side navigation can currently pass `ProtectedRoute` because waitlist `setAccessToken` sets generic `isAuthenticated: true`. Full-session provenance must replace that generic authorization signal before the dashboard route is exposed. The fix must be memory-only and refresh-initialization-based; it must not decode JWT scope or prevent the waitlist token from reaching risk endpoints.
- Current `useCurrentUser` and refresh-queue helpers do inspect a JWT `scope` claim to avoid `/users/me` or a futile refresh for the existing waitlist flow. No risk service or risk hook performs a scope preflight. Task 6 must replace capability gating with explicit full-session provenance where applicable without adding endpoint-specific risk authorization logic.
- Remaining backend/product question: whether public results are persisted/retrievable later. This affects report persistence, not whether a valid waitlist Bearer token may call risk APIs.

### Profile and flags

- `useUserProfile` aliases `useCurrentUser` and uses canonical key `QUERY_KEYS.USER_ME`. `userService.getMe` validates `/api/v1/users/me`, accepts `AbortSignal`, hydrates the user, and synchronizes flags.
- Available identity fields are `user.first_name`, nullable `user.last_name`, and `user.email`; profile fields include nullable `date_of_birth`, `gender`, `state`, `city`, `occupation`, `average_monthly_income`, `years_of_experience`, and address/platform fields. There is no profile marital-status field.
- `TechAssessmentInput` includes first/last name, DOB, gender, state, city, occupation, marital status, and survey answers. It does not include email. Email must never be added to the submission payload.
- Dashboard mode may use the canonical profile query. Current personal-details prefill uses first/last name, gender, state, and city, but omits profile DOB and occupation; it disables several populated fields. Dashboard prefill must remain editable and resumed dashboard answers take priority. Public mode must not call `/users/me`; it may use only waitlist form name metadata already held in memory plus its own resumed answers.
- `riskAssessed` lives only in the memory-only auth store beside `kycVerified`. A refresh-backed full `setSession` hydrates it from auth, and `/users/me` calls `setFlags`. A waitlist-issued Bearer token enters through `setAccessToken`, which currently sets generic `isAuthenticated: true` while leaving flags unresolved. That generic boolean is insufficient for protected access and must never unlock dashboard content. Current successful submission does not distinguish these modes: dashboard success needs flag/query synchronization, whereas public success must show its mutation response without fabricating full-session flags.

### Contracts and synchronization status

- Local risk paths and the core `TechAssessmentInput`, `AssessmentResponse`, `AssessmentSummary`, `ApplicantProfile`, and `PillarScores` schemas exactly match the supplied OpenAPI.
- Task 2 synchronized the approved supplied user/profile and marketplace semantics into local `openapi.json` and regenerated `src/types/schema.d.ts`: required `UserResponse.role`, decimal-string profile income, number-or-decimal-string profile update income, validation-error `input`/`ctx`, marketplace decimal constraints, and documented 422 responses. The exact risk paths and core generated assessment types were preserved. Supplied descriptions/titles and unrelated endpoint domains were not copied merely to create formatting or scope churn.
- `src/lib/validators/user.ts` and canonical profile fixtures now match those generated user/profile semantics. Existing marketplace runtime validators already enforced decimal monetary strings and remain unchanged. Marketplace list/detail stay public; marketplace recommendations retain Bearer security.
- Questions and categories responses are `{}` in both OpenAPI files. Their current hand-maintained types and MSW shapes are therefore assumptions requiring backend confirmation and defensive runtime validation.
- Task 3 added strict runtime validation for the established discriminated question bank and the narrow `string | { category }` category forms already consumed by the wizard. These remain provisional frontend contracts—not invented OpenAPI guarantees—and malformed/duplicate step, question, option, range, and consent configurations are rejected.
- `GET /risk/assessment` returns the latest `AssessmentResponse`; its documented response has no timestamp and no documented 404 response.
- `GET /risk/history` returns `AssessmentSummary[]` with `created_at`, described only as chronological. Ordering direction is not specified, so history cannot supply “Last Updated” until ordering semantics are confirmed and tested.
- `GET /risk/recommendations` returns and now runtime-validates `RecommendationsResponse { recommendations, overall_score?, risk_profile? }`. The stale product-array validator, consumer, mock, and associated assertions were removed; textual advice remains distinct from marketplace products.
- `POST /risk/assessment/{category}` returns 201 and requires the path category to equal `data.occupation`. The service currently hard-codes `tech_freelancer`.
- Questions, categories, submission, latest assessment, history, and risk recommendations are authenticated. Marketplace list/detail are public; authenticated marketplace recommendations return `RecommendedProductsResponse` and are the only product source for “Recommended for you.”

### Reusable report, marketplace, mock, and test foundations

- `ReportScreen` renders the response, five pillar cards, parsed AI insight blocks, textual recommendations, and PDF action. It is visually tied to the standalone flow and directly imports `@react-pdf/renderer`.
- `RiskReportPDF`, `parseInsights`, `renderInlineBold`, `getRiskLevel`, and `report-theme` are reusable foundations. Shared normalized report selectors/display models should serve dashboard and PDF; dashboard DOM components must not be coupled to PDF primitives.
- Task 3 removed “Generated just now,” recommendation count as “Plans Needed,” pillar scores `> 70` as “Critical Gaps,” PDF generation-date presentation, and Low/Moderate/High pillar thresholds. Pillars now use neutral numeric output; only backend `risk_profile` supplies a classification.
- `useMarketplaceRecommendations`, `marketplaceService`, validators, `ProductCard`, and `ProductDetailPanel` are reusable. The authenticated risk page should render returned products and reuse detail behavior, not hard-code screenshot providers or plans.
- `src/mocks/handlers/domain.ts` still has provisional question/category assumptions, only a hard-coded tech submission route, and no malformed/empty risk scenarios. Its risk-recommendations payload now matches the textual response contract; Task 4 still owns complete shared-Bearer scenarios and fixture extraction.
- Existing validator/service/hook/dashboard tests cover latest-assessment validation, Bearer authentication, query deduplication, and assessment gating. Wizard tests correctly preserve the public `/waitlist` fallback but also preserve hard-coded category, tightly coupled standalone cancel/report, locked prefill, and shallow submission assumptions. There is no dedicated dual-journey assessment E2E suite.
- Performance locks: canonical React Query keys own server data, duplicate route-level requests are deduplicated, assessment responses are not copied into Zustand/local component mirrors, and PDF renderer/document code must be loaded only after an explicit download request.
- Reference availability is confirmed: `Overview (7).png` is 1512×1810 and represents the assessed dashboard report; `Overview (8).png` is 1512×1133 and represents the unassessed empty state. Required responsive QA remains 320, 360, 390, 768, 1024, 1280, 1440+, and the 1512px reference width. Contract-unsupported screenshot values remain omissions/blockers rather than implementation inputs.

## API Contracts

| Operation | Runtime contract and implementation rule |
|---|---|
| `POST /api/v1/auth/waitlist/signup` | Public BFF acquisition call. Returns an in-memory Bearer token but no refresh token/full-session flags. |
| `GET /api/v1/users/me` | Dashboard capability only. Reuse `useUserProfile`; public mode does not issue this non-risk request. |
| `GET /api/v1/risk/categories` | Any valid in-memory Bearer token; response underspecified. Add a narrow validator for confirmed metadata. |
| `GET /api/v1/risk/questions?category=` | Any valid in-memory Bearer token; defaults to `tech_freelancer`; validate the discriminated union and fetch once/category—not per step. |
| `POST /api/v1/risk/assessment/{category}` | Any valid in-memory Bearer token. Validate complete input, require path category to equal occupation, accept `AbortSignal`, expect 201, validate `AssessmentResponse`. No email. |
| `GET /api/v1/risk/assessment` | Any valid in-memory Bearer token. Dashboard uses it for latest state; public completion can remain driven by its validated 201 response. Represent 404/malformed/auth/network failures distinctly. |
| `GET /api/v1/risk/history` | Any valid in-memory Bearer token. Dashboard may use it; public flow does not need it. Do not choose a latest timestamp until ordering semantics are confirmed. |
| `GET /api/v1/risk/recommendations` | Any valid in-memory Bearer token. Validate `RecommendationsResponse`; keep textual advice separate from products. |
| `GET /api/v1/marketplace/recommendations?per_category=` | Refresh-backed full session only. Use returned items for dashboard product cards; public report must not call it with a waitlist-issued Bearer token. |

One shared `riskService` uses the Bearer-attaching `apiClient` for every risk endpoint and token type. It neither accepts a token type nor performs scope checks; it attaches the current in-memory token, passes `AbortSignal`, and runtime-validates responses. Query retries must not stack with Axios retries; expected 4xx responses and mutations do not retry. Public authentication failures and dashboard refresh failures have different route-level recovery adapters.

## Existing Wizard and Report Reuse Audit

### Reuse as-is or with styling-only changes

- Question input components and question discriminated union after response validation.
- `buildStepSchema` after tests cover every question type and invalid configuration.
- Consent gate semantics and step-specific React Hook Form validation.
- `useWizardStore` concept and session-scoped resume behavior.
- `parseInsights`, `renderInlineBold`, report colors, and PDF document as foundations.
- Marketplace service, recommendation hook, product data contract, and detail panel behavior.

### Refactor for composition

- Extract a shell-neutral `RiskAssessmentWizard` with explicit `mode: 'public' | 'dashboard'`, `onCancel`, `onSuccess`, initial-defaults, and auth-failure callbacks. It must not decide routes, call profile APIs, render shell chrome, or choose the final report.
- Extract payload construction into a pure validated adapter under `src/lib/risk/`; remove boolean/integer fallback coercions that can silently manufacture answers.
- Extract profile-to-wizard defaults into a pure adapter. Initialize once, only into empty fields, after persisted answers are known.
- Add thin route adapters: the public adapter preserves waitlist-token guard, handoff timing, standalone layout, `/waitlist?expired=true` recovery, and public report; the dashboard adapter relies on `ProtectedRoute`, profile prefill, app-shell geometry, dashboard report, and full-session recovery.
- Make wizard internals shell-neutral. The dashboard adapter leaves sidebar/navbar mounted; the public adapter retains the current wizard header. Focus returns to the initiating CTA on dashboard cancel or completion.
- Extract a report display model/selectors from raw `AssessmentResponse`. Reuse it between the dashboard report and PDF where meaningful.
- Split report primitives into score card, insights, exposure cards, recommendations, and download action. Lazy-load PDF code only after the user requests it.

### Replace stale assumptions

- Public token guard remains in the public adapter; dashboard `ProtectedRoute` replaces it only on `/dashboard/risk-assessment`.
- Parent route adapters replace mutation-only report selection while preserving public report output.
- Selected category replaces the hard-coded submission path.
- Editable, precedence-safe profile prefill replaces locked inputs.
- Query invalidation and `setFlags({ riskAssessed: true })` replace passive mutation success.
- Supported copy and API fields replace “just now,” answer count, plan/gap counts, monthly estimate, benchmark, and share link.

## Screenshot Analysis

### Shared dashboard shell

Both references define only `/dashboard/risk-assessment`: the completed pale-teal shell, active dark-teal Risk Assessment row with yellow rail, marketplace promo, and content navbar. The route contributes page-specific content. The existing navbar should gain a route-aware title presentation for `/dashboard/risk-assessment` rather than spawning a second navbar; public `/assessment` retains the existing standalone wizard shell.

### Unassessed state — `Overview (8).png`

- Heading “Risk assessment” and subtitle “Get to know your risk profile.”
- Large bordered pale panel, owned/approved assessment illustration with explicit dimensions, explanatory copy, primary “Take assessment” CTA, duration copy, and informational banner.
- `riskAssessed === false` after authoritative `/users/me` hydration is sufficient to render this state without requesting latest assessment. A reconciliation request is not made by default.
- Mobile keeps one content column, removes fixed-height assumptions, and preserves CTA/banner readability.

### Assessed state — `Overview (7).png`

- Heading/subtitle, update CTA, score/protection-plan card, personalized insights, five pillar exposure cards, authenticated marketplace products, and report download boundary are implementable.
- The layout should approximate the reference hierarchy while omitting unsupported counters, benchmarks, timestamps, descriptions, or actions. Empty space must be recomposed rather than filled with fake values.
- AI insights are unstructured authored text. The parser may create presentational blocks, but it must not claim stable “Income Insights,” “Risk Alerts,” or “Industry Comparison” fields unless the actual text provides those labels.
- Exposure titles map exactly: `income` → Income stability, `client` → Client concentration, `safety` → Safety-net strength, `equipment` → Equipment dependency, `health` → Health and lifestyle.
- Scores are displayed numerically and textually. Risk labels use only an approved, documented mapping and never color alone.

## Contract-to-UI Field Mapping

| Screenshot value | Source/status | MVP decision |
|---|---|---|
| Applicant first name/name | Direct API: `AssessmentResponse.applicant`; profile fallback | Display validated name with safe wrapping. |
| Overall percentage | Direct API: `overall_score` | Display rounded only through a tested formatter; preserve raw value for accessible text. |
| Risk classification | Direct API: `risk_profile` | Display verbatim validated text. |
| Five exposure scores | Direct API: `pillar_scores` | Render five cards and numeric bars/rings. |
| Exposure titles | Existing frontend mapping | Reuse a typed exhaustive mapping. |
| Exposure risk labels | Existing frontend-derived `getRiskLevel` thresholds | Blocked pending product approval; otherwise show neutral score text only. |
| Personalized insight content | Direct API: `ai_insights` | Parse defensively into semantic text blocks; fall back to plain text. |
| Text recommendations | Direct API: `recommendations`; optional risk recommendations endpoint | Render as advice, not products or plan count. Avoid a redundant endpoint when latest response is sufficient. |
| Recommended product categories | Direct API: optional `recommended_categories` | Optional context only; not product cards. |
| Recommended product cards | Existing documented endpoint: marketplace recommendations | Fetch lazily in assessed state and reuse product/detail infrastructure. |
| Product premium/coverage/provider | Direct marketplace product fields | Display only returned values with existing formatters. |
| “Generated just now” | Missing backend contract | Omit for MVP. Mutation completion may be announced, not persisted as report metadata. |
| “Last Updated” | History has timestamp but ordering is unconfirmed | Omit for MVP; blocked until ordering/latest identity semantics are documented. |
| Answer count | Missing backend contract | Omit for MVP. |
| Plans needed | Existing report incorrectly uses recommendation count | Omit for MVP; recommendations are not plans. |
| Critical gaps | Existing report uses undocumented `score > 70` rule | Omit for MVP pending approved derivation. |
| Estimated monthly premium | Missing backend contract | Omit for MVP; do not sum marketplace products. |
| Income-band insight | Potentially contained in unstructured AI text | Show only when present in authored insight text; no structured metric claim. |
| Risk-alert description | Potentially contained in unstructured AI text | Show as parsed authored content, not a derived alert. |
| Industry comparison/64% | Missing backend contract | Omit for MVP. |
| Human exposure descriptions | Missing backend contract | Omit; use score and approved label only. |
| “Vs. covered freelancers” | Missing benchmarking contract | Omit for MVP. |
| Download PDF | Existing frontend capability | Reuse one PDF implementation with pending/error/success state. |
| Share Link | Missing URL/creation contract | Render disabled with explanation only if design requires; otherwise omit. |
| Assessment illustration | Design asset, not API data | Add approved optimized asset or owned SVG with `next/image` dimensions. |

## State Matrix

| State | Visible UI | Authority | Actions and announcement | Recovery |
|---|---|---|---|---|
| Public informational visit | `/risk-assessment` marketing content and waitlist CTA | Public route | Start CTA opens `/waitlist` | Normal public navigation |
| Anonymous `/assessment`, no token | No wizard content flash | Public route adapter + memory store | Redirect to `/waitlist` | Complete waitlist form |
| Waitlist signup pending | Existing onboarding form/loading | Waitlist BFF mutation | Accessible pending/error status | Retry without full login |
| Waitlist signup success | Handoff success then `/assessment` | Validated BFF response | Store waitlist-issued Bearer token in memory; announce handoff | Navigate public wizard |
| Waitlist-issued token present | Public wizard in standalone shell | In-memory token presence; backend validates requests | Begin/resume assessment immediately | No profile/dashboard/KYC/product requests |
| Public risk authentication failure | Expired-session recovery | Backend risk API response | Clear memory token; no full-session refresh requirement | Redirect `/waitlist?expired=true` |
| Public categories/questions loading/error | Existing public wizard skeleton/error | Waitlist Bearer risk queries | Status, retry, cancel | Preserve public answers |
| Public partial/resumed wizard | Resume banner and namespaced public progress | Session wizard store | Continue or Start over | Confirm destructive reset |
| Public validation/submission error | Current step and associated errors | RHF/Zod/API | Focus first invalid field; retry | Answers remain intact |
| Public submission pending | Standalone wizard/report skeleton | Waitlist Bearer mutation | “Analyzing assessment” status | Prevent duplicate submit |
| Public submission success | Existing public report presentation | Validated 201 response | Announce completion; offer shared PDF | Do not set full-session flags or call full-only endpoints |
| Full auth initialization pending | Existing app-shell skeleton | Auth provider | “Loading protected application” | Silent refresh settles |
| Anonymous dashboard-route visit | No protected page flash | Middleware/ProtectedRoute | Redirect to login with `/dashboard/risk-assessment` return | Login returns safely |
| Waitlist token navigates to dashboard route | No protected dashboard content | Refresh-cookie middleware for direct navigation; full-session provenance in `ProtectedRoute` for client navigation | Redirect to login/safe public recovery; never call dashboard APIs | Public `/assessment` remains usable with the same token |
| Fully authenticated, flags unresolved | Dashboard assessment skeleton | `/users/me` | Polite loading status | Profile success/error |
| Dashboard profile error | Page error with retry | Canonical profile query | Alert and Retry | Refetch `/users/me` |
| Authenticated unassessed | `Overview (8)` empty state | Resolved `riskAssessed === false` | Take assessment opens shared wizard in dashboard mode | No latest request |
| Dashboard wizard loading/error/resume | Embedded shared wizard | Full token + namespaced dashboard progress | Retry/cancel/start over | Cancel returns empty/report state |
| Dashboard validation/submission error | Embedded current step | RHF/Zod/API | Associated errors and retry | Preserve dashboard answers |
| Dashboard submission pending | Embedded stable geometry | Full-session mutation | Pending announcement | Prevent duplicate submit |
| Dashboard submission success | Fresh dashboard report | Validated 201 response | Announce; seed report; sync flags/queries | Clear dashboard progress after success |
| Dashboard flag/query synchronization | Stable report transition | `setFlags` + QueryClient | No empty/report flash | Invalidate profile/latest/history/dashboard/risk/marketplace keys |
| Assessed dashboard report loading/success | Skeleton then `Overview (7)` report | Latest query | Update Assessment and report actions | Normal operation |
| Latest 404 while flag true | Reconciliation error, not empty state | Flag + latest HTTP status | Alert; Retry; refresh profile | Never silently clear flag |
| Latest malformed/network/server error | Dashboard report error | Validator/query error | Alert and Retry | Refetch latest only |
| Dashboard reassessment/cancel | Fresh shared wizard or restored cached report | Explicit user intent | Confirm reset; Cancel restores focus/report | No mutation on cancel |
| PDF pending/success/error | Current public or dashboard report remains visible | Shared lazy PDF action | Busy/success/error announcement | Retry and revoke object URL |
| Dashboard products loading/empty/error/success | Section-local product state | Full-session marketplace query | Retry/browse/open detail | Panel restores focus |
| Unsupported share action | Omitted or disabled explanation | No contract | No fake clipboard success | Await product/backend decision |
| Dashboard mobile drawer open/closed | Existing drawer over dashboard route | Shell-local state | Existing announcements | Escape/backdrop/navigation closes |

## Open Questions

1. Are public results persisted, associated with `user_id`, and retrievable later, or is the validated submission response the only public report authority?
2. What exact response shape and stable slug field will `/risk/categories` guarantee?
3. Will questions receive a documented response schema and versioning policy?
4. Are only `tech_freelancer` submissions currently accepted despite multiple category metadata examples?
5. Is `risk_profile` a closed enum, and are high pillar scores always worse? Approve thresholds before rendering Low/Moderate/High labels.
6. What is assessment-history ordering, and can the latest item be identified independently of score/category? Until answered, omit timestamps.
7. Should dashboard reassessment always start clean, or may users seed from prior answers? Default: explicit update starts clean after confirmation; incomplete attempts resume only within their route mode.
8. Should a 404 latest assessment with `risk_assessed=true` be healed by backend/profile, and which source wins? Default: show reconciliation error and refetch profile without silently changing the flag.
9. Should backend provide answer count, gap rules, plan count, estimate, benchmarks, exposure narratives, and a shareable report URL? All are omitted until contracted.
10. May the existing frontend risk thresholds remain a product-approved derivation? Default: numeric scores only until approved.

## Product and Architecture Decisions

- **Routes:** keep public `/risk-assessment`, `/waitlist`, and `/assessment` in their existing public/wizard trees. Add `/dashboard/risk-assessment` under `(app)`. Do not protect or redirect public `/assessment` to login.
- **Protection:** `/dashboard/risk-assessment` is covered by the existing `/dashboard` prefix in `PROTECTED_APP_PATHS` plus `ProtectedRoute`. Direct navigation requires the refresh cookie; client navigation must also require successful full-session initialization, not generic `isAuthenticated`. Do not add `/assessment` to `PROTECTED_APP_PATHS` or middleware.
- **Full-session provenance:** harden the memory auth/session boundary so `setSession`/silent refresh establishes explicit refresh-backed full-session capability, while waitlist `setAccessToken` does not. This may be a small `sessionKind`/`hasFullSession` field or an equivalent established invariant; it must not decode JWT scope or persist state.
- **Link ownership:** authenticated sidebar, dashboard widgets/actions, and authenticated-unassessed marketplace gate use `/dashboard/risk-assessment`. Public marketing and waitlist handoff retain `/risk-assessment` → `/waitlist` → `/assessment`.
- **Shells:** dashboard route reuses `(app)` and route-aware navbar title; public route retains the wizard shell. Neither shared wizard nor shared report data layer renders global chrome.
- **Authentication versus capabilities:** any present in-memory token is sent to risk APIs without frontend scope inspection. Public versus dashboard route context determines non-risk query access and failure recovery. The backend alone accepts or rejects the Bearer token.
- **Authority:** public completion uses the validated 201 response and does not set full-session flags. For dashboard, `/users/me.risk_assessed` controls initial branching and latest assessment is fetched only for true.
- **Controllers:** thin public and dashboard controllers own shell-specific routing/recovery/report choice. React Query owns server data; Zustand owns only resumable progress, namespaced by `public` versus `dashboard` if both can coexist in one browser session.
- **Wizard:** one shared component exposes mode/callbacks/defaults. Public mode preserves waitlist handoff/recovery; dashboard mode uses full auth/profile and update semantics. Question controls, validation, payload creation, and submission are identical.
- **Submission:** build and runtime-validate the request in a pure adapter; use `payload.occupation` as path category; parse server errors through `parseApiError` and map 422 field paths where possible.
- **Success synchronization:** public mode clears only public progress after rendering/retaining its validated response. Dashboard mode sets `riskAssessed: true`, seeds latest assessment, then invalidates `USER_ME`, `RISK_ASSESSMENT`, `RISK_HISTORY`, `RISK_RECOMMENDATIONS`, `DASHBOARD_OVERVIEW`, and marketplace recommendation keys.
- **Reports:** public `ReportScreen` and dashboard assessed UI are separate presentation adapters over one typed display model. Never turn recommendation count into plan count, apply unapproved gap rules, or synthesize benchmark/descriptive prose.
- **Recommendations:** textual assessment advice, recommended categories, and marketplace products remain three distinct concepts.
- **PDF/share:** lazy-load one existing PDF renderer. Share remains omitted/disabled until a valid public URL or backend contract exists.
- **Errors:** page/profile/latest errors retain the authenticated shell; recommendation and PDF failures remain section-local.

## Performance Strategy

- Keep the route page as a small server component and interactive orchestration in focused client leaves.
- Start independent profile/latest/product work only when required; do not introduce fetch waterfalls or duplicate `/users/me` consumers.
- Canonical query keys: profile 5 minutes, latest assessment 5 minutes, history 5 minutes, question/category data session-stable until backend versioning exists, marketplace recommendations 5 minutes. Document any changed value in tests.
- Pass `AbortSignal` through every service, disable mutation retries, and avoid React Query retries on expected 4xx responses.
- Do not mirror profile, latest assessment, questions, categories, or products into local/Zustand state.
- Direct-import icons/components; dynamically import PDF generation and consider deferring recommendation UI until the assessed section enters the viewport only if measurement justifies it.
- Use CSS/SVG score rings and bars, explicit-dimension `next/image` artwork, stable skeleton geometry, reduced-motion styles, and no chart dependency.
- Subscribe to narrow Zustand selectors and avoid reconstructing every step/form on unrelated shell state changes.
- Final QA must inspect both `/assessment` and `/dashboard/risk-assessment` route chunks, shared-wizard duplication, PDF lazy chunk, request counts, and production build output.

## Accessibility and Responsive Strategy

- Preserve the dashboard skip link/landmarks and the public wizard’s own meaningful header/main structure; shared internals must not assume either shell.
- One page `h1`; section headings descend in order. Wizard step title receives focus on transition and announces “Step N of M.”
- Form controls have labels, descriptions, `aria-invalid`, associated error IDs, an error summary, and first-invalid-field focus.
- Resume/start-over/reassessment reset actions explain destructive effects. Cancel restores focus to the CTA that opened the wizard.
- Async query, submission, PDF, and product states use restrained `aria-live`; errors use alerts without repeated announcements.
- Score/risk visuals have text alternatives. Exposure labels and status never rely on color alone.
- Existing dashboard drawer and product dialog retain focus trap, Escape/backdrop/explicit close, body lock, and opener restoration. Public mode must remain keyboard-complete without dashboard controls.
- Minimum 44px touch targets, visible focus, tested contrast, wrapping long names/classifications/recommendations/errors, and `prefers-reduced-motion` support are mandatory.
- Verify 320, 360, 390, 768, 1024, 1280, 1440+, and the reference desktop viewport. Cards use one column on mobile, two where space permits, and three exposure/product columns only when content remains readable. No horizontal page overflow; internal wide AI tables may scroll within a labelled region.

## Epic Tasks

### Task 1: Dual-Journey Route, Bearer Authentication, Wizard, Report, and Contract Audit

**Status:** Complete — 2026-07-07 16:35 WAT. Audit/documentation only; no feature code changed.

**Goal**

Revalidate both public acquisition and authenticated dashboard journeys, including shared Bearer handling and distinct session recovery, before code changes.

**Files likely touched**

- `DASHBOARD_RISK_ASSESSMENT_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Confirm `/risk-assessment` → `/waitlist` → `/assessment`, full-session `/dashboard/risk-assessment`, middleware prefix behavior, BFF token handling, shared `apiClient` use for all risk endpoints, all reusable files, supplied/local schema differences, and unsupported screenshot values. Do not introduce JWT-scope preflight checks or endpoint-specific risk permission logic.

**Acceptance criteria**

- Audit matches live files and records decisions/blockers without fabrication.
- Public `/assessment` remains unprotected, dashboard route ownership is confirmed, and mode-specific authorities/recovery are locked.
- No token persistence, JWT-scope preflight, duplicated risk service, or invented permission matrix is planned.

**Testing**

- `git diff --check`

**Performance considerations**

- Lock deduplication, lazy PDF, and no-server-data-in-Zustand decisions.

**Accessibility and responsive requirements**

- Confirm both references and every required viewport remain available.

**Dependencies**

- None.

### Task 2: OpenAPI Synchronization and Generated Types

**Status:** Complete — 2026-07-07 21:56 WAT. Approved semantic contract sync and generator-owned declarations only; no UI or route behavior changed.

**Goal**

Synchronize supplied profile/marketplace differences and preserve exact risk contracts.

**Files likely touched**

- `openapi.json`
- `src/types/schema.d.ts`
- `CONTEXT.md`

**Implementation details**

Apply semantic supplied changes only, preserve established marketplace security, run generation, and never hand-edit generated declarations.

**Acceptance criteria**

- Generated user/profile, assessment, and marketplace types match the approved schema.
- Underspecified category/question responses remain explicitly documented rather than invented in OpenAPI.

**Testing**

- `npm run generate:types`
- `npx tsc --noEmit`
- Focused generated-contract diff review.

**Performance considerations**

- Generated declarations add no runtime code.

**Accessibility and responsive requirements**

- No UI change.

**Dependencies**

- Task 1.

### Task 3: Runtime Risk Validators, Types, Selectors, and Field Mapping

**Status:** Complete — 2026-07-07 22:11 WAT. Runtime contract foundations, pure payload/report selectors, and unsupported-derivation removal completed without route or token changes.

**Goal**

Create validated request/question/category/report foundations and remove unsupported derivations.

**Files likely touched**

- `src/lib/validators/risk.ts`
- `src/types/risk-assessment.ts`
- `src/lib/risk/build-assessment-payload.ts`
- `src/lib/risk/report-display-model.ts`
- `src/app/(wizard)/assessment/_lib/getRiskLevel.ts`
- `src/__tests__/lib/risk-validators.test.ts`
- `src/__tests__/lib/buildStepSchema.test.ts`
- `src/__tests__/lib/risk-report-display-model.test.ts`
- `CONTEXT.md`

**Implementation details**

Add discriminated question/category schemas, complete input validation, category/payload equality, exhaustive pillar mapping, safe AI insight fallback, and approved-only risk labels.

**Acceptance criteria**

- Valid contracts parse; malformed configs, scores, payloads, and mismatched categories fail.
- Selectors expose no plans/gaps/benchmarks/timestamps/descriptions.

**Testing**

- Focused validator/helper suites and `npx tsc --noEmit`.

**Performance considerations**

- Pure, linear, tree-shakeable selectors; no render-time repeated parsing.

**Accessibility and responsive requirements**

- Display model includes textual score equivalents and safe long-copy output.

**Dependencies**

- Task 2.

### Task 4: Shared-Bearer Risk MSW Fixtures and Contract Scenarios

**Status:** Complete — 2026-07-07 22:28 WAT. Deterministic shared-Bearer fixtures and contract scenarios completed without route, session, wizard, report, or production API behavior changes.

**Goal**

Provide contract-shaped network scenarios for every page state.

**Files likely touched**

- `src/mocks/handlers/domain.ts`
- `src/mocks/fixtures/risk-assessment.ts`
- `src/mocks/handlers/index.ts`
- `src/__tests__/mocks/risk-handlers.test.ts`
- `CONTEXT.md`

**Implementation details**

Cover waitlist signup, public no-token/backend-401 cases, category/question valid/malformed/error/delay with either valid Bearer fixture, dynamic category submission with 201/401/422/500, latest/history/textual recommendations with either valid Bearer fixture, authenticated marketplace outcomes, and public/dashboard 201 responses.

**Acceptance criteria**

- Risk handlers accept either valid test Bearer and assert category/body equality. They must not decode scope or reject a valid token based on frontend-invented permissions.
- Stale array recommendation and tech-only post handlers are removed.

**Testing**

- Focused handler/validator contract tests.

**Performance considerations**

- Fixtures remain test-only and deterministic.

**Accessibility and responsive requirements**

- Include long names/copy and empty content fixtures.

**Dependencies**

- Task 3.

### Task 5: Shared Risk Service and React Query Hook Corrections

**Goal**

Make every risk operation authenticated, cancellable, validated, and cache-coherent.

**Files likely touched**

- `src/services/risk.service.ts`
- `src/hooks/risk/useRisk.ts`
- `src/lib/constants.ts`
- `src/__tests__/services/risk.service.test.ts`
- `src/__tests__/hooks/risk-hooks.test.tsx`
- `CONTEXT.md`

**Implementation details**

Accept category in submission, validate request/response, correct recommendations object, add enabled/retry policies, and expose backend authentication errors without embedding route redirects or token-type branches in the shared service/hooks.

**Acceptance criteria**

- Both waitlist-issued and full-session Bearer fixtures use the same methods/client; AbortSignal, 201, exact payload, dynamic path, malformed rejection, deduplication, and no expected-4xx retry are tested.
- Route controllers enable only the queries their experience needs: public mode never enables profile/dashboard/KYC/marketplace recommendation calls, while risk-query enablement depends on route state and token presence—not token type.

**Testing**

- Focused service/hook tests and `npx tsc --noEmit`.

**Performance considerations**

- One request per canonical key; no Axios/Query retry stacking.

**Accessibility and responsive requirements**

- Hooks expose enough state for accurate announcements/retry.

**Dependencies**

- Tasks 3–4.

### Task 6: Full-Session Provenance, Route Capabilities, Mode Namespacing, and Prefill Adapters

**Goal**

Define route-owned capabilities/recovery and initialize mode-specific editable defaults without crossing public/dashboard boundaries or pre-validating risk tokens.

**Files likely touched**

- `src/lib/risk/profile-to-wizard-defaults.ts`
- `src/lib/risk/assessment-route-context.ts`
- `src/store/auth-store.ts`
- `src/hooks/auth/useSession.ts`
- `src/components/auth/shared/protected-route.tsx`
- `src/app/(wizard)/assessment/_components/steps/StepPersonalDetails.tsx`
- `src/store/wizard-store.ts`
- `src/__tests__/components/wizard/StepPersonalDetails.test.tsx`
- `src/__tests__/lib/assessment-route-context.test.ts`
- `src/__tests__/store/auth-store.test.ts`
- `src/__tests__/components/auth/route-guards.test.tsx`
- `src/__tests__/store/wizard-store.test.ts`
- `src/__tests__/hooks/user-profile.test.tsx`
- `CONTEXT.md`

**Implementation details**

Define `public | dashboard` route contexts with allowed non-risk queries and recovery callbacks. Public requires an in-memory token to begin, sends it without decoding to risk APIs, and learns invalidity only from backend failure. Add an explicit memory-only full-session provenance invariant established only by refresh-backed `setSession`/successful initialization; `ProtectedRoute` and dashboard query gates consume it instead of generic `isAuthenticated`. Namespace progress if necessary. Dashboard precedence is resumed answer > supported profile value > empty; public precedence is resumed answer > in-memory waitlist name metadata > empty. Never call profile in public mode, map email, store tokens, inspect JWT scope before risk calls, or invent marital status.

**Acceptance criteria**

- One `/users/me` call in full-session dashboard mode, zero in public mode, any present token is forwarded to risk APIs, partial/error behavior, editable values, no effect reset loop, and no cross-mode resume.
- A waitlist-issued Bearer token leaves full-session capability false even though legacy `isAuthenticated` is true; client and direct dashboard navigation render no protected content.

**Testing**

- Prefill, resume precedence, partial profile, error, dedupe, and exact-payload tests.

**Performance considerations**

- Pure adapter and one initialization pass.

**Accessibility and responsive requirements**

- Profile error does not block unrelated fields; field labels/errors remain associated.

**Dependencies**

- Tasks 3 and 5.

### Task 7: Shared Composable RiskAssessmentWizard Extraction

**Goal**

Extract one shell-neutral wizard used by public and dashboard route adapters.

**Files likely touched**

- `src/components/risk-assessment/wizard/risk-assessment-wizard.tsx`
- `src/components/risk-assessment/wizard/risk-assessment-wizard.types.ts`
- `src/app/(wizard)/assessment/_components/RiskWizard.tsx`
- `src/app/(wizard)/assessment/_components/StepSidebar.tsx`
- `src/app/(wizard)/assessment/_components/steps/StepWrapper.tsx`
- `src/app/(wizard)/assessment/_components/questions/QuestionRenderer.tsx`
- `src/__tests__/components/wizard/RiskWizard.test.tsx`
- `src/__tests__/components/risk-assessment/shared-wizard-contract.test.tsx`
- `CONTEXT.md`

**Implementation details**

Move question orchestration, validation, payload construction, consent, progress, submission callbacks, and focus behavior into one component. Accept explicit mode, initial defaults, cancel/success/auth-failure callbacks, and shell sizing. Do not read route, choose report, call profile, or render global chrome inside it.

**Acceptance criteria**

- Public and dashboard harnesses produce identical question/payload/validation behavior.
- Public waitlist recovery and dashboard full-session recovery are callbacks, not shared-wizard conditionals with hard-coded URLs.
- No duplicated question controls, validators, payload builder, or submission mutation exists.

**Testing**

- Shared contract, question, payload, progress, keyboard, and typecheck tests.

**Performance considerations**

- Shared code is emitted once per relevant route graph; heavy report/PDF code is not bundled into the wizard core.

**Accessibility and responsive requirements**

- Step progress, first-invalid focus, action reachability, and reduced motion are shell-neutral.

**Dependencies**

- Tasks 3, 5, and 6.

### Task 8: Public Acquisition Adapter and Report Regression

**Goal**

Preserve `/risk-assessment`, `/waitlist`, public `/assessment`, waitlist-token recovery, handoff analytics, and the current public report around the shared wizard.

**Files likely touched**

- `src/app/(wizard)/assessment/page.tsx`
- `src/app/(wizard)/assessment/_components/public-assessment-controller.tsx`
- `src/app/(wizard)/assessment/_components/ReportScreen.tsx`
- `src/app/(wizard)/waitlist/page.tsx`
- `src/components/public/risk-assessment/ScrollCTA.tsx`
- `src/__tests__/components/wizard/RiskWizard.test.tsx`
- `src/__tests__/components/wizard/ReportScreen.test.tsx`
- `src/__tests__/pages/WaitlistPage.test.tsx`
- `CONTEXT.md`

**Implementation details**

Wrap the shared wizard with public no-token redirect, present-token entry, backend-authentication-failure recovery, standalone cancel destination, handoff timing, and public report selection. Do not decode or pre-reject the token. Keep the validated 201 response local/query-backed for the public report and do not set full-session flags or call full-session-only non-risk APIs.

**Acceptance criteria**

- Anonymous users go to `/waitlist`, waitlist-token users never go to login, backend-rejected tokens recover via `?expired=true`, and public completion still renders the report/PDF foundation.
- `/assessment` is absent from protected paths and no `/users/me`, latest, history, dashboard, or marketplace recommendation request occurs in public mode.

**Testing**

- MSW-backed waitlist/no-token/backend-401/submission/report tests and public CTA link regressions.

**Performance considerations**

- Preserve prefetch/handoff performance and avoid importing dashboard report/product code.

**Accessibility and responsive requirements**

- Existing public header/main, step focus, expired banner, and report announcements remain accessible.

**Dependencies**

- Task 7.

### Task 9: Authenticated Dashboard Route and Shell Integration

**Goal**

Add `/dashboard/risk-assessment`, update authenticated links, and leave public routes untouched.

**Files likely touched**

- `src/app/(app)/dashboard/risk-assessment/page.tsx`
- `src/components/dashboard/shell/dashboard-navbar.tsx`
- `src/components/dashboard/shell/app-navigation.tsx`
- `src/lib/dashboard/actions.ts`
- `src/components/dashboard/overview/unassessed-hero.tsx`
- `src/components/dashboard/overview/income-stability-card.tsx`
- `src/hooks/marketplace/useMarketplaceRecommendationsGate.ts`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `src/__tests__/components/dashboard/dashboard-navbar.test.tsx`
- `src/__tests__/components/auth/route-guards.test.tsx`
- `CONTEXT.md`

**Implementation details**

Create the thin protected page under the existing `/dashboard` prefix, make the existing navbar route-aware, point authenticated sidebar/dashboard/gate actions to it, and preserve public acquisition links. Do not add `/assessment` to middleware.

**Acceptance criteria**

- Dashboard route uses app shell/ProtectedRoute, active navigation, safe login return, and no standalone wizard header.
- Link audit proves public CTAs still reach `/waitlist`/`/assessment`, while authenticated CTAs reach `/dashboard/risk-assessment`.
- A waitlist-issued Bearer token can call `/api/v1/risk/*` but cannot access `/dashboard/risk-assessment`, `/users/me`, dashboard overview, KYC, authenticated marketplace recommendations, or other full-session pages.
- Direct URL entry is rejected by refresh-cookie middleware and client-side navigation is rejected by full-session-aware `ProtectedRoute`; protected dashboard content and dashboard API calls never render/fire.

**Testing**

- Route guard tests cover waitlist-token direct and client navigation; navigation, navbar, dashboard action, marketplace gate, middleware, and public-link regression tests cover both route classes.

**Performance considerations**

- Thin server page and no duplicate shell or wizard bundle.

**Accessibility and responsive requirements**

- Skip link/main target, active route, drawer, navbar title, and 44px links work at all widths.

**Dependencies**

- Tasks 7–8.

### Task 10: Dashboard State Controller and Unassessed UI

**Goal**

Coordinate full-session flags/profile/latest state and implement `Overview (8).png` around the shared wizard.

**Files likely touched**

- `src/components/risk-assessment/dashboard/dashboard-risk-assessment-controller.tsx`
- `src/components/risk-assessment/dashboard/unassessed-state.tsx`
- `src/app/(wizard)/assessment/_components/public-assessment-controller.tsx`
- `src/app/(wizard)/assessment/_components/ReportScreen.tsx`
- `src/components/risk-assessment/dashboard/risk-assessment-skeleton.tsx`
- `src/components/risk-assessment/dashboard/risk-assessment-error.tsx`
- `public/assets/images/risk-assessment-empty.webp`
- `src/__tests__/components/risk-assessment/dashboard-risk-assessment-controller.test.tsx`
- `src/__tests__/components/risk-assessment/unassessed-state.test.tsx`
- `CONTEXT.md`

**Implementation details**

Use only full-session/profile flags. Skip latest for resolved false; reconcile true+404; compose empty/wizard/report/reassessment modes without copying query data. Render heading/subtitle, bordered empty panel, optimized artwork, CTA, duration, and info banner.

**Acceptance criteria**

- Auth/profile/empty/loading/latest error branches are deterministic; empty CTA opens shared dashboard-mode wizard; cancel restores empty state/focus; no public waitlist behavior leaks into the dashboard.

**Testing**

- MSW state/request-count tests plus empty-state content/focus/image/overflow tests.

**Performance considerations**

- Narrow subscriptions, conditional latest/profile queries, stable geometry.

**Accessibility and responsive requirements**

- Stable focus/live states, informative/decorative image decision, mobile wrapping.

**Dependencies**

- Tasks 6, 7, and 9.

### Task 11: Mode-Specific Submission Success, Synchronization, and Recovery

**Goal**

Make the same validated submission transition correctly in public and dashboard modes without conflating session authority.

**Files likely touched**

- `src/hooks/risk/useRisk.ts`
- `src/app/(wizard)/assessment/_components/public-assessment-controller.tsx`
- `src/components/risk-assessment/dashboard/dashboard-risk-assessment-controller.tsx`
- `src/components/risk-assessment/wizard/risk-assessment-wizard.tsx`
- `src/__tests__/components/risk-assessment/risk-assessment-submission.test.tsx`
- `CONTEXT.md`

**Implementation details**

Keep shared mutation/payload behavior identical. Public success retains the validated 201 response for the public report and clears only public progress; it must not set full-session flags or enable full-only queries. Dashboard success sets the flag, seeds latest, invalidates documented keys, then clears dashboard progress. Both retain answers on error and map 422 fields.

**Acceptance criteria**

- One submission in either mode; a public backend authentication failure invokes waitlist recovery, a dashboard 401 invokes shared full-session recovery, and neither route uses the other mode’s destination.
- Dashboard has no empty-state flash and refresh resolves correctly; public completion remains accessible without login.

**Testing**

- Both-mode success, public no-flag behavior, dashboard invalidation/refresh, backend 401/422/500, and duplicate-submit tests.

**Performance considerations**

- Seed validated response to avoid immediate redundant latest fetch while still invalidating dependencies.

**Accessibility and responsive requirements**

- Pending/success/error are announced and focus lands on report heading or first invalid field.

**Dependencies**

- Tasks 5 and 10.

### Task 12: Shared Report Display Model and Dashboard Score/Insights

**Goal**

Build one authoritative report display model and the dashboard upper report while preserving public consumption.

**Files likely touched**

- `src/components/risk-assessment/report/risk-score-card.tsx`
- `src/components/risk-assessment/report/personalized-insights.tsx`
- `src/app/(wizard)/assessment/_components/ReportScreen.tsx`
- `src/lib/risk/report-display-model.ts`
- `src/__tests__/components/risk-assessment/risk-score-card.test.tsx`
- `src/__tests__/components/risk-assessment/personalized-insights.test.tsx`
- `CONTEXT.md`

**Implementation details**

Make both public `ReportScreen` and dashboard components consume the same validated display model for applicant, score, profile, pillars, advice, and AI blocks. Omit unsupported dashboard values without forcing the public presentation to match the dashboard.

**Acceptance criteria**

- Valid data maps exactly; malformed AI text degrades to readable plain text; unsupported metrics never appear.

**Testing**

- Boundaries, long copy, empty insights, parser fallback, unsupported-value absence.

**Performance considerations**

- CSS/SVG ring; parse once; no chart library.

**Accessibility and responsive requirements**

- Score text alternative, semantic sections, non-color classification, responsive stacking.

**Dependencies**

- Tasks 3, 8, and 11.

### Task 13: Risk-Exposure Breakdown Components

**Goal**

Render five contract-backed pillar cards.

**Files likely touched**

- `src/components/risk-assessment/report/risk-exposure-grid.tsx`
- `src/components/risk-assessment/report/risk-exposure-card.tsx`
- `src/__tests__/components/risk-assessment/risk-exposure-grid.test.tsx`
- `CONTEXT.md`

**Implementation details**

Use exhaustive mapping and approved labels only. Do not add narrative descriptions or benchmark card.

**Acceptance criteria**

- Exactly five API scores render; no arbitrary sixth card or prose; boundaries are safe.

**Testing**

- Ordering, all score boundaries, label policy, long text, unsupported absence.

**Performance considerations**

- Lightweight CSS bars and static typed mapping.

**Accessibility and responsive requirements**

- Numeric text, status not color-only, one/two/three-column grid without overflow.

**Dependencies**

- Tasks 3 and 12.

### Task 14: Marketplace Product Recommendation Integration

**Goal**

Render authenticated API-backed products and reuse detail behavior.

**Files likely touched**

- `src/components/risk-assessment/report/recommended-products.tsx`
- `src/components/marketplace/product-card.tsx`
- `src/components/marketplace/product-detail-panel.tsx`
- `src/__tests__/components/risk-assessment/recommended-products.test.tsx`
- `src/__tests__/components/marketplace/product-detail-panel.test.tsx`
- `CONTEXT.md`

**Implementation details**

Use existing hook/service. Reuse or add a documented compact card variant without duplicating product logic; preserve detail panel focus lifecycle.

**Acceptance criteria**

- Loading/empty/error/success are isolated; products are never hard-coded; textual advice remains separate.

**Testing**

- Bearer request, response rendering, retry, empty, card/detail keyboard interaction, no duplicate calls.

**Performance considerations**

- Fetch only in assessed report; avoid eager detail calls; defer panel code if bundle measurement supports it.

**Accessibility and responsive requirements**

- Screen-reader-friendly states, card names, focus restoration, stacked mobile cards.

**Dependencies**

- Tasks 5 and 12.

### Task 15: Shared PDF Download and Share-Action Boundary

**Goal**

Reuse one PDF path from both report presentations with honest share behavior.

**Files likely touched**

- `src/components/risk-assessment/report/report-actions.tsx`
- `src/app/(wizard)/assessment/_components/report/RiskReportPDF.tsx`
- `src/__tests__/components/risk-assessment/report-actions.test.tsx`
- `src/__tests__/components/wizard/ReportScreen.test.tsx`
- `CONTEXT.md`

**Implementation details**

Dynamic-import renderer/document on click, use shared display data, stable filename, cleanup URLs, and omit/disable Share Link.

**Acceptance criteria**

- Pending/success/error/retry work in public and dashboard reports; no eager PDF bundle; one document/data adapter; no fake share success.

**Testing**

- Lazy import, Blob/download/cleanup, generation failure, disabled/absent share.

**Performance considerations**

- PDF libraries stay out of initial route chunks.

**Accessibility and responsive requirements**

- Busy state and errors announced; action row wraps with 44px controls.

**Dependencies**

- Task 12.

### Task 16: Reassessment and Update Flow

**Goal**

Implement deliberate, cancellable reassessment without stale data flashes.

**Files likely touched**

- `src/components/risk-assessment/dashboard/dashboard-risk-assessment-controller.tsx`
- `src/components/risk-assessment/wizard/risk-assessment-wizard.tsx`
- `src/components/risk-assessment/report/assessed-report.tsx`
- `src/__tests__/components/risk-assessment/reassessment-flow.test.tsx`
- `CONTEXT.md`

**Implementation details**

Update CTA requests confirmation, resets prior progress once, enters fresh wizard, hides report, and restores cached report/focus on cancel.

**Acceptance criteria**

- Cancel does not alter flag/cache; success replaces report and invalidates dependencies; browser back behavior is documented/tested.

**Testing**

- Confirm/start/cancel/back/error/success/refresh paths.

**Performance considerations**

- Reuse cached categories/questions; no eager new latest call.

**Accessibility and responsive requirements**

- Confirmation semantics, focus restoration, clear mode announcement, mobile controls.

**Dependencies**

- Tasks 10–15.

### Task 17: Dashboard Page Composition, Metadata, Loading, and Error Boundaries

**Goal**

Compose the complete thin `/dashboard/risk-assessment` route without changing public route ownership.

**Files likely touched**

- `src/app/(app)/dashboard/risk-assessment/page.tsx`
- `src/app/(app)/dashboard/risk-assessment/loading.tsx`
- `src/app/(app)/dashboard/risk-assessment/error.tsx`
- `src/__tests__/pages/dashboard-risk-assessment.test.tsx`
- `CONTEXT.md`

**Implementation details**

Add metadata, dashboard controller, stable loading, resettable unexpected-error boundary, and final sections. Keep `src/app/(wizard)/assessment/page.tsx` and its public report adapter intact.

**Acceptance criteria**

- One h1, all dashboard modes compose in existing shell, expected query errors stay local, and both distinct routes have one owner each.

**Testing**

- Page composition, metadata, loading/error reset, shell integration, typecheck.

**Performance considerations**

- Small server boundary and minimal serialized props.

**Accessibility and responsive requirements**

- Landmark/heading/skip target correctness and no overflow.

**Dependencies**

- Tasks 8–16.

### Task 18: Accessibility, Responsiveness, and Pixel-Perfect QA

**Goal**

Iterate rendered UI against both references and the complete accessibility strategy.

**Files likely touched**

- `src/components/risk-assessment/dashboard/unassessed-state.tsx`
- `src/components/risk-assessment/wizard/risk-assessment-wizard.tsx`
- `src/components/risk-assessment/report/assessed-report.tsx`
- `src/components/risk-assessment/report/risk-score-card.tsx`
- `src/components/risk-assessment/report/personalized-insights.tsx`
- `src/components/risk-assessment/report/risk-exposure-grid.tsx`
- `src/components/risk-assessment/report/recommended-products.tsx`
- `src/components/risk-assessment/report/report-actions.tsx`
- `src/components/dashboard/shell/dashboard-navbar.tsx`
- `src/app/globals.css`
- `CONTEXT.md`

**Implementation details**

Use browser screenshots to tune dashboard spacing, typography, surfaces, grid ratios, long content, and mobile behavior. Re-run public wizard/report visual and keyboard regression checks after shared-component changes. Add global tokens only when existing tokens cannot express the references. Audit keyboard, focus, announcements, contrast, and reduced motion in both shells.

**Acceptance criteria**

- No overflow at 320/360/390/768/1024/1280/1440+; dashboard references compared at native viewport; public wizard/report retain usable layouts; no known focus/contrast/clipping defect.

**Testing**

- Focused suites, browser screenshots, automated overflow assertions where stable.

**Performance considerations**

- Recheck CLS geometry, image sizing, animations, and mobile render cost.

**Accessibility and responsive requirements**

- Owns the complete strategy checklist and manual evidence.

**Dependencies**

- Task 17.

### Task 19: Dual-Journey Unit and Integration Test Completion

**Goal**

Close behavior coverage across contracts, services, state orchestration, wizard, report, products, and PDF.

**Files likely touched**

- `src/__tests__/lib/risk-validators.test.ts`
- `src/__tests__/services/risk.service.test.ts`
- `src/__tests__/hooks/risk-hooks.test.tsx`
- `src/__tests__/components/risk-assessment/dashboard-risk-assessment-controller.test.tsx`
- `src/__tests__/components/risk-assessment/risk-assessment-submission.test.tsx`
- `src/__tests__/components/risk-assessment/reassessment-flow.test.tsx`
- `src/__tests__/pages/dashboard-risk-assessment.test.tsx`
- `src/__tests__/pages/WaitlistPage.test.tsx`
- `src/__tests__/components/wizard/RiskWizard.test.tsx`
- `src/__tests__/components/risk-assessment/shared-wizard-contract.test.tsx`
- `src/__tests__/lib/api-client.test.ts`
- `src/__tests__/lib/api-refresh-queue.test.ts`
- `src/__tests__/middleware.test.ts`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `src/__tests__/hooks/user-profile.test.tsx`
- `src/__tests__/components/marketplace/product-detail-panel.test.tsx`
- `CONTEXT.md`

**Implementation details**

Use MSW at network boundaries and test user-visible behavior. Replace stale assertions only when product behavior legitimately changes; never mock the component under test.

**Acceptance criteria**

- Every state-matrix row, shared Bearer/signal behavior, absence of JWT-scope gating, public no-login funnel, backend-rejected token recovery, request dedupe, mode-specific prefill/flag sync, shared-wizard parity, unsupported-value absence, and keyboard/error behavior is covered.
- Tests prove `setAccessToken` may authenticate risk requests but cannot satisfy full-session route/query guards; neither `/users/me` nor any dashboard/KYC/marketplace-recommendation request starts during a waitlist-token dashboard attempt.

**Testing**

- Focused suites, `npm test -- --run`, `npm run lint`, `npx tsc --noEmit`, `git diff --check`.

**Performance considerations**

- Request-count and lazy-PDF assertions; no test-only production abstractions.

**Accessibility and responsive requirements**

- Prefer role/name/focus/live-region/overflow assertions over class snapshots.

**Dependencies**

- Tasks 3–18.

### Task 20: Public and Dashboard Playwright E2E Coverage

**Goal**

Verify the acquisition funnel and protected dashboard assessment flows in Chromium.

**Files likely touched**

- `e2e/risk-assessment/public-acquisition-flow.spec.ts`
- `e2e/risk-assessment/dashboard-risk-assessment-flow.spec.ts`
- `e2e/dashboard/dashboard-flow.spec.ts`
- `e2e/marketplace/marketplace-flow.spec.ts`
- `CONTEXT.md`

**Implementation details**

Use deterministic route mocks for waitlist-issued Bearer tokens, backend token rejection, full sessions, profile, categories, questions, submission, latest/history/products, and preserve credentialed CORS/session patterns. Risk mocks accept either valid Bearer and do not implement frontend-invented scope rules.

**Acceptance criteria**

- Public: informational CTA, waitlist signup, no-login handoff, shared wizard, completion report, backend-rejected token recovery, and existing-link regression.
- Dashboard: protected redirect, unassessed, shared wizard parity, profile prefill, submission/refresh, assessed, reassessment/cancel, malformed/404, products, drawer, and mobile overflow.
- Security: with only a waitlist-issued Bearer token, direct and client-side navigation to `/dashboard/risk-assessment` never displays protected dashboard content or calls full-session-only APIs; public `/assessment` continues to call risk APIs successfully.

**Testing**

- `npm run test:e2e -- --project=chromium e2e/risk-assessment/public-acquisition-flow.spec.ts e2e/risk-assessment/dashboard-risk-assessment-flow.spec.ts`
- `npm run test:e2e -- --project=chromium`

**Performance considerations**

- Assert public performs no full-only calls, dashboard request counts are deduplicated, and shared wizard code/behavior does not fork.

**Accessibility and responsive requirements**

- Keyboard-only wizard/drawer/panel paths and required viewports.

**Dependencies**

- Tasks 18–19.

### Task 21: Performance, Build, and Final QA

**Goal**

Complete the production validation matrix and bundle/request audit.

**Files likely touched**

- `DASHBOARD_RISK_ASSESSMENT_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Run all commands, inspect public `/assessment` and `/dashboard/risk-assessment` chunks for shared-code duplication, confirm PDF laziness and request dedupe, and resolve new warnings. Document exact environmental blockers.

**Acceptance criteria**

- No unjustified bundle/global state/request cost, no regression, and all acceptance criteria are verified or explicitly blocked.

**Testing**

- `npm test -- --run`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:e2e -- --project=chromium`
- `npm run build`
- `git diff --check`

**Performance considerations**

- Record route/lazy chunk sizes, request counts, image output, and layout observations.

**Accessibility and responsive requirements**

- Reconfirm manual and automated evidence after production build.

**Dependencies**

- Task 20.

### Task 22: CONTEXT.md and Epic Handoff Update

Status: complete on 2026-07-08. The live implementation map, final verification evidence, route/security invariants, and unresolved backend/product questions are now recorded in this epic and `CONTEXT.md`.

**Goal**

Leave an accurate implementation map, decisions, results, and unresolved contracts.

**Files likely touched**

- `DASHBOARD_RISK_ASSESSMENT_EPICS.md`
- `CONTEXT.md`

**Implementation details**

Record every changed file and role, command output, route decision, security/query invariants, visual evidence, and remaining backend/product questions. Append:

`### [DATE AND TIME WAT]`

`Task completed: Task [NUMBER] — [TASK NAME]`

with Files changed, Summary, Important decisions, and Known follow-ups.

**Acceptance criteria**

- Tasks are marked complete only when their criteria pass; unsupported features remain explicit.

**Testing**

- `git diff --check` and rerun any command affected by final corrections.

**Performance considerations**

- Include final bundle/request/CLS findings.

**Accessibility and responsive requirements**

- Include final viewport, keyboard, focus, announcement, and contrast outcomes.

**Dependencies**

- Task 21.

## Final QA Requirements

- Tasks 1–22 are completed in order and each appends the required WAT `CONTEXT.md` entry.
- `/risk-assessment` remains public information, `/waitlist` remains public onboarding, and `/assessment` has exactly one owner under `(wizard)` with waitlist-issued-Bearer/no-login behavior.
- `/dashboard/risk-assessment` has exactly one owner under `(app)`, is protected through the existing `/dashboard` middleware prefix and `ProtectedRoute`, uses the completed shell, and never flashes protected content.
- `/assessment` is not added to protected middleware paths; public CTAs and waitlist handoff still reach it, while authenticated sidebar/dashboard links reach `/dashboard/risk-assessment`.
- A waitlist-issued Bearer token can call `/api/v1/risk/*` but cannot access `/dashboard/risk-assessment`, `/users/me`, dashboard overview, KYC, authenticated marketplace recommendations, or any other refresh-backed full-session page. Both direct and client navigation are regression-tested and protected content never renders.
- Supplied/local OpenAPI differences are reconciled through generation; `src/types/schema.d.ts` is never hand-edited.
- Questions/categories, request payload, submission, latest/history/risk recommendations, profile, and marketplace recommendations are authenticated as applicable, cancellable, runtime-validated, and contract-tested.
- The path category equals payload occupation; email is absent; prefill never overwrites resumed answers and remains editable.
- Public submission never creates a full session or sets `riskAssessed`; dashboard submission sets the shared memory-only flag, seeds/invalidates canonical queries, and both clear only their own progress after success.
- Waitlist and full-session access tokens remain memory-only; refresh tokens remain httpOnly; tests prove neither token class enters local/session storage.
- Backend responses remain authoritative for Bearer validity/authorization; frontend code and mocks perform no JWT-scope preflight or endpoint-specific risk permission checks.
- Both routes import one `RiskAssessmentWizard`, payload builder, validators, report display model, and PDF document/action foundation; public and dashboard report presentations consume the same validated `AssessmentResponse` without duplicated domain logic.
- No screenshot-only answer count, plan count, critical-gap rule, monthly estimate, benchmark, narrative, timestamp, share URL, or hard-coded product appears.
- Existing wizard, report/PDF, dashboard, auth, profile, KYC, marketplace, and session-security behavior remains intact except for intentionally documented route/composition changes.
- Accessibility verification covers landmarks, skip link, headings, focus movement/restoration, form errors, step progress, live states, non-color meaning, 44px targets, dialog/drawer behavior, contrast, and reduced motion.
- Responsive verification covers 320, 360, 390, 768, 1024, 1280, 1440+, and the reference desktop viewport with no page overflow or clipped controls/content.
- Performance verification confirms canonical request counts, no server data in Zustand, stable skeletons, optimized artwork, lightweight score visuals, and lazy PDF code.
- Required commands pass or exact blockers are recorded: `npm run generate:types` when OpenAPI changes, focused Vitest suites after each task, `npm test -- --run`, `npm run lint`, `npx tsc --noEmit`, `npm run test:e2e -- --project=chromium`, `npm run build`, and `git diff --check`.

## Final Implementation Handoff

Status: complete on 2026-07-08. The live repository, not the original Task 1 audit snapshot, is authoritative for current route ownership, shared wizard/report composition, query/security boundaries, and test coverage.

### Live implementation map

Each task entry in `CONTEXT.md` records the exact file-by-file edits. The live implementation groups into the following production and verification areas:

- Contracts and data boundaries:
  - `openapi.json` and `src/types/schema.d.ts` hold the synchronized generated contract surface.
  - `src/lib/validators/risk.ts`, `src/lib/risk/build-assessment-payload.ts`, `src/lib/risk/profile-to-wizard-defaults.ts`, and `src/lib/risk/report-display-model.ts` own runtime validation, payload construction, editable prefill, and the shared validated report display model.
  - `src/services/risk.service.ts`, `src/hooks/risk/useRisk.ts`, `src/hooks/marketplace/useMarketplace.ts`, and `src/lib/constants.ts` own the authenticated risk and marketplace data layer through `apiClient`, canonical query keys, `AbortSignal`, runtime validation, and `parseApiError` consumers.
  - `src/store/auth-store.ts`, `src/store/wizard-store.ts`, and `src/lib/risk/assessment-route-context.ts` preserve the memory-only access-token/full-session boundary and namespaced resumable wizard progress without copying server data into Zustand.

- Route owners and controllers:
  - `src/app/(public)/risk-assessment/page.tsx` remains the public informational route.
  - `src/app/(wizard)/waitlist/page.tsx` remains the waitlist acquisition handoff.
  - `src/app/(wizard)/assessment/page.tsx` and `src/app/(wizard)/assessment/_components/public-assessment-controller.tsx` remain the sole public wizard/report owner using the waitlist-issued in-memory Bearer token and `/waitlist?expired=true` recovery.
  - `src/app/(app)/dashboard/risk-assessment/page.tsx`, `loading.tsx`, and `error.tsx` plus `src/components/risk-assessment/dashboard/dashboard-risk-assessment-controller.tsx` remain the sole authenticated risk-assessment route owner inside the existing dashboard shell.

- Shared wizard, report, and PDF composition:
  - `src/components/risk-assessment/wizard/` owns the shell-neutral `RiskAssessmentWizard`, its context, and route-mode props.
  - `src/app/(wizard)/assessment/_components/` and `_lib/` retain the shared step controls, question renderers, consent gate, sidebar, insight parsing helpers, and public report adapter.
  - `src/components/risk-assessment/report/` owns the authenticated assessed report, score/insight/exposure/product sections, reassessment entry point, and shared lazy PDF action.
  - `src/app/(wizard)/assessment/_components/report/RiskReportPDF.tsx` remains the one PDF document foundation reused by both public and dashboard presentations.

- Verification surface:
  - `src/__tests__/lib/`, `src/__tests__/services/`, `src/__tests__/components/risk-assessment/`, `src/__tests__/components/wizard/`, and `src/__tests__/pages/dashboard-risk-assessment.test.tsx` cover the shared contracts, wizard behavior, public report, dashboard controller states, reassessment, products, PDF actions, route boundaries, and store invariants.
  - `e2e/risk-assessment/helpers.ts`, `e2e/risk-assessment/public-acquisition-flow.spec.ts`, and `e2e/risk-assessment/dashboard-risk-assessment-flow.spec.ts` provide the dual-journey Chromium coverage for public acquisition, protected-route behavior, authenticated submission/reassessment, retry, and mobile overflow/navigation.

### Final route and security invariants

- `/risk-assessment` remains public information, `/waitlist` remains public onboarding, and `/assessment` remains the only public wizard/report route owner under `(wizard)`.
- `/dashboard/risk-assessment` remains the only authenticated assessment route owner under `(app)` and is protected by the existing `/dashboard` middleware prefix plus `ProtectedRoute`.
- Waitlist-issued and full-session access tokens remain memory-only. Refresh tokens remain httpOnly BFF cookies.
- The shared `riskService` and `apiClient` send whichever in-memory Bearer token is present to `/api/v1/risk/*`; the frontend does not decode JWT scope, maintain a risk-endpoint permission matrix, or pre-reject a present token before the backend responds.
- Public mode never starts `/users/me`, dashboard overview, KYC, or authenticated marketplace recommendation requests. Dashboard mode may start those only after refresh-backed full-session initialization.
- React Query remains the owner of profile, assessment, history, recommendation, overview, and marketplace server data. Zustand remains limited to auth/session flags and namespaced resumable wizard progress.

### Final verification evidence

- Focused Task 20 Playwright coverage passed 2 files and 10 tests for the public acquisition and authenticated dashboard journeys.
- The broader Chromium pass finished with 44 passing tests and 1 unrelated auth refresh-queue failure while all risk-assessment specs passed.
- Task 21 production validation passed `npm test -- --run` with 112 files and 743 tests, `npx tsc --noEmit`, and `npm run lint` with 0 errors and the same 7 pre-existing unrelated warnings.
- `npm run build` passed for the real source after the restricted-environment Google Fonts fetch issue was retried with network access; the resulting build included `/assessment`, `/dashboard/risk-assessment`, and `/risk-assessment`.
- Public/dash route bundle inspection confirmed that the two assessment routes share most client chunks and keep the PDF renderer out of their initial client payloads.
- Request-count verification remained within the planned boundaries: the public journey makes no full-session-only requests, the dashboard overview remains one request per entry/cache cycle, marketplace recommendations remain one request after assessed dashboard success, and latest assessment stays deferred until an assessed dashboard state needs it.

### Environment-specific notes

- The broader Chromium suite still has one unrelated existing failure in `e2e/auth/refresh-queue.spec.ts` (`concurrent expired authenticated requests share one refresh and retry with the new token`) returning an `AxiosError` 401.
- Next.js still emits the existing `middleware` deprecation warning during build output; that migration remains outside this epic.
- A fully offline production build is still blocked by `next/font` fetching `Inter` from Google Fonts. No font workaround was merged into production source during this epic.

### Remaining backend and product questions

- Are public assessment results persisted and later retrievable, or is the validated 201 response the only public report authority?
- What exact response schemas and stable identifiers will `/risk/categories` and `/risk/questions` guarantee?
- Does latest assessment need documented 404 healing semantics, timestamps, or a stable “last updated” authority?
- What is the guaranteed ordering for `/risk/history`, and can one item be identified as the latest independently of chronology?
- Is `risk_profile` a closed enum, and may any frontend-derived pillar/risk thresholds ever be shown beyond neutral numeric score output?
- Will backend/product add a shareable report URL, approved benchmark/comparison fields, product-plan counts, premium estimates, or other currently omitted screenshot-only values?
