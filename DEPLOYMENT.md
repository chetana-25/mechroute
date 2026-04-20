# MechRoute Deployment Guide

## Production Readiness Summary

MechRoute is now close to deployment-ready.

What is already in place:
- PostgreSQL is configured through `DATABASE_URL`
- Passwords are hashed with `bcryptjs`
- Registration endpoints return success responses
- Partner and driver records are stored in PostgreSQL
- A safe debug endpoint exists at `GET /debug/users`
- Frontend API base is configurable through `window.MECHROUTE_API_BASE`
- Backend CORS can be configured with `CORS_ORIGIN` or `CLIENT_ORIGIN`

What still needs to be set for production:
- Production environment variables on your host
- A production database URL
- A deployed frontend base URL or runtime config for `window.MECHROUTE_API_BASE`

## 1. Backend Deployment

### Recommended platforms
- Render
- Railway

### Backend environment variables
Set these in your backend host:
- `PORT` = platform-provided port or `3000`
- `DATABASE_URL` = production PostgreSQL connection string
- `JWT_SECRET` = strong random secret
- `PGSSL` = `true` for managed cloud PostgreSQL, otherwise `false`
- `CORS_ORIGIN` = your frontend domain, for example `https://your-frontend.netlify.app`

### Deploy steps
1. Push the project to GitHub.
2. Create a new backend service on Render or Railway.
3. Connect the GitHub repository.
4. Set the environment variables above.
5. Ensure the start command is `npm start`.
6. Deploy and open the backend URL.

### Backend health checks
After deploy, verify:
- `GET /api/health` returns `{ ok: true, database: 'connected' }`
- `GET /debug/users` returns only safe fields and no passwords

## 2. Database Deployment

### Recommended platform
- Render PostgreSQL
- Railway PostgreSQL

### Database steps
1. Create a managed PostgreSQL instance.
2. Copy the connection string into `DATABASE_URL`.
3. Run the schema file against the production database:
   - `db/schema.sql`
4. Confirm the `users` table exists.

### Important
Do not use local-only credentials in production:
- Replace any local `postgres:postgres@localhost` values
- Use the cloud connection string only

## 3. Frontend Deployment

### Recommended platforms
- Netlify
- Vercel

### Frontend configuration
Set the API base URL at runtime with:
- `window.MECHROUTE_API_BASE = 'https://your-backend.onrender.com'`

If the frontend and backend are served from the same domain, the client can use the current origin automatically.

### Deploy steps
1. Deploy the static frontend site.
2. Add the backend URL to the page configuration.
3. Confirm the frontend can call the backend over HTTPS.
4. Test registration and login from the deployed UI.

## 4. Production Checks

### Backend
- No direct localhost dependency in browser API config
- All routes use env-based database and JWT settings
- CORS is restricted to the deployed frontend domain
- Errors return JSON with safe messages

### Database
- `DATABASE_URL` points to managed PostgreSQL
- `PGSSL=true` if required by the provider
- No plaintext passwords are stored

### Frontend
- API base is configurable
- No hardcoded `localhost:3000` required in production
- UI is served over HTTPS

## 5. Deployment Validation Checklist

1. Open the deployed frontend.
2. Register a new driver account.
3. Confirm the backend logs show DB insert success.
4. Confirm the database contains the new user row.
5. Register a new partner account.
6. Confirm the partner email matches the formal format: `first.last.partner@mechroute.com`.
7. Verify `/api/health` returns success on the deployed backend.
8. Verify `/debug/users` returns only safe fields.

## 6. Notes

- The debug endpoints are useful for development, but you may want to disable or protect them further in a public production release.
- For stronger security, rotate the JWT secret before production deployment.
- Consider adding rate limiting and stricter auth checks for public endpoints.
