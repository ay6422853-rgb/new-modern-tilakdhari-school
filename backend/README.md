# School Management Backend — MERN

Node.js + Express + MongoDB/Mongoose backend for a single-school management system.

## Setup
1. Install/start local MongoDB.
2. Copy `.env.example` to `.env` and adjust values.
3. `npm install`
4. `npm run seed`
5. `npm run dev`

API: `http://localhost:4000/api`
Health: `GET /api/health`

Demo accounts (all password `Admin@123`):
- principal@school.local
- accountant@school.local
- operator@school.local
- teacher@school.local
- parent@school.local

## Core flow
Registration -> registration payment/receipt -> admission -> admission payment/receipt -> active student -> student credentials.

## Notes
Local standalone MongoDB does not require a replica set for this version. For production, use a replica set/managed MongoDB, strong JWT secret, HTTPS, backups and real credentials.
