# GigSecure Dashboard Settings Feature Epic

## Objective

Implement the protected GigSecure dashboard Settings page in the authenticated app shell with TypeScript, React Query, Zod runtime validation, accessible responsive tabs, mutation-backed preference controls, and careful account deactivation/deletion flows. The implementation must use the real backend settings contracts only, reuse the existing auth/session/API architecture, and match the supplied Settings screenshots as closely as the documented contracts allow.

This document is the implementation source of truth for the Settings feature. It is planning-only and does not authorize feature code during this task. Implementation must proceed in task order, and every completed task must append a timestamped entry to `CONTEXT.md`.

## Scope Summary

- Add a protected Settings destination under the authenticated dashboard route tree.
- Enable the existing Settings sidebar item only when the route exists.
- Build three semantic tabs: Notifications, Privacy and Data, and Delete account.
- Integrate the documented settings endpoints through the existing Bearer-authenticated `apiClient`.
- Add generated types, hand-written domain types where useful, Zod validators, endpoint constants, query keys, services, hooks, MSW handlers, UI primitives, page composition, and tests.
- Persist preference changes through mutation-backed partial updates with optimistic UI or explicit pending state, rollback on failure, and user-facing errors parsed through `parseApiError`.
- Add confirmation modals for deactivate and delete actions. Delete account requires password confirmation because the supplied OpenAPI schema requires `DeleteAccountRequest.password`.
- Clear the memory-only auth session and redirect out of the protected app after successful account deletion or deactivation.
- Verify accessibility, keyboard behavior, mobile responsiveness, loading/error/retry/success states, and Playwright user flows.

Out of scope: notification feed items, mark-as-read behavior, profile editing, password change, premiums page implementation, policy purchase, new auth architecture, new global settings store, persistent client-side settings cache outside React Query, and any fields not documented by OpenAPI.

## Codebase Audit Summary

The required planning inputs were reviewed before creating this document:

- `RULES.md`
- `CONTEXT.md`
- `DASHBOARD_EPICS.md`
- `DASHBOARD_RISK_ASSESSMENT_EPICS.md`
- `MARKETPLACE_EPICS.md`
- `AUTH_EPICS.md`
- `KYC_EPICS.md`
- `src/app/globals.css`
- `openapi.json`
- `src/types/schema.d.ts`

No required planning file was missing.

Current architecture to reuse:

- `src/app/(app)/layout.tsx` already wraps protected app routes in `ProtectedRoute`, `AuthenticatedAppShell`, `AppSidebar`, and `DashboardNavbar`.
- `src/components/dashboard/shell/` already provides the persistent 298px desktop sidebar, mobile drawer, skip link, navbar, marketplace promo, search, notification trigger, and stable app-shell loading geometry.
- `src/components/dashboard/shell/app-navigation.tsx` already contains a Settings nav item, but it is currently marked `available: false` and renders as disabled "Soon". Settings implementation must enable it and point it to the protected Settings route.
- `src/components/auth/shared/protected-route.tsx`, `src/lib/auth/redirects.ts`, and `src/middleware.ts` already protect `/dashboard` prefixes through refresh-cookie hints and client full-session initialization. A `/dashboard/settings` route will inherit that protection.
- `src/lib/api/client.ts` is the authenticated Axios client. It attaches the memory-only access token, sends `X-Requested-With`, uses the BFF refresh route for 401 recovery, and must be reused for settings calls.
- `src/lib/api/errors.ts` exposes `parseApiError`, which supports string `detail`, validation-array `detail`, `message`, `error`, and field errors. Settings UI and hooks must route user-facing errors through it.
- `src/providers/QueryProvider.tsx` provides React Query defaults. Feature hooks can override stale times and must set settings mutations to `retry: false`.
- `src/store/auth-store.ts` is memory-only and contains `clearAuth`, `setSession`, `setFlags`, `hasFullSession`, `kycVerified`, and `riskAssessed`. Settings must not add a parallel auth store.
- Existing domain features follow the same pattern: generated types in `src/types/schema.d.ts`, narrow feature types in `src/types/*`, validators in `src/lib/validators/*`, endpoint constants in `src/lib/api/endpoints.ts`, query keys in `src/lib/constants.ts`, services in `src/services/*`, hooks in `src/hooks/*`, MSW handlers in `src/mocks/handlers/*`, and focused Vitest/Playwright coverage.
- Existing dashboard visual tokens are defined in `src/app/globals.css`: primary teal, accent yellow, app canvas, app sidebar, and app border. Settings should reuse these and add only the smallest additional neutral/error tokens if truly necessary.

Current gaps:

- There is no `src/app/(app)/dashboard/settings/page.tsx` or equivalent protected settings page.
- There are no settings services, hooks, validators, domain types, query keys, endpoint constants, MSW handlers, fixtures, or tests.
- The local `openapi.json` and generated `src/types/schema.d.ts` include only `/api/v1/settings/notifications`. They do not include `/api/v1/settings/privacy`, `/api/v1/settings/account/deactivate`, `/api/v1/settings/account`, `PrivacySettingsResponse`, `UpdatePrivacySettingsRequest`, or `DeleteAccountRequest`.
- Because `src/types/schema.d.ts` is generated from local OpenAPI, it is current for the local file but stale relative to the supplied Settings contract. Implementation must synchronize `openapi.json` and regenerate `src/types/schema.d.ts`; generated files must not be hand-edited.
- The existing navbar renders the search input on most routes and a route title only for `/dashboard/risk-assessment`. The Settings screenshots show the standard search navbar, so no special route title is needed.
- The existing notification panel is a dashboard feed adapter, not Settings notification preferences. Do not couple these concepts.

## OpenAPI And Schema Audit Summary

Local contract status:

- Present locally: `GET /api/v1/settings/notifications`
- Present locally: `PUT /api/v1/settings/notifications`
- Missing locally: `GET /api/v1/settings/privacy`
- Missing locally: `PUT /api/v1/settings/privacy`
- Missing locally: `POST /api/v1/settings/account/deactivate`
- Missing locally: `DELETE /api/v1/settings/account`
- Present locally: `NotificationPrefsResponse`
- Present locally: `UpdateNotificationPrefsRequest`
- Missing locally: `PrivacySettingsResponse`
- Missing locally: `UpdatePrivacySettingsRequest`
- Missing locally: `DeleteAccountRequest`

Supplied OpenAPI contract status:

- Notifications preferences are documented and authenticated with HTTP Bearer.
- Privacy settings are documented and authenticated with HTTP Bearer.
- Account deactivation is documented as `POST /api/v1/settings/account/deactivate`, returns `204`, and has no request body.
- Account deletion is documented as `DELETE /api/v1/settings/account`, returns `204`, and requires `{ password: string }`.
- Deletion has a 422 validation response. Deactivation does not document a validation response.

Implementation rule:

Task 2 must update local `openapi.json` from the supplied OpenAPI settings contracts and run `npm run generate:types`. `src/types/schema.d.ts` must only change through generation. If backend changes the schema before implementation, the newer backend-approved schema wins and this epic must be updated with the exact conflict.

## API Contracts And Schemas Used

All settings endpoints require Bearer authentication through the existing `apiClient`.

### `GET /api/v1/settings/notifications`

Returns `NotificationPrefsResponse`:

- `risk_score_updates: boolean`
- `premium_renewals: boolean`
- `new_plan_recommendations: boolean`
- `payment_confirmations: boolean`
- `product_updates: boolean`

### `PUT /api/v1/settings/notifications`

Accepts `UpdateNotificationPrefsRequest`, a partial update object whose documented fields are optional and nullable booleans:

- `risk_score_updates?: boolean | null`
- `premium_renewals?: boolean | null`
- `new_plan_recommendations?: boolean | null`
- `payment_confirmations?: boolean | null`
- `product_updates?: boolean | null`

Returns the full `NotificationPrefsResponse`.

Frontend rule: send only the changed documented key with a boolean value unless product/backend explicitly requires sending `null`. Do not invent extra preference fields.

### `GET /api/v1/settings/privacy`

Returns `PrivacySettingsResponse`:

- `share_anonymised_data: boolean`
- `personalise_recommendations: boolean`
- `share_data_with_partners: boolean`

### `PUT /api/v1/settings/privacy`

Accepts `UpdatePrivacySettingsRequest`, a partial update object whose documented fields are optional and nullable booleans:

- `share_anonymised_data?: boolean | null`
- `personalise_recommendations?: boolean | null`
- `share_data_with_partners?: boolean | null`

Returns the full `PrivacySettingsResponse`.

Frontend rule: send only the changed documented key with a boolean value unless product/backend explicitly requires sending `null`.

### `POST /api/v1/settings/account/deactivate`

Temporarily deactivates the current user's account.

- Request body: none documented.
- Success response: `204 No Content`.
- Security: HTTP Bearer.

Frontend rule: after success, call the existing logout/session cleanup path or directly clear auth state only if the logout BFF is unavailable after deactivation. Redirect to `/login` with a short success message mechanism that does not require protected state.

### `DELETE /api/v1/settings/account`

Permanently deletes the current user's account and associated data.

Request body:

- `password: string`

Success response:

- `204 No Content`

Frontend rule: the confirmation modal must require password input, validate non-empty password client-side, submit only `{ password }`, and clear local session after success.

## Screenshot And UI Analysis

The three supplied Settings screenshots show a protected dashboard page inside the completed app shell:

- Persistent pale-teal left sidebar with GigSecure branding, marketplace promo, and active Settings row.
- Top navbar aligned over the content column only, with mobile menu icon, search input, bell trigger, premiums placeholder, and "Take A Tour" placeholder.
- Main content begins below the navbar with a spacious, left-aligned tab row.
- Tabs are horizontal on desktop: Notifications, Privacy and Data, Delete account.
- Active tab uses dark teal text and a thick dark teal underline.
- Content is intentionally minimal and avoids card-heavy composition.
- Toggle rows place label and description on the left and the switch far right on desktop.
- The desktop content width is broad enough for far-right controls, while the copy itself remains comfortably readable.
- Mobile and very small mobile must preserve usability: tabs can horizontally scroll or wrap with stable focus behavior, rows stack when needed, switches remain reachable, and there must be no horizontal page overflow.

### Notifications Tab

Visible content:

- Heading: `Email notifications`
- Description: `Control which emails GigSecure sends to you.`
- Rows:
  - `Risk score updates`
  - `Premium renewals`
  - `New plan recommendations`
  - `Payment confirmations`
  - `GigSecure product updates`

API field mapping:

- Risk score updates -> `risk_score_updates`
- Premium renewals -> `premium_renewals`
- New plan recommendations -> `new_plan_recommendations`
- Payment confirmations -> `payment_confirmations`
- GigSecure product updates -> `product_updates`

### Privacy And Data Tab

Visible content:

- Heading: `Data & privacy controls`
- Description: `Control how GigSecure uses and stores your information.`
- Subheading: `Data usage`
- Rows:
  - `Share anonymised data for risk research`
  - `Allow GigSecure to personalise recommendations`
  - `Share data with insurance partners`

API field mapping:

- Share anonymised data for risk research -> `share_anonymised_data`
- Allow GigSecure to personalise recommendations -> `personalise_recommendations`
- Share data with insurance partners -> `share_data_with_partners`

The screenshot copy for insurance partners says the setting is required for live premium quotes but can be turned off. If product/backend later makes this non-optional, the UI must reflect disabled/required state from a real contract, not hard-coded assumption.

### Delete Account Tab

Visible content:

- Red heading: `Danger zone`
- Warning copy: actions are permanent or sensitive and should be read carefully.
- Row: `Deactivate account`
  - Description: temporarily disables account; user can reactivate by logging back in.
  - Red outlined `Deactivate` button.
- Row: `Delete my account`
  - Description: permanently deletes account, data, risk history, and coverage records.
  - Solid red `Delete account` button.

Required interaction:

- Deactivate opens an accessible confirmation modal.
- Delete opens an accessible confirmation modal with password confirmation.
- Both actions must be impossible to trigger accidentally from the row button alone.
- Successful completion clears session and exits the protected dashboard.

## Architecture Decisions

- Settings lives under the protected dashboard route tree, preferably `src/app/(app)/dashboard/settings/page.tsx`, so middleware and `ProtectedRoute` protect it through the existing `/dashboard` prefix.
- Update `AppNavigation` to make Settings available and active at `/dashboard/settings`. Do not add a second sidebar.
- Reuse `AuthenticatedAppShell`, `DashboardNavbar`, and existing app canvas spacing. The settings page contributes only page content.
- Use one settings domain module rather than separate one-off modules per tab: `settings.service.ts`, `useSettings.ts`, `settings.ts` validators, and `settings` types.
- Do not create a Zustand settings store. React Query owns server settings state, and local component state should exist only for modal open state, active tab, password input, and transient UI status.
- Use separate canonical query keys for notification preferences and privacy settings. Fetch each tab's data on demand or prefetch adjacent tabs only if measured UX requires it. Do not fetch account action endpoints until the user confirms an action.
- Mutations use `retry: false`. Toggle mutations must either use optimistic update with rollback or hold the previous UI until success; the final behavior must not leave a failed preference in the wrong state.
- Account action mutations must not retry automatically. They must disable their submit controls while pending and require explicit user confirmation.
- The account action service should return `void` for `204` responses and handle empty response bodies without forcing JSON parsing.
- Successful deactivation/deletion must clear memory auth state. Prefer calling the existing `authService.logout` or `useLogout` cleanup if it still works after backend action; if backend deactivation invalidates the token before logout can complete, fall back to `useAuthStore.getState().clearAuth()` and document that behavior in `CONTEXT.md`.
- Delete account password confirmation belongs only to the delete modal. Do not reuse or conflate the authenticated change-password form.
- Runtime validation is mandatory for every JSON response. For `204` responses, validate status and return `void`.
- UI primitives should be small and feature-local unless a truly generic dashboard primitive already exists or the implementation clearly benefits from reuse.
- Use `button role="tab"` semantics or a tested tab primitive with `role="tablist"`, `role="tab"`, `role="tabpanel"`, roving focus, arrow keys, Home/End, and visible focus.
- Use native `button` controls for switches with `role="switch"` and `aria-checked`, or a tested accessible switch primitive if one exists by implementation time.
- Confirmation modals must trap focus, restore focus to the opener, support Escape/backdrop/explicit cancel, prevent background scroll, and have labelled title/description.

## Open Questions

1. Should the settings route be `/dashboard/settings` or `/settings`? Default: `/dashboard/settings` because the existing protected dashboard shell and sidebar live under `/dashboard`, and `/settings` is not currently protected by the `/dashboard` prefix.
2. Should deactivated users see a dedicated reactivation message on login? The backend description says users can reactivate by logging back in, but no reactivation endpoint or login response state is documented.
3. Should account deletion redirect to `/login`, `/`, or a dedicated goodbye page? Default: `/login` or `/` with a short success message, whichever existing auth redirect patterns support cleanly.
4. Should `share_data_with_partners` be allowed to turn off if live quotes depend on it? The supplied contract exposes a boolean toggle, so the frontend should allow it unless backend/product adds a required/locked state.
5. Should settings preferences be loaded all at once when the page mounts, or lazily per tab? Default: load the active tab first and keep cached tab state through React Query; prefetch only if UX feels sluggish.
6. Should successful preference changes show a visible toast, inline saved status, or only switch state? Default: compact inline `aria-live` status per section, because no app-wide toast system is evident in the current codebase.
7. Does account deletion invalidate the refresh cookie server-side? The frontend must still clear local memory state and local BFF cookie through the existing logout cleanup where possible.

## Ordered Implementation Tasks

### Task 1: Settings Audit And Contract Lock

Goal: Revalidate the live codebase, screenshots, and supplied OpenAPI before implementation starts.

Files likely touched:

- `DASHBOARD_SETTINGS_EPICS.md`
- `CONTEXT.md`

Acceptance criteria:

- The current route tree, shell, sidebar, navbar, auth guard, API client, error parser, query setup, MSW setup, and test patterns are documented.
- Local OpenAPI drift for privacy and account-action settings endpoints is recorded.
- Screenshot-to-field mapping is documented.
- No feature code is implemented in this task.

Testing:

- No automated tests required for planning-only work.

Dependencies:

- None.

### Task 2: OpenAPI Sync And Generated Types

Goal: Synchronize local settings contracts and regenerate TypeScript declarations.

Files likely touched:

- `openapi.json`
- `src/types/schema.d.ts`

Acceptance criteria:

- Local `openapi.json` includes all six required settings operations:
  - `GET /api/v1/settings/notifications`
  - `PUT /api/v1/settings/notifications`
  - `GET /api/v1/settings/privacy`
  - `PUT /api/v1/settings/privacy`
  - `POST /api/v1/settings/account/deactivate`
  - `DELETE /api/v1/settings/account`
- Local schemas include `NotificationPrefsResponse`, `UpdateNotificationPrefsRequest`, `PrivacySettingsResponse`, `UpdatePrivacySettingsRequest`, and `DeleteAccountRequest`.
- Generated declarations are refreshed with `npm run generate:types`.
- `src/types/schema.d.ts` is not hand-edited.

Testing:

- `npm run generate:types`
- `npx tsc --noEmit`

Dependencies:

- Task 1.

### Task 3: Settings Domain Types, Validators, Endpoints, Query Keys, And MSW

Goal: Add the settings data foundation without UI behavior.

Files likely touched:

- `src/types/settings.ts`
- `src/lib/validators/settings.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/constants.ts`
- `src/mocks/fixtures/settings.ts`
- `src/mocks/handlers/settings.ts`
- `src/mocks/handlers/index.ts`
- `src/__tests__/lib/settings-validators.test.ts`
- `src/__tests__/mocks/settings-handlers.test.ts`

Acceptance criteria:

- Feature types are derived from generated `components['schemas']` where available.
- Zod validators cover notification response, notification partial update, privacy response, privacy partial update, delete account request, and empty `204` action responses.
- Endpoint constants exist under `ENDPOINTS.SETTINGS`.
- Query keys exist for notification preferences and privacy settings.
- MSW handlers require a Bearer token and cover success, validation error, unauthorized, server failure, and malformed response scenarios.
- No undocumented settings fields are introduced.

Testing:

- Validator tests cover valid payloads, malformed payloads, partial update payloads, and delete password validation.
- MSW handler tests cover auth requirement and the main success/error cases.

Dependencies:

- Task 2.

### Task 4: Settings Services And React Query Hooks

Goal: Add typed settings network operations and cache behavior.

Files likely touched:

- `src/services/settings.service.ts`
- `src/hooks/settings/useSettings.ts`
- `src/__tests__/services/settings.service.test.ts`
- `src/__tests__/hooks/settings-hooks.test.tsx`

Acceptance criteria:

- Services use the existing `apiClient`, pass `AbortSignal` for queries, and runtime-validate JSON responses.
- Services expose:
  - `getNotificationPreferences`
  - `updateNotificationPreferences`
  - `getPrivacySettings`
  - `updatePrivacySettings`
  - `deactivateAccount`
  - `deleteAccount`
- Hooks expose queries and mutations with canonical query keys.
- Preference mutations use `retry: false`.
- Account action mutations use `retry: false`.
- Toggle mutations update cache correctly and roll back or refetch after failure.
- Errors exposed to UI are compatible with `parseApiError`.
- `204` responses are handled as `void` without JSON parsing assumptions.

Testing:

- Service tests verify endpoints, methods, payloads, validation, `204` handling, and Bearer-authenticated client usage.
- Hook tests verify loading, success, optimistic or pending behavior, rollback/refetch on error, and no mutation retry.

Dependencies:

- Task 3.

### Task 5: Shared Settings UI Primitives

Goal: Build small accessible UI pieces that match the screenshots and support all three tabs.

Files likely touched:

- `src/components/settings/settings-tabs.tsx`
- `src/components/settings/settings-section.tsx`
- `src/components/settings/settings-toggle-row.tsx`
- `src/components/settings/settings-status.tsx`
- `src/components/settings/settings-confirmation-modal.tsx`
- `src/components/settings/settings-skeleton.tsx`
- `src/components/settings/settings-error-state.tsx`
- `src/__tests__/components/settings/settings-primitives.test.tsx`

Acceptance criteria:

- Tabs use semantic `tablist`, `tab`, and `tabpanel` relationships.
- Tabs support click, Enter/Space, arrow keys, Home/End, focus visibility, and deep-linkable or stateful active tab behavior as chosen in implementation.
- Toggle row uses accessible switch semantics, has a programmatic label, supports keyboard activation, announces pending/saved/error state, and preserves stable layout.
- Section shell supports heading, description, optional subheading, loading, error, retry, empty, and status regions.
- Confirmation modal traps focus, restores focus to opener, supports Escape/backdrop/cancel, labels title and description, and locks background scroll.
- Components use existing tokens and avoid nested card layouts.

Testing:

- Component tests cover keyboard tabs, switch semantics, disabled/pending states, status announcements, modal focus trap/restoration, and mobile-friendly wrapping where feasible in JSDOM.

Dependencies:

- Task 4 can proceed in parallel conceptually, but implementation should land after domain contracts are stable.

### Task 6: Notifications Settings Section

Goal: Implement the Notifications tab using real notification preference contracts.

Files likely touched:

- `src/components/settings/notifications-settings-section.tsx`
- `src/__tests__/components/settings/notifications-settings-section.test.tsx`

Acceptance criteria:

- The section renders heading `Email notifications` and description `Control which emails GigSecure sends to you.`
- It renders the five documented rows and maps them to the exact OpenAPI fields.
- Initial state comes from `GET /api/v1/settings/notifications`.
- Each switch updates through `PUT /api/v1/settings/notifications` with only the changed documented field.
- Pending state is visible and accessible.
- Success state is announced without noisy repeated chatter.
- Error state uses `parseApiError`, shows retry/revert behavior, and failed updates do not leave incorrect UI state.
- Loading and query error states are friendly and retryable.

Testing:

- Tests cover loading, success render, each field mapping, toggle success, toggle failure rollback, retry, parseApiError output, keyboard activation, and disabled pending behavior.

Dependencies:

- Tasks 3, 4, and 5.

### Task 7: Privacy And Data Settings Section

Goal: Implement the Privacy and Data tab using real privacy settings contracts.

Files likely touched:

- `src/components/settings/privacy-settings-section.tsx`
- `src/__tests__/components/settings/privacy-settings-section.test.tsx`

Acceptance criteria:

- The section renders heading `Data & privacy controls`, description `Control how GigSecure uses and stores your information.`, and subheading `Data usage`.
- It renders the three documented rows and maps them to the exact OpenAPI fields.
- Initial state comes from `GET /api/v1/settings/privacy`.
- Each switch updates through `PUT /api/v1/settings/privacy` with only the changed documented field.
- Pending, success, error, retry, and rollback behavior matches the Notifications section.
- No undocumented partner or quote-accuracy fields are invented.

Testing:

- Tests cover loading, success render, field mapping, toggle success, toggle failure rollback, retry, parseApiError output, keyboard activation, and mobile-safe row stacking.

Dependencies:

- Tasks 3, 4, and 5.

### Task 8: Delete And Deactivate Account Section

Goal: Implement the Delete account tab with guarded destructive actions.

Files likely touched:

- `src/components/settings/account-danger-section.tsx`
- `src/components/settings/deactivate-account-modal.tsx`
- `src/components/settings/delete-account-modal.tsx`
- `src/__tests__/components/settings/account-danger-section.test.tsx`

Acceptance criteria:

- The tab renders red `Danger zone` heading and warning copy.
- Deactivate row renders the screenshot-aligned description and red outlined button.
- Delete row renders the screenshot-aligned description and solid red button.
- Deactivate button opens a confirmation modal; final confirmation calls `POST /api/v1/settings/account/deactivate`.
- Delete button opens a confirmation modal with password input; final confirmation calls `DELETE /api/v1/settings/account` with `{ password }`.
- Delete password is required client-side and is never stored.
- Modals prevent accidental submission, disable submit while pending, and show parsed API errors.
- Successful deactivate/delete clears session and redirects out of the protected app.
- Failed actions keep the user on the tab with modal state and error recovery.

Testing:

- Tests cover opening/closing modals, focus trap/restoration, Escape/backdrop/cancel, required password validation, successful deactivate session cleanup, successful delete session cleanup, API error display, and no accidental action before final confirmation.

Dependencies:

- Tasks 3, 4, and 5.

### Task 9: Settings Page Composition And Navigation

Goal: Add the protected Settings route and wire it into the authenticated shell.

Files likely touched:

- `src/app/(app)/dashboard/settings/page.tsx`
- `src/app/(app)/dashboard/settings/loading.tsx`
- `src/app/(app)/dashboard/settings/error.tsx`
- `src/components/settings/settings-page.tsx`
- `src/components/dashboard/shell/app-navigation.tsx`
- `src/lib/constants.ts`
- `src/__tests__/pages/dashboard-settings.test.tsx`
- `src/__tests__/components/dashboard/app-navigation.test.tsx`

Acceptance criteria:

- Settings page is protected and not public.
- Sidebar Settings item is enabled, links to the chosen protected route, and shows active styling on the Settings page.
- Page uses the existing app shell and navbar.
- Page composition matches screenshot spacing, tab placement, left alignment, and desktop toggle alignment.
- Loading and error route states preserve shell geometry.
- The page avoids redundant network requests when switching tabs.

Testing:

- Page tests cover protected composition, active nav state, initial tab, tab switching, loading/error states, and route metadata if applicable.
- Existing navigation tests are updated for the Settings item changing from unavailable to available.

Dependencies:

- Tasks 5, 6, 7, and 8.

### Task 10: Responsive And Accessibility Pass

Goal: Verify and refine the complete Settings experience across keyboard, screen-reader, and viewport constraints.

Files likely touched:

- `src/components/settings/*`
- `src/app/(app)/dashboard/settings/page.tsx`
- Relevant tests

Acceptance criteria:

- Mobile layout is usable at 320px, 360px, and 390px without horizontal overflow.
- Tablet and desktop layouts preserve screenshot hierarchy and far-right desktop switch alignment.
- Tabs remain reachable and understandable on small screens.
- Touch targets are at least 44px where practical.
- Visible focus states are present for every interactive element.
- No text overlaps or clips in buttons, tabs, rows, or modals.
- `prefers-reduced-motion` is respected for modal/tab transitions if animations are used.
- Color is not the only signal for danger, active tab, pending, success, or error states.
- Status and error regions are programmatically announced without duplicating announcements.

Testing:

- Add or update Testing Library accessibility tests for keyboard behavior.
- Add Playwright viewport checks for 320, 390, 768, 1024, 1280, and 1512px widths.
- Run a manual or automated contrast pass against actual tokens.

Dependencies:

- Task 9.

### Task 11: Unit And Integration Test Completion

Goal: Lock down feature behavior with meaningful automated coverage.

Files likely touched:

- `src/__tests__/lib/settings-validators.test.ts`
- `src/__tests__/services/settings.service.test.ts`
- `src/__tests__/hooks/settings-hooks.test.tsx`
- `src/__tests__/components/settings/*.test.tsx`
- `src/__tests__/pages/dashboard-settings.test.tsx`
- `src/__tests__/mocks/settings-handlers.test.ts`

Acceptance criteria:

- Tests verify real user-visible behavior rather than implementation trivia.
- Coverage includes loading, success, error, retry, malformed API response, unauthorized response, toggle pending, toggle rollback, keyboard tabs, keyboard switches, modal focus behavior, password validation, session cleanup, and responsive class/structure expectations.
- Existing auth/dashboard/navigation tests remain passing after enabling Settings.
- No tests are weakened or skipped merely to pass.

Testing:

- `npm test -- --run` or a focused equivalent during implementation.
- `npx tsc --noEmit`.

Dependencies:

- Tasks 3 through 10.

### Task 12: E2E Coverage

Goal: Add Playwright coverage for the completed Settings user flows.

Files likely touched:

- `e2e/dashboard/settings-flow.spec.ts`
- E2E helpers or MSW setup if needed

Acceptance criteria:

- E2E opens Settings from the authenticated dashboard shell.
- E2E verifies Settings nav active state.
- E2E switches between Notifications, Privacy and Data, and Delete account tabs.
- E2E toggles at least one notification preference and one privacy preference.
- E2E verifies failed toggle recovery or retry behavior where practical.
- E2E opens and cancels the deactivate modal.
- E2E opens delete modal, verifies password is required, and cancels without deleting.
- E2E verifies mobile tab/switch usability at a small viewport.
- Destructive success flows are tested only against isolated mocks and must not break the rest of the suite's authenticated session assumptions.

Testing:

- `npm run test:e2e -- --project=chromium e2e/dashboard/settings-flow.spec.ts`
- Full `npm run test:e2e -- --project=chromium` before final handoff if runtime permits.

Dependencies:

- Task 11.

### Task 13: Final QA And `CONTEXT.md` Update

Goal: Complete verification, document the implementation, and leave a clear handoff.

Files likely touched:

- `CONTEXT.md`
- Potential small fixes from QA

Acceptance criteria:

- `CONTEXT.md` includes the final Settings implementation map, files changed, important decisions, backend/product open questions, and verification results.
- Final QA commands are run or clearly documented if blocked:
  - `npm run lint`
  - `npm test -- --run`
  - `npx tsc --noEmit`
  - `npm run test:e2e -- --project=chromium`
  - `npm run build`
- Visual QA is performed against the supplied screenshots at the 1512px reference width and against mobile/tablet widths.
- No unrelated refactors or metadata churn are included.
- The generated schema file is confirmed to have been generated, not hand-edited.

Testing:

- Full relevant test suite and build verification as above.

Dependencies:

- Task 12.

## Testing And QA Strategy

Unit tests:

- Zod validators for all request and response shapes.
- Formatting/mapping helpers for settings labels and API field names.
- Modal and tab primitives for keyboard and focus behavior.

Integration tests:

- Services with MSW for authenticated request behavior, response validation, 204 handling, and error propagation.
- React Query hooks for caching, pending states, rollback/refetch, mutation retry policy, and account-action side effects.
- Page and section tests for loading, success, error, retry, tab switching, switch behavior, and modal flows.

E2E tests:

- Authenticated user opens Settings from sidebar.
- User switches tabs by click and keyboard.
- User toggles notification and privacy settings.
- User sees retry/error behavior for a failed preference update.
- User opens and cancels deactivate/delete modals.
- User cannot submit delete without a password.
- Mobile viewport remains usable without horizontal overflow.

Manual/visual QA:

- Compare desktop at 1512px width with the three supplied Settings screenshots.
- Verify 320, 360, 390, 768, 1024, 1280, and 1440+ widths.
- Verify focus order, focus restoration, Escape behavior, body scroll lock, and screen-reader labels.
- Verify no settings page network call is made without an authenticated full session.
- Verify account deactivation/deletion success leaves no protected content visible after session cleanup.

## Specific Acceptance Criteria

The final implementation must satisfy all of the following:

- Settings page is protected and not public.
- API responses are runtime validated.
- Mutations use `retry: false`.
- User-facing errors go through `parseApiError`.
- Toggle mutations show pending, success, and error feedback.
- Failed toggle updates do not leave incorrect UI state.
- Tabs are keyboard accessible.
- Confirmation modals trap focus and restore focus on close.
- Delete/deactivate actions cannot be triggered accidentally.
- Delete account requires password confirmation because the supplied schema requires `password`.
- Successful account deletion/deactivation clears session and redirects appropriately.
- Mobile layout is usable without horizontal overflow.
- Tests cover loading, success, error, retry, keyboard, and mobile states.
- E2E covers opening settings, switching tabs, toggling preferences, and confirmation modal behavior.
- Generated files are not hand-edited.
- No undocumented settings fields, stores, API clients, or auth state paths are introduced.

## Final Handoff And Update Requirements

Every implementation task must append this format to `CONTEXT.md`:

```text
### [DATE AND TIME WAT]

Task completed: Task [NUMBER] - [TASK NAME]

Files changed:
- [Full path]

Summary:
[What was built.]

Important decisions:
[Architecture, API, UX, performance, and accessibility decisions.]

Known follow-ups:
[Deferred work, backend gaps, and next-task requirements.]
```

The final handoff must include:

- Route and navigation summary.
- API and schema synchronization summary.
- Settings files created and their responsibilities.
- Account deactivation/deletion cleanup behavior.
- Any backend/product questions that remain unresolved.
- Exact verification commands run and their results.
- Any commands that could not be run and why.
