# TODO: Authenticated Propose Metric

This TODO list is derived from `planning/plan-propose-metric.md`. It is structured for incremental execution across multiple sessions. Do not implement code until tasks are selected.

## Phase 1: Feature Flag & Build Gating

- [x] `PM-FF-1` Define compile-time feature flag constant
`Description:` Add a single source of truth boolean for `VITE_FEATURE_AUTH_PROPOSE_METRIC` and ensure it is evaluated at build time.
`Files/modules affected:` `src/lib/featureFlags.ts` (new)
`Dependencies:` None
`Acceptance criteria:` Flag is read from `import.meta.env` and used as a compile-time constant in the app build.
`Mode scope:` shared

- [x] `PM-FF-2` Gate auth-only module imports behind feature flag
`Description:` Ensure any auth-related modules are only imported within a gated branch to enable tree-shaking.
`Files/modules affected:` `src/router.ts`, `src/features/authPropose/*` (new)
`Dependencies:` PM-FF-1
`Acceptance criteria:` No auth-only modules are imported from non-gated modules; auth-only imports are only reachable from `src/features/authPropose/`.
`Mode scope:` shared

- [x] `PM-FF-3` Ensure `/propose-auth` route is only registered when flag is true
`Description:` Add route registration only inside a compile-time gate, using conditional import for auth routes.
`Files/modules affected:` `src/router.ts`, `src/features/authPropose/routes.ts` (new)
`Dependencies:` PM-FF-1, PM-FF-2
`Acceptance criteria:` Static build has no `/propose-auth` route; auth build includes it.
`Mode scope:` shared

- [ ] `PM-FF-4` Verify auth code is not bundled when flag is false
`Description:` Inspect build output and confirm auth-only chunks are absent.
`Files/modules affected:` Build artifacts in `dist/`
`Dependencies:` PM-FF-1, PM-FF-2, PM-FF-3
`Acceptance criteria:` When `VITE_FEATURE_AUTH_PROPOSE_METRIC=false`, no auth-only chunk is present and no auth-only dependencies are bundled.
`Mode scope:` shared

## Phase 2: Environment Configuration

- [x] `PM-ENV-1` Define required env vars and typing
`Description:` Add typing for `VITE_FEATURE_AUTH_PROPOSE_METRIC`, `VITE_GITHUB_CLIENT_ID`, `VITE_OAUTH_EXCHANGE_URL`, `VITE_OAUTH_REDIRECT_URI`, `VITE_REPO_URL`.
`Files/modules affected:` `src/env.d.ts`
`Dependencies:` PM-FF-1
`Acceptance criteria:` TypeScript recognizes all required env vars in auth mode.
`Mode scope:` shared

- [x] `PM-ENV-2` Add runtime validation for auth-mode env vars
`Description:` Validate presence/format of required env vars when feature flag is true, and surface clear developer-facing errors.
`Files/modules affected:` `src/features/authPropose/lib/env.ts` (new), `src/features/authPropose/*`
`Dependencies:` PM-FF-1, PM-ENV-1
`Acceptance criteria:` In auth mode, missing env vars produce clear error messages before auth flow starts.
`Mode scope:` auth-only

- [x] `PM-ENV-3` Define repo target derivation from `VITE_REPO_URL`
`Description:` Implement parsing logic to derive `{owner}/{repo}` from `VITE_REPO_URL` and validate shape.
`Files/modules affected:` `src/features/authPropose/lib/repo.ts` (new)
`Dependencies:` PM-ENV-2
`Acceptance criteria:` Invalid or missing `VITE_REPO_URL` yields a developer-facing error; valid URLs parse owner/repo correctly.
`Mode scope:` auth-only

## Phase 3: Auth Module (OAuth Flow)

- [ ] `PM-AUTH-1` Implement state and PKCE generation
`Description:` Create helpers to generate `state`, `code_verifier`, and `code_challenge` (S256). Persist state and verifier across redirect using `sessionStorage` only.
`Files/modules affected:` `src/features/authPropose/lib/pkce.ts` (new), `src/features/authPropose/lib/state.ts` (new)
`Dependencies:` PM-ENV-2
`Acceptance criteria:` `state` and `code_verifier` are generated per auth attempt and survive redirect; no token storage occurs.
`Mode scope:` auth-only

- [ ] `PM-AUTH-2` Build authorize redirect URL
`Description:` Construct GitHub authorize URL using client ID, scope `public_repo`, state, PKCE challenge, and redirect URI.
`Files/modules affected:` `src/features/authPropose/lib/auth.ts`
`Dependencies:` PM-AUTH-1, PM-ENV-2
`Acceptance criteria:` URL includes `client_id`, `scope=public_repo`, `state`, `code_challenge`, `code_challenge_method=S256`, and `redirect_uri`.
`Mode scope:` auth-only

- [ ] `PM-AUTH-3` Handle OAuth callback and validate state
`Description:` Parse `code` and `state` on callback, validate against stored state, and guard against CSRF.
`Files/modules affected:` `src/features/authPropose/lib/auth.ts`, `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-1, PM-AUTH-2
`Acceptance criteria:` Mismatched or missing `state` causes authentication to fail with a clear error; valid state proceeds to exchange.
`Mode scope:` auth-only

- [ ] `PM-AUTH-4` Exchange code for token
`Description:` Call backend `POST /oauth/github/exchange` with `code`, `state`, `code_verifier`, and `redirect_uri`.
`Files/modules affected:` `src/features/authPropose/lib/auth.ts`
`Dependencies:` PM-AUTH-3
`Acceptance criteria:` Successful exchange returns `{ access_token, username }`; errors are surfaced for the UI.
`Mode scope:` auth-only

- [ ] `PM-AUTH-5` In-memory token storage and logout
`Description:` Store token and username in memory only; add logout that clears auth state and form state.
`Files/modules affected:` `src/features/authPropose/lib/auth.ts`, `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-4
`Acceptance criteria:` Token is not persisted in localStorage/sessionStorage; logout clears auth and form; refresh loses token and shows logged-out state.
`Mode scope:` auth-only

- [ ] `PM-AUTH-6` UX messaging for token loss on refresh
`Description:` Provide UI text indicating that authentication is temporary and will reset on refresh.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-5
`Acceptance criteria:` Message is visible when authenticated and explains refresh logout behavior.
`Mode scope:` auth-only

## Phase 4: GitHub API Client

- [ ] `PM-GH-1` Implement minimal GitHub issues client
`Description:` Create a helper to call `POST /repos/{owner}/{repo}/issues` with Bearer token, JSON body, and required headers.
`Files/modules affected:` `src/features/authPropose/lib/githubApi.ts`
`Dependencies:` PM-ENV-3, PM-AUTH-5
`Acceptance criteria:` Requests include `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version`.
`Mode scope:` auth-only

- [ ] `PM-GH-2` Normalize GitHub API error responses
`Description:` Map 401, 403, and rate-limit responses to consistent error objects for UI.
`Files/modules affected:` `src/features/authPropose/lib/githubApi.ts`
`Dependencies:` PM-GH-1
`Acceptance criteria:` Errors for unauthorized, forbidden, and rate-limited responses include actionable messages.
`Mode scope:` auth-only

## Phase 5: Issue Body Builder (Parser-Compatible)

- [ ] `PM-ISSUE-1` Implement issue body builder
`Description:` Build a function that outputs the exact heading order and labels expected by `scripts/issue-to-metric.ts`, including `_No response_` for empty optional fields.
`Files/modules affected:` `src/features/authPropose/lib/buildIssueBody.ts`
`Dependencies:` PM-ENV-3
`Acceptance criteria:` Generated body includes all 12 headings in exact order with correct labels.
`Mode scope:` auth-only

- [ ] `PM-ISSUE-2` Enforce threshold line format
`Description:` Validate and normalize threshold entries to `Name | Value | Optional description`.
`Files/modules affected:` `src/features/authPropose/lib/buildIssueBody.ts`, `src/features/authPropose/lib/validation.ts` (new)
`Dependencies:` PM-ISSUE-1
`Acceptance criteria:` Invalid thresholds are rejected with clear errors before submission.
`Mode scope:` auth-only

- [ ] `PM-ISSUE-3` Snapshot-test issue body format
`Description:` Add tests that snapshot the full body string and verify heading order and `_No response_` placeholders.
`Files/modules affected:` `src/features/authPropose/lib/__tests__/buildIssueBody.test.ts` (new)
`Dependencies:` PM-ISSUE-1
`Acceptance criteria:` Snapshot tests fail if heading order or labels drift; empty fields produce `_No response_`.
`Mode scope:` auth-only

## Phase 6: Form Domain Model & Validation Schema

- [ ] `PM-FORM-1` Define proposal form model
`Description:` Create a shared type for proposal form state using `Threshold` from `src/lib/metrics.ts`.
`Files/modules affected:` `src/features/authPropose/lib/types.ts` (new)
`Dependencies:` PM-ISSUE-1
`Acceptance criteria:` Form model matches fields required by the issue template and parser.
`Mode scope:` auth-only

- [ ] `PM-FORM-2` Implement validation schema
`Description:` Validate required fields, kebab-case metric id, known phase ID, and thresholds.
`Files/modules affected:` `src/features/authPropose/lib/validation.ts`
`Dependencies:` PM-FORM-1
`Acceptance criteria:` Validation errors are deterministic and include field-level messages.
`Mode scope:` auth-only

## Phase 7: UI Components (Form, Editors, Selects)

- [ ] `PM-UI-1` Build core form component
`Description:` Implement the propose-metric form with dropdowns, autocomplete inputs, markdown editor, and threshold editor.
`Files/modules affected:` `src/features/authPropose/components/ProposeMetricForm.vue`
`Dependencies:` PM-FORM-2
`Acceptance criteria:` Form renders all required fields and surfaces validation feedback inline.
`Mode scope:` auth-only

- [ ] `PM-UI-2` Implement markdown editor with preview
`Description:` Provide textarea with live preview using `renderMarkdown`.
`Files/modules affected:` `src/features/authPropose/components/MarkdownEditor.vue`
`Dependencies:` PM-UI-1
`Acceptance criteria:` Preview is sanitized and updates as text changes.
`Mode scope:` auth-only

- [ ] `PM-UI-3` Implement thresholds editor
`Description:` Allow adding/removing structured threshold rows (name/value/description).
`Files/modules affected:` `src/features/authPropose/components/ThresholdEditor.vue`
`Dependencies:` PM-UI-1
`Acceptance criteria:` Thresholds serialize into the required `Name | Value | Optional description` lines.
`Mode scope:` auth-only

- [ ] `PM-UI-4` Add autocomplete data sources
`Description:` Populate tags/tools/depends-on suggestions from `useMetricsCatalogue()`.
`Files/modules affected:` `src/features/authPropose/components/ProposeMetricForm.vue`, `src/lib/useMetricsCatalogue.ts`
`Dependencies:` PM-UI-1
`Acceptance criteria:` Suggestions appear and can be selected; user can still input custom values.
`Mode scope:` auth-only

## Phase 8: Route Integration (Gated)

- [x] `PM-ROUTE-1` Add gated route module
`Description:` Register `/propose-auth` only when the feature flag is true via a dedicated route module.
`Files/modules affected:` `src/router.ts`, `src/features/authPropose/routes.ts`
`Dependencies:` PM-FF-3
`Acceptance criteria:` Route is present only in auth build and absent in static build.
`Mode scope:` shared

## Phase 9: Header/CTA Integration

- [x] `PM-CTA-1` Switch CTA based on feature flag
`Description:` Update header CTA to link to `/propose-auth` when flag is true, otherwise the existing GitHub issue link.
`Files/modules affected:` `src/components/AppHeader.vue`, `src/lib/config.ts`
`Dependencies:` PM-FF-1
`Acceptance criteria:` CTA points to external issue form in static mode and internal route in auth mode.
`Mode scope:` shared

- [x] `PM-CTA-2` Update overview CTA (if present)
`Description:` Align any other “propose” CTAs with the same behavior as the header.
`Files/modules affected:` `src/views/OverviewView.vue`, `src/lib/config.ts`
`Dependencies:` PM-CTA-1
`Acceptance criteria:` All CTAs resolve to the same target based on the flag.
`Mode scope:` shared

## Phase 10: Error Handling & UX States

- [ ] `PM-UX-1` Unauthenticated state
`Description:` Disable submit and show “Login with GitHub” button.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-5, PM-UI-1
`Acceptance criteria:` Submit is disabled when unauthenticated; login button visible.
`Mode scope:` auth-only

- [ ] `PM-UX-2` Authenticating state
`Description:` Show progress indicator while code exchange is in progress.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-4
`Acceptance criteria:` UI shows “Authenticating…” and disables form submission.
`Mode scope:` auth-only

- [ ] `PM-UX-3` Authenticated ready state
`Description:` Show GitHub username and enable submit.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-AUTH-5
`Acceptance criteria:` Username is visible; submit enabled when form is valid.
`Mode scope:` auth-only

- [ ] `PM-UX-4` Submit in progress state
`Description:` Disable submit and prevent double click during issue creation.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-GH-1
`Acceptance criteria:` Submit button is disabled; repeated clicks do not create multiple requests.
`Mode scope:` auth-only

- [ ] `PM-UX-5` Success state
`Description:` Show created issue URL after success.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-GH-1, PM-ISSUE-1
`Acceptance criteria:` Success banner shows link to the created issue.
`Mode scope:` auth-only

- [ ] `PM-UX-6` GitHub API error state
`Description:` Surface 401/403/rate-limit errors with actionable guidance.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-GH-2
`Acceptance criteria:` Error messaging distinguishes unauthorized, forbidden, and rate-limit responses.
`Mode scope:` auth-only

- [ ] `PM-UX-7` Network error state
`Description:` Handle network failures with retry guidance.
`Files/modules affected:` `src/features/authPropose/ProposeMetricAuthView.vue`
`Dependencies:` PM-GH-1
`Acceptance criteria:` Network errors render a user-friendly message and allow retry.
`Mode scope:` auth-only

## Phase 11: Security Hardening

- [ ] `PM-SEC-1` Enforce no token persistence
`Description:` Add checks to ensure no token is stored in localStorage/sessionStorage.
`Files/modules affected:` `src/features/authPropose/lib/auth.ts`
`Dependencies:` PM-AUTH-5
`Acceptance criteria:` Token exists only in memory and is cleared on refresh.
`Mode scope:` auth-only

- [ ] `PM-SEC-2` Sanitize markdown preview
`Description:` Ensure markdown preview uses `renderMarkdown` with DOMPurify.
`Files/modules affected:` `src/features/authPropose/components/MarkdownEditor.vue`, `src/lib/markdown.ts`
`Dependencies:` PM-UI-2
`Acceptance criteria:` Previewed HTML is sanitized and no raw HTML is injected.
`Mode scope:` auth-only

## Phase 12: Build Verification (Flag On/Off)

- [ ] `PM-BUILD-1` Verify static build output
`Description:` Build with `VITE_FEATURE_AUTH_PROPOSE_METRIC=false` and confirm auth code is not bundled.
`Files/modules affected:` Build artifacts in `dist/`
`Dependencies:` PM-FF-4
`Acceptance criteria:` No auth-only chunks and no `/propose-auth` route in static output.
`Mode scope:` shared

- [ ] `PM-BUILD-2` Verify auth build output
`Description:` Build with `VITE_FEATURE_AUTH_PROPOSE_METRIC=true` and confirm auth chunks and routes are present.
`Files/modules affected:` Build artifacts in `dist/`
`Dependencies:` PM-FF-4
`Acceptance criteria:` Auth route exists and auth chunks are present in build output.
`Mode scope:` shared

## Phase 13: Manual Test Scenarios

- [ ] `PM-MAN-1` Static build behavior
`Description:` Validate that static deployment shows only external issue link and no auth UI.
`Files/modules affected:` N/A
`Dependencies:` PM-BUILD-1, PM-CTA-1
`Acceptance criteria:` Static build has no login flow and CTA opens GitHub issue form.
`Mode scope:` static-only

- [ ] `PM-MAN-2` Auth build behavior
`Description:` Validate that auth deployment shows login button and `/propose-auth` route.
`Files/modules affected:` N/A
`Dependencies:` PM-BUILD-2, PM-ROUTE-1
`Acceptance criteria:` Auth build has login flow and authenticated propose form.
`Mode scope:` auth-only

- [ ] `PM-MAN-3` Full OAuth flow
`Description:` Validate login, redirect, state/PKCE validation, and successful token exchange.
`Files/modules affected:` N/A
`Dependencies:` PM-AUTH-1, PM-AUTH-4
`Acceptance criteria:` Successful login returns username and enables submit.
`Mode scope:` auth-only

- [ ] `PM-MAN-4` Issue creation end-to-end
`Description:` Submit a proposal and verify GitHub issue is created and triggers the GitHub Action.
`Files/modules affected:` N/A
`Dependencies:` PM-GH-1, PM-ISSUE-1
`Acceptance criteria:` GitHub Action runs and opens PR from the created issue.
`Mode scope:` auth-only

- [ ] `PM-MAN-5` Invalid form prevention
`Description:` Ensure invalid id/required fields prevent submission and show errors.
`Files/modules affected:` N/A
`Dependencies:` PM-FORM-2, PM-UI-1
`Acceptance criteria:` Submit is blocked and errors are shown for invalid inputs.
`Mode scope:` auth-only

- [ ] `PM-MAN-6` Refresh during auth
`Description:` Refresh the page after auth and confirm token is lost and UI returns to logged-out state.
`Files/modules affected:` N/A
`Dependencies:` PM-AUTH-5, PM-AUTH-6
`Acceptance criteria:` User is logged out on refresh and informed about token loss.
`Mode scope:` auth-only

## Progress Log

- Session 2026-03-01: Completed PM-FF-1, PM-FF-2, PM-FF-3, PM-ENV-1, PM-ENV-2, PM-ENV-3, PM-ROUTE-1, PM-CTA-1, PM-CTA-2.

## Blocking Questions

None.
