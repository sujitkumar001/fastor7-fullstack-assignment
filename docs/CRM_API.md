# CRM REST API Documentation

Base URL: `http://localhost:5000`

## Employee Registration

`POST /api/auth/register`

```json
{
  "name": "Test Counselor",
  "email": "counselor@example.com",
  "password": "SecurePassword123!"
}
```

Expected success: HTTP 201 with employee information and JWT.

## Employee Login

`POST /api/auth/login`

```json
{
  "email": "counselor@example.com",
  "password": "SecurePassword123!"
}
```

Expected success: HTTP 200 with JWT.

## Current Employee

`GET /api/auth/me`

Header:

`Authorization: Bearer YOUR_JWT`

## Public Student Enquiry

`POST /api/enquiries`

No authentication required.

```json
{
  "studentName": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "course": "Full Stack Development",
  "message": "Interested in course details."
}
```

Expected success: HTTP 201.

## List Unclaimed Leads

`GET /api/enquiries/unclaimed`

Requires JWT.

Returns enquiries where `claimed_by IS NULL`.

## Claim Lead

`PATCH /api/enquiries/:id/claim`

Requires JWT.

Possible responses:

- `200`: Lead successfully claimed
- `400`: Invalid enquiry ID
- `401`: Authentication required or invalid token
- `404`: Enquiry not found
- `409`: Lead already claimed

Claiming uses an atomic SQL UPDATE to ensure only one counselor can claim a lead.

## My Claimed Leads

`GET /api/enquiries/mine`

Requires JWT.

Returns only enquiries where `claimed_by` equals the authenticated employee ID.

## Authentication

For protected routes, supply:

```text
Authorization: Bearer YOUR_JWT
```

## Data Privacy

Public enquiries are visible to authenticated counselors only while unclaimed.

Once claimed, an enquiry is removed from the shared list and accessible through the claiming counselor's private list.

## Automated Tests

Run:

```bash
npm test
```

The test suite covers authentication, validation, database connectivity, enquiry submission, lead claiming, competing claims, and counselor isolation.