# Plan: Authenticated Propose Metric Server

## 1. Goal
Build a minimal, production-ready backend service to support the in-app “Propose metric” flow. The server securely exchanges GitHub OAuth codes for access tokens, retrieves the username, and returns `{ access_token, username }` to the frontend. It should be lightweight, secure, and fully compatible with the existing Vue + Vite SPA.

## 2. Recommended Technology Stack
- **Runtime**: Node.js LTS (20.x)
- **Language**: TypeScript
- **Web framework**: Fastify (lightweight, high-performance, built-in schema validation)
- **HTTP client**: `undici` (built-in Node 20) or `@fastify/reply-from` for upstream requests
- **Config**: `dotenv` + `zod` for type-safe environment variable validation
- **Observability**: Pino (Fastify default) + optional OpenTelemetry instrumentation
- **Security**: `@fastify/helmet` + strict CORS configuration
- **Deployment**: Docker container, behind NGINX or platform-managed TLS (Fly.io, Render, AWS ECS)

This stack ensures strong parity with your SPA codebase and keeps the server lightweight.

## 3. High-Level Architecture
```
Browser (SPA)
  └─ POST /oauth/github/exchange ──> Auth Server (Fastify)
       └─ POST https://github.com/login/oauth/access_token
       └─ GET  https://api.github.com/user
```

**Server responsibilities**:
- Validate request payload (`code`, `redirect_uri`, `code_verifier`).
- Exchange code for GitHub access token.
- Retrieve GitHub username.
- Return `{ access_token, username }` to SPA.

No user data is stored server-side. Tokens remain in memory only, per client requirements.

## 4. API Endpoints

### `POST /oauth/github/exchange`
**Request payload**:
```json
{
  "code": "...",
  "redirect_uri": "...",
  "code_verifier": "..."
}
```

**Response (200)**:
```json
{ "access_token": "...", "username": "..." }
```

**Error responses**:
- `400` Invalid request payload
- `401` Invalid or expired OAuth code
- `429` Rate limited by GitHub
- `500` Unexpected error

**Notes**:
- Do not trust client-provided `state`. If server-side state validation is added later, it should be stored and verified independently.
- Always include `Accept: application/json` when calling GitHub’s token endpoint to avoid URL-encoded responses.

## 5. OAuth Flow

1. SPA redirects user to GitHub authorization URL with PKCE challenge.
2. GitHub redirects back to SPA with `code`.
3. SPA posts `{ code, code_verifier, redirect_uri }` to backend.
4. Backend exchanges code:
   - POST `https://github.com/login/oauth/access_token`
   - Headers: `Accept: application/json`
5. Backend fetches user info:
   - GET `https://api.github.com/user` with Bearer token
6. Backend returns `{ access_token, username }` to SPA.

The flow allows the SPA to validate state and store tokens in memory only.

## 6. Security Requirements

### Transport & Headers
- Enforce HTTPS (TLS at proxy or platform).
- Use `@fastify/helmet` for standard security headers.
- CORS: restrict to SPA origin using strict allowlist.

### Input Validation
- Validate payload schema (Zod or Fastify schema).
- Reject missing or extra fields.
- Validate `redirect_uri` against allowlisted origins.

### Rate Limiting
- `@fastify/rate-limit` on `/oauth/github/exchange`.
- Suggested defaults (low traffic): 5 requests/min per IP, burst 10.

### Logging & Secrets
- Never log access tokens, OAuth codes, or client secrets.
- Mask sensitive values if logging payloads.
- Store `GITHUB_CLIENT_SECRET` only in environment.

### CSRF / State
- **Client-only state**: simplest; SPA validates before calling backend.
- **Server-validated state** (optional future): store short-lived state (in-memory, signed cookie, or Redis).
- **Recommendation**: start with client-only; design API to accept server-issued state later without changes.

## 7. Environment Variables

**Required**:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI` (must match GitHub OAuth app)
- `CORS_ALLOWED_ORIGIN` (SPA origin)
- `PORT`

**Optional**:
- `LOG_LEVEL` (default: `info`)
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW`
- `GITHUB_OAUTH_BASE_URL` (future GitHub Enterprise support)
- `GITHUB_API_BASE_URL` (future GitHub Enterprise support)

## 8. Deployment Plan
- Build and containerize Node 20 app (TypeScript → `dist`).
- Run behind TLS-enabled reverse proxy.
- Health check endpoint `/healthz`.
- Secrets and allowlists via environment variables.

## 9. Observability
- Structured logs via Pino.
- Include request ID, latency, and OAuth exchange outcome.
- Optional: OpenTelemetry for metrics export (e.g., OAuth success/failure count).

## 10. Testing

**Unit tests**:
- Request payload validation
- GitHub token exchange handling
- GitHub user fetch handling
- Error mapping and response codes

**Integration tests**:
- Mock GitHub endpoints for full OAuth flow
- Validate `/oauth/github/exchange` responses and errors

## 11. Risks & Mitigations
- **GitHub rate limiting**: apply throttling + clear error messages.
- **OAuth code reuse**: GitHub rejects reused codes; return 401 to client.
- **CORS misconfig**: strictly allow SPA origin only.
- **Double callback submission**: ensure SPA calls backend only once per redirect.

## 12. Open Questions / Future Considerations
- Server-side state validation: tradeoff between stronger CSRF protection vs. added complexity.
- GitHub Enterprise support: endpoints configurable via env vars.
- Traffic volume: initial low traffic → conservative rate limits suffice.
