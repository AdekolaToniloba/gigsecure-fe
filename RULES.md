# Authentication Implementation Rules

Created: 2026-05-22 18:02 WAT

These rules are mandatory for the GigSecure authentication epic.

## Planning and Progress

1. Do not start feature implementation until `AUTH_EPICS.md`, `CONTEXT.md`, and `RULES.md` exist.
2. Implement tasks in the order defined in `AUTH_EPICS.md`.
3. Update `CONTEXT.md` after every completed task.
4. Each `CONTEXT.md` update must include date/time, task completed, files changed, summary, important decisions, and known follow-ups.
5. Record API mismatches and blockers instead of hiding them.
6. Prefer existing project patterns over new architecture unless the existing pattern violates a security requirement.

## Token Storage and Session Security

1. Never store access tokens in `localStorage`.
2. Never store access tokens in `sessionStorage`.
3. Never store refresh tokens in browser-readable storage.
4. Access token must live only in memory.
5. Refresh token must live only in an httpOnly cookie managed by BFF route handlers.
6. Browser JavaScript must never receive or read `refresh_token`.
7. Login, verify email, activate account, and refresh must use BFF routes if the backend returns refresh tokens.
8. Register must not create a session because the documented API returns only `{ message }`.
9. Logout must clear in-memory auth state and expire the refresh cookie.
10. If the backend adds logout invalidation, call it from the BFF logout route before clearing the cookie.
11. Use `SameSite=Strict` or the strongest backend-approved cookie policy.
12. Use `Secure` cookies in production.
13. All state-changing BFF auth routes must require `X-Requested-With: XMLHttpRequest`.

## Silent Refresh and Refresh Mutex

1. On app load, run silent refresh before declaring the user unauthenticated.
2. Maintain an explicit initializing state during silent refresh.
3. Avoid UI flicker from login to dashboard or dashboard to login while initialization is pending.
4. On concurrent 401 responses, send exactly one refresh request.
5. Requests that hit 401 while refresh is in progress must wait for the active refresh promise.
6. After refresh succeeds, retry original requests with the new access token.
7. If refresh fails, clear auth state and redirect to the correct unauthenticated route.
8. Do not refresh non-expired waitlist tokens for scope errors.
9. Refresh queue behavior must have meaningful tests.

## API and Error Handling

1. Use `src/lib/api/client.ts` for shared API client setup.
2. Use `src/lib/api/endpoints.ts` for endpoint constants.
3. Use services in `src/services` for API operations.
4. Use hooks in `src/hooks` for React Query integration.
5. Parse all API errors through a reusable parser.
6. Support error shape `{ detail: string }`.
7. Support 422 error shape `{ detail: [{ loc, msg, type }] }`.
8. Support existing `{ message }` mock/BFF errors where present.
9. Map field-level errors to form fields when possible.
10. Show user-friendly errors and keep raw technical details out of primary UI.
11. Auth mutations should not retry expected 4xx validation/authentication failures.

## File Placement

1. Public auth route pages must live under `src/app/(auth)/`; authenticated auth-adjacent pages, such as change password, must live in the protected app route tree.
2. Auth components must live under `src/components/auth/<feature-name>/`.
3. Shared auth UI primitives must live under `src/components/auth/shared/`.
4. Reusable auth types must live in `src/types`.
5. Zod schemas must live in `src/lib/validators`.
6. API client setup must stay in `src/lib/api`.
7. Auth service calls must live in `src/services/auth.service.ts` or a clearly named auth service module.
8. Auth hooks must live in `src/hooks/auth`.
9. Test mocks must live in `src/mocks`.
10. Tests must live in `src/__tests__` unless e2e tooling convention requires a top-level `e2e` folder; document that decision in `CONTEXT.md`.

## Route and Redirect Rules

1. Required email-link routes must exist:
   - `/verify-email?token=`
   - `/activate?token=`
   - `/reset-password?token=`
2. Successful registration must route to check inbox, not dashboard.
3. Successful login must route to dashboard unless a safe redirect param exists.
4. Successful reset password must route to login with a success message.
5. Successful change password must keep the user authenticated and show a success state.
6. Successful email verification must store session tokens and route to the agreed onboarding destination.
7. Successful account activation must store session tokens and route to the agreed onboarding destination.
8. Sanitize redirect parameters to prevent open redirects.
9. Middleware must not rely on in-memory access tokens.
10. Middleware cookie checks are only a server-side hint; client auth state must still be initialized safely.

## Password Flow Rules

1. Password confirmation is required on every password creation/reset UI.
2. Password confirmation must never be sent to the API.
3. Enforce minimum password length 8.
4. Enforce maximum password length 128.
5. Validate password confirmation match on the frontend.
6. Change password requires old password and a valid session.
7. Reset password works without a session and requires a token.
8. Activate account works without an existing session and requires a token.
9. Do not merge reset password and change password flows.

## UI, Accessibility, and SEO

1. Replicate provided screenshots as closely as possible when they are available.
2. Use existing design system components and tokens where practical.
3. Every page must define appropriate Next.js metadata.
4. Every form control must have an accessible label.
5. Error text must be programmatically associated with fields where possible.
6. Loading, success, disabled, and error states must be visible and accessible.
7. Use screen-reader-friendly status regions for async status changes.
8. Ensure keyboard navigation works for all controls.
9. Provide visible focus states.
10. Keep responsive layouts stable on mobile and desktop.
11. Do not add marketing-style auth pages unless screenshots require them.
12. Use micro-interactions carefully and never at the cost of accessibility or layout stability.

## Testing Rules

1. Write meaningful tests that verify intended behavior, not implementation trivia.
2. Unit tests must cover validators, error parser, token/session utilities, and refresh queue behavior.
3. Integration tests must cover auth services, React Query hooks, Zustand auth store, and form submit flows.
4. E2E tests must cover full auth flows once tooling is available.
5. Update existing tests when security requirements change existing behavior.
6. Do not leave tests asserting access token persistence in localStorage.
7. Use MSW for API mocking unless an existing test pattern clearly requires another approach.
8. Run relevant tests after each implementation task.
9. If a test cannot be run, document why in `CONTEXT.md`.

## KYC Scope Rule

1. Use only `NIN` for KYC for now.
2. Do not expose BVN as a selectable KYC document type until backend OpenAPI supports it.
