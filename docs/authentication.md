# Authentication Architecture

## Overview
The Candidate Ranking System implements a complete authentication and authorization flow using JWT (JSON Web Tokens), MongoDB, and a Zustand-based frontend state management system. 

It supports two distinct roles:
- **User (Candidate)**: Can manage their profile, upload resumes, and view their application status.
- **Recruiter**: Has premium access to the ranking engine, recruiter copilot, candidate comparison, and analytics features.

## Architecture

1. **Frontend (React + Zustand + React Router)**:
   - State is managed via `useAuthStore` (persisted in `localStorage`).
   - Private routes are guarded by `<ProtectedRoute>`, `<RecruiterRoute>`, and `<UserRoute>` wrappers.
   - The API Client (`client.ts`) uses Axios interceptors to automatically inject the JWT `Authorization: Bearer <token>` header into every outgoing request.
   - The interceptor globally handles `401 Unauthorized` responses by automatically logging the user out and redirecting them to `/login`.

2. **Backend (Flask + PyMongo + PyJWT + Bcrypt)**:
   - Authentication routes (`/signup`, `/login`) are isolated within the `auth_bp` Blueprint.
   - A singleton MongoDB connection is established in `api/db.py`.
   - Passwords are securely hashed via bcrypt.
   - The `@require_auth(allowed_roles=[...])` decorator securely parses and validates the JWT signature, enforcing role-based access control without interfering with the underlying business logic.

## MongoDB Schema
A dedicated `users` collection tracks user credentials and profiles:

```json
{
  "_id": ObjectId("..."),
  "full_name": "Alex Rivera",
  "email": "alex@example.com",
  "password_hash": "$2b$12$...",
  "role": "recruiter",
  "profile_picture": "https://api.dicebear.com/...",
  "phone": "",
  "company": "Antigravity",
  "is_verified": false,
  "is_active": true,
  "created_at": ISODate("..."),
  "updated_at": ISODate("..."),
  "last_login": ISODate("...")
}
```

## JWT Flow
- **Generation**: Issued by `/login` or `/signup` valid for 24 hours.
- **Storage**: Kept in the frontend's `localStorage` (key: `recruiter_auth_token`).
- **Validation**: Enforced via `@require_auth` using the `JWT_SECRET` environment variable.

## Role Permissions
- **Public Routes**: Landing page (`/`), Authentication (`/login`, `/signup`, `/forgot-password`), Demo page.
- **Recruiter Routes**: Dashboard, JD Analysis, Candidate Profiles, Copilot, Analytics, Admin, Launch Center.
- **User Routes**: User Profile, Resume Upload, User Dashboard.

## Backward Compatibility
Existing endpoints remain completely functional. Authentication decorators are isolated and modular. The default system configuration does not mandate authentication for the `/rank` endpoint directly unless explicitly guarded, allowing existing machine-to-machine tests and integration scripts to run unabated if needed.
