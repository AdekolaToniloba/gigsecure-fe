# GigSecure KYC Feature Epic

Created: 2026-05-27 18:52 WAT

## Objective

Implement the complete GigSecure KYC identity verification experience for authenticated users in Next.js App Router with TypeScript, Zustand, React Query, secure memory-only session flag handling, accessible UI, route/action gating, and meaningful unit, integration, and e2e coverage.

## Scope Summary

- Integrate `kyc_verified` and `risk_assessed` user flags across auth BFF responses, silent refresh, `/users/me`, Zustand auth state, and reusable hooks.
- Hydrate authenticated user/profile data after session initialization with `GET /users/me`.
- Add KYC-specific types, Zod validators, endpoint constants, services, hooks, and MSW handlers.
- Build reusable KYC gating primitives: `KycStatusGate` and `KycRequiredModal`.
- Add a dashboard KYC banner for unverified users.
- Add the protected `/kyc` route using app chrome, not AuthShell.
- Build the NIN-only KYC verification form and KYC status/polling UI.
- Cover accessibility, SEO, loading/error/success states, field validation, route protection, unit/integration tests, and Playwright e2e tests.

## Codebase Audit Summary

- Auth state currently lives in `src/store/auth-store.ts` as memory-only Zustand state with `accessToken`, basic user metadata, and auth initialization status. It does not yet include `kycVerified`, `riskAssessed`, `setSession`, or `setFlags`; Task 2 owns adding those without persisting sensitive session state.
- Auth BFF response handling currently lives in `src/app/api/auth/_bff-utils.ts` and stores the backend refresh token in the `gs_refresh_token` httpOnly cookie while returning only browser-safe token data. It does not yet forward `kyc_verified` or `risk_assessed`; Task 2 must add those fields while continuing to exclude `refresh_token` from browser responses.
- Auth response validators in `src/lib/validators/auth.ts` currently validate access-token responses without user flags. The refresh queue in `src/lib/api/refresh-queue.ts` currently parses only the new access token, so Task 2 must make silent refresh preserve and sync flags.
- The shared Axios client in `src/lib/api/client.ts` is the correct transport for KYC verify/status calls. It already attaches the memory-only access token, sends `X-Requested-With: XMLHttpRequest`, uses the BFF refresh endpoint for 401 recovery, and retries failed original requests after a queued refresh.
- Endpoint constants in `src/lib/api/endpoints.ts` currently include auth, users, risk, marketplace, policies, claims, payments, and admin endpoints. `ENDPOINTS.KYC` does not yet exist and must be added in Task 4.
- User profile fetching currently exists as `userService.getMe` in `src/services/user.service.ts` and `useCurrentUser` in `src/hooks/user/useUser.ts`. The current profile schema and hook do not yet sync `kyc_verified` or `risk_assessed`, and no `useUserProfile` or `useUserFlags` abstraction exists yet; Task 3 owns that integration.
- The local `openapi.json` and generated `src/types/schema.d.ts` are stale for this feature: they do not include `/api/v1/kyc/verify`, `/api/v1/kyc/status`, `/api/v1/kyc/callback`, or the user flag fields on token/profile responses. The KYC epic therefore uses the provided API contract as source of truth until the generated schema is refreshed.
- MSW auth/user handlers in `src/mocks/handlers/auth.ts` currently return token and `/users/me` payloads without user flags. There are no KYC handlers yet; Task 4 must add KYC handlers and Task 2/3 must update existing auth/user mocks.
- Middleware protection currently relies only on the server-visible refresh cookie and protected path constants in `src/lib/auth/redirects.ts`. `/kyc` is not yet listed as protected, and middleware cannot decide KYC completion because access tokens and flags are memory-only; Task 7 must add `/kyc` to protected paths and keep final flag redirects in client route control.
- The dashboard at `src/app/(app)/dashboard/page.tsx` is currently a placeholder content grid with no KYC banner or gated recommendations action. Task 8 owns adding the first real KYC-gated dashboard consumer.
- Risk recommendations already have endpoint constants, `riskService.getRecommendations`, and `useRiskRecommendations`; Task 8 should reuse that path for verified users instead of inventing a parallel recommendations client.
- Existing tests use Vitest, Testing Library, MSW, and Playwright. KYC has no test coverage yet; Tasks 4 through 13 add targeted validators, services, hooks, components, route, and e2e coverage.
- KYC UI must use authenticated app chrome and the existing design tokens from `src/app/globals.css`: `primary`, `primary-light`, `primary-muted`, `accent`, and `background`. It must not use AuthShell, which is reserved for public auth pages.

## New API Contracts

### User Flags

`kyc_verified` and `risk_assessed` now appear on:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/users/me`

Backend token response:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "kyc_verified": false,
  "risk_assessed": true
}
```

Browser-safe BFF token response:

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "kyc_verified": false,
  "risk_assessed": true
}
```

`GET /api/v1/users/me` response:

```json
{
  "user": { "id": "uuid", "email": "user@example.com", "first_name": "Amaka", "status": "active", "email_verified": true },
  "profile": { "date_of_birth": "1995-06-15", "city": "Lagos", "country": "Nigeria" },
  "kyc_verified": false,
  "risk_assessed": false
}
```

Recommended post-login/onboarding redirect logic:

```ts
if (!risk_assessed) redirect('/risk-assessment');
else if (!kyc_verified) redirect('/kyc');
else redirect('/dashboard');
```

### KYC Verify

`POST /api/v1/kyc/verify` requires Bearer auth through the shared Axios client.

Request:

```json
{
  "document_type": "NIN",
  "document_number": "12345678901",
  "first_name": "Amaka",
  "last_name": "Obi",
  "date_of_birth": "1995-06-15"
}
```

Response:

```json
{ "status": "verified", "message": "Identity verified successfully.", "smile_job_id": "500000001" }
```

or:

```json
{ "status": "rejected", "message": "Details do not match records.", "smile_job_id": "500000002" }
```

Notes:

- `document_type` is `const "NIN"` for frontend implementation.
- `document_number` must be exactly 11 digits.
- No alternate document type is exposed in frontend types, schemas, mocks, UI, tests, or labels.

### KYC Status

`GET /api/v1/kyc/status` requires Bearer auth through the shared Axios client.

Response:

```json
{
  "status": "verified",
  "document_type": "NIN",
  "verified_at": "2026-04-24T10:00:00Z",
  "rejection_reason": null
}
```

`status` can be:

- `null`: user has never attempted KYC.
- `pending`: verification is in progress.
- `verified`: identity is verified.
- `rejected`: submitted details did not match records; user can retry.
- `failed`: verification failed for a technical or provider reason.

### KYC Callback

`POST /api/v1/kyc/callback` is a backend webhook for asynchronous Smile ID results. The frontend must understand this endpoint exists but must not call it.

### Generated OpenAPI Note

The local `openapi.json` currently does not include `/api/v1/kyc/*` paths, while the provided OpenAPI schema does. Implementation should either regenerate `src/types/schema.d.ts` from the updated schema or add hand-maintained KYC types in `src/types/kyc.ts` until the local OpenAPI file is updated.

## Open Questions

No KYC planning questions are currently unresolved. Resolved decisions:

1. Pending KYC polling should run every 3 seconds for the first 30 seconds, then back off to every 10 seconds. Stop polling after 5 minutes and show a "this is taking longer than expected, check back later" state.
2. Post-verification destination is `/dashboard`.
3. `rejected` and `failed` are retryable after a 1-hour cooldown.
4. `rejected` and `failed` must have distinct user-facing copy. `rejected` means submitted details did not match Smile ID records and should guide the user to double-check their NIN slip or NIMC card. `failed` means a technical/provider issue and must not imply the user's details were wrong.
5. When `POST /kyc/verify` returns `{ status: "verified" }`, set `kycVerified: true` in the auth store immediately, then refetch `GET /users/me` in the background. Do not change the store flag on `rejected` or `failed`.
6. Risk assessment must use the same flag sync utilities established here. The risk epic should call the shared session/flag action instead of introducing a separate store shape.
7. The first real consumer of `KycRequiredModal` should be a dashboard "View Recommendations" or "Get your coverage plan" action backed by `GET /api/v1/risk/recommendations`. Unverified users see the modal and CTA to `/kyc`; verified users call the endpoint.
8. `POST /api/v1/kyc/verify` should use direct Bearer-authenticated Axios through `apiClient`, not a frontend BFF route. It does not issue or consume refresh tokens, and the shared Axios client already sends `X-Requested-With: XMLHttpRequest`.

## Product and Architecture Decisions

- Pending status polling uses a responsive-to-conservative backoff: 3 seconds for the first 30 seconds, then 10 seconds until a 5-minute maximum.
- Post-verification routing goes to `/dashboard`.
- Verified users who later visit `/kyc` remain on the page and see the successfully verified state plus `/users/me` profile details. This supersedes the earlier Task 7/13 redirect-away wording and matches the UX follow-up completed after Task 11.
- `rejected` and `failed` are both retryable after a 1-hour memory-only cooldown, but they must use different user-facing explanations.
- `kycVerified` is set immediately on synchronous `status: "verified"` from `POST /kyc/verify`, followed by background `GET /users/me` refetch.
- `riskAssessed` and `kycVerified` updates must share the same session/flag store utilities so future risk work does not create a parallel state model.
- The first reusable KYC modal consumer is the dashboard recommendations action backed by `GET /api/v1/risk/recommendations`.
- KYC verify/status use direct Axios through `apiClient`; no KYC BFF route is planned because no refresh token is involved.
- All KYC tasks must include appropriate loading states and specific, user-friendly error states for validation, rejection, provider failure, long-running pending, auth/session failure, and unexpected server errors.

## Final Implementation Map

Task 14 final QA confirms the implemented KYC flow is complete with the current product decisions above.

- Auth/session flags: `src/store/auth-store.ts`, `src/lib/validators/auth.ts`, auth BFF routes, `src/services/auth.service.ts`, and `src/hooks/auth/useAuth.ts` keep `kyc_verified` and `risk_assessed` memory-only and browser-safe.
- Profile flag sync: `src/services/user.service.ts`, `src/hooks/user/useUser.ts`, `src/hooks/user/useUserProfile.ts`, and `src/hooks/auth/useUserFlags.ts` hydrate `/users/me` and sync flags through `setFlags`.
- KYC contract/runtime layer: `openapi.json`, `src/types/schema.d.ts`, `src/types/kyc.ts`, `src/lib/validators/kyc.ts`, `src/lib/api/endpoints.ts`, and `src/mocks/handlers/kyc.ts` cover NIN-only verify/status contracts and test fixtures.
- KYC data hooks: `src/services/kyc.service.ts` and `src/hooks/kyc/useKyc.ts` use direct authenticated `apiClient`, parse responses, expose user-facing errors, update the verified flag only on confirmed verified responses, and poll pending status with the resolved backoff policy.
- Gates and dashboard consumers: `src/hooks/kyc/useKycGate.ts`, `src/components/kyc/shared/*`, `src/components/kyc/dashboard/*`, and `src/app/(app)/dashboard/page.tsx` provide the reusable KYC gate, required modal, unverified dashboard banner, and gated recommendations action.
- Protected KYC page: `src/app/(app)/kyc/page.tsx`, `src/components/kyc/kyc-route-controller.tsx`, `src/components/kyc/kyc-page.tsx`, `src/components/kyc/verify/*`, and `src/components/kyc/status/*` compose the authenticated app-chrome KYC experience with verified profile display, NIN-only form, status display, retry cooldown, and accessible async states.
- Route protection: `src/middleware.ts`, `src/lib/auth/redirects.ts`, and `src/components/auth/shared/protected-route.tsx` protect `/kyc` using the refresh-cookie session hint and client-side memory-only session initialization.
- Test coverage: `src/__tests__/...` covers validators, services, hooks, store/session behavior, route guards, page composition, status polling, form states, dashboard banner/action, modal/gate behavior, and `e2e/kyc/kyc-flow.spec.ts` covers the full KYC user flow.

## Final QA Status

- KYC security requirements are met: access tokens remain memory-only, refresh tokens remain httpOnly-cookie-only through auth BFF routes, KYC verify/status use direct Bearer-authenticated `apiClient`, and no KYC BFF route was added.
- NIN-only behavior is enforced in validators, UI, mocks, and tests. The generated OpenAPI description still contains backend wording that mentions BVN, but frontend-facing types, schemas, labels, mocks, and tests expose only `NIN`.
- `kyc_verified` and `risk_assessed` are synchronized from login, refresh, and `/users/me`; KYC status/verify set `kycVerified` only on confirmed `verified` outcomes.
- No KYC product questions remain unresolved. The only documented policy change is the verified-user `/kyc` behavior noted above.
- Final QA passed on 2026-05-29: `npm run lint`, `npm test -- --run`, `npx tsc --noEmit`, `npm run test:e2e -- --project=chromium`, `npm run build`, and `git diff --check`.

## Epic Tasks

### Task 1: KYC Codebase Audit and Contract Lock

Goal: Confirm existing auth/profile/session patterns, local OpenAPI drift, KYC API contract, and UI/test conventions before implementation.

Files likely touched/created:

- `KYC_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- Current auth store, auth BFF, user profile hook, endpoint constants, mocks, middleware, and dashboard structure are documented in the plan.
- Local OpenAPI mismatch for KYC endpoints is recorded.
- KYC API contracts and flag semantics are captured.
- No feature implementation is started.

Testing requirements:

- No tests required for planning-only task.

Dependencies/blockers:

- None.

Implementation notes:

- Keep this task as the KYC implementation source of truth.
- This is the first KYC implementation task, so append the required task completion entry to `CONTEXT.md` after the audit is locked.

### Task 2: User Flags in Auth Session Contract

Goal: Add `kyc_verified` and `risk_assessed` to the memory-only auth session state and auth BFF token response flow.

Files likely touched/created:

- `src/store/auth-store.ts`
- `src/types/auth.ts`
- `src/lib/validators/auth.ts`
- `src/app/api/auth/_bff-utils.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/activate/route.ts`
- `src/services/auth.service.ts`
- `src/hooks/auth/useAuth.ts`
- `src/hooks/auth/useSession.ts`
- `src/__tests__/store/auth-store.test.ts`
- `src/__tests__/api/auth-bff-routes.test.ts`
- `src/__tests__/hooks/auth-hooks.test.tsx`
- `src/__tests__/services/auth.service.test.ts`

Acceptance criteria:

- Auth store includes `kycVerified` and `riskAssessed` or equivalent booleans, with explicit unknown/default handling during initialization.
- Auth store includes a shared `setSession` and/or `setFlags` action that all future features, including the risk epic, must use for `kycVerified` and `riskAssessed` updates.
- Flags are memory-only and are cleared with `clearAuth`.
- Browser-safe BFF token responses include `kyc_verified` and `risk_assessed` while still excluding `refresh_token`.
- Login, refresh, verify email, and activate account success paths update the store flags.
- Silent refresh updates flags without causing redirect flicker.
- Existing auth behavior and token security guarantees remain unchanged.

Testing requirements:

- Store tests prove flags are memory-only and reset on logout/refresh failure.
- BFF tests prove flags are forwarded and `refresh_token` is never exposed.
- Hook/service tests prove login and refresh update flags.

Dependencies/blockers:

- Task 1.
- Backend response may omit flags temporarily; implementation must decide whether schemas default missing values to `false` or fail loudly.

Implementation notes:

- Prefer a single store action such as `setSession({ accessToken, kycVerified, riskAssessed })` to avoid partial session updates.
- Add a dedicated flag update path, such as `setFlags({ kycVerified, riskAssessed })`, for non-token responses like `/users/me`, KYC success, and future risk assessment completion.
- Keep `waitlist` token behavior separate; waitlist users may not have full-session flags.
- Document this as the one source of truth for flag updates so the risk epic inherits it cleanly.

### Task 3: User Profile Hydration and Flag Sync

Goal: Hydrate authenticated user profile data with `GET /users/me` and synchronize profile-sourced flags into the auth store.

Files likely touched/created:

- `src/lib/validators/user.ts`
- `src/types/auth.ts`
- `src/services/user.service.ts`
- `src/hooks/user/useUser.ts`
- `src/hooks/user/useUserProfile.ts` or existing `src/hooks/user/useUser.ts`
- `src/hooks/auth/useUserFlags.ts`
- `src/mocks/handlers/auth.ts`
- `src/__tests__/hooks/user-profile.test.tsx`
- `src/__tests__/services/user.service.test.ts`
- `src/__tests__/lib/user-validators.test.ts`

Acceptance criteria:

- `userWithProfileResponseSchema` accepts `kyc_verified` and `risk_assessed`.
- `useUserProfile` or equivalent calls `GET /users/me` only for authenticated non-waitlist sessions.
- Profile query exposes `user`, `profile`, `kyc_verified`, and `risk_assessed`.
- Successful profile fetch syncs user data and flags into the auth store.
- Loading, error, and empty/null profile states are representable to consumers.
- Components can read flags through a reusable `useUserFlags` hook without importing the raw store.

Testing requirements:

- MSW-backed service and hook tests cover authenticated fetch, skipped waitlist token fetch, flag sync, null profile, and error states.
- Validator tests cover responses with and without profile objects.

Dependencies/blockers:

- Task 2.

Implementation notes:

- Reuse existing `userService.getMe` and `useCurrentUser` where practical instead of creating duplicate profile plumbing.
- Keep `risk_assessed` synchronized here even if the risk feature later owns updates after assessment submission.

### Task 4: KYC Types, Schemas, Endpoints, and Mocks

Goal: Add KYC-specific TypeScript types, Zod schemas, endpoint constants, and MSW handlers.

Files likely touched/created:

- `src/types/kyc.ts`
- `src/lib/validators/kyc.ts`
- `src/lib/api/endpoints.ts`
- `src/mocks/handlers/kyc.ts`
- `src/mocks/browser.ts`
- `src/mocks/server.ts`
- `src/__tests__/lib/kyc-validators.test.ts`

Acceptance criteria:

- `kycVerifyRequestSchema` enforces `document_type: "NIN"`.
- `document_number` validates exactly 11 numeric digits.
- `kycVerifyResponseSchema` accepts `"verified"`, `"rejected"`, and `"failed"` status responses with optional nullable `smile_job_id`.
- `kycStatusResponseSchema` accepts `null`, `pending`, `verified`, `rejected`, and `failed`.
- `ENDPOINTS.KYC.VERIFY` and `ENDPOINTS.KYC.STATUS` exist.
- MSW handlers cover verify success, verify rejection, verify failure, status null, pending, verified, rejected, and failed.

Testing requirements:

- Unit tests cover valid NIN payloads, invalid document types, invalid document numbers, verify responses, and every status response.

Dependencies/blockers:

- Task 1.
- Local generated OpenAPI KYC types are missing until schema regeneration happens.

Implementation notes:

- Do not expose alternate document types in types, schema unions, labels, mocks, or UI.
- Keep webhook callback types out of frontend services unless needed for tests/documentation; the frontend must not call it.

### Task 5: KYC Service and React Query Hooks

Goal: Implement KYC API operations and React Query hooks using the shared Axios client and error parser.

Files likely touched/created:

- `src/services/kyc.service.ts`
- `src/hooks/kyc/useKyc.ts`
- `src/lib/api/endpoints.ts`
- `src/__tests__/services/kyc.service.test.ts`
- `src/__tests__/hooks/kyc-hooks.test.tsx`

Acceptance criteria:

- `kycService.verify` posts to `ENDPOINTS.KYC.VERIFY` through `apiClient`.
- `kycService.getStatus` gets `ENDPOINTS.KYC.STATUS` through `apiClient`.
- `useVerifyKyc` exposes mutation loading, success, and error states and uses `retry: false`.
- `useKycStatus` exposes query loading, error, status, and refetch behavior.
- API errors are parsed through `parseApiError` at UI/hook boundaries where user-facing messages are derived.
- Successful `"verified"` responses can update the auth store flag or trigger a profile/status refetch according to the chosen policy.
- Verification mutation uses direct Bearer-authenticated Axios through `apiClient`, not a frontend BFF route.
- Verification mutation exposes clear loading and user-friendly error states for validation errors, auth errors, provider failures, and unexpected server failures.

Testing requirements:

- MSW-backed service tests assert URLs, methods, payloads, Authorization behavior via `apiClient`, and parsed response shapes.
- Hook tests cover mutation success, rejection, API error, and status query states.

Dependencies/blockers:

- Tasks 2 through 4.

Implementation notes:

- KYC endpoints are authenticated backend endpoints and do not return refresh tokens, so they should use `apiClient` rather than auth BFF. The shared Axios client already attaches the memory-only access token and `X-Requested-With: XMLHttpRequest`, so a BFF route adds no meaningful security benefit here.

### Task 6: Reusable KYC Gates and Required Modal

Goal: Build reusable KYC gating primitives before page-specific KYC UI.

Files likely touched/created:

- `src/components/kyc/shared/kyc-status-gate.tsx`
- `src/components/kyc/shared/kyc-required-modal.tsx`
- `src/hooks/kyc/useKycGate.ts`
- `src/__tests__/components/kyc/kyc-status-gate.test.tsx`
- `src/__tests__/components/kyc/kyc-required-modal.test.tsx`

Acceptance criteria:

- `KycStatusGate` or `useKycGate` exposes `isKycVerified`, `isRiskAssessed`, and a loading state while flags/profile are resolving.
- Gate reads flags through `useUserFlags` or equivalent, not direct store imports inside feature pages.
- `KycRequiredModal` can be opened from any action and closed by button, Escape, and overlay behavior if implemented.
- Modal has accessible dialog semantics, labelled title/description, focus management, and keyboard support.
- CTA navigates to `/kyc` and can preserve an intended destination if redirect support is implemented.
- Modal is composable and does not assume marketplace implementation details.

Testing requirements:

- Component tests cover verified/unverified/loading gate states.
- Modal tests cover focus, Escape close, dismiss action, CTA navigation, ARIA labels, and keyboard interaction.

Dependencies/blockers:

- Task 3.

Implementation notes:

- Prefer existing project UI patterns and tokens; do not add a modal dependency unless the project already has one.
- If a full focus trap is hand-built, keep it small and well tested.

### Task 7: KYC Route Protection and Redirect Policy

Goal: Add protected KYC routing and redirect rules aligned with memory-only auth and user flags.

Files likely touched/created:

- `src/app/(app)/kyc/page.tsx`
- `src/middleware.ts`
- `src/lib/auth/redirects.ts`
- `src/components/auth/shared/protected-route.tsx`
- `src/components/kyc/kyc-route-controller.tsx`
- `src/__tests__/middleware.test.ts`
- `src/__tests__/components/kyc/kyc-route-controller.test.tsx`

Acceptance criteria:

- `/kyc` exists under `src/app/(app)/kyc/page.tsx`.
- Route requires authentication and redirects unauthenticated users to login with a safe redirect back to `/kyc`.
- Route allows already verified users to view their successful KYC state and `/users/me` profile details on `/kyc`.
- Route waits for auth initialization and user flag/profile resolution before deciding verified vs unverified.
- Page defines appropriate Next.js metadata.
- Route uses app chrome, not AuthShell.
- Middleware protected paths include `/kyc`.

Testing requirements:

- Middleware/route guard tests cover unauthenticated redirect, authenticated unverified access, authenticated verified redirect, and loading/no-flicker state.

Dependencies/blockers:

- Tasks 2, 3, and 6.

Implementation notes:

- Middleware can only use refresh-cookie presence; final flag decisions belong in client route control after silent refresh/profile hydration.

### Task 8: Dashboard KYC Banner

Goal: Add a persistent dashboard banner prompting unverified users to complete KYC.

Files likely touched/created:

- `src/app/(app)/dashboard/page.tsx`
- `src/components/kyc/dashboard/kyc-dashboard-banner.tsx`
- `src/components/kyc/dashboard/kyc-recommendations-action.tsx`
- `src/__tests__/components/kyc/kyc-dashboard-banner.test.tsx`
- `src/__tests__/components/kyc/kyc-recommendations-action.test.tsx`
- `src/__tests__/pages/dashboard.test.tsx`

Acceptance criteria:

- Banner appears at the top of the dashboard content when `kyc_verified` is `false`.
- Banner is absent when `kyc_verified` is `true`.
- Banner has a clear message and CTA to `/kyc`.
- Banner is dismissible for the current component/session visit only and reappears on a later visit if KYC remains incomplete.
- Banner uses accessible alert/landmark semantics.
- Banner appearance/disappearance does not cause unexpected layout shift in the dashboard content.
- Dashboard includes the first real KYC-gated action: a "View Recommendations" or "Get your coverage plan" action.
- Unverified users triggering the recommendations action see `KycRequiredModal`; verified users call `GET /api/v1/risk/recommendations`.
- Recommendations action has loading and user-friendly error states for verified users.

Testing requirements:

- Component/page tests cover unverified visible, verified absent, dismiss behavior, CTA navigation target, accessible role/text, recommendations modal behavior for unverified users, and recommendations loading/error/success behavior for verified users.

Dependencies/blockers:

- Tasks 3 and 6.

Implementation notes:

- Do not store dismissal in localStorage; use component state or memory-only session state if needed.
- Keep dashboard styling consistent with the existing app layout and tokens.
- This dashboard recommendations action is the initial real modal consumer until marketplace flows are built; marketplace can later reuse the same gate/modal pattern.

### Task 9: KYC Verification Form

Goal: Build the NIN-only KYC verification form with validation, profile prefill, and accessible async states.

Files likely touched/created:

- `src/components/kyc/verify/kyc-verification-form.tsx`
- `src/components/kyc/verify/kyc-form-shell.tsx`
- `src/components/kyc/verify/kyc-result-alert.tsx`
- `src/__tests__/components/kyc/kyc-verification-form.test.tsx`

Acceptance criteria:

- Form includes `document_type`, `document_number`, `first_name`, `last_name`, and `date_of_birth`.
- `document_type` is fixed to `NIN` and not rendered as a selectable document-type option.
- `document_number` validates exactly 11 digits before submission.
- `first_name`, `last_name`, and `date_of_birth` prefill from profile when available and remain editable.
- Date of birth uses the existing `DatePicker` component and submits backend format `YYYY-MM-DD`.
- Submission payload matches `KYCVerifyRequest` exactly.
- On `verified`, the UI sets `kycVerified: true` immediately, triggers background profile refetch, shows success state, and redirects to `/dashboard`.
- On `rejected`, the UI shows the backend message/reason clearly and allows retry after the cooldown.
- On `failed`, the UI shows a technical/provider error that does not imply user fault.
- On `rejected` or `failed`, the form starts a 1-hour memory-only retry cooldown using `last_attempt_at` and shows a retry timer while the cooldown is active.
- Loading, disabled, validation, error, cooldown, and success states are visible, accessible, and user-friendly.

Testing requirements:

- Component tests cover profile prefill, frontend validation, exact payload, verified success, rejected cooldown/copy, failed cooldown/copy, API errors, disabled/loading state, and no alternate document-type option.

Dependencies/blockers:

- Tasks 3 through 5 and 7.

Implementation notes:

- Keep this task focused on the form; do not combine KYC status polling into this component.
- Use `parseApiError` to render user-friendly errors.
- Set `kycVerified: true` immediately when `POST /kyc/verify` returns `status: "verified"`, then refetch `GET /users/me` in the background. Redirect to `/dashboard`.
- Do not change the store flag when verification returns `rejected` or `failed`.
- Cooldown is memory-only and may reset on page refresh; this is acceptable because `GET /kyc/status` remains the source of truth on remount.

### Task 10: KYC Status Display and Polling

Goal: Build a status component that handles current KYC state and polls while verification is pending.

Files likely touched/created:

- `src/components/kyc/status/kyc-status-panel.tsx`
- `src/components/kyc/status/kyc-pending-state.tsx`
- `src/components/kyc/status/kyc-retry-panel.tsx`
- `src/hooks/kyc/useKyc.ts`
- `src/__tests__/components/kyc/kyc-status-panel.test.tsx`
- `src/__tests__/hooks/kyc-status-polling.test.tsx`

Acceptance criteria:

- Status UI handles `null`, `pending`, `verified`, `rejected`, and `failed`.
- `null` means no attempt yet and does not show rejection/failure copy.
- `pending` shows a waiting state and uses React Query `refetchInterval` or equivalent function-based polling.
- Pending polling runs every 3 seconds for the first 30 seconds, then every 10 seconds until the 5-minute maximum poll duration is reached.
- After 5 minutes of pending status, polling stops and the UI shows a "this is taking longer than expected, check back later" state.
- Polling stops when status becomes `verified`, `rejected`, or `failed`.
- Transition to `verified` updates `kyc_verified` in the store and triggers profile refresh.
- `rejected` shows rejection reason, explains that submitted details did not match records, and guides the user to double-check their NIN slip or NIMC card.
- `failed` shows a technical/provider failure message that does not imply user fault.
- `rejected` and `failed` retry actions respect the 1-hour memory-only cooldown from the last attempt timestamp.

Testing requirements:

- Component tests cover every status state, long-running pending timeout copy, rejected copy, failed copy, and cooldown timer.
- Hook tests cover polling at 3-second and 10-second intervals, polling stop after 5 minutes, disabled polling for terminal states, and store update on verified transition.

Dependencies/blockers:

- Tasks 3 through 5.

Implementation notes:

- Keep this separate from the verification form; the KYC page can compose both.
- Track polling elapsed time or poll count in a way that works with React Query's function form of `refetchInterval`.
- Store `last_attempt_at` in memory only, not `localStorage`.

### Task 11: KYC Page Composition, Accessibility, SEO, and Visual QA

Goal: Compose the protected KYC page from route controller, form, and status components with production-grade accessibility and layout.

Files likely touched/created:

- `src/app/(app)/kyc/page.tsx`
- `src/components/kyc/kyc-page.tsx`
- `src/components/kyc/verify/kyc-verification-form.tsx`
- `src/components/kyc/status/kyc-status-panel.tsx`
- `src/__tests__/pages/kyc-page.test.tsx`

Acceptance criteria:

- KYC page uses existing app chrome and app layout conventions.
- Page metadata is defined and meaningful.
- Page presents profile-aware form and status state without duplicating service calls unnecessarily.
- Loading, empty, error, pending, verified, rejected, and failed states are accessible.
- Every unique failure mode has user-friendly copy: validation errors explain the field issue, rejected KYC explains the submitted details did not match records, failed KYC explains a technical/provider issue, and long-running pending explains that verification is taking longer than expected.
- Keyboard navigation, focus states, form labels, error associations, and screen-reader status regions are correct.
- Layout is responsive and uses existing tokens (`primary`, `primary-muted`, `accent`, `background`) without introducing a clashing palette.

Testing requirements:

- Page/component tests cover composed loading, status, form, and redirect states.
- Run accessibility-focused component tests; perform browser visual QA when implementation screenshots/designs are available.

Dependencies/blockers:

- Tasks 7, 9, and 10.

Implementation notes:

- Do not use AuthShell for this page.
- Keep visual design restrained and app-like because KYC is an operational authenticated workflow.

### Task 12: Unit and Integration Test Completion

Goal: Ensure meaningful test coverage across KYC validators, services, hooks, store integration, gates, modal, banner, form, and status UI.

Files likely touched/created:

- `src/__tests__/lib/kyc-validators.test.ts`
- `src/__tests__/services/kyc.service.test.ts`
- `src/__tests__/hooks/kyc-hooks.test.tsx`
- `src/__tests__/hooks/user-profile.test.tsx`
- `src/__tests__/store/auth-store.test.ts`
- `src/__tests__/components/kyc/*.test.tsx`
- `src/__tests__/pages/kyc-page.test.tsx`
- `src/__tests__/pages/dashboard.test.tsx`
- `src/mocks/handlers/kyc.ts`

Acceptance criteria:

- Validator tests cover KYC request/response/status schemas and NIN-only behavior.
- Service tests cover verify and status endpoints with MSW.
- Hook tests cover mutation states, status polling, user profile hydration, and flag sync.
- Store tests cover flag updates, memory-only behavior, and clearing on logout.
- Component tests cover form, banner, modal, gate, and status states.
- Tests assert behavior and security constraints, not implementation trivia.

Testing requirements:

- `npm test -- --run` passes.
- `npm run lint` passes with no new errors.
- `npx tsc --noEmit` passes.

Dependencies/blockers:

- Tasks 2 through 11.

Implementation notes:

- Keep e2e tests in Task 13; this task owns unit/integration depth.

### Task 13: KYC E2E Flow Coverage

Goal: Add Playwright coverage for complete KYC route, flag, banner, modal, and verification flows.

Files likely touched/created:

- `e2e/kyc/kyc-flow.spec.ts`
- `playwright.config.ts` if needed
- `src/mocks/handlers/kyc.ts` or e2e-specific route mocks

Acceptance criteria:

- Unauthenticated user is redirected away from `/kyc` to login.
- Already verified user sees verified KYC state and profile details on `/kyc`.
- Successful NIN verification works end-to-end and updates the `kyc_verified` flag behavior.
- Rejected verification shows rejection copy and allows retry.
- Failed verification shows technical/provider copy and respects retry cooldown.
- Pending verification backs off from 3-second to 10-second polling and stops after the 5-minute maximum in a deterministic test path.
- Dashboard banner appears for unverified users.
- Dashboard banner is absent for verified users.
- `KycRequiredModal` appears when an unverified user triggers the dashboard recommendations action, and CTA navigates to `/kyc`.
- Verified users can trigger the dashboard recommendations action and call `GET /api/v1/risk/recommendations`.
- Tests assert no alternate document type is available as an option.

Testing requirements:

- `npm run test:e2e -- --project=chromium` passes.

Dependencies/blockers:

- Tasks 6 through 12.

Implementation notes:

- Reuse the Playwright setup from the auth epic.
- Prefer route-level API mocks for deterministic flag/status transitions.
- Use the dashboard recommendations action as the first real gated modal consumer until marketplace flows are built.

### Task 14: Final QA and Documentation Update

Goal: Verify the KYC epic is complete and leave maintainable documentation behind.

Files likely touched/created:

- `KYC_EPICS.md`
- `CONTEXT.md`
- Any KYC README if useful

Acceptance criteria:

- All KYC routes and components exist and work with documented redirects.
- KYC security and NIN-only requirements are met.
- `kyc_verified` and `risk_assessed` stay synchronized across login, refresh, and `/users/me`.
- Unit, integration, e2e, typecheck, lint, and build pass or blockers are documented.
- Remaining backend/product questions are clearly marked resolved or unresolved.
- `CONTEXT.md` records every created KYC file and its role in the flow.

Testing requirements:

- Run `npm run lint`.
- Run `npm test -- --run`.
- Run `npx tsc --noEmit`.
- Run `npm run test:e2e -- --project=chromium`.
- Run `npm run build` if feasible.

Dependencies/blockers:

- Tasks 1 through 13.

Implementation notes:

- Keep final documentation concise and useful for the next engineer.
- Do not mark the epic complete if flag sync, route protection, or NIN-only behavior is unverified.
