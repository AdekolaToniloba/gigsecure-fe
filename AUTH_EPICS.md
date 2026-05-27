# GigSecure Authentication Feature Epic

Created: 2026-05-22 18:02 WAT

## Objective

Implement the complete GigSecure authentication experience in Next.js App Router with TypeScript, Zustand, React Query, secure token handling, accessible UI, and meaningful test coverage.

Planning status: complete. Tasks 1 through 19 have been implemented and verified.

## Audit Summary

The codebase already has partial authentication plumbing:

- BFF auth routes exist under `src/app/api/auth/*`.
- `src/lib/api/client.ts` has an Axios client, request token attachment, and a refresh queue.
- `src/store/auth-store.ts` stores auth state with Zustand.
- `src/hooks/auth/useAuth.ts` exposes React Query mutations.
- `src/services/auth.service.ts` wraps auth API calls.
- `src/lib/validators/auth.ts` contains Zod request/response schemas.
- `src/middleware.ts` protects dashboard routes using a refresh cookie.
- Tests use Vitest, Testing Library, and MSW under `src/__tests__`.

Important gaps and mismatches:

- `src/store/auth-store.ts` currently persists `accessToken` to `localStorage`; this violates the security requirement.
- `src/services/auth.service.ts`, `src/hooks/auth/useAuth.ts`, `src/app/api/auth/register/route.ts`, and auth mocks currently treat register as if it returns tokens, but the API docs say register returns only `{ message }`.
- `tokenResponseSchema` lacks `refresh_token`, while generated OpenAPI requires it. BFF responses intentionally omit refresh token, so separate frontend/BFF schemas are needed.
- Silent refresh on app load is not wired through a provider-level boot flow.
- Refresh queue exists in Axios, but it should be extracted or tested directly and aligned with cookie-only refresh behavior.
- `src/app/api/auth/refresh/route.ts` assumes refresh token rotation and destructures `refresh_token`; docs only guarantee a new `access_token`.
- Verify email and activate account currently call backend directly through Axios, which exposes refresh token in JS responses unless moved behind BFF routes.
- Forgot/reset/change password are partly present in services/hooks, but route pages and complete UI are missing.
- `/verify-email`, `/activate`, and `/reset-password` routes do not exist yet.
- Middleware public paths do not include all auth routes and cannot rely on in-memory access tokens.
- No Playwright e2e setup is present in `package.json`; e2e tooling must be added or explicitly documented before e2e tests are written.

## Backend Questions

1. Unresolved: Is there or will there be a logout endpoint that invalidates the refresh token?
   - Current frontend behavior: `/api/auth/logout` clears the in-memory session and expires the httpOnly refresh cookie locally. Backend invalidation should be added when an endpoint exists.
2. Unresolved backend contract mismatch: Should `/auth/refresh` read refresh token from an httpOnly cookie instead of request body?
   - Current frontend behavior: the browser calls the BFF `/api/auth/refresh`; the BFF reads the httpOnly cookie and sends `{ refresh_token }` to the documented backend endpoint. Browser JavaScript never reads or sends the refresh token directly.
3. Partially resolved in frontend: What cookie name, domain, path, SameSite, Secure, and expiry should be used?
   - Current frontend behavior: cookie name `gs_refresh_token`, path `/`, `HttpOnly`, `SameSite=Strict`, `Secure` in production, max age 7 days. Backend/product should confirm final domain policy.
4. Partially resolved in frontend: Should refresh tokens rotate on every refresh?
   - Current frontend behavior: refresh rotation is optional. If the backend returns a new `refresh_token`, the BFF rotates the cookie; if not, it keeps the existing cookie.
5. Unresolved product decision: What is the intended post-email-verification route: risk assessment, dashboard, or onboarding gate?
   - Current frontend behavior: email verification routes to `/dashboard` through `DEFAULT_AUTHENTICATED_PATH`.
6. Unresolved product decision: What is the intended post-waitlist-activation route?
   - Current frontend behavior: account activation routes to `/dashboard` through `DEFAULT_AUTHENTICATED_PATH`.
7. Resolved in frontend: Should authenticated users be redirected away from login/register pages?
   - Current frontend behavior: middleware and client guards redirect authenticated users away from public auth routes.
8. Resolved for this epic: Are admin auth routes in scope or explicitly out of scope?
   - Current frontend behavior: admin auth routes are out of scope for this user authentication epic.

## Final QA Status

- `npm run lint` passes with warning-only output from pre-existing non-auth areas.
- `npm test -- --run` passes: 53 files, 307 tests.
- `npm run test:e2e -- --project=chromium` passes: 10 tests.
- `npx tsc --noEmit` passes.
- `npm run build` passes when network access is available for `next/font` to fetch Google Fonts.

## Epic Tasks

### Task 1: Codebase Audit and Auth Contract Lock

Goal: Confirm existing auth architecture, API mismatches, route structure, test tooling, and design system conventions before implementation.

Files likely touched/created:

- `AUTH_EPICS.md`
- `CONTEXT.md`
- `RULES.md`

Acceptance criteria:

- Existing auth files and gaps are documented.
- API contract mismatches are listed.
- Backend questions are recorded.
- No feature implementation is started.

Testing requirements:

- No tests required for planning-only task.

Dependencies/blockers:

- None.

Implementation notes:

- Keep this task as the source of truth for the initial audit.
- Update `CONTEXT.md` after the task is completed.

### Task 2: Auth API Contract and BFF Route Corrections

Goal: Align auth network boundaries with the secure token model and documented API behavior.

Files likely touched/created:

- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/activate/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/resend-activation/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/_bff-utils.ts`
- `src/lib/api/endpoints.ts`
- `src/mocks/handlers/auth.ts`

Acceptance criteria:

- Register BFF returns `{ message }` and does not set auth cookies.
- Login, verify email, and activate account set refresh token in an httpOnly cookie and return only non-sensitive session data to the browser.
- Refresh BFF reads the refresh token from the httpOnly cookie and returns a new access token.
- Refresh BFF supports non-rotating backend response and rotates cookie only if backend returns a new refresh token.
- Logout clears the refresh cookie and documents that backend invalidation is unavailable unless a backend endpoint is added.
- All state-changing BFF routes enforce the `X-Requested-With: XMLHttpRequest` CSRF check.

Testing requirements:

- Unit/integration tests for BFF response shapes where project tooling supports route handler tests.
- MSW handlers updated to reflect real contract.

Dependencies/blockers:

- Backend logout and refresh rotation answers may refine implementation.

Implementation notes:

- Prefer BFF routes for every auth endpoint that can return or depend on refresh tokens.
- Do not expose `refresh_token` to browser JavaScript.

### Task 3: Auth Types, Schemas, and Error Parser

Goal: Create accurate reusable auth types, Zod schemas, and API error parsing utilities.

Files likely touched/created:

- `src/types/auth.ts`
- `src/types/api.ts`
- `src/lib/validators/auth.ts`
- `src/lib/api/errors.ts`
- `src/__tests__/lib/auth-validators.test.ts`
- `src/__tests__/lib/api-errors.test.ts`

Acceptance criteria:

- Separate schemas exist for backend token responses and browser-safe BFF token responses.
- Register response schema expects `{ message }`.
- Password form schemas include confirmation fields but strip them before API submission.
- Error parser supports string `detail`, array `detail`, `message`, and Axios/fetch-style errors.
- Field-level 422 errors can be mapped to form fields.

Testing requirements:

- Unit tests cover valid/invalid schemas, password confirmation mismatch, token-required flows, and error parser cases.

Dependencies/blockers:

- None.

Implementation notes:

- Keep reusable types in `src/types`.
- Keep Zod validators in `src/lib/validators`.

### Task 4: Token Session Architecture

Goal: Make access token memory-only and add explicit auth initialization state.

Files likely touched/created:

- `src/store/auth-store.ts`
- `src/lib/auth/session.ts`
- `src/providers/AuthProvider.tsx`
- `src/providers/index.tsx`
- `src/__tests__/store/auth-store.test.ts`
- `src/__tests__/lib/auth-session.test.ts`

Acceptance criteria:

- Access token is never persisted to `localStorage`, `sessionStorage`, or cookies by client code.
- Refresh token remains only in httpOnly cookie managed by BFF routes.
- Store has `status` or equivalent states: `idle`, `initializing`, `authenticated`, `unauthenticated`.
- App performs silent refresh once on client boot before declaring user unauthenticated.
- Auth provider avoids redirect flicker while initialization is pending.

Testing requirements:

- Store tests prove access token is memory-only and auth status transitions correctly.
- Session tests prove silent refresh success/failure behavior.

Dependencies/blockers:

- Task 2 refresh BFF contract.

Implementation notes:

- Preserve non-sensitive waitlist handoff metadata only if required, but do not persist sensitive tokens.

### Task 5: API Client Refresh Queue Hardening

Goal: Make 401 handling deterministic, tested, and reusable.

Files likely touched/created:

- `src/lib/api/client.ts`
- `src/lib/api/refresh-queue.ts`
- `src/lib/api/endpoints.ts`
- `src/__tests__/lib/api-refresh-queue.test.ts`
- `src/__tests__/lib/api-client.test.ts`

Acceptance criteria:

- Only one refresh request runs during concurrent 401 responses.
- All queued requests wait for the same refresh promise.
- Original requests retry with the new access token after refresh succeeds.
- Refresh failure clears auth state and routes users correctly.
- Waitlist token behavior is preserved and documented.

Testing requirements:

- Unit tests simulate concurrent 401s and assert exactly one refresh call.
- Unit tests cover refresh failure and waitlist token handling.

Dependencies/blockers:

- Task 4 auth store status.

Implementation notes:

- Avoid decoding JWTs inline inside the interceptor if a reusable utility can do it more safely.

### Task 6: Auth React Query Hooks and Services

Goal: Provide complete auth hooks and services for all flows using the corrected BFF/API contract.

Files likely touched/created:

- `src/services/auth.service.ts`
- `src/hooks/auth/useAuth.ts`
- `src/hooks/auth/useSession.ts`
- `src/__tests__/services/auth.service.test.ts`
- `src/__tests__/hooks/auth-hooks.test.tsx`

Acceptance criteria:

- Hooks exist for register, login, logout, silent refresh, verify email, resend activation, forgot password, reset password, activate account, and change password.
- Register success does not set access token.
- Login, verify email, activate, and refresh success set access token.
- Auth mutations expose loading and error states through React Query.
- Auth mutations avoid excessive retry on expected 4xx errors.

Testing requirements:

- Integration tests cover success and error behavior for each hook.
- Tests assert redirect decisions are left to UI/controller layer unless existing patterns require otherwise.

Dependencies/blockers:

- Tasks 2 through 5.

Implementation notes:

- Use React Query for server mutations and Zustand only for client session state.

### Task 7: Route Protection and Redirect Policy

Goal: Align middleware, route groups, and client redirects with the memory-token architecture.

Files likely touched/created:

- `src/middleware.ts`
- `src/app/(app)/(auth)/layout.tsx`
- `src/app/(app)/layout.tsx`
- `src/components/auth/shared/auth-redirect-guard.tsx`
- `src/components/auth/shared/protected-route.tsx`

Acceptance criteria:

- Auth pages live under `src/app/(app)/(auth)/...`.
- Public-only auth pages redirect authenticated users according to policy.
- Dashboard and protected app routes guard using refresh cookie in middleware and auth provider state in client UI.
- Required email-link routes exist: `/verify-email`, `/activate`, `/reset-password`.
- Middleware public paths include all auth routes that must be reachable without a session.

Testing requirements:

- Unit/integration tests for redirect guard behavior.
- Middleware tests if existing tooling supports them, otherwise document manual coverage.

Dependencies/blockers:

- Backend answers for post-verification and post-activation destinations.

Implementation notes:

- Middleware can check cookies only; client code should complete auth verification via silent refresh.

### Task 8: Shared Auth UI Primitives

Goal: Create reusable, accessible auth UI building blocks that match screenshots once provided.

Files likely touched/created:

- `src/components/auth/shared/auth-shell.tsx`
- `src/components/auth/shared/form-field.tsx`
- `src/components/auth/shared/password-field.tsx`
- `src/components/auth/shared/password-checklist.tsx`
- `src/components/auth/shared/auth-alert.tsx`
- `src/components/auth/shared/auth-submit-button.tsx`
- `src/components/auth/shared/auth-status.tsx`
- `src/__tests__/components/auth/shared/*.test.tsx`

Acceptance criteria:

- Components support labels, descriptions, errors, disabled states, loading states, focus states, and screen-reader status text.
- Password field supports show/hide with accessible controls.
- Shared components reduce meaningful duplication across auth forms.
- Components can be visually adapted to screenshot designs without changing form logic.

Testing requirements:

- Component tests cover labels, error rendering, keyboard access, and loading/disabled behavior.

Dependencies/blockers:

- Design screenshots for pixel-perfect styling.

Implementation notes:

- Use existing UI system and design tokens where possible.
- Avoid nested card patterns unless screenshots require them.

### Task 9: Register and Check Inbox Flow

Goal: Implement user registration and post-registration holding page.

Files likely touched/created:

- `src/app/(app)/(auth)/register/page.tsx`
- `src/app/(app)/(auth)/check-inbox/page.tsx`
- `src/components/auth/register/register-form.tsx`
- `src/components/auth/check-inbox/check-inbox-panel.tsx`
- `src/components/auth/check-inbox/resend-activation-form.tsx`
- `src/__tests__/components/auth/register-form.test.tsx`
- `src/__tests__/components/auth/check-inbox.test.tsx`

Acceptance criteria:

- Register form validates email, first name, optional last name, password, and password confirmation.
- Register success routes to check-inbox page with safe non-sensitive context.
- No access token is set after registration.
- Check-inbox page supports resend activation with loading, success, and error states.
- Page metadata is defined.

Testing requirements:

- Form integration tests cover validation, successful register, register error, and resend activation.

Dependencies/blockers:

- Tasks 2, 3, 6, and 8.

Implementation notes:

- Do not put sensitive data in query strings.

### Task 10: Verify Email Flow

Goal: Implement `/verify-email?token=` as an email-link route.

Files likely touched/created:

- `src/app/(app)/(auth)/verify-email/page.tsx`
- `src/components/auth/verify-email/verify-email-status.tsx`
- `src/__tests__/components/auth/verify-email-status.test.tsx`

Acceptance criteria:

- Missing token shows a clear error.
- Valid token calls verify endpoint once.
- Success stores access token and routes to risk assessment or configured onboarding destination.
- Invalid/expired/already-used token states are user-friendly and accessible.
- Page metadata is defined.

Testing requirements:

- Tests cover missing token, success, and API error states.

Dependencies/blockers:

- Backend route destination answer.
- Tasks 2, 4, 6, and 8.

Implementation notes:

- Verify email endpoint should be behind BFF if it returns refresh tokens.

### Task 11: Login Flow

Goal: Implement login UI and session creation.

Files likely touched/created:

- `src/app/(app)/(auth)/login/page.tsx`
- `src/components/auth/login/login-form.tsx`
- `src/__tests__/components/auth/login-form.test.tsx`

Acceptance criteria:

- Login validates email and password.
- Success stores access token and routes to dashboard or safe redirect target.
- Errors are parsed and displayed accessibly.
- Loading and disabled states are present.
- Page metadata is defined.

Testing requirements:

- Integration tests cover success, invalid credentials, validation errors, and redirect behavior.

Dependencies/blockers:

- Tasks 2, 4, 6, 7, and 8.

Implementation notes:

- Sanitize redirect params to prevent open redirects.

### Task 12: Forgot Password Flow

Goal: Implement password reset request UI.

Files likely touched/created:

- `src/app/(app)/(auth)/forgot-password/page.tsx`
- `src/components/auth/forgot-password/forgot-password-form.tsx`
- `src/__tests__/components/auth/forgot-password-form.test.tsx`

Acceptance criteria:

- Form validates email.
- Success state avoids confirming whether the account exists if backend behaves that way.
- Loading, error, and success states are accessible.
- Page metadata is defined.

Testing requirements:

- Tests cover validation, success, and API error states.

Dependencies/blockers:

- Tasks 3, 6, and 8.

Implementation notes:

- Keep the flow unauthenticated.

### Task 13: Reset Password Flow

Goal: Implement `/reset-password?token=` as an unauthenticated token-based password reset.

Files likely touched/created:

- `src/app/(app)/(auth)/reset-password/page.tsx`
- `src/components/auth/reset-password/reset-password-form.tsx`
- `src/__tests__/components/auth/reset-password-form.test.tsx`

Acceptance criteria:

- Missing token shows a clear error.
- Form validates new password and password confirmation.
- Password confirmation is not sent to API.
- Success redirects to login with a success message.
- Page metadata is defined.

Testing requirements:

- Tests cover missing token, validation, success redirect, and API error states.

Dependencies/blockers:

- Tasks 3, 6, and 8.

Implementation notes:

- Do not require a session for reset password.

### Task 14: Activate Account Flow

Goal: Implement `/activate?token=` for waitlist users setting their password.

Files likely touched/created:

- `src/app/(app)/(auth)/activate/page.tsx`
- `src/components/auth/activate/activate-account-form.tsx`
- `src/__tests__/components/auth/activate-account-form.test.tsx`

Acceptance criteria:

- Missing token shows a clear error.
- Form validates password and confirmation.
- Success stores access token and routes to risk assessment or configured onboarding destination.
- Invalid/expired/already-activated token states are user-friendly.
- Page metadata is defined.

Testing requirements:

- Tests cover missing token, validation, success, and API error states.

Dependencies/blockers:

- Backend post-activation route answer.
- Tasks 2, 4, 6, and 8.

Implementation notes:

- Activation endpoint should be behind BFF because it returns refresh token.

### Task 15: Change Password Flow

Goal: Implement authenticated password change.

Files likely touched/created:

- `src/app/(app)/(auth)/change-password/page.tsx`
- `src/components/auth/change-password/change-password-form.tsx`
- `src/__tests__/components/auth/change-password-form.test.tsx`

Acceptance criteria:

- Requires authenticated session.
- Form validates old password, new password, and confirmation.
- Password confirmation is not sent to API.
- Success keeps the user authenticated and shows a success state.
- Page metadata is defined.

Testing requirements:

- Tests cover unauthenticated guard, validation, success, and API error states.

Dependencies/blockers:

- Tasks 4, 6, 7, and 8.

Implementation notes:

- Do not merge this with reset password.

### Task 16: Accessibility, SEO, and Pixel-Perfect UI Pass

Goal: Polish all auth pages against screenshots, accessibility, SEO, and responsive requirements.

Files likely touched/created:

- All auth pages and auth components.
- `src/app/(app)/(auth)/*/page.tsx`

Acceptance criteria:

- Every auth page has useful metadata.
- Forms have labels, focus states, error associations, and screen-reader status updates.
- UI matches provided screenshots as closely as possible.
- Micro-interactions are polished and do not disrupt layout.
- Text does not overflow or overlap on mobile or desktop.

Testing requirements:

- Component tests for accessibility-critical states.
- Browser screenshot/manual QA when dev server is available.

Dependencies/blockers:

- Design screenshots must be available for pixel-perfect replication.

Implementation notes:

- Do not create marketing pages unless screenshots require them.

### Task 17: Unit and Integration Test Completion

Goal: Ensure meaningful test coverage across auth utilities, services, hooks, stores, and forms.

Files likely touched/created:

- `src/__tests__/lib/*`
- `src/__tests__/services/*`
- `src/__tests__/hooks/*`
- `src/__tests__/store/*`
- `src/__tests__/components/auth/*`
- `src/mocks/*`

Acceptance criteria:

- Tests cover validators, error parser, token/session utilities, refresh queue, services, hooks, auth store, and form flows.
- Tests assert user-visible behavior and security constraints.
- Existing tests are updated for memory-only token behavior.

Testing requirements:

- `npm test` passes.
- `npm run lint` passes where feasible.

Dependencies/blockers:

- Tasks 2 through 16.

Implementation notes:

- Do not write tests that only validate implementation details without proving behavior.

### Task 18: E2E Test Setup and Auth Flow Coverage

Goal: Add or document e2e tooling and cover the full auth flow.

Files likely touched/created:

- `playwright.config.ts`
- `e2e/auth/*.spec.ts`
- `package.json`
- `src/mocks/*` or e2e-specific mocks

Acceptance criteria:

- If Playwright is added, scripts exist and e2e tests can run against the app.
- If tooling cannot be added yet, the blocker and recommended setup are documented.
- E2E coverage includes register to check-inbox, login success/error, forgot password, reset password via token, activate account via token, authenticated change password, silent refresh, and concurrent 401 refresh behavior.

Testing requirements:

- E2E suite passes locally or documented blockers are recorded in `CONTEXT.md`.

Dependencies/blockers:

- Approval may be needed to install Playwright dependencies.

Implementation notes:

- Use stable selectors and user-visible labels.

### Task 19: Final QA and Documentation Update

Goal: Verify the authentication epic is complete and leave maintainable documentation behind.

Files likely touched/created:

- `CONTEXT.md`
- `AUTH_EPICS.md`
- `RULES.md`
- Any auth README if useful.

Acceptance criteria:

- All auth routes exist and work with documented redirects.
- Security requirements are met.
- Tests pass or blockers are documented.
- `CONTEXT.md` includes every created file and its role in the flow.
- Remaining backend questions are clearly marked resolved or unresolved.

Testing requirements:

- Run relevant unit/integration/e2e tests.
- Run lint/build if feasible.

Dependencies/blockers:

- All prior tasks.

Implementation notes:

- Keep final docs concise and useful for the next engineer.
