# School Management Frontend — MERN / MongoDB

React + Vite frontend for the Node/Express/Mongoose school backend.

## Folder structure

src/pages/
- public/
- principal/
- accountant/
- operator/
- teacher/
- parent/
- student/

Each panel has its own actual page files and routes.

## Run

1. Ensure MongoDB backend is running on port 4000.
2. `npm install`
3. `copy .env.example .env`
4. `npm run dev`

VITE_API_URL defaults to `http://localhost:4000/api`.
