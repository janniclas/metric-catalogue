# TODO: Authenticated Propose Metric Server

This TODO list is derived from `planning/plan-propose-metric-server.md`. It is structured for incremental execution across multiple sessions. Do not implement code until tasks are selected.

## Phase 1: Project Skeleton & Tooling

- [x] `SRV-BOOT-1` Create server workspace and package manifest
`Description:` Initialize server folder, package.json, TypeScript config, and basic build scripts.
`Files/modules affected:` `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`
`Dependencies:` None
`Acceptance criteria:` `npm run build` compiles TypeScript to `server/dist` without errors.
`Mode scope:` shared

- [x] `SRV-BOOT-2` Add lint/format/test scaffolding
`Description:` Add dev tooling for linting, formatting, and tests (e.g., ESLint, Prettier, Vitest).
`Files/modules affected:` `server/package.json`, `server/.eslintrc`, `server/.prettierrc`, `server/vitest.config.ts`
`Dependencies:` SRV-BOOT-1
`Acceptance criteria:` `npm run test` executes and exits successfully.
`Mode scope:` shared

## Phase 2: Environment Configuration

- [x] `SRV-ENV-1` Define env schema and validation
`Description:` Add Zod schema for required and optional env vars; validate on boot.
`Files/modules affected:` `server/src/env.ts`
`Dependencies:` SRV-BOOT-1
`Acceptance criteria:` Missing required env vars cause a clear startup error.
`Mode scope:` shared

- [x] `SRV-ENV-2` Add support for GitHub Enterprise endpoints (future)
`Description:` Allow override of OAuth and API base URLs via env vars.
`Files/modules affected:` `server/src/env.ts`, `server/src/github.ts`
`Dependencies:` SRV-ENV-1
`Acceptance criteria:` Custom `GITHUB_OAUTH_BASE_URL` and `GITHUB_API_BASE_URL` are used when provided.
`Mode scope:` shared

## Phase 3: Fastify Server Core

- [x] `SRV-CORE-1` Create Fastify server with health endpoint
`Description:` Initialize Fastify app, add `/healthz` route, enable logging.
`Files/modules affected:` `server/src/index.ts`, `server/src/server.ts`
`Dependencies:` SRV-BOOT-1
`Acceptance criteria:` `GET /healthz` returns 200.
`Mode scope:` shared

- [x] `SRV-CORE-2` Add security headers
`Description:` Integrate `@fastify/helmet`.
`Files/modules affected:` `server/src/server.ts`
`Dependencies:` SRV-CORE-1
`Acceptance criteria:` Security headers present in responses.
`Mode scope:` shared

- [x] `SRV-CORE-3` Configure strict CORS
`Description:` Allow only the SPA origin configured by `CORS_ALLOWED_ORIGIN`.
`Files/modules affected:` `server/src/server.ts`
`Dependencies:` SRV-CORE-1, SRV-ENV-1
`Acceptance criteria:` Requests from non-allowed origins are rejected.
`Mode scope:` shared

- [x] `SRV-CORE-4` Add rate limiting
`Description:` Add `@fastify/rate-limit` for `/oauth/github/exchange` (defaults 5/min, burst 10).
`Files/modules affected:` `server/src/server.ts`
`Dependencies:` SRV-CORE-1, SRV-ENV-1
`Acceptance criteria:` Excess requests return 429.
`Mode scope:` shared

## Phase 4: GitHub OAuth Exchange

- [x] `SRV-OAUTH-1` Implement GitHub code exchange
`Description:` Call GitHub token endpoint with `Accept: application/json` and handle errors.
`Files/modules affected:` `server/src/github.ts`
`Dependencies:` SRV-ENV-1
`Acceptance criteria:` Returns access token for valid code; errors mapped to 401/429/500.
`Mode scope:` shared

- [x] `SRV-OAUTH-2` Implement GitHub username fetch
`Description:` Call GitHub API `/user` endpoint with Bearer token to get login.
`Files/modules affected:` `server/src/github.ts`
`Dependencies:` SRV-OAUTH-1
`Acceptance criteria:` Returns username and handles API errors.
`Mode scope:` shared

## Phase 5: API Endpoint

- [x] `SRV-API-1` Add `/oauth/github/exchange` endpoint
`Description:` Validate payload, call exchange + user fetch, return `{ access_token, username }`.
`Files/modules affected:` `server/src/routes/oauth.ts`, `server/src/server.ts`
`Dependencies:` SRV-CORE-1, SRV-OAUTH-1, SRV-OAUTH-2
`Acceptance criteria:` Request schema validated, success and error responses match spec.
`Mode scope:` shared

- [x] `SRV-API-2` Do not trust client-provided state
`Description:` Ensure backend ignores `state` (unless server-side state validation is later added).
`Files/modules affected:` `server/src/routes/oauth.ts`
`Dependencies:` SRV-API-1
`Acceptance criteria:` `state` is not validated or trusted by backend; contract documented.
`Mode scope:` shared

## Phase 6: Logging & Observability

- [ ] `SRV-OBS-1` Structured logging
`Description:` Ensure Pino logs include request id, status, and latency.
`Files/modules affected:` `server/src/server.ts`
`Dependencies:` SRV-CORE-1
`Acceptance criteria:` Logs show request id and latency for `/oauth/github/exchange`.
`Mode scope:` shared

- [ ] `SRV-OBS-2` Add basic metrics (optional)
`Description:` Track exchange success/failure counts (log-only or metrics exporter).
`Files/modules affected:` `server/src/server.ts`
`Dependencies:` SRV-OBS-1
`Acceptance criteria:` Success/failure counts are emitted or logged.
`Mode scope:` shared

## Phase 7: Tests

- [x] `SRV-TEST-1` Unit tests for env validation
`Description:` Verify missing env vars fail at boot.
`Files/modules affected:` `server/src/__tests__/env.test.ts`
`Dependencies:` SRV-ENV-1
`Acceptance criteria:` Tests cover missing required and optional env cases.
`Mode scope:` shared

- [x] `SRV-TEST-2` Unit tests for GitHub API integration
`Description:` Mock GitHub endpoints and verify exchange/user fetch behavior.
`Files/modules affected:` `server/src/__tests__/github.test.ts`
`Dependencies:` SRV-OAUTH-1, SRV-OAUTH-2
`Acceptance criteria:` Valid and error cases are covered with clear assertions.
`Mode scope:` shared

- [x] `SRV-TEST-3` Integration tests for `/oauth/github/exchange`
`Description:` Use Fastify inject to test request/response behavior and error mapping.
`Files/modules affected:` `server/src/__tests__/oauth.test.ts`
`Dependencies:` SRV-API-1
`Acceptance criteria:` 200/400/401/429/500 paths tested.
`Mode scope:` shared

## Phase 8: Deployment & Ops

- [ ] `SRV-DEPLOY-1` Add Dockerfile and production build
`Description:` Build a minimal container for deployment.
`Files/modules affected:` `server/Dockerfile`
`Dependencies:` SRV-BOOT-1
`Acceptance criteria:` Docker build completes and server starts.
`Mode scope:` shared

- [ ] `SRV-DEPLOY-2` Add health check configuration
`Description:` Document health check usage in deployment.
`Files/modules affected:` `server/README.md`
`Dependencies:` SRV-CORE-1
`Acceptance criteria:` Health check endpoint documented and usable.
`Mode scope:` shared

## Phase 9: Manual Test Scenarios

- [ ] `SRV-MAN-1` Local OAuth exchange
`Description:` Run server locally and test exchange flow with SPA.
`Files/modules affected:` N/A
`Dependencies:` SRV-API-1
`Acceptance criteria:` SPA receives token + username successfully.
`Mode scope:` shared

- [ ] `SRV-MAN-2` Rate limit behavior
`Description:` Trigger rate limit and confirm 429 response.
`Files/modules affected:` N/A
`Dependencies:` SRV-CORE-4
`Acceptance criteria:` 429 response and clear error message.
`Mode scope:` shared

## Progress Log

- Session 2026-03-01: Completed SRV-BOOT-1, SRV-BOOT-2, SRV-ENV-1, SRV-ENV-2, SRV-CORE-1, SRV-CORE-2, SRV-CORE-3, SRV-CORE-4, SRV-OAUTH-1, SRV-OAUTH-2, SRV-API-1, SRV-API-2, SRV-TEST-1, SRV-TEST-2, SRV-TEST-3.

## Blocking Questions

None.


## New workflow input

You’re essentially designing a GitHub-backed submission workflow with three concerns:
User authentication (anti-spam, identity)
Authorization (who is allowed to submit)
Issue creation model (who is the issue author)
Below is the architectural trade-off and a recommended pattern.
1) Use GitHub OAuth for authentication (mandatory in your case)
   Implement GitHub OAuth App (not a GitHub App for this use case) in your Fastify backend:
   Flow:
   SPA → /auth/github/login
   Redirect to GitHub OAuth
   GitHub → callback → Fastify exchanges code for access token
   Backend fetches:
   user login
   user id
   verified email (optional but useful)
   Backend creates session (cookie, httpOnly) or JWT
   This gives you:
   Strong identity (GitHub account)
   Rate-limiting per user
   Optional org/team membership checks via GitHub API
   You do not expose any tokens to the SPA.

2) Create issues via a machine identity
This is the standard pattern.
Flow:
User authenticates via GitHub OAuth
User submits form to your backend
Backend validates user & applies anti-spam rules
Backend creates the issue using a machine token
Issue body includes the GitHub username + metadata
Machine identity options
✔️ Best: GitHub App (preferred over PAT)
Use a GitHub App with:
Repository: your target repo only
Permissions: Issues → Read & Write
Advantages:
Fine-grained
Short-lived installation tokens
No long-lived PAT secrets
Auditable

3) Preserve user identity in the issue
Even though the issue is created by the bot, you can:
Mention the user: Submitted by @username
Add labels based on form data
Add structured front-matter
Example issue body:
Submitted via web form.

GitHub user: @jan-niclas
User id: 12345678

---



This gives traceability without granting repo write access to users.

4) End-to-end architecture
Components
Vue SPA → form UI
Fastify backend:
GitHub OAuth
Session/JWT
Anti-spam checks
Issue creation via GitHub App
Nginx → reverse proxy
Fastify endpoints
GET  /auth/github/login
GET  /auth/github/callback
GET  /api/me
POST /api/submit-issue
/api/submit-issue logic
Verify session
Rate limit per user
Fetch cached GitHub profile (or refresh)
Apply trust heuristics
Create issue via GitHub App token
Return issue URL