# GigSecure Authentication Context

Created: 2026-05-22 18:02 WAT

This is the living context file for the authentication epic. It must be updated after every completed task with what changed, what was added, important decisions, and known follow-ups.

## Current Codebase State

### App and Routing

- Root layout: `src/app/layout.tsx`
  - Uses `Providers`, Inter font, global CSS, Google Analytics, and Vercel Speed Insights.
- App layout: `src/app/(app)/layout.tsx`
  - Wraps app routes in a simple flex layout and footer.
- Existing protected page: `src/app/(app)/dashboard/page.tsx`
- Existing wizard routes:
  - `src/app/(wizard)/waitlist/page.tsx`
  - `src/app/(wizard)/assessment/page.tsx`
- Existing public routes:
  - `src/app/(public)/page.tsx`
  - `src/app/(public)/about/page.tsx`
  - `src/app/(public)/faq/page.tsx`
  - `src/app/(public)/risk-assessment/page.tsx`
- Missing required auth routes:
  - `src/app/(app)/(auth)/register/page.tsx`
  - `src/app/(app)/(auth)/login/page.tsx`
  - `src/app/(app)/(auth)/check-inbox/page.tsx`
  - `src/app/(app)/(auth)/verify-email/page.tsx`
  - `src/app/(app)/(auth)/activate/page.tsx`
  - `src/app/(app)/(auth)/forgot-password/page.tsx`
  - `src/app/(app)/(auth)/reset-password/page.tsx`
  - `src/app/(app)/(auth)/change-password/page.tsx`

### Existing Auth BFF Routes

- `src/app/api/auth/_bff-utils.ts`
  - Defines `BACKEND_URL`, `gs_refresh_token`, CSRF header check, cookie builder, and cookie clearer.
  - Refresh cookie path is currently `Path=/api/auth/refresh`.
  - Cookie uses `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- `src/app/api/auth/login/route.ts`
  - Calls backend `/api/v1/auth/login`.
  - Stores backend `refresh_token` in httpOnly cookie.
  - Returns `{ access_token, token_type }` to browser.
- `src/app/api/auth/register/route.ts`
  - Currently calls backend `/api/v1/auth/register` and incorrectly expects tokens.
  - Must be changed because real register returns only `{ message }`.
- `src/app/api/auth/refresh/route.ts`
  - Reads `gs_refresh_token` cookie.
  - Sends `{ refresh_token }` to backend `/api/v1/auth/refresh`.
  - Currently assumes backend returns a rotated `refresh_token`.
  - Must tolerate docs-compliant response that returns only `{ access_token, token_type }`.
- `src/app/api/auth/logout/route.ts`
  - Clears local refresh cookie only.
  - No backend invalidation exists in docs.
- `src/app/api/auth/waitlist/route.ts`
  - Calls backend `/api/v1/auth/waitlist/signup`.
  - Returns waitlist access token only; no refresh cookie.

Missing BFF routes that should be added or evaluated:

- Verify email, because it returns auth tokens.
- Activate account, because it returns auth tokens.
- Forgot password.
- Reset password.
- Resend activation.
- Change password, unless direct backend call with Bearer token is acceptable.

### Existing API Client

- `src/lib/api/client.ts`
  - Axios client with `baseURL: process.env.NEXT_PUBLIC_API_BASE_URL`.
  - `withCredentials: true`.
  - Adds JSON and `X-Requested-With` headers.
  - Uses `axios-retry` for network and 5xx retries.
  - Attaches Bearer token from `useAuthStore.getState().accessToken`.
  - Has a 401 refresh queue with `isRefreshing` and `failedQueue`.
  - Refreshes through `AUTH_ENDPOINTS.REFRESH`.
  - Has inline JWT parsing to avoid refreshing non-expired waitlist tokens.

Gaps:

- Refresh queue is not directly tested.
- Redirects from interceptor are imperative and path-specific.
- Waitlist token decoding should be extracted to a utility if retained.
- Axios client and BFF route response shapes must be aligned.

### Existing Endpoint Constants

- `src/lib/api/endpoints.ts`
  - `AUTH_ENDPOINTS` contains BFF routes for login, register, refresh, logout, waitlist.
  - `ENDPOINTS.AUTH` contains backend auth routes for verify email, activate, forgot password, reset password, change password, and resend activation.

Gaps:

- Browser-sensitive token-returning endpoints should use BFF routes.
- `AUTH_ENDPOINTS` needs all auth BFF paths once created.

### Existing Auth Service

- `src/services/auth.service.ts`
  - Login/register/waitlist/logout use BFF fetch routes.
  - Forgot/reset/change/verify/activate use direct Axios backend calls.
  - `register` currently parses a token response, which conflicts with API docs.
  - `verifyEmail` does not parse/store tokens even though docs say it returns tokens.
  - `activateAccount` parses token response from direct backend call, which risks exposing refresh token to JS.

Gaps:

- Service methods must reflect secure BFF boundaries and true API response shapes.
- `resendActivation` service is missing.
- Error parsing is duplicated and incomplete.

### Existing Auth Hooks

- `src/hooks/auth/useAuth.ts`
  - Provides `useLogin`, `useRegister`, `useWaitlistSignup`, `useLogout`, `useForgotPassword`, `useResetPassword`, `useChangePassword`, `useVerifyEmail`, `useIsAuthenticated`, and `useAuthState`.
  - `useRegister` currently sets access token after register, which is wrong.
  - `useVerifyEmail` does not set access token on success.
  - `useActivateAccount` is missing.
  - `useResendActivation` is missing.
  - Silent refresh/session boot hook is missing.

### Existing Zustand Auth Store

- `src/store/auth-store.ts`
  - Stores `accessToken`, `firstName`, `lastName`, `user`, and `isAuthenticated`.
  - Uses `persist` with `localStorage`.
  - Persists `accessToken`, `firstName`, `lastName`, and `isAuthenticated`.

Critical gap:

- Persisting access token to `localStorage` violates the security requirement. Access token must be memory-only.

Needed:

- Explicit auth initialization status.
- Memory-only token handling.
- Clear distinction between authenticated, unauthenticated, and initializing.

### Existing Middleware

- `src/middleware.ts`
  - Applies security headers.
  - Protects staging subdomain with `gs_staging_auth`.
  - Redirects logged-in users away from `/login`, `/signup`, and `/register` based on `gs_refresh_token`.
  - Protects `/dashboard` and `/app` based on `gs_refresh_token`.

Gaps:

- Required auth routes are not all represented.
- Middleware cannot read in-memory access token, so cookie presence is only a coarse server-side signal.
- Refresh cookie path is `/api/auth/refresh`, so middleware may not see the cookie on `/dashboard` unless cookie path is changed to `/` or an additional non-sensitive session cookie is introduced.

### Existing Validators and Types

- `src/lib/validators/auth.ts`
  - Contains request schemas and response schemas.
  - `tokenResponseSchema` currently expects `access_token` and `token_type`, but not `refresh_token`.
  - `registerRequestSchema` has password min length but no max length.
  - UI-only password confirmation schemas do not exist.
  - `registerResponseSchema` does not exist.
- `src/types/api.ts`
  - Re-exports generated OpenAPI types and contains some hand-maintained risk types.
- `src/types/schema.d.ts`
  - Generated from OpenAPI.

Gaps:

- Need `src/types/auth.ts` or equivalent for auth-specific UI/BFF types.
- Need distinct backend token vs browser-safe token schemas.
- Need reusable API error parsing.

### Existing React Query Provider

- `src/providers/QueryProvider.tsx`
  - Creates QueryClient with queries `staleTime: 60_000` and `retry: 1`.
  - Does not configure auth mutation retry behavior globally.
- `src/providers/index.tsx`
  - Wraps the app with QueryProvider only.

Needed:

- Add AuthProvider/session boot provider around the app.
- Ensure silent refresh runs before auth-dependent UI settles.

### Existing UI and Design System

- `src/components/ui/Button.tsx`
  - Accessible loading button with variants and sizes.
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/ComboboxSelect.tsx`
- `src/components/ui/DatePicker.tsx`
- `src/components/ui/WaitlistModal.tsx`
- `src/app/(wizard)/waitlist/page.tsx`
  - Existing form style uses React Hook Form, Zod resolver, Framer Motion, Lucide icons, and responsive split layout.

Gaps:

- No `src/components/auth/*` structure exists yet.
- No shared auth form primitives exist yet.
- Future auth UI must wait for screenshots before pixel-perfect styling.

### Existing Mocks and Tests

- Test stack:
  - Vitest
  - Testing Library
  - JSDOM
  - MSW
- Config:
  - `vitest.config.ts`
  - `src/__tests__/setup.ts`
  - `src/__tests__/test-utils.tsx`
- Mocks:
  - `src/mocks/index.ts`
  - `src/mocks/browser.ts`
  - `src/mocks/server.ts`
  - `src/mocks/handlers/auth.ts`
  - `src/mocks/handlers/domain.ts`

Current auth test:

- `src/__tests__/store/auth-store.test.ts`
  - Tests current persisted-store shape, but must be updated for memory-only token behavior.

Gaps:

- No auth service tests.
- No auth hook tests.
- No auth form tests.
- No refresh queue tests.
- No Playwright e2e setup or scripts.

## Decisions Made

- Auth implementation should use BFF routes for token-producing auth endpoints so refresh tokens never reach browser JavaScript.
- Register is not a login. Register success must route to a check-inbox page.
- Access tokens must be memory-only.
- Refresh token must be httpOnly cookie only.
- Silent refresh must run on app load before deciding the user is unauthenticated.
- Refresh queue/mutex must allow only one refresh request at a time.
- Reset password and change password are separate flows.
- Use only NIN for KYC for now, despite markdown saying BVN is supported.

## Files Created During This Planning Task

- `AUTH_EPICS.md`
  - Ordered authentication implementation epic and backend questions.
- `CONTEXT.md`
  - Living codebase and implementation context.
- `RULES.md`
  - Strict rules for future implementation.

## Update Log

### 2026-05-22 18:02 WAT

Task completed: Task 1 - Codebase Audit and Auth Contract Lock.

Files changed:

- `AUTH_EPICS.md`
- `CONTEXT.md`
- `RULES.md`

Summary:

- Audited existing auth services, hooks, BFF routes, API client, middleware, Zustand store, validators, providers, mocks, tests, and route structure.
- Created the planning artifacts required before implementation.
- Documented security-critical mismatches and ordered the authentication epic into incremental tasks.

Important decisions:

- Do not implement auth UI or feature code until the planning docs exist.
- Move token-producing auth calls behind BFF routes.
- Remove access token persistence from localStorage during implementation.

Known follow-ups:

- Confirm backend logout support.
- Confirm refresh token cookie contract and rotation behavior.
- Confirm post-verification and post-activation redirect targets.
- Add e2e tooling or document blocker before e2e tests.

### 2026-05-25 12:53 WAT

Task completed: Task 2 — Auth API Contract and BFF Route Corrections

Files changed:
- `CONTEXT.md`
- `src/app/api/auth/_bff-utils.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/waitlist/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/activate/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/resend-activation/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/lib/api/endpoints.ts`
- `src/mocks/handlers/auth.ts`

Summary:
Updated the auth BFF contract so register now returns the backend `{ message }` response without creating a session, while login, verify email, and activate account convert backend token responses into browser-safe access-token responses and keep refresh tokens in httpOnly cookies only. Added missing BFF routes for verify email, activate account, forgot password, reset password, resend activation, and change password, and updated endpoint constants and MSW mocks to reflect the BFF boundary. Hardened shared BFF utilities with safe JSON parsing, missing-backend handling, cookie helpers, and session-response shaping.

Important decisions:
The refresh cookie path was changed to `/` so server-side middleware can see the session cookie in later route-protection work; logout also clears the legacy `/api/auth/refresh` cookie path to avoid stale cookies from the earlier implementation. Refresh token rotation is optional: `/api/auth/refresh` resets the cookie only when the backend returns a new `refresh_token`, and otherwise returns the new access token without exposing or changing the refresh cookie. Because no backend logout endpoint is documented, BFF logout remains client-session cleanup only and includes a code comment marking where backend invalidation should be added later.

Known follow-ups:
Task 6 must update `src/services/auth.service.ts` and `src/hooks/auth/useAuth.ts` to call the new BFF endpoint constants; those files still reflect the older direct-backend shape and were intentionally not changed in this task. The existing `src/store/auth-store.ts` still persists access tokens to `localStorage`, which conflicts with `RULES.md` but belongs to Task 4. Verification passed with `npx tsc --noEmit` and `npm test -- --run src/__tests__/store/auth-store.test.ts`; `npm run lint` still fails on pre-existing unrelated lint errors in tests, public UI components, wizard code, scripts, and services.

### 2026-05-25 13:04 WAT

Task completed: Task 3 — Auth Types, Schemas, and Error Parser

Files changed:
- `CONTEXT.md`
- `src/lib/validators/auth.ts`
- `src/types/auth.ts`
- `src/types/api.ts`
- `src/lib/api/errors.ts`
- `src/__tests__/lib/auth-validators.test.ts`
- `src/__tests__/lib/api-errors.test.ts`

Summary:
Added accurate auth schemas for backend token responses, browser-safe BFF token responses, register message responses, reusable message responses, and all password creation/reset form flows with confirmation stripping. Added reusable auth types in `src/types/auth.ts` and API error parsing types/utilities that support string `detail`, 422 validation arrays, `message`, explicit field error maps, and Axios-style response errors. Added focused unit tests for token response separation, password confirmation behavior, token-required forms, and field-level API error mapping.

Important decisions:
Kept `tokenResponseSchema` as the browser-safe BFF response shape so existing BFF-facing login parsing remains compatible, and introduced `backendTokenResponseSchema` for responses that still include `refresh_token`. Password confirmation fields are represented only in UI form schemas and are removed by schema transforms before API payloads are produced, keeping the "never send confirmation fields" rule enforceable at the validation layer.

Known follow-ups:
Task 4 still needs to remove access-token persistence from `src/store/auth-store.ts`; this known `RULES.md` conflict remains documented and intentionally untouched in Task 3. Task 6 should migrate `src/services/auth.service.ts` and `src/hooks/auth/useAuth.ts` onto the new BFF endpoint constants and updated response schemas. Verification passed with `npm test -- --run src/__tests__/lib/auth-validators.test.ts src/__tests__/lib/api-errors.test.ts`, `npx tsc --noEmit`, and scoped ESLint for the files changed in this task; full `npm run lint` is still expected to fail until the pre-existing unrelated lint issues documented in Task 2 are addressed.
### 2026-05-25 13:31 WAT

Task completed: Task 4 — Token Session Architecture

Files changed:
- `CONTEXT.md`
- `src/store/auth-store.ts`
- `src/lib/auth/session.ts`
- `src/providers/AuthProvider.tsx`
- `src/providers/index.tsx`
- `src/__tests__/store/auth-store.test.ts`
- `src/__tests__/lib/auth-session.test.ts`

Summary:
Reworked the auth store so access tokens are memory-only and removed the previous Zustand `persist`/localStorage behavior. Added explicit auth lifecycle states (`idle`, `initializing`, `authenticated`, `unauthenticated`) plus a client boot `AuthProvider` that attempts silent refresh once before settling the user as unauthenticated. Added focused tests for store transitions, silent refresh behavior, refresh failure handling, and token non-persistence.

Important decisions:
The silent refresh helper calls the BFF `/api/auth/refresh` route with `X-Requested-With: XMLHttpRequest`, keeping refresh token handling behind the httpOnly cookie contract. `AuthProvider` is nested inside `QueryProvider` at the app providers boundary so auth initialization runs once for the client app without changing route behavior in this task.

Known follow-ups:
Task 5 must add the API client refresh mutex/queue so concurrent 401s share one refresh promise and retry safely. Later route protection work must respect the new `initializing` status to avoid redirect flicker, and the backend contract question remains that refresh must be cookie-based rather than requiring browser JavaScript to send a refresh token body.
