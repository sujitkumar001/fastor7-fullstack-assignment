# Fastor7 Full Stack Developer Assignment

A full-stack recruitment assignment comprising a React restaurant discovery application and a Node.js CRM REST API.

## Projects

### 1. React Restaurant Discovery Application

A responsive React application integrated with Fastor staging APIs.

Features:
- Mobile-number authentication
- OTP request and six-digit OTP verification
- JWT-based authentication
- Restaurant discovery and listing
- Restaurant search and cuisine filtering
- Restaurant details view
- Responsive mobile and desktop layout
- Loading, error, and empty states
- Fallback UI for unavailable restaurant images

**Tech stack:** React 19, Vite 7, JavaScript, CSS.

### 2. Node.js CRM REST API

An Express REST API for student enquiries and counselor lead management.

Features:
- Employee registration and login
- Password hashing with bcrypt
- JWT-protected employee endpoints
- Public student enquiry submission without authentication
- Shared list of unclaimed enquiries
- Atomic lead claiming to prevent duplicate ownership
- Private list of enquiries claimed by the logged-in counselor
- PostgreSQL persistence
- Input validation, error handling, and integration tests

**Tech stack:** Node.js 20, Express, PostgreSQL, JWT, bcryptjs, Zod, Vitest, Supertest.

## Repository Structure

```text
fastor7-fullstack-assignment/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── validators/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── api/
│   ├── .env.example
│   └── package.json
├── docs/
│   └── CRM_API.md
└── README.md
```

## Prerequisites

- Node.js 20 or later
- npm
- PostgreSQL
- Git

## Backend Setup

1. Create a PostgreSQL database named `fastor_crm`.
2. Create a database user with access to the database.
3. Open the `backend` directory.
4. Install dependencies:

```bash
npm install
```

5. Copy `.env.example` to `.env`.
6. Set your database credentials and a strong JWT secret.
7. Apply the schema:

```bash
psql -U fastor_app -d fastor_crm -f src/config/schema.sql
```

Use your configured PostgreSQL username if different from `fastor_app`.

8. Start the backend:

```bash
npm run dev
```

Default backend address:

`http://localhost:5000`

Health check:

`GET http://localhost:5000/api/health`

## Frontend Setup

1. Open the `frontend` directory.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` if you need to configure the Fastor staging API URL.
4. Start the frontend:

```bash
npm run dev
```

5. Open the local URL shown by Vite, normally:

`http://localhost:5173`

The React application communicates with the Fastor staging APIs.

## React API Workflow

1. Request OTP: `POST /v1/pwa/user/register`
2. Verify OTP: `POST /v1/pwa/user/login`
3. Fetch restaurants: `GET /v1/m/restaurant?city_id=118`

API base URL:

`https://staging.fastor.ai`

The supplied Postman collection documents `123456` as the default test OTP.

Restaurant requests use the JWT returned from the login API.

## CRM API Endpoints

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Service health |
| POST | `/api/auth/register` | Public | Register employee |
| POST | `/api/auth/login` | Public | Employee login |
| GET | `/api/auth/me` | JWT | Current employee |
| POST | `/api/enquiries` | Public | Submit student enquiry |
| GET | `/api/enquiries/unclaimed` | JWT | List unclaimed leads |
| PATCH | `/api/enquiries/:id/claim` | JWT | Claim a lead |
| GET | `/api/enquiries/mine` | JWT | List own claimed leads |

For request examples, see [CRM API Documentation](docs/CRM_API.md).

## Testing

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

At the final local verification, the backend passed 27 automated tests, and the frontend passed ESLint and production build checks.

## Lead Claiming and Privacy

The CRM uses an atomic PostgreSQL UPDATE operation that claims a lead only if it is currently unclaimed.

If two counselors attempt to claim the same lead, only one succeeds.

Claimed leads are removed from the shared unclaimed list and appear only in the claiming counselor's private list.

## Security

- JWT authentication for protected CRM endpoints
- Password hashing
- Parameterized SQL queries
- Input validation
- Environment-based secrets
- Private `.env` files excluded from Git
- Recovery backups excluded from Git

## Assignment References

- [Fastor React API Postman Collection](https://www.postman.com/lunar-sunset-956052/workspace/react-task/collection/8878133-877a3a64-7f42-4f37-bdbe-00c428296471)
- [Fastor React Figma Design](https://www.figma.com/file/cTAq6FteBYR3MDbh4feptK/Mobile-App-Design-Task)

Note: The supplied Figma file was unavailable during implementation, so the frontend uses a custom responsive design rather than claiming an exact Figma reproduction.

## Author

Pulakala Sujit Kumar

GitHub: https://github.com/sujitkumar001