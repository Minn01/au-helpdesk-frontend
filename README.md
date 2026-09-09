# AU HelpDesk — Internal Campus IT Ticketing System

BAD 541 — Systems Integration Project 1

HelpDesk is a web-based internal IT support platform for university students, faculty, IT technicians, and administrators. Users sign in with their existing university Microsoft account, submit a ticket describing a technical problem, and track it through to resolution. Incoming tickets are classified automatically by an AI service, routed into a technician queue, and resolved through a claim → investigate → resolve workflow with a full audit trail.

- **Live system:** https://minthant-bad2026.eastasia.cloudapp.azure.com/helpdesk
- **Repository:** https://github.com/Minn01/au-helpdesk-frontend
- **Team:** Aung Myint Myat (6611906), Soe Min Min Latt (6611938), Min Thant (6612012)


---

## Features

**Students and faculty**
- Sign in with a university Microsoft Active Directory account — no separate HelpDesk password.
- Create a ticket with a title, description, location, and optional file attachments.
- Choose a category, or select *Not sure — detect automatically* and let the AI classifier decide.
- Track ticket status, comment with the assigned technician, and edit or cancel their own `OPEN` tickets.

**Technicians**
- Filter the shared queue of unassigned tickets and claim work.
- Concurrency-safe claiming: two technicians cannot claim the same ticket.
- Progress tickets through the lifecycle, override the AI classification, and communicate with the requester.
- Pull EduCore registration diagnostics on demand for Course Registration tickets.

**Administrators**
- Dashboard with ticket counts by status and priority, unassigned volume, and technician workload.
- Paginated search across all tickets; assign or reassign technicians.
- Manage categories (create, rename, enable/disable) and manage user roles and account status.

**Ticket lifecycle**

```
OPEN → CLAIMED → IN_PROGRESS → RESOLVED → CLOSED
OPEN → CANCELLED          (owning requester only)
```

Priorities are `LOW`, `MEDIUM`, `HIGH`, `URGENT`. Requesters never set priority themselves — it is recommended by the classifier and adjustable by technicians and admins. Every state change is recorded as a `TicketActivity` entry.

---

## Architecture overview

The whole application is served from a single hardened Linux VPS behind Nginx. Nginx terminates TLS and mounts HelpDesk under the `/helpdesk` path prefix so it coexists with the pre-existing `/content` (WordPress) and `/api` (lab) routes on the same domain.

```
                    ┌──────────────────────────────────────────┐
   Browser ───TLS──▶│  Nginx  (Let's Encrypt, reverse proxy)   │
                    │                                          │
                    │  /content   → WordPress    (unchanged)   │
                    │  /api       → Lab API      (unchanged)   │
                    │  /helpdesk  → React static build         │
                    │  /helpdesk/api → Express  (prefix strip) │
                    └───────────────────┬──────────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │  Express REST API     │
                            │  controller → service │
                            │  → Prisma / integr.   │
                            └───┬───────────────┬───┘
                                │               │
                     ┌──────────▼───┐   ┌───────▼─────────────────────┐
                     │ PostgreSQL   │   │ Microsoft Entra ID (AD)     │
                     │ via Prisma   │   │ OpenAI  (classification)    │
                     └──────────────┘   │ Supabase Storage (files)    │
                                        │ Azure Key Vault (secrets)   │
                                        │ EduCore peer API (x-api-key)│
                                        └─────────────────────────────┘
```

**Request flow for a new ticket**

1. The browser POSTs to `/helpdesk/api/tickets` with the `helpdesk_session` HttpOnly cookie.
2. Nginx strips the `/helpdesk` prefix and proxies to Express on `127.0.0.1:5050`.
3. Auth middleware verifies the JWT session and loads the internal `User`; RBAC middleware checks the role.
4. If the requester chose `AUTO_DETECT`, the classification service calls OpenAI, which returns a suggested category, priority, and short summary.
5. Prisma writes the `Ticket` plus its opening `TicketActivity` row inside a transaction.
6. The ticket appears in the technician queue.

**Layering rule.** Route handlers never call OpenAI, Supabase, EduCore, or Key Vault directly. Controllers delegate to domain services, and domain services delegate to Prisma or a dedicated integration service. Configuration is resolved once at startup through a single config module.

---

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma (schema + migrations) |
| Identity | Microsoft Azure Active Directory (OAuth2 / OIDC) |
| Authorization | JWT session cookie + role-based access control |
| AI | OpenAI API (ticket classification) |
| File storage | Supabase Storage (private bucket, signed URLs) |
| Secrets | Azure Key Vault |
| Container / deploy | Docker + Docker Compose |
| Reverse proxy | Nginx |
| TLS | Let's Encrypt (Certbot) |
| Host | Linux VPS on Microsoft Azure |
| Peer integration | REST + static `x-api-key` |

---

## Repository structure

```
.
├── frontend/                 # React + Vite client (base path /helpdesk/)
│   ├── src/
│   │   ├── api/              # the only place that talks HTTP
│   │   │   ├── http.client.ts        # fetch wrapper, credentials, ApiError
│   │   │   ├── api.config.ts         # base URL + mock-mode flag
│   │   │   ├── api.adapters.ts       # backend DTO → UI type
│   │   │   ├── auth.api.ts  requester.api.ts
│   │   │   ├── tickets.api.ts  technician.api.ts  admin.api.ts
│   │   │   ├── categories.api.ts  comments.api.ts
│   │   │   ├── attachments.api.ts  users.api.ts  educore.api.ts
│   │   ├── components/       # layout, route guards, ticket UI
│   │   ├── contexts/         # AuthContext
│   │   ├── pages/            # Dashboard, MyTickets, TicketForm, Details, …
│   │   └── types/
│   └── vite.config.ts
├── backend/                  # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── config/           # Azure Key Vault loader
│       ├── middleware/       # auth, RBAC, peer API key, errors
│       ├── routes/  controllers/  services/
│       └── integrations/     # openai, supabase, educore
├── docker-compose.yml
├── deploy.sh
└── README.md
```

Components never call `fetch` directly. Every network call goes through a module in `src/api/`, which keeps the UI decoupled from backend response envelopes.

---

## Data model

Managed entirely by Prisma migrations against PostgreSQL.

| Entity | Purpose |
|---|---|
| `User` | Internal HelpDesk account linked to a Microsoft AD object ID. Holds role and active flag. |
| `Category` | Admin-managed relational data (not an enum), with an active/inactive flag. |
| `Ticket` | Ticket number, title, description, location, status, priority, category, creator, current assignee, AI fields, timestamps. |
| `TicketAssignment` | Claim and assignment history, so reassignment is auditable rather than overwriting one column. |
| `Comment` | Ticket-scoped messages between requester and technician. |
| `Attachment` | File metadata only — filename, storage path, MIME type, size, uploader. Binaries live in Supabase Storage. |
| `TicketActivity` | Append-only audit timeline: creation, classification, claim, assignment, status/priority/category change, resolution, cancellation. |

AI fields on `Ticket`: `aiSuggestedCategory`, `aiSuggestedPriority`, `aiSummary`, plus a classification origin of `USER_SELECTED`, `AI_SUGGESTED`, or `TECHNICIAN_OVERRIDE`.

Run `npx prisma studio` from `backend/` to browse the live schema.

---

## Authentication and RBAC

Identity and authorization are deliberately separate concerns.

1. `GET /helpdesk/api/auth/microsoft` redirects the browser to Microsoft.
2. The user authenticates against the university tenant.
3. Microsoft redirects to `GET /helpdesk/api/auth/microsoft/callback`.
4. The backend validates the response, finds or creates the internal `User`, resolves the HelpDesk role, signs its own JWT, and sets it as an **HttpOnly, Secure, SameSite** cookie named `helpdesk_session`.
5. The browser is redirected back into the SPA. `GET /auth/me` restores the session on reload.

The token is never readable by JavaScript. Every frontend request sends `credentials: "include"`. A `401` clears client auth state and returns the user to `/login`.

**Roles:** `STUDENT`, `FACULTY`, `TECHNICIAN`, `ADMIN`.

| Capability | STUDENT / FACULTY | TECHNICIAN | ADMIN |
|---|---|---|---|
| Create ticket | ✅ | — | — |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets | — | queue + assigned | ✅ |
| Claim ticket | — | ✅ | — |
| Change status / classification | — | ✅ | ✅ |
| Assign or reassign technician | — | — | ✅ |
| Manage categories | — | — | ✅ |
| Manage users and roles | — | — | ✅ |

Frontend route guards control presentation only. **Every rule above is enforced again in backend middleware** — the client is never a security boundary.

---

## Secrets management (Azure Key Vault)

No production secret is stored in a `.env` file, in the image, or in the repository. On startup the backend authenticates to the class Azure Key Vault with `DefaultAzureCredential` and fetches every secret through one configuration module, which the rest of the codebase reads from.

```ts
// backend/src/config/keyvault.ts
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const client = new SecretClient(process.env.AZURE_KEY_VAULT_URL!, new DefaultAzureCredential());
const read = async (name: string) => (await client.getSecret(name)).value!;
```

Secrets fetched at runtime:

| Key Vault secret | Used for |
|---|---|
| `helpdesk-database-url` | PostgreSQL connection string for Prisma |
| `helpdesk-jwt-secret` | Signing the HelpDesk session JWT |
| `helpdesk-openai-api-key` | OpenAI classification calls |
| `helpdesk-azure-ad-client-secret` | Microsoft AD OAuth2 exchange |
| `helpdesk-supabase-service-role-key` | Signed URLs for private attachments |
| `helpdesk-educore-outbound-key` | The key EduCore issued to us |
| `helpdesk-peer-inbound-key` | The key we issued to EduCore |

The only environment variables in production are the ones needed to *reach* the vault: `AZURE_KEY_VAULT_URL`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`. Local development may use a `.env` file; production must not.

---

## External integration (OpenAI)

When a ticket is submitted with the *detect automatically* intent, the description is sent to the OpenAI API, which returns a suggested category, priority, and one-line summary. This removes most manual triage before a technician ever opens the queue.

Example — a user submits *"My laptop cannot connect to the university Wi-Fi."* → classified as **Network**, priority **MEDIUM**, with a short summary stored on the ticket.

The classification is **advisory, never authoritative**. Technicians and admins can override category and priority at any time via `PATCH /tickets/:id/classification`, and the override is recorded in the activity timeline with origin `TECHNICIAN_OVERRIDE`. If OpenAI is unavailable or returns an unusable response, ticket creation still succeeds and the ticket falls back to the default category — the AI call is never on the critical path for the requester.

All OpenAI calls happen in `backend/src/integrations/openai`. The browser never receives or uses the API key.

---

## Peer API documentation

Our peer team is **EduCore — University Course Registration Backend**. The relationship is bidirectional and both directions are authenticated with a static `x-api-key` header. Neither system ever accepts the other's end-user session.

### Endpoint we expose to EduCore

```http
POST /helpdesk/api/peer/tickets
x-api-key: <key HelpDesk issued to EduCore>
Content-Type: application/json
```

**What it does.** When EduCore detects that a student's course registration failed for a technical or system reason, it calls this endpoint to open a support ticket on the student's behalf. The student does not have to notice the failure and report it manually.

Request body:

```json
{
  "studentEmail": "student@university.edu",
  "courseCode": "CS401",
  "registrationStatus": "FAILED",
  "failureReason": "System error while processing registration",
  "attemptedAt": "2026-08-28T03:45:00.000Z",
  "eventId": "evt_a1b2c3"
}
```

Response `201`:

```json
{ "ticket": { "id": "…", "ticketNumber": "HD-000127", "status": "OPEN" } }
```

The request is authenticated by API key only. The key is generated by us, issued to EduCore out of band, stored in Azure Key Vault, and verified by a dedicated middleware that runs before the route handler. A missing or wrong key returns `401`. The created ticket is attributed to the student and lands in the normal technician queue like any other.

### Endpoint we consume from EduCore

```http
GET https://<educore-domain>/api/registrations/:eventId
x-api-key: <key EduCore issued to HelpDesk>
```

**What we fetch.** When a technician or admin opens a **Course Registration** ticket, the ticket detail page offers a *Load registration context* action. That hits our own endpoint:

```http
GET /helpdesk/api/tickets/:ticketId/educore-context
```

which, server-side, calls EduCore with our issued key and returns a normalized payload:

```json
{
  "context": {
    "studentId": "S123",
    "courseCode": "CS401",
    "registrationStatus": "FAILED",
    "failureReason": "System error while processing registration",
    "attemptedAt": "2026-08-28T03:45:00.000Z",
    "additionalContext": { "term": "2026/1", "attemptNumber": 2 }
  }
}
```

This gives the technician the affected course, registration status, failure reason, and attempt details without leaving HelpDesk.

**Design notes.**
- React never holds a peer API key and never calls EduCore directly. All peer traffic is server-to-server.
- The lookup is lazy — nothing is fetched until a technician asks for it — and the panel is only offered on Course Registration tickets.
- Peer failures degrade gracefully into distinct, safe error codes rather than breaking the ticket page: `EDUCORE_CONTEXT_NOT_AVAILABLE`, `EDUCORE_CONTEXT_NOT_FOUND`, `EDUCORE_UNAVAILABLE`, `EDUCORE_AUTH_FAILED`, `EDUCORE_INVALID_RESPONSE`.
- Fields from the peer payload are filtered before display; anything resembling a key, token, secret, or internal identifier is dropped.
- The peer integration lives behind its own service. The core `Ticket` model is not coupled to EduCore-specific columns.

---

## API reference

All paths are relative to `/helpdesk/api`. Unless noted, requests are authenticated with the `helpdesk_session` cookie and authorized by role.

### Auth

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/auth/microsoft` | public | Begin Microsoft sign-in |
| GET | `/auth/microsoft/callback` | public | OAuth2 callback; issues session cookie |
| GET | `/auth/me` | any | Current user; `401` if no valid session |
| POST | `/auth/logout` | any | Clear the session cookie |

### Tickets — requester

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tickets/mine` | Student, Faculty | Own tickets; supports `search`, `status`, `priority`, `category`, `sort`, `pageSize` |
| POST | `/tickets` | Student, Faculty | Create a ticket (`categoryId` or `categoryIntent: "AUTO_DETECT"`) |
| GET | `/tickets/:id` | owner, Technician, Admin | Ticket with comments, attachments, activity |
| PATCH | `/tickets/:id` | owner | Edit own `OPEN` ticket |
| POST | `/tickets/:id/cancel` | owner | Cancel own `OPEN` ticket |
| GET | `/tickets/:id/comments` | participants | List comments |
| POST | `/tickets/:id/comments` | participants | Add a comment |

### Tickets — technician

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tickets/queue` | Technician | Unassigned queue with filters |
| GET | `/tickets/assigned` | Technician | Tickets assigned to the caller |
| POST | `/tickets/:id/claim` | Technician | Claim — concurrency-safe |
| POST | `/tickets/:id/start` | Technician | → `IN_PROGRESS` |
| POST | `/tickets/:id/resolve` | Technician | → `RESOLVED` |
| PATCH | `/tickets/:id/classification` | Technician, Admin | Override category and/or priority |
| GET | `/tickets/:id/educore-context` | Technician, Admin | Peer registration context |

### Attachments

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/tickets/:id/attachments` | participants | `multipart/form-data`, field `files` |
| GET | `/tickets/:id/attachments/:attachmentId/url` | participants | Short-lived signed URL |
| DELETE | `/tickets/:id/attachments/:attachmentId` | uploader, Admin | Remove attachment |

### Categories and users

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/categories` | any | Active categories |
| GET | `/users/technicians` | Admin | Technician list for assignment |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Counts by status and priority, unassigned volume, technician workload, recent tickets |
| GET | `/admin/tickets` | Paginated search — `search`, `status`, `priority`, `category`, `assignedTechnicianId`, `sort`, `page`, `pageSize` |
| GET | `/admin/tickets/:id` | Full ticket detail |
| POST | `/admin/tickets/:id/assign` | Assign or reassign — body `{ technicianId }` |
| GET / POST | `/admin/categories` | List / create |
| PATCH | `/admin/categories/:id` | Rename or re-describe |
| POST | `/admin/categories/:id/enable` \| `/disable` | Toggle active state |
| GET | `/admin/users` | List — `search`, `role`, `active` |
| PATCH | `/admin/users/:id` | Change role or active state |

### Peer (API key, no session)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/peer/tickets` | `x-api-key` | EduCore opens a ticket for a failed registration |

**Error envelope.** Failures return `{ "error": "CODE", "message": "Human readable", "details": … }`. `401` means no valid session, `403` means authenticated but not permitted.

---

## Local setup

### Prerequisites

- Node.js 20+ and pnpm
- PostgreSQL (local or Supabase)
- Docker and Docker Compose (optional locally, required for deployment)
- An Azure AD app registration, an OpenAI API key, and access to the class Key Vault

### 1. Clone

```sh
git clone https://github.com/Minn01/au-helpdesk-frontend.git
cd au-helpdesk-frontend
```

### 2. Backend

```sh
cd backend
pnpm install
cp .env.example .env        # local development only
npx prisma migrate dev      # create schema
pnpm dev                    # http://127.0.0.1:5050
```

`backend/.env` for local work:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/helpdesk"
JWT_SECRET="local-development-only"
PORT=5050
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_REDIRECT_URI="http://localhost:5173/helpdesk/api/auth/microsoft/callback"
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
EDUCORE_BASE_URL=
EDUCORE_API_KEY=             # key EduCore issued to us
PEER_INBOUND_API_KEY=        # key we issued to EduCore
```

In production every value above is replaced by an Azure Key Vault lookup; only the four `AZURE_*` vault-access variables are set on the host.

### 3. Frontend

```sh
cd frontend
pnpm install
pnpm dev                    # http://localhost:5173/helpdesk/
```

`frontend/.env`:

```env
VITE_USE_MOCK_API=false
VITE_BACKEND_ORIGIN=http://127.0.0.1:5050
# VITE_API_BASE_URL=/api
```

The Vite dev server proxies `/api` and `/helpdesk/api` to `VITE_BACKEND_ORIGIN`, so the browser always sees same-origin URLs and the session cookie behaves exactly as it does in production. The API base URL defaults to `/api` in development and `/helpdesk/api` in production builds; `VITE_API_BASE_URL` overrides either.

Setting `VITE_USE_MOCK_API=true` runs the UI against in-memory fixtures for isolated frontend demos. It is never used in production and the app never silently falls back to it.

### 4. Checks

```sh
pnpm lint
pnpm build
```

---

## Deployment

The application runs on a hardened Linux VPS on Azure: UFW restricted to 22/80/443, SSH key-only authentication, automatic security updates, and the application running as a non-root user.

### Docker Compose

```sh
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

Or run the automated script:

```sh
./deploy.sh
```

### Nginx

HelpDesk is mounted under a distinct path prefix and does not touch the existing `/content` and `/api` routes.

```nginx
# React static build
location /helpdesk/ {
    alias /var/www/helpdesk/;
    try_files $uri $uri/ /helpdesk/index.html;
}

# Express API — prefix stripped before proxying
location /helpdesk/api/ {
    proxy_pass http://127.0.0.1:5050/api/;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Because Nginx strips `/helpdesk` before proxying, Express routes are defined without the prefix. The frontend is built with Vite `base: "/helpdesk/"` so all asset URLs resolve correctly under the subpath.

### TLS

```sh
sudo certbot --nginx -d minthant-bad2026.eastasia.cloudapp.azure.com
```

Certificates renew automatically via the Certbot systemd timer. HTTP is redirected to HTTPS, and the session cookie is issued with `Secure` and `SameSite`, so the application only works over TLS.

---

## Requirement coverage

| Course requirement | Where it is implemented |
|---|---|
| Hardened Linux VPS | Azure Linux VPS — UFW, SSH key-only, non-root service user |
| Nginx reverse proxy + Let's Encrypt, distinct URL path | `/helpdesk` and `/helpdesk/api` location blocks; `/content` and `/api` untouched |
| Node.js (Express) REST API | `backend/src` |
| Relational DB via Prisma with migrations | PostgreSQL, `backend/prisma/schema.prisma`, `prisma/migrations` |
| JWT auth + RBAC + Microsoft AD | `/auth/microsoft` OAuth2 flow, `helpdesk_session` JWT cookie, role middleware |
| Azure Key Vault, no production `.env` | `backend/src/config` — all secrets fetched at runtime |
| External 3rd-party API | OpenAI ticket classification |
| Peer API — expose | `POST /helpdesk/api/peer/tickets`, protected by an `x-api-key` we issued to EduCore |
| Peer API — consume | EduCore registration lookup via `GET /helpdesk/api/tickets/:id/educore-context` |
| GitHub repository | https://github.com/Minn01/au-helpdesk-frontend |
| Automated deployment | `docker-compose.yml` and `deploy.sh` |

---
