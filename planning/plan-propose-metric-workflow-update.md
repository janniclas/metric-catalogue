# Plan: Update Propose Metric Auth Workflow (Server-Owned OAuth + Issue Creation)

## 1. Purpose
Align the current frontend + backend implementation with the new workflow input: server-owned OAuth + session, and server-side issue creation via machine identity (GitHub App preferred). This plan describes concrete changes needed to existing code and tests, without implementing them.

## 2. Current State (Snapshot)
Frontend:
- OAuth + PKCE handled in SPA via `src/features/authPropose/lib/auth.ts`.
- SPA calls backend `POST /oauth/github/exchange` with `code` + `code_verifier` and stores access token in memory.
- SPA creates GitHub issues directly with the user token via `src/features/authPropose/lib/githubApi.ts`.
- Route `/propose-auth` is gated by compile-time flag in `src/router.ts`.

Backend:
- Fastify endpoint `POST /oauth/github/exchange` exchanges code for token and fetches username in `server/src/routes/oauth.ts` + `server/src/github.ts`.
- No session management or login endpoints.
- No server-side issue creation.

## 3. Target Workflow (New Requirements)
- SPA initiates login by redirecting to backend endpoint `GET /auth/github/login`.
- Backend handles OAuth code exchange and user lookup, then establishes a server-side session.
- SPA never receives or stores GitHub access tokens.
- SPA reads auth state via `GET /api/me` and submits proposals to `POST /api/submit-issue`.
- Backend creates issues via machine identity (prefer GitHub App).

## 4. Backend Update Plan
### 4.1 New endpoints
- `GET /auth/github/login`
  - Builds GitHub authorize URL and redirects.
  - Stores state + PKCE verifier in a server-side session or signed cookie.
- `GET /auth/github/callback`
  - Validates state from server store.
  - Exchanges code for access token.
  - Fetches user profile and optional verified email.
  - Creates a server-side session (cookie, httpOnly).
  - Redirects back to SPA route (e.g. `/propose-auth`) with a minimal status marker.
- `GET /api/me`
  - Returns `{ username, userId, avatarUrl?, email? }` if session exists.
  - Returns 401 if no session.
- `POST /api/submit-issue`
  - Requires authenticated session.
  - Validates proposal payload.
  - Builds issue body on server.
  - Creates issue via GitHub App installation token.
  - Returns `{ issueUrl, issueNumber }`.

### 4.2 Session management
- Add server-side session with httpOnly cookie.
- Use `@fastify/secure-session` or `@fastify/session` + `@fastify/cookie`.
- Cookie settings:
  - `httpOnly: true`
  - `secure: true` (production)
  - `sameSite: "lax"`
  - `path: "/"`
- Store:
  - `userId`, `username`, `avatarUrl`, `email` (if collected)
  - OAuth state + code verifier only for the short-lived login flow

### 4.3 GitHub App issue creation
- Use GitHub App installation token rather than user token.
- Use Octokit App auth (`@octokit/auth-app`) or `@octokit/app`.
- Env variables to add:
  - `GITHUB_APP_ID`
  - `GITHUB_APP_PRIVATE_KEY`
  - `GITHUB_APP_INSTALLATION_ID`
  - `GITHUB_APP_REPO_OWNER`
  - `GITHUB_APP_REPO_NAME`
- Cache installation token in memory until expiry to reduce API calls.

### 4.4 Issue contract handling
- Move the issue body builder to server-side ownership.
- Ensure it matches the existing workflow parser’s required schema.
- Include submitter metadata in the issue body.

### 4.5 Rate limits and abuse control
- Rate-limit `GET /auth/github/login` and `POST /api/submit-issue` per IP.
- Add per-user limits in `POST /api/submit-issue` (session + userId).
- Add a short cooldown for repeated submissions.

### 4.6 Logging and audit
- Log authentication events without tokens.
- Log issue creation with user identity + issue number.

## 5. Frontend Update Plan
### 5.1 Auth flow changes
- Replace `useAuth` logic in `src/features/authPropose/lib/auth.ts`:
  - `startLogin()` should redirect to backend `GET /auth/github/login`.
  - `handleCallback()` should be removed or simplified to a status refresh.
  - Replace access token storage with `GET /api/me` to determine auth state.
- Update `src/features/authPropose/ProposeMetricAuthView.vue`:
  - On mount, call `/api/me` to determine session state.
  - Display username from `/api/me`.
  - Use a logout endpoint (e.g. `POST /auth/logout`) that clears the cookie.

### 5.2 Issue submission changes
- Replace `createIssue` call in `src/features/authPropose/lib/githubApi.ts` with a new backend call:
  - `POST /api/submit-issue` with proposal payload.
  - Include `credentials: "include"` for cookie session.
- Remove or retire `src/features/authPropose/lib/repo.ts` usage in SPA.
- Keep client-side validation and UI preview but treat backend as source of truth.

### 5.3 Environment variables
- Remove frontend reliance on:
  - `VITE_GITHUB_CLIENT_ID`
  - `VITE_OAUTH_EXCHANGE_URL`
  - `VITE_OAUTH_REDIRECT_URI`
- Introduce frontend env pointing to backend:
  - `VITE_AUTH_BASE_URL` or `VITE_API_BASE_URL`
- Update `src/features/authPropose/lib/env.ts` accordingly.

## 6. Shared Domain Logic Strategy
- Avoid duplicating issue body logic in SPA and server.
- Recommended option:
  - Move issue body builder and validation schema into a shared module.
  - Use TypeScript path aliases or a small `packages/` workspace folder consumed by both SPA and server.
- Frontend uses schema for immediate validation and structured payload.
- Backend uses schema to validate and create the final issue body.

## 7. Test Plan Updates
### 7.1 Frontend tests
- Update auth tests to mock `GET /api/me` and login redirect.
- Update submit tests to mock `POST /api/submit-issue` with cookie credentials.
- Verify that OAuth query params are no longer required in SPA routes.

### 7.2 Backend tests
- Add endpoint tests:
  - `GET /auth/github/login` redirect behavior
  - `GET /auth/github/callback` state validation and session setup
  - `GET /api/me` auth vs unauth responses
  - `POST /api/submit-issue` validation, auth required, and success path
- Add GitHub App auth unit tests with mocked Octokit.

## 8. Migration Notes
- Existing `POST /oauth/github/exchange` becomes legacy and should be removed or deprecated after the new flow is live.
- SPA logic will no longer parse `code` + `state` query params from GitHub.
- Issue creation should be fully server-driven for consistency and audit.

## 9. Risks and Mitigations
- Risk: session cookie blocked by browser.
  - Mitigation: use same-site `lax` and ensure backend + SPA share a top-level domain in production.
- Risk: OAuth callback failure leads to session loss.
  - Mitigation: redirect to `/propose-auth?auth=error` and show user-safe error.
- Risk: GitHub App token rotation failure.
  - Mitigation: cache token with expiry and refresh lazily.

## 10. Blocking Questions
- Should the backend use `@fastify/secure-session` (cookie-only) or `@fastify/session` with a server-side store (Redis) for production? Answer: cookie-only.
- Should verified email be required? If yes, OAuth scope must include `user:email` and backend must call `/user/emails`. Answer: no.
- What is the required redirect target after successful login: `/propose-auth` or a dedicated callback route? Answer: 
- Are there existing GitHub App credentials and installation IDs available for the target repo?
- Should the backend support GitHub Enterprise endpoints in the new flow, or only github.com?
