# GigSecure Dashboard Profile Feature Epic

## Objective

Implement the protected GigSecure Dashboard Profile page in the existing authenticated app shell with TypeScript, React Query, Zod runtime validation, accessible responsive tabs, editable personal information, read-only risk data summaries, a safe assessment update path, KYC status display, and password change support. The implementation must use real backend contracts only, reuse the existing dashboard/auth/risk/KYC architecture, and match the supplied Profile screenshots as closely as the documented contracts allow.

This document is the implementation source of truth for the Dashboard Profile feature. It is planning-only and does not authorize feature code during this task. Implementation must proceed in task order, and every completed task must append a timestamped entry to `CONTEXT.md`.

## Scope Summary

- Add a protected Profile destination under the authenticated dashboard route tree.
- Enable the existing Profile sidebar item only when the route exists.
- Build three semantic tabs: Personal Information, Risk Data, and Security.
- Integrate personal information with `GET /api/v1/users/me` and `PUT /api/v1/users/me`.
- Display Risk Data from existing risk contracts, primarily `GET /api/v1/risk/assessment` and, where useful, `GET /api/v1/risk/history`.
- Keep Risk Data MVP read-only unless backend and existing wizard architecture can safely support section-level edits.
- Provide an `Update Assessment` or `Retake Assessment` path through the existing authenticated dashboard risk assessment route instead of inventing partial update endpoints.
- Integrate password change through the existing change-password BFF/service flow backed by `PUT /api/v1/auth/change-password`.
- Display KYC status from `GET /api/v1/kyc/status` with a status-aware Verify/Review CTA.
- Add/update generated types, feature types where useful, validators, endpoint constants, query keys, services, hooks, MSW handlers, UI primitives, route composition, and tests.
- Reuse the existing authenticated app shell, sidebar, navbar, auth guard, API client, error parser, React Query provider, KYC patterns, risk assessment services/wizard/report display model, MSW setup, and dashboard visual tokens.

Out of scope: dashboard settings sections, notification/privacy/delete-account settings, policy purchase, claims, a new auth architecture, a new profile or risk Zustand store, new API clients, undocumented risk insight refresh endpoints, fabricated risk answers, and a separate dashboard shell.

## Codebase Audit Summary

The required planning inputs were reviewed before creating this document:

- `RULES.md`
- `CONTEXT.md`
- `DASHBOARD_EPICS.md`
- `DASHBOARD_RISK_ASSESSMENT_EPICS.md`
- `DASHBOARD_SETTINGS_EPICS.md`
- `DASHBOARD_PREMIUMS_EPICS.md`
- `MARKETPLACE_EPICS.md`
- `AUTH_EPICS.md`
- `KYC_EPICS.md`
- `src/app/globals.css`
- `openapi.json`
- `src/types/schema.d.ts`

No required planning file was missing.

Current architecture to reuse:

- `src/app/(app)/layout.tsx` already wraps protected app routes in `ProtectedRoute`, `AuthenticatedAppShell`, `AppSidebar`, and `DashboardNavbar`.
- `src/components/dashboard/shell/` already provides the persistent 298px desktop sidebar, mobile drawer, skip link, navbar, search, notification trigger, marketplace promo, and stable app-shell loading geometry.
- `src/components/dashboard/shell/app-navigation.tsx` already contains a Profile nav item, but it is currently marked `available: false` and renders as disabled "Soon". Profile implementation must enable it and point it to the protected Profile route.
- `src/components/auth/shared/protected-route.tsx`, `src/lib/auth/redirects.ts`, and `src/middleware.ts` already protect `/dashboard` prefixes through refresh-cookie hints and client full-session initialization. A `/dashboard/profile` route will inherit that protection.
- `src/lib/api/client.ts` is the authenticated Axios client. It attaches the memory-only access token, sends `X-Requested-With`, uses the BFF refresh route for 401 recovery, and must be reused for users, KYC, and risk calls.
- `src/lib/api/errors.ts` exposes `parseApiError`, which supports string `detail`, validation-array `detail`, `message`, `error`, and field errors. Profile UI must route user-facing errors through it.
- `src/providers/QueryProvider.tsx` provides React Query defaults. Feature hooks can override stale times and mutations must use `retry: false`.
- `src/store/auth-store.ts` is memory-only and contains `clearAuth`, `setSession`, `setFlags`, `hasFullSession`, `kycVerified`, and `riskAssessed`. Profile must not add a parallel auth/profile/risk store.
- `src/services/user.service.ts`, `src/hooks/user/useUser.ts`, and `src/hooks/user/useUserProfile.ts` already fetch `/users/me`, update profile through `PUT /users/me`, runtime-validate responses, hydrate the auth store user, and sync `kyc_verified` and `risk_assessed`.
- `src/services/kyc.service.ts` and `src/hooks/kyc/useKyc.ts` already fetch KYC status, runtime-validate responses, expose parsed errors, and use `retry: false`.
- `src/services/risk.service.ts` and `src/hooks/risk/useRisk.ts` already support latest assessment, history, questions, categories, recommendations, and full assessment submission through `apiClient` with runtime validation.
- `src/components/risk-assessment/dashboard/dashboard-risk-assessment-controller.tsx` already composes a dashboard-mode `RiskAssessmentWizard` for full assessment and reassessment flows. It invalidates profile, latest assessment, history, dashboard overview, recommendations, and marketplace recommendation keys after success.
- `src/lib/risk/profile-to-wizard-defaults.ts`, `src/lib/risk/build-assessment-payload.ts`, `src/lib/risk/report-display-model.ts`, and the existing wizard step components are the right foundations for any future assessment editing work.
- Existing dashboard Settings and Premiums pages demonstrate page-controller composition, semantic tabs, inline status regions, focus-trapped modal/slide-over behavior, MSW patterns, unit/integration tests, and Playwright route tests.
- `src/app/globals.css` defines the main design tokens: primary teal, accent yellow, app canvas, app sidebar, and app border.

Current gaps:

- There is no `src/app/(app)/dashboard/profile/page.tsx`, loading state, error boundary, or profile page controller.
- There is no `src/components/dashboard/profile/` feature area.
- `ROUTES.PROFILE` currently points to `/profile`, but the dashboard shell pattern suggests `/dashboard/profile`.
- `AppNavigation` marks Profile unavailable.
- Existing `useUpdateProfile` does not invalidate React Query caches after success. Profile implementation should either extend it or add a Profile-specific wrapper so successful updates invalidate `QUERY_KEYS.USER_ME`, `QUERY_KEYS.DASHBOARD_OVERVIEW`, and relevant risk/marketplace recommendation keys when assessment-relevant fields change.
- The current `useUpdateProfile` mutation does not explicitly set `retry: false`; the Profile implementation should fix that for expected validation failures.
- `AUTH_ENDPOINTS.CHANGE_PASSWORD`, `authService.changePassword`, and `useChangePassword` already exist through the BFF. There is also an existing standalone change-password form under `src/components/auth/change-password/`, but the Profile Security tab needs a dashboard row/modal/sheet treatment, not a separate settings page.
- KYC status service/hook already exists, but there is no Profile Security row that displays its status and routes to `/kyc`.
- The latest risk assessment contract returns `AssessmentResponse` with applicant, scores, profile, recommendations, and AI insights. It does not return the original full survey answers needed to populate all screenshot key-value fields in the six Risk Data cards.
- `AssessmentSummary` includes `created_at`, but `GET /api/v1/risk/history` is described only as chronological. Ordering direction and latest identity semantics are not documented, so the UI must be careful with "last generated" labels.
- There is no backend endpoint for "refresh insights" or persistent stale insight flags. Any refresh card must either be session-local after profile edits or route to the existing full assessment update flow.

## OpenAPI And Schema Audit Summary

The supplied OpenAPI attachment and local `openapi.json` both include the core Profile endpoints:

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PUT /api/v1/auth/change-password`
- `GET /api/v1/kyc/status`
- `GET /api/v1/risk/assessment`
- `GET /api/v1/risk/history`
- `GET /api/v1/risk/questions`
- `POST /api/v1/risk/assessment/{category}`

The supplied and local contracts both include the Profile-relevant schemas:

- `UserWithProfileResponse`
- `UserResponse`
- `UserProfileResponse`
- `UpdateProfileRequest`
- `ChangePasswordRequest`
- `KYCStatusResponse`
- `AssessmentResponse`
- `AssessmentSummary`
- `TechAssessmentInput`
- `ApplicantProfile`
- `PillarScores`

Important drift and gaps:

- The supplied OpenAPI documents a 422 validation response for `PUT /api/v1/auth/change-password`; the local generated `src/types/schema.d.ts` currently exposes only a 200 response with no content. Task 2 must sync local OpenAPI if the supplied contract remains authoritative, or document the backend-approved local difference.
- The local and supplied risk question/category response schemas are intentionally underspecified (`schema: {}`). The existing frontend validators define the narrow wizard shape currently consumed by the app. Profile planning should reuse those validators but should not treat them as an OpenAPI guarantee.
- `GET /api/v1/risk/assessment` returns the latest `AssessmentResponse`, but that response does not contain original answers such as `job_type`, `freelance_duration`, `income_sources`, `past_risks`, `insurance_types`, or `protection_priority`.
- `AssessmentResponse` has no timestamp. `AssessmentSummary.created_at` exists on history, but ordering/latest semantics are not explicit.
- No endpoint exists for stale insight detection, risk insight refresh, partial risk section update, saved profile-to-assessment snapshot, or section-level draft save.
- `UserProfileResponse.average_monthly_income` is a decimal string, while `UpdateProfileRequest.average_monthly_income` accepts number, decimal string, or null. Runtime validators should preserve that boundary.
- `KYCStatusResponse.status` is generated as `string | null`, while local KYC validators narrow it to `null | pending | verified | rejected | failed`. The narrowed frontend validator matches the implemented KYC feature and should be reused unless backend broadens the enum.

## API Contracts And Schemas Used

All authenticated backend endpoints use the existing Bearer-authenticated `apiClient`, except change password, which already goes through the auth BFF route to keep auth boundaries consistent.

### `GET /api/v1/users/me`

Returns `UserWithProfileResponse`:

- `user: UserResponse`
- `profile?: UserProfileResponse | null`
- `kyc_verified: boolean`
- `risk_assessed: boolean`

Profile page usage:

- Hydrate Personal Information.
- Populate the top-right user summary with name, occupation, and optional profile picture URL.
- Determine whether Risk Data has an assessment through the existing `risk_assessed` flag.
- Sync auth store flags through the existing user hook.

### `PUT /api/v1/users/me`

Accepts `UpdateProfileRequest` with optional nullable fields:

- `first_name`
- `last_name`
- `phone_number`
- `date_of_birth`
- `gender`
- `address_line_1`
- `address_line_2`
- `city`
- `state`
- `country`
- `postal_code`
- `occupation`
- `gig_platform`
- `average_monthly_income`
- `years_of_experience`
- `profile_picture_url`

Returns `UserWithProfileResponse`.

Frontend rules:

- Submit only changed documented fields.
- Do not submit unchanged values.
- Validate fields before submit and map 422 field errors back to form fields.
- Use `retry: false`.
- On success, update auth user/flags and invalidate relevant user/profile/dashboard/risk recommendation queries.
- If an assessment-relevant field changes, show a session-local Risk Data refresh prompt unless a real backend stale snapshot exists by implementation time.

### `PUT /api/v1/auth/change-password`

Accepts `ChangePasswordRequest`:

- `old_password`
- `new_password`

Frontend rules:

- Use existing `authService.changePassword`/`useChangePassword` unless Task 2 changes the network boundary.
- Use the existing password validation pattern: minimum 8, maximum 128, confirmation required in UI but never sent.
- Use `retry: false`.
- Keep the user authenticated after success.
- Show accessible success and error states.

### `GET /api/v1/kyc/status`

Returns `KYCStatusResponse`:

- `status: null | pending | verified | rejected | failed` through local runtime validation
- `document_type`
- `verified_at`
- `rejection_reason`

Frontend rules:

- Display status-aware Security copy.
- Link unverified, rejected, failed, or pending users to `/kyc`.
- Do not call the KYC callback endpoint from frontend.

### `GET /api/v1/risk/assessment`

Returns latest `AssessmentResponse`:

- `applicant`
- `category`
- `pillar_scores`
- `overall_score`
- `risk_profile`
- `recommendations`
- `recommended_categories?`
- `ai_insights`

Frontend rules:

- Use existing `useLatestAssessment`.
- Display only fields actually present in the response.
- Use `pillar_scores` and `risk_profile` for truthful grouped summaries where answer-level fields are unavailable.
- Do not fabricate original survey answers.

### `GET /api/v1/risk/history`

Returns `AssessmentSummary[]`:

- `id`
- `category`
- `first_name?`
- `last_name?`
- `age?`
- `overall_score`
- `risk_profile`
- `created_at`

Frontend rules:

- Use history only for safe contextual metadata, such as a list of past assessments or a candidate generated date after ordering semantics are confirmed.
- Do not infer latest date unless the implementation documents and tests backend ordering.

### `GET /api/v1/risk/questions`

Returns an underspecified question bank shape currently validated by `riskQuestionsResponseSchema`.

Frontend rules:

- Reuse the existing validator and wizard question model.
- Question metadata may help label Risk Data card sections, but it does not provide saved answers.

### `POST /api/v1/risk/assessment/{category}`

Accepts full `TechAssessmentInput` and returns `AssessmentResponse`.

Frontend rules:

- Use the existing dashboard risk assessment flow for update/retake.
- Do not plan section-level partial save as MVP unless backend adds partial update/draft endpoints or the current app already supports a safe answer-prefilled section-edit mode.

## Screenshot And UI Analysis

The supplied Profile screenshots show the completed authenticated dashboard shell:

- Persistent pale-teal left sidebar with GigSecure branding, active Profile row, and marketplace promo card.
- Top navbar aligned over the content column with menu icon/search where applicable, bell trigger, premiums placeholder, and `Take A Tour` placeholder.
- Main content below the navbar on the app canvas.
- Page heading: `Profile`.
- Subtitle: `Manage your personal details, security and preferences`.
- Top-right user summary with avatar/icon, name, and occupation.
- Three horizontal tabs:
  - `Personal Information`
  - `Risk Data`
  - `Security`
- Active tab uses dark teal text and a dark teal underline.
- Content is spacious, minimal, and aligned to the dashboard design system.
- Mobile and very small mobile must keep tabs usable, avoid horizontal overflow, preserve touch targets, and wrap top summary content cleanly.

### Personal Information Tab

Screenshot behavior:

- Display profile fields in grouped rows.
- Right-aligned `Edit` actions open editing for the corresponding group or row.
- Personal Information must hydrate from `GET /api/v1/users/me`.

Field mapping:

- First name -> `user.first_name`
- Last name -> `user.last_name`
- Email -> `user.email` display-only unless backend adds email update
- Phone number -> `user.phone_number`
- Date of birth -> `profile.date_of_birth`
- Gender -> `profile.gender`
- Address fields -> `profile.address_line_1`, `profile.address_line_2`
- City -> `profile.city`
- State -> `profile.state`
- Country -> `profile.country`
- Postal code -> `profile.postal_code`
- Occupation -> `profile.occupation`
- Gig platform -> `profile.gig_platform`
- Average monthly income -> `profile.average_monthly_income`
- Years of experience -> `profile.years_of_experience`
- Profile picture URL -> `profile.profile_picture_url`

### Risk Data Tab

Screenshot groups:

1. Personal details
2. You & your work
3. Income & stability
4. Your risks
5. Health & lifestyle
6. Safety net & insurance history

MVP mapping constraints:

- Personal details can use `AssessmentResponse.applicant` and profile fallback.
- Overall score, risk profile, and pillar scores can be displayed from `AssessmentResponse`.
- Exact answer summaries like work mode, clients based, hours per week, insurance coverage, savings duration, and top worries are not available in the latest assessment response.
- The implementation may display an honest "Not available from current assessment summary" state for fields that require original survey answers.
- The implementation should avoid showing screenshot values as if they came from the backend.

Refresh insights card:

- The screenshot shows a yellow warning card for outdated insights.
- No backend stale flag, refresh endpoint, or assessment snapshot exists.
- MVP should derive a lightweight session-only `riskInsightsStale` state after a successful profile edit changes assessment-relevant fields.
- The CTA should link to `/dashboard/risk-assessment` with `Update Assessment` or `Retake Assessment` copy, or be informational if route-level update affordance is enough.
- Persistent stale detection should be documented as a backend follow-up.

Risk Data editing:

- The screenshots show section-level wizard edit screens with sidebar/navbar still visible, a Back link, step indicator, section title, radio/checkbox groups, Cancel, Save for Later, Continue, and Submit on the final section.
- The existing dashboard risk route supports a full embedded wizard and reassessment flow.
- The backend accepts a full `TechAssessmentInput` submission, not partial section updates.
- The latest assessment response does not return saved answers, so a section edit screen cannot be prefilled truthfully from backend data.
- MVP recommendation: display Risk Data read-only in grouped cards and provide a full `Update Assessment` path through the existing dashboard risk assessment route.
- Section-level editing should be a follow-up requiring backend support for saved answers, drafts, partial updates, or a safe full-answer prefill contract.

### Security Tab

Screenshot behavior:

- A `Password` row with icon, label, neutral helper copy, and `Change` action.
- A `KYC/ Identity verification` row with icon, label, KYC status copy, and status-aware CTA.

Security mapping:

- Password action -> existing change-password BFF/service/hook.
- KYC status -> `GET /api/v1/kyc/status`.
- If password last-changed data is not available, use neutral copy such as "Keep your account password up to date" rather than "Last changed 3 months ago".
- KYC CTA should route to `/kyc` for not verified, pending, rejected, or failed states, and use read-only verified copy for verified users unless product wants a review route.

## Architecture Decisions

- Profile lives under `src/app/(app)/dashboard/profile/page.tsx`, so middleware and `ProtectedRoute` cover it through the existing `/dashboard` prefix.
- Update `AppNavigation` to make Profile available and active at `/dashboard/profile`. Do not add a second sidebar.
- Keep the App Router page as a small server metadata/composition boundary. Interactive behavior belongs in a client controller and focused child components.
- Reuse existing `userService`, `useUserProfile`, `useUpdateProfile`, `kycService`, `useKycStatus`, `riskService`, `useLatestAssessment`, `useAssessmentHistory`, and `useChangePassword`.
- Improve existing hooks where necessary instead of creating parallel data clients. In particular, profile update should use `retry: false` and cache invalidation.
- React Query owns user profile, KYC status, latest risk assessment, assessment history, and password mutation state. Do not copy server state into Zustand.
- Zustand remains limited to memory-only auth/session/user metadata/flags already established in the app.
- Use feature-local Profile UI primitives first. Extract shared dashboard primitives only if they clearly reduce duplication with Settings or Risk pages.
- Runtime validation is mandatory for JSON responses. Empty change-password success should be treated as successful through the existing BFF message schema or documented backend response handling.
- User-facing errors must go through `parseApiError`.
- Tabs must use semantic `tablist`, `tab`, and `tabpanel` roles with roving focus, arrow keys, Home/End, visible focus, and labelled panels.
- Edit forms should use grouped modal/sheet/inline editing based on implementation ergonomics, but they must support dirty state, cancel/reset, field-level validation, loading, success, error, and focus management.
- Assessment-relevant profile fields are `occupation`, `gig_platform`, `average_monthly_income`, `years_of_experience`, `city`, `state`, `country`, and any fields mapped into the risk payload, including first/last name, date of birth, gender, state, city, and occupation.
- Do not persist `riskInsightsStale` in a global store. Use local state/session-local derivation unless backend supplies a real stale flag.
- If the Risk Data tab uses `AssessmentSummary.created_at`, document the ordering assumption and cover it with tests. Otherwise omit generated-date labels.
- Mobile must have no horizontal overflow, stable tab behavior, wrapped action rows, and readable form controls.
- Every completed implementation task must append a WAT timestamped entry to `CONTEXT.md` with files changed, summary, important decisions, known follow-ups, and validation.

## Open Questions

1. Should the route be `/dashboard/profile` or `/profile`? Default: `/dashboard/profile`, because the Profile UI belongs to the authenticated dashboard shell and inherits `/dashboard` protection.
2. Should profile editing be row-level, group-level, or full-form? Default: group-level edit sections to match the screenshot while keeping validation and dirty state manageable.
3. Can the backend provide password last-changed metadata? Current contract does not, so use neutral helper copy.
4. Can the backend provide saved risk assessment answers or section summaries? Current `AssessmentResponse` does not, so Risk Data MVP must not fabricate answer-level fields.
5. Can the backend provide an assessment snapshot or stale-insights flag tied to profile fields? Current contract does not, so stale insights are session-local after edits.
6. Should the Refresh Insights CTA trigger a backend operation or route to the existing dashboard risk assessment flow? Default: route to `/dashboard/risk-assessment` until a refresh endpoint exists.
7. Should Risk Data cards show completion counts like `6 of 7 completed`? Current latest assessment contract has no per-section completion data. Default: show available/unavailable status derived from present data, not invented counts.
8. Should section-level Risk Data edit screens be built before backend partial update support exists? Default: no. Use the existing full wizard update path.
9. Does `GET /api/v1/risk/history` return newest-first or oldest-first? Default: do not rely on ordering for "last generated" unless backend confirms or the service sorts by `created_at` with documented semantics.
10. Should KYC verified users get a read-only detail view or a CTA to `/kyc`? Default: show verified status and optionally "View details" to `/kyc` because the existing KYC route supports verified users.

## Ordered Implementation Tasks

### Task 1: Profile Audit And Contract Lock

Goal: Revalidate the live codebase, screenshots, supplied OpenAPI, local OpenAPI, and generated schema before feature implementation starts.

Files likely touched:

- `DASHBOARD_PROFILE_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- Current route tree, app shell, sidebar, navbar, auth guard, API client, error parser, React Query setup, MSW setup, user/profile services, KYC services, risk services, risk wizard architecture, and test patterns are documented.
- Screenshot requirements are mapped to real `UserWithProfileResponse`, `KYCStatusResponse`, `AssessmentResponse`, and `AssessmentSummary` fields.
- Missing or insufficient fields are recorded without invented frontend data.
- Risk Data section-level editing feasibility is documented.
- No feature code is implemented in this task.

Testing:

- No automated tests required for planning-only work.

Dependencies:

- None.

### Task 2: OpenAPI Sync And Generated Types

Goal: Ensure local `openapi.json` and generated declarations match the backend-approved Profile contracts.

Files likely touched:

- `openapi.json`
- `src/types/schema.d.ts`
- `CONTEXT.md`

Acceptance criteria:

- Local `openapi.json` is compared against the supplied OpenAPI for:
  - `GET /api/v1/users/me`
  - `PUT /api/v1/users/me`
  - `PUT /api/v1/auth/change-password`
  - `GET /api/v1/kyc/status`
  - `GET /api/v1/risk/assessment`
  - `GET /api/v1/risk/history`
  - `GET /api/v1/risk/questions`
  - `POST /api/v1/risk/assessment/{category}`
- Local schemas include the Profile-relevant schemas listed in this epic.
- The change-password 422 response drift is resolved or explicitly documented as a backend-approved local difference.
- `src/types/schema.d.ts` is regenerated with `npm run generate:types` if OpenAPI changes.
- `src/types/schema.d.ts` is not hand-edited.

Testing:

- `npm run generate:types` if OpenAPI changes
- `npx tsc --noEmit`

Dependencies:

- Task 1.

### Task 3: Profile Domain Types, Validators, Endpoints, Query Keys, And MSW

Goal: Lock Profile-specific runtime contracts and mocks while reusing existing domain modules.

Files likely touched:

- `src/types/profile.ts`
- `src/lib/validators/user.ts`
- `src/lib/validators/kyc.ts`
- `src/lib/validators/risk.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/constants.ts`
- `src/mocks/fixtures/profile.ts`
- `src/mocks/handlers/profile.ts` or existing `auth.ts` user handlers
- `src/mocks/handlers/index.ts`
- `src/__tests__/lib/profile-validators.test.ts`
- `src/__tests__/mocks/profile-handlers.test.ts`
- `CONTEXT.md`

Acceptance criteria:

- Feature types are derived from generated `components['schemas']` or existing validator inference where available.
- Existing user validators still match `UserWithProfileResponse`, `UserResponse`, `UserProfileResponse`, and `UpdateProfileRequest`.
- Profile form schemas validate editable fields and preserve API boundaries for decimal strings, dates, nullable fields, and integer years of experience.
- Endpoint constants remain canonical for users, KYC, risk, and auth change password.
- Query keys exist or are reused for `USER_ME`, `KYC_STATUS`, `RISK_ASSESSMENT`, `RISK_HISTORY`, and change-password mutation scope if needed.
- MSW handlers cover profile get/update success, validation error, unauthorized, malformed response, KYC states, latest assessment success/empty/error, and password success/error.
- No undocumented user, KYC, or risk fields are introduced.

Testing:

- Validator tests cover valid responses, malformed responses, editable form payloads, decimal income, null fields, dirty-payload generation, and field-level validation.
- MSW tests cover authenticated success, 422 field errors, malformed data, and relevant empty/error states.

Dependencies:

- Task 2.

### Task 4: Profile, Security, KYC, And Risk Services/Hooks

Goal: Reuse and tighten service/hook behavior needed by the Profile page.

Files likely touched:

- `src/services/user.service.ts`
- `src/hooks/user/useUser.ts`
- `src/services/kyc.service.ts`
- `src/hooks/kyc/useKyc.ts`
- `src/services/risk.service.ts`
- `src/hooks/risk/useRisk.ts`
- `src/hooks/auth/useAuth.ts`
- `src/__tests__/services/user.service.test.ts`
- `src/__tests__/hooks/user-profile.test.tsx`
- `src/__tests__/services/kyc.service.test.ts`
- `src/__tests__/hooks/kyc-hooks.test.tsx`
- `src/__tests__/hooks/risk-hooks.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Existing services use `apiClient` or existing auth BFF paths as appropriate.
- Query services pass `AbortSignal` where supported.
- JSON responses are runtime-validated.
- `useUpdateProfile` or a new wrapper mutation uses `retry: false`.
- Successful profile update syncs auth user/flags and invalidates `QUERY_KEYS.USER_ME`.
- Successful profile update invalidates dashboard/risk/marketplace recommendation queries when assessment-relevant fields change.
- KYC status query uses `retry: false` and exposes `parsedError`.
- Latest assessment and history hooks remain `retry: false` and expose `parsedError`.
- Password mutation uses `retry: false` and keeps user authenticated after success.
- UI-facing errors remain compatible with `parseApiError`.

Testing:

- Service tests verify endpoints, methods, payloads, validation, empty success handling, and error propagation.
- Hook tests verify enabled states, cache invalidation, no mutation retry, parsed errors, profile flag sync, KYC status branches, latest assessment loading/error/success, and password mutation success/error.

Dependencies:

- Task 3.

### Task 5: Shared Profile UI Primitives

Goal: Build focused, accessible Profile primitives that support all three tabs.

Files likely touched:

- `src/components/dashboard/profile/profile-tabs.tsx`
- `src/components/dashboard/profile/user-summary-header.tsx`
- `src/components/dashboard/profile/profile-field-row.tsx`
- `src/components/dashboard/profile/editable-profile-section.tsx`
- `src/components/dashboard/profile/profile-form-fields.tsx`
- `src/components/dashboard/profile/risk-section-card.tsx`
- `src/components/dashboard/profile/completion-badge.tsx`
- `src/components/dashboard/profile/refresh-insights-card.tsx`
- `src/components/dashboard/profile/security-row.tsx`
- `src/components/dashboard/profile/profile-status.tsx`
- `src/components/dashboard/profile/profile-skeleton.tsx`
- `src/components/dashboard/profile/profile-error-state.tsx`
- `src/__tests__/components/dashboard/profile/profile-primitives.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Tabs use semantic `tablist`, `tab`, and `tabpanel` relationships.
- Tabs support click, Enter/Space, ArrowLeft/ArrowRight, Home/End, visible focus, and screen-reader labels.
- User summary handles missing profile picture, missing last name, and missing occupation.
- Field rows handle empty values with neutral copy and preserve accessible edit controls.
- Editable section shell supports loading, dirty state, cancel/reset, save pending, success, error, and field-level errors.
- Risk section cards support title, subtitle, status, edit/update action, expand/collapse if implemented, and key-value rows without inventing data.
- Completion badge text is color-independent.
- Refresh insights card exposes tags, last generated copy only when supported, CTA, and a small AI-not-real-time note.
- Security row has icon, label, helper text, status, action, and keyboard-accessible controls.
- Components use existing tokens and lucide icons.
- Components avoid nested card layouts and horizontal overflow.

Testing:

- Component tests cover keyboard tabs, user summary fallbacks, field-row edit labels, form dirty/cancel/save states, status announcements, risk card data gaps, refresh card CTA, security row states, and responsive class/structure expectations.

Dependencies:

- Task 4.

### Task 6: Personal Information Section

Goal: Implement Personal Information display and editing from real user/profile contracts.

Files likely touched:

- `src/components/dashboard/profile/personal-information-section.tsx`
- `src/components/dashboard/profile/personal-information-form.tsx`
- `src/components/dashboard/profile/profile-formatters.ts`
- `src/__tests__/components/dashboard/profile/personal-information-section.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Section hydrates from `GET /api/v1/users/me`.
- It displays all contracted fields listed in this epic, with empty-value fallbacks.
- Email is displayed from `user.email` and not edited unless backend adds an email update contract.
- Edit controls are accessible and restore focus after cancel/save.
- Form validation matches API constraints and existing app patterns.
- Dirty state prevents submitting unchanged data.
- Submit sends only changed documented fields to `PUT /api/v1/users/me`.
- Field-level 422 errors are associated with controls.
- Cancel resets unsaved changes.
- Save success is visible and announced.
- Loading, error, empty, and retry states are visible and accessible.
- Successful update invalidates relevant queries.
- Updates to assessment-relevant profile fields trigger session-local stale Risk Data state.

Testing:

- Tests cover loading, successful display, empty profile, edit open/cancel, dirty unchanged submit prevention, changed-field payload, successful save, field-level API validation, generic API error, focus restoration, query invalidation, and stale-insights trigger.

Dependencies:

- Tasks 4 and 5.

### Task 7: Risk Data Read-Only Grouped Section

Goal: Implement the Risk Data tab as truthful grouped cards from existing assessment contracts.

Files likely touched:

- `src/components/dashboard/profile/risk-data-section.tsx`
- `src/components/dashboard/profile/risk-data-card-grid.tsx`
- `src/components/dashboard/profile/risk-data-mappers.ts`
- `src/__tests__/components/dashboard/profile/risk-data-section.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Section uses `useUserProfile` to determine whether risk assessment data exists.
- If `risk_assessed` is false, it renders a friendly empty state with CTA to `/dashboard/risk-assessment`.
- If assessed, it loads `GET /api/v1/risk/assessment`.
- It displays grouped cards:
  - Personal details
  - You & your work
  - Income & stability
  - Your risks
  - Health & lifestyle
  - Safety net & insurance history
- Cards show only fields backed by `AssessmentResponse`, `AssessmentSummary`, or profile data.
- Missing answer-level fields render explicit unavailable/needs-update copy, not screenshot placeholders.
- Overall risk profile, score, pillar scores, recommendations, and AI insights are rendered where useful.
- Loading, error, empty, malformed, and retry states are visible and accessible.
- Existing public and authenticated risk assessment flows are not changed by this task.

Testing:

- Tests cover unassessed empty state, latest loading, latest success, unavailable answer-level fields, score/pillar rendering, API error with retry, malformed response, and no fabricated screenshot data.

Dependencies:

- Tasks 4 and 5.

### Task 8: Risk Insights Stale And Refresh Behavior

Goal: Add lightweight stale-insights behavior after assessment-relevant profile changes without inventing backend state.

Files likely touched:

- `src/components/dashboard/profile/profile-page-controller.tsx`
- `src/components/dashboard/profile/refresh-insights-card.tsx`
- `src/components/dashboard/profile/risk-insights-stale.ts`
- `src/__tests__/components/dashboard/profile/risk-insights-stale.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Stale state is derived from real data where possible.
- If no assessment snapshot exists, stale state appears only after the current session successfully updates an assessment-relevant profile field.
- Stale state is not persisted in Zustand, local storage, or a new global store.
- Change tags use only known changed fields, such as `Income updated`, `Occupation updated`, `Location updated`, or `Work profile updated`.
- Last generated date is shown only if safely derived from history with documented semantics; otherwise omit it.
- CTA routes to `/dashboard/risk-assessment` with update/retake copy.
- If a backend refresh endpoint is added later, this task documents the integration point rather than inventing one now.

Testing:

- Tests cover non-relevant profile update, relevant profile update, multiple tags, no persistence, CTA routing, optional generated-date behavior, and accessible status copy.

Dependencies:

- Tasks 6 and 7.

### Task 9: Risk Data Edit Feasibility Decision And Full Assessment Update Path

Goal: Provide a safe update path while explicitly deferring unsafe section-level edits.

Files likely touched:

- `src/components/dashboard/profile/risk-data-section.tsx`
- `src/components/dashboard/profile/risk-section-card.tsx`
- `src/components/dashboard/profile/risk-data-edit-note.tsx`
- `src/__tests__/components/dashboard/profile/risk-data-edit-path.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Each Risk Data card may expose an `Update` or `Edit` action only if it routes to the existing full dashboard assessment flow or opens explanatory copy.
- The UI does not claim section-level editing or partial save support.
- Copy makes clear that updating risk data uses the full assessment flow until section editing is supported.
- Existing `/dashboard/risk-assessment` reassessment flow remains unchanged and covered by existing tests.
- Public `/assessment` acquisition flow is not touched.
- Backend/design follow-up is documented for saved answers, partial section update, draft save, and refresh insights endpoint.

Testing:

- Tests cover CTA destination, no partial endpoint calls, explanatory copy, and no regression in route/link behavior.

Dependencies:

- Tasks 7 and 8.

### Task 10: Security Section With Change Password And KYC Status

Goal: Implement the Security tab using documented password and KYC contracts.

Files likely touched:

- `src/components/dashboard/profile/security-section.tsx`
- `src/components/dashboard/profile/change-password-modal.tsx`
- `src/components/dashboard/profile/kyc-status-row.tsx`
- `src/__tests__/components/dashboard/profile/security-section.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Password row renders icon, label `Password`, neutral helper copy, and `Change` action.
- Change action opens an accessible form modal/sheet with current password, new password, and confirm password.
- Form validation reuses existing password constraints.
- Submit sends only `{ old_password, new_password }`.
- Mutation uses `retry: false`.
- Success keeps user authenticated, resets sensitive fields, closes or shows a clear success state, and announces status.
- Errors use `parseApiError` and field-level mapping where possible.
- KYC row loads `GET /api/v1/kyc/status`.
- KYC row renders verified, pending, rejected, failed, and no-attempt states with user-friendly copy.
- KYC CTA routes to `/kyc` where appropriate.
- Loading, error, retry, and empty KYC states are accessible.

Testing:

- Tests cover password modal open/close, focus trap/restoration, validation, successful password change, failed password change, sensitive field reset, each KYC status, KYC loading/error/retry, and CTA routing.

Dependencies:

- Tasks 4 and 5.

### Task 11: Profile Page Composition Under Authenticated Dashboard Route

Goal: Add the protected Profile route and compose all tabs.

Files likely touched:

- `src/app/(app)/dashboard/profile/page.tsx`
- `src/app/(app)/dashboard/profile/loading.tsx`
- `src/app/(app)/dashboard/profile/error.tsx`
- `src/components/dashboard/profile/profile-page-controller.tsx`
- `src/components/dashboard/shell/app-navigation.tsx`
- `src/lib/constants.ts`
- `src/__tests__/pages/dashboard-profile.test.tsx`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- `/dashboard/profile` is protected by existing middleware and `ProtectedRoute`.
- Page metadata is defined.
- Profile sidebar item is enabled and active on `/dashboard/profile`.
- Page heading is `Profile`.
- Subtitle is `Manage your personal details, security and preferences`.
- Top user summary renders from profile data.
- Tabs compose Personal Information, Risk Data, and Security.
- Initial tab is stable and keyboard accessible.
- Page-level loading and error boundaries match dashboard patterns.
- No settings sections are included.
- No duplicate navbar/sidebar/shell is created.

Testing:

- Page tests cover protected composition, heading/subtitle, tab switching, active sidebar nav, user summary, loading state, route error fallback, and absence of settings-only sections.

Dependencies:

- Tasks 6, 7, 8, 9, and 10.

### Task 12: Responsive And Accessibility Pass

Goal: Verify the Profile page is accessible and stable across dashboard breakpoints.

Files likely touched:

- `src/components/dashboard/profile/*`
- `src/__tests__/components/dashboard/profile/profile-accessibility.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- There is one page-level `h1`.
- Tabs, forms, modals, and status regions have correct accessible names and relationships.
- Keyboard users can switch tabs, open edit controls, cancel/save forms, change password, retry queries, and reach CTAs.
- Focus is restored after modals/sheets close.
- Errors are programmatically associated with fields.
- Status/success/error announcements use polite/assertive regions appropriately.
- Color is not the only signal for completion or status.
- Mobile layout at 320, 360, 390, 768, 1024, 1280, and 1440+ has no horizontal overflow.
- Long names, emails, occupations, locations, and backend risk profile text wrap without overlap.
- Touch targets remain usable.

Testing:

- Testing Library accessibility/structure tests for headings, labels, tabs, dialogs, status regions, and long text.
- Playwright viewport checks are added in Task 14.

Dependencies:

- Task 11.

### Task 13: Unit And Integration Tests

Goal: Complete focused Vitest coverage for Profile domain, hooks, components, and page composition.

Files likely touched:

- `src/__tests__/lib/profile-validators.test.ts`
- `src/__tests__/services/user.service.test.ts`
- `src/__tests__/hooks/user-profile.test.tsx`
- `src/__tests__/hooks/kyc-hooks.test.tsx`
- `src/__tests__/hooks/risk-hooks.test.tsx`
- `src/__tests__/components/dashboard/profile/*.test.tsx`
- `src/__tests__/pages/dashboard-profile.test.tsx`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`
- `CONTEXT.md`

Acceptance criteria:

- Tests cover loading, success, error, validation, dirty state, cancel/reset, refresh insights prompt, keyboard tabs, KYC states, password mutation, risk data rendering, and mobile-safe structure.
- Tests verify API responses are runtime-validated.
- Tests verify user-facing errors use `parseApiError` output.
- Tests verify mutations use `retry: false` where expected.
- Existing dashboard, risk assessment, settings, premiums, auth, and KYC tests still pass or are updated only for legitimate Profile navigation changes.

Testing:

- Run the Profile-focused Vitest matrix.
- Run relevant existing app-navigation, user, KYC, risk, and auth tests.

Dependencies:

- Tasks 3 through 12.

### Task 14: E2E Coverage

Goal: Add Playwright coverage for the protected Profile user journeys.

Files likely touched:

- `e2e/dashboard/profile-flow.spec.ts`
- `e2e/dashboard/helpers.ts` if a shared helper exists or is created
- `CONTEXT.md`

Acceptance criteria:

- Unauthenticated `/dashboard/profile` redirects to login with a safe redirect parameter.
- Authenticated user can open Profile from sidebar.
- Personal Information tab renders profile data.
- User can edit a personal information field and see the updated value.
- Updating an assessment-relevant profile field shows the refresh insights prompt.
- Risk Data tab displays latest assessment summary and honest unavailable states for unsupported answer-level fields.
- Risk Data update CTA routes to `/dashboard/risk-assessment`.
- Security tab displays KYC status.
- Failed password change shows an error.
- Successful password change shows a success state and keeps the user authenticated.
- Desktop and mobile viewport checks confirm no horizontal overflow.

Testing:

- `npm run test:e2e -- e2e/dashboard/profile-flow.spec.ts`
- If sandbox port binding fails, rerun the approved e2e command with escalation as established by prior epics.

Dependencies:

- Task 13.

### Task 15: Final QA And Context Update

Goal: Complete implementation verification and handoff notes.

Files likely touched:

- `CONTEXT.md`
- Any test snapshots or fixtures legitimately updated by final fixes

Acceptance criteria:

- `CONTEXT.md` includes a final Profile epic summary with files changed, completed work, important decisions, known follow-ups, and validation output.
- Known backend gaps are listed:
  - saved risk answers/section summaries
  - section-level edit/partial update/draft save support
  - persistent stale insight detection
  - refresh insights endpoint
  - password last-changed metadata
  - risk history ordering semantics
- Public `/assessment` and `/dashboard/risk-assessment` flows are confirmed not broken.
- No unrelated refactors or speculative abstractions remain.
- Generated files are produced by generation only.
- No feature code uses undocumented fields.

Testing:

- `npm run generate:types` if OpenAPI changed
- Profile-focused unit/integration matrix
- Relevant existing auth/user/KYC/risk/dashboard/app-navigation tests
- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`
- Profile Playwright spec
- Broader `npm test -- --run` if time/environment permits

Dependencies:

- Task 14.

## Testing And QA Strategy

- Unit tests validate schemas, mappers, formatters, dirty-payload generation, stale-insights derivation, and unsupported-field handling.
- Service tests verify endpoint constants, methods, payloads, response validation, and error propagation.
- Hook tests verify React Query keys, enabled states, invalidation, parsed errors, mutation retry settings, and auth flag sync.
- Component tests verify accessible tabs, forms, modals, status regions, KYC states, password flow, Risk Data cards, and refresh card behavior.
- Page tests verify composition inside the authenticated app shell and active navigation.
- E2E tests cover real user flows across tabs plus mobile/desktop overflow checks.
- Regression tests must preserve public `/assessment` and dashboard `/dashboard/risk-assessment` behavior.
- Tests must verify expected behavior, not internal implementation trivia, and must not be weakened to pass.

## Final Handoff Requirements

At completion, the implementation handoff must include:

- Summary of Profile page capabilities shipped.
- Files changed, grouped by domain/API, UI/routes, mocks/tests, and docs.
- Confirmation that Profile is protected and uses the existing app shell.
- Confirmation that `apiClient`, React Query, `parseApiError`, existing auth store/session behavior, KYC hooks, and risk hooks were reused.
- Explicit note that Risk Data MVP is read-only and uses full assessment update flow unless backend support changed.
- Any OpenAPI/schema drift resolved during implementation.
- Remaining backend/product follow-ups.
- Validation commands run and their results.
