# HelpDesk Project Agent Guide

Read this durable project context before changing code, then verify it against the repository because implementation state evolves. Keep this file current when architecture, commands, or requirements materially change.

## Product and central workflow

HelpDesk is a university Internal Campus IT Ticketing System replacing scattered support by email/messages with a structured workflow for Wi-Fi, hardware, printers, Microsoft accounts, software, classroom equipment, and course-registration technical issues.

The ticket is the central domain object. Comments, attachments, assignments, status changes, AI suggestions, and activity history belong to it.

```text
University user signs in → creates ticket → system/AI assists classification
→ ticket enters technician queue → technician claims or is assigned
→ technician investigates and communicates → ticket is resolved and closed
```

## Complete planned system

This university systems-integration project must eventually demonstrate:

- React + TypeScript + Vite + Tailwind frontend.
- Node.js + Express + TypeScript REST API.
- PostgreSQL with Prisma migrations; Supabase-hosted PostgreSQL is currently planned.
- Microsoft university Azure Active Directory identity, HelpDesk JWT/session handling, and backend-enforced RBAC.
- OpenAI classification, Supabase Storage attachments, and Azure Key Vault production secrets.
- Bidirectional EduCore peer REST integration protected by `x-api-key`.
- Linux Azure VPS, Docker Compose or automated deployment, Nginx, Let's Encrypt HTTPS, and GitHub source control.

The public application belongs under `/helpdesk`; public APIs conceptually use `/helpdesk/api/...`. Microsoft entry and callback URLs are `/helpdesk/api/auth/microsoft` and `/helpdesk/api/auth/microsoft/callback`. Nginx may strip the prefix before proxying, so do not force internal Express routes to hard-code `/helpdesk` everywhere.

Final topology:

```text
Browser → HTTPS/Nginx → frontend and Express API under /helpdesk
→ Prisma → PostgreSQL

Express → Microsoft AD, OpenAI, Supabase Storage, Azure Key Vault
Express ↔ EduCore peer API
```

## What exists now

- This repository is frontend-only: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, and pnpm.
- The frontend includes typed in-memory mock data services, Microsoft-only authentication, protected/role-aware routing, an authenticated responsive shell, and complete Student/Faculty, Technician, and Admin workflows.
- Phase 4 connects Student/Faculty auth, tickets, categories, and comments to the real backend through `src/api/http.client.ts` and DTO adapters. Real API mode is the default; session-memory mocks require the explicit `VITE_USE_MOCK_API=true` option and production must never silently fall back to them.
- Phase 5 connects the Technician Dashboard, queue, assigned tickets, shared ticket details/comments, concurrency-safe claiming, lifecycle actions, and classification overrides to the real backend. Admin functions remain explicit later-phase failures in real API mode.
- Phase 6 connects the Admin Dashboard, paginated ticket search/filter/detail and assignment, active/inactive category management, and HelpDesk user role/status management to the real backend.
- Phase 7 connects Microsoft sign-in through backend redirects, restores the HttpOnly-cookie session through `/auth/me`, and displays safe callback errors.
- The attachment frontend uses a two-step ticket-create/upload flow, private short-lived signed URLs, and role-aware upload/removal controls through `attachments.api.ts`.
- Technician/Admin ticket details lazily retrieve normalized EduCore registration context through the HelpDesk backend for Course Registration tickets; React never handles peer API keys or calls EduCore directly.
- Authentication uses backend-managed Microsoft Azure AD redirects for every role, and the sidebar is the single authenticated identity/logout surface.
- Ticket creation supports a real category choice or `AUTO_DETECT` submission intent. Mock classification records the resolved relational category and its origin; no real AI call occurs.
- Attachments are uploaded through the backend multipart API and displayed from safe ticket-detail metadata; private files are opened with fresh signed URLs.
- Tailwind is imported in `src/index.css` and configured through `@tailwindcss/vite`.

## Do not implement yet

Unless the user explicitly starts a future phase, do not add Express, Prisma, PostgreSQL, Supabase uploads, OpenAI calls, Key Vault, real Microsoft OAuth, real technician claim concurrency, admin CRUD, deployment machinery, or persistent fake storage. Never call OpenAI from React or expose database, service-role, peer, or other secret credentials to the browser.

Keep dependencies minimal. Preserve pnpm, strict TypeScript/linting conventions, and unrelated user work. Avoid over-abstraction and large component libraries.

## Authentication and authorization

Microsoft will prove identity. HelpDesk will then find/create its internal `User`, determine the HelpDesk role, and issue/maintain its own JWT/session. Identity and authorization are separate.

The current backend session is carried only in the `helpdesk_session` HttpOnly cookie. Every frontend API request must use `credentials: "include"`; JavaScript must never attempt to read or persist the session token. A 401 clears frontend auth state and returns the user to `/login`.

Roles are `STUDENT`, `FACULTY`, `TECHNICIAN`, and `ADMIN`. The backend must eventually enforce RBAC. Frontend guards only control presentation and are never security boundaries. Current `AuthContext` exposes `user`, `isAuthenticated`, `isLoading`, Microsoft sign-in redirect, and `logout()`; unauthenticated protected routes redirect to `/login`.

## Roles and ownership

- Student/Faculty: create tickets; view only their tickets/details/history; comment; attach files; edit or cancel their own `OPEN` tickets; track progress.
- Technician (future): filter the available queue; claim unassigned tickets; see assigned tickets; communicate; adjust category/priority; progress and resolve tickets.
- Admin (future): see all tickets; assign/reassign technicians; manage users/technicians and categories; inspect queues, workload, and basic statistics.

Technician self-claiming is normal; admin assignment is secondary. A successful claim changes an unassigned `OPEN` ticket to assigned/`CLAIMED` and adds it to My Assigned Tickets. Backend claims must be concurrency-safe so two technicians cannot claim one ticket.

Role-aware navigation:

- Student/Faculty: Dashboard, My Tickets, Create Ticket.
- Technician: Dashboard, Ticket Queue, My Assigned Tickets.
- Admin: Dashboard, Tickets, Categories, Users / Technicians.

## Ticket lifecycle and domain

Statuses: `OPEN`, `CLAIMED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED`.

```text
OPEN → CLAIMED → IN_PROGRESS → RESOLVED → CLOSED
OPEN → CANCELLED (owning Student/Faculty only)
```

Keep frontend edit/cancel rules at own `OPEN` tickets unless requirements change. Do not invent transitions.

Planned entities are `User`, `Category`, `Ticket`, `Comment`, `TicketAssignment`, `Attachment`, and `TicketActivity`. Do not freeze the final Prisma schema before backend requirements are reviewed.

- `Category` is relational database data, not an enum; admins will manage it.
- A ticket has a human-readable number, creator, title/description, category, priority, status, location, current assignee where appropriate, timestamps, and optional AI fields.
- `TicketAssignment` may be required for claim/assignment history; do not assume a single `assignedTechnicianId` is sufficient.
- Comments are ticket-scoped REST communication, not a separate real-time chat system.
- `TicketActivity` is the audit timeline for creation, classification, claims, assignments/reassignments, status/priority/category changes, resolution, cancellation, and similar events.

## AI classification and category origin

OpenAI is a real future backend integration. It may inspect a ticket description and advise category, priority, and a short summary through fields such as `aiSuggestedCategory`, `aiSuggestedPriority`, and `aiSummary`.

AI is advisory, never final authority. Technicians/admins can override category and priority. Student/Faculty users never select priority.

Category creation UX must offer:

- `Not sure — detect automatically` (submission intent, not a database Category)
- Current categories fetched from the category service

If a user selects a category, preserve it unless later business rules explicitly change. If they choose auto-detect, the backend will classify it. Preserve classification origin where useful—for example `USER_SELECTED`, `AI_SUGGESTED`, or `TECHNICIAN_OVERRIDE`—without treating origin as the Category itself. Frontend mocks may simulate this behavior, but all real OpenAI calls belong in a backend AI/classification service.

Priorities are `LOW`, `MEDIUM`, `HIGH`, and `URGENT`; the future backend assigns/recommends them automatically for requesters.

## Attachments and secrets

Future attachment path:

```text
Frontend → Express → private Supabase Storage bucket
                   → PostgreSQL/Prisma attachment metadata
```

Use a private `ticket-attachments` bucket and paths like `tickets/<ticket-id>/<generated-name>-screenshot.png`. PostgreSQL stores metadata such as ticket ID, filename, storage path, type, size, and upload timestamp—not file binaries. Never expose `SUPABASE_SERVICE_ROLE_KEY` to React.

Local backend development may use `.env`. Production secrets (`DATABASE_URL`, `JWT_SECRET`, OpenAI/Supabase/peer/Microsoft credentials) come from Azure Key Vault through a centralized configuration layer, not scattered direct access. Key Vault does not belong in this frontend repository.

## EduCore peer integration

EduCore is a student course-registration backend. Communication is bidirectional REST with static `x-api-key` authentication; do not invent permanent endpoint names prematurely.

- HelpDesk exposes a peer API so EduCore can automatically create a ticket when registration fails for a technical/system reason, avoiding duplicate manual reports.
- HelpDesk consumes EduCore context—affected course, registration status, failure reason, and useful technical details—when technicians investigate registration tickets.

Keep this behind a peer-integration service. Do not tightly couple the core Ticket model to EduCore-specific fields.

## Service boundaries

Frontend modules remain `auth.api.ts`, `tickets.api.ts`, `categories.api.ts`, and `comments.api.ts`; components never fetch directly. `http.client.ts` centralizes the configurable base URL, JSON, `credentials: "include"`, AbortSignal support, and normalized `ApiError`. Local defaults are same-origin `/api` through the Vite proxy; production defaults to `/helpdesk/api`; `VITE_API_BASE_URL` can override either. DTO adapters isolate backend names/envelopes from UI types.

Phase 6 connects Student/Faculty, Technician, and Admin endpoints. Admin DTO/query adapters live behind the existing Promise-based API modules; real API mode never falls back to mock production data. Use `VITE_USE_MOCK_API=true` only for isolated frontend demonstrations.

Future backend boundaries should cover auth, tickets, categories, comments, attachments, AI/classification, peer integrations, and configuration/secrets. Prefer controller → domain service → Prisma/integration services. Do not scatter OpenAI, Storage, EduCore, or Key Vault calls through route handlers.

## Current frontend routes and quality bar

- `/login`: university Microsoft sign-in presentation and safe callback-error guidance.
- `/dashboard`: summary counts, recent tickets, requester CTA.
- `/tickets`: own tickets with search, filters, sort, responsive table/cards.
- `/tickets/new`: title, description, manual/auto category, location, prototype attachments, async feedback, redirect.
- `/tickets/:ticketId`: metadata, description, attachments, conversation, activity, eligible edit/cancel.
- `/tickets/:ticketId/edit`: own `OPEN` tickets only.
- Technician/Admin destinations use the same Promise-based service boundary as requester pages and are connected to their production backend APIs.

Every data-driven page needs loading, empty, and error states. Controls need labels, keyboard access, visible focus, and sufficient contrast. Never communicate status/priority by color alone. Use professional internal-university styling: neutral, compact, readable, responsive, restrained borders/radii and animation; avoid decorative gradients and generic SaaS excess.

## Incremental roadmap

Broad order: frontend product/UI → database/Prisma design → Microsoft auth + JWT/RBAC → REST ticket APIs → technician workflow → AI classification → attachments → admin → peer API → Key Vault → Docker/VPS/Nginx/HTTPS. The order may evolve; describing a future phase does not authorize implementing it.

## Review and verification

Before changes, read this file and relevant source/config/types, run `git status --short`, preserve unrelated edits, and trace UI data through API modules to mocks.

Review priorities:

1. Broken behavior, data loss, ownership/RBAC mistakes, route guards, unsafe claim transitions.
2. Service-boundary violations, leaked secrets, or contracts hostile to future REST integration.
3. Lifecycle, classification-origin, assignment-history, loading/error/empty, and async-state correctness.
4. Accessibility, responsive behavior, validation, maintainability, and visual consistency.

After frontend implementation run:

```sh
pnpm lint
pnpm build
```

When browser tooling is available, test desktop/mobile and mock role navigation, protected routes, filters, create/redirect, manual and auto-detected categories, details, comments/activity, OPEN-only edit, confirmed cancellation, and logout. Reviews report findings first by severity with file/line references, distinguish defects from assumptions, and name testing gaps when no findings exist.

## Current frontend definition of done

A Student can complete the requester journey; a Technician can filter/claim/progress/resolve assigned work; and an Admin can inspect/assign tickets and manage mock categories and application users. All state changes go through Promise-based service modules, create activity history where relevant, pass lint/build, and remain replaceable by the future REST API.
