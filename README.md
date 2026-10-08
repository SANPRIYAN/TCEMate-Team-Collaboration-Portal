# TCEMate Team Collaboration Portal

TCEMate is an AngularJS student team-collaboration portal backed by an Express API and MongoDB Atlas. The backend is the authority for roles, project lifecycle, required-skill validation, application eligibility, and team membership.

## Technology and layout

- Frontend: AngularJS 1.x, static HTML and CSS
- Backend: Node.js, Express, Mongoose, JWT, bcrypt
- Database: existing MongoDB Atlas cluster
- Frontend API setting: `window.TCEMateConfig.apiBaseUrl` in `js/config.js`

## Local development

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGO_URI` to the existing Atlas connection string and set `JWT_SECRET` to a random value of at least 32 characters. Configure `ADMIN_SETUP_EMAIL` and a temporary `ADMIN_SETUP_SECRET` (at least 32 random characters) before first-admin setup. Configure SMTP for password-reset messages.
3. From `backend/`, run `npm install` and `npm run dev`.
4. Serve the repository root over HTTP (for example, VS Code Live Server on port 8000) and open `login.html`. Do not use `file://`.

The local API default is `http://localhost:5000/api`. In production, the browser uses the same-origin `/api` path unless the deployed `js/config.js` sets a different API URL.

## Environment configuration

Backend settings belong in the hosting provider's secret/environment-variable manager (or untracked `backend/.env` for local development):

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Required MongoDB Atlas connection string |
| `JWT_SECRET` | Required JWT signing secret; at least 32 characters |
| `PORT` | API port; defaults to 5000 |
| `NODE_ENV` | Set to `production` in the production host |
| `CLIENT_URL` | Exact HTTPS frontend origin(s); comma-separated when multiple origins are required |
| `APP_BASE_URL` | HTTPS public frontend URL used to construct password-reset links and support outstanding legacy verification links |
| `ADMIN_SETUP_EMAIL` | The one pre-authorized email address allowed to complete first-administrator setup |
| `ADMIN_SETUP_SECRET` | Temporary random setup secret required, together with `ADMIN_SETUP_EMAIL`, to create the first administrator; use at least 32 characters and remove it from the host after setup |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | SMTP settings for password-reset messages (`MAIL_*` aliases remain supported for existing deployments) |
Production startup requires a strong JWT secret, exact HTTPS CORS origins, public HTTPS app URL, the authorized administrator email, and SMTP settings. `ADMIN_SETUP_SECRET` is required only while first-admin setup is available. The API refuses to start without a MongoDB connection, and `/api/health` reports ready only when MongoDB is connected. Never commit `.env` files, credentials, verification/reset tokens, or any secret.

## Student registration and login

Registration accepts only `*@student.tce.edu`; the backend assigns the `student` role and creates an active account directly in MongoDB. Registration sends no OTP or verification email. Students sign in with email and password; login never calls a code-generation or email endpoint. `isEmailVerified` is retained for legacy records and verification-link compatibility, but it is not an authentication gate. Inactive accounts remain unable to log in or use authenticated APIs.

Authentication endpoints remain rate limited: registration allows five attempts per hour per client; each login email/IP pair allows ten attempts per 15 minutes, with an additional shared-IP ceiling of 60 login attempts per 15 minutes; password-reset requests allow three attempts per 15 minutes; and first-admin setup allows five attempts per hour. Production multi-instance deployments should use a shared gateway rate-limit store or Redis.

## First administrator setup

When MongoDB contains no administrator and both `ADMIN_SETUP_EMAIL` and `ADMIN_SETUP_SECRET` are configured, the login page exposes Administrator Setup. The request must provide the exact pre-authorized email and setup secret, plus a strong password. Email allowlisting alone is not proof of identity; the separate high-entropy secret prevents an unauthenticated caller from claiming the first-admin slot. The backend compares the secret without exposing it in responses or logs. After successful creation, remove `ADMIN_SETUP_SECRET` from the deployment environment; setup also rejects once an administrator exists. Public student registration always assigns the student role. The database's unique partial admin index is the final guard against concurrent setup attempts. Administrators sign in with email and password only.

Generate a setup secret locally without sharing it, for example from `backend/`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

MongoDB enforces the one-admin maximum with a unique partial index on `role: "admin"`; startup ensures the index exists. If existing Atlas data already contains multiple admins, startup safely fails to create the index and requires manual review rather than changing or deleting accounts.

Every ordinary registration is assigned the `student` role. Profile updates cannot modify roles. Legacy email-verification links can still be redeemed, but are not sent for new registrations. Student skills are self-declared; legacy skill metadata is retained but no longer gates matching or requires administrator review. Existing OTP collections/indexes are not dropped or reset; any old challenge records are left for their existing TTL indexes to expire.

## Deployment

1. Deploy the backend as a Node.js service configured with the production variables above. Continue using the existing Atlas cluster; do not run destructive seed or database-reset operations.
2. Ensure Atlas network access and database-user permissions allow the API host to connect. The application workflows use MongoDB transactions, so deploy on an Atlas replica-set cluster.
3. Run `npm start` from `backend/`. Route `/api` through the deployment's HTTPS reverse proxy to the API.
4. Publish the static frontend over HTTPS. For a separate API host, configure the public URL ending in `/api` in deployed `js/config.js`; for same-origin hosting, retain `/api`. Do not use localhost for production.
5. Set `CLIENT_URL` to the exact frontend origin and `APP_BASE_URL` to the public frontend URL. Configure SMTP and verify password-reset email delivery before launch. Configure `ADMIN_SETUP_SECRET` only during initial administrator creation, then remove it.
6. The API applies in-process request limits to authentication and reset endpoints. Multi-instance deployments should use a shared rate-limit store at the gateway or a shared store such as Redis.

## API surface

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin/login`, legacy-link `POST /api/auth/verify-email`, `GET /api/auth/admin/setup/status`, `POST /api/auth/admin/setup`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me`
- Users: `GET/PUT /api/users/me`, `POST /api/users/me/skills`, `PUT/DELETE /api/users/me/skills/:skillId`
- Projects: `GET /api/projects`, `GET /api/projects/:id`, authenticated create/update/delete at `/api/projects`
- Applicants: authenticated `GET/POST /api/applicants`, `PUT/DELETE /api/applicants/:id`
- Interests: authenticated `GET/POST /api/interests`, `PUT/DELETE /api/interests/:id`
- Discussions: `GET/POST/PUT/DELETE /api/discussions`
- Notifications: authenticated `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
- Administrator monitoring (all routes require an authenticated administrator): `GET /api/admin/overview`, `GET /api/admin/students`, `GET /api/admin/students/:id`, `PATCH /api/admin/students/:id/status`, `DELETE /api/admin/students/:id`, `GET /api/admin/projects`, `GET /api/admin/interests`, `GET /api/admin/discussions`
- Health: `GET /api/health`

The administrator dashboard and monitoring pages read live MongoDB data and expose only the profile/activity fields needed for administration; credentials, hashes, JWTs, and reset tokens are never included. Admins can suspend/reactivate students, remove inappropriate project listings with their application/interest/notification records in a MongoDB transaction, and moderate discussions. Student skill additions, edits, and removals require no administrator review. Monitoring interests does not change their status; project owners retain the existing accept/reject workflow. Student navigation and student dashboard behavior remain distinct from the administrator interface.

Projects require at least one non-empty required skill at both the API and Mongoose validation layers. Skill values are trimmed and duplicates are removed case-insensitively. The API sets new applications to `pending`, derives applicant identity and match percentage from all self-declared skills on the authenticated user, and creates the paired interest and notification in the same MongoDB transaction. The status decision endpoint permits only a pending-to-accepted/rejected transition by the project owner or an administrator. Project deadlines, team capacity, and all-required-skill matching are enforced server-side; projects past their deadline are closed and cannot receive new applications.

## Tests

Run the automated backend tests from `backend/` with:

```bash
npm test
```

The tests cover registration and password-only login, bcrypt hashing/comparison, inactive-account rejection, the first-admin email/secret gate, OTP-route removal, the single-admin index, self-declared skill matching, required-skill validation, deadline rules, admin authorization, MongoDB-derived admin statistics, privacy-safe student summaries, and admin route gating. Before production, also run end-to-end checks against a non-production Atlas database for student/admin registration and login, first-admin setup, password reset, student skill CRUD, moderation cascades, project-application workflows, persistence after restart, and CORS rejection of unlisted origins. Do not use production records for destructive test operations.
