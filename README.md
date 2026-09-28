# Studyflow — Study Management

A personal study planner with a React + TypeScript web app and an Odoo 18 backend. The Odoo addon stores courses, tasks, and study sessions; a small local REST API connects the dashboard to Odoo.

## Run the complete stack (recommended)

Install and start Docker Desktop, then open PowerShell in this folder and run:

```powershell
docker compose up --build
```

The first startup downloads the Odoo, PostgreSQL, and Node images and can take a few minutes. When the services are ready, open:

- Web app: <http://localhost:5173>
- Odoo backend: <http://localhost:8069>

The Odoo app initializes the `study_management` database and installs the `study_management` addon automatically. Sample courses and tasks are loaded on first install. To stop the stack, press Ctrl+C and run `docker compose down`; to remove local database data too, run `docker compose down -v`.

## Run the web app without Docker

Install Node.js 20+ and run:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. If Odoo is not running, the UI uses preview data so you can explore the interface; changes in preview mode are kept only for the current browser session.

## Backend and API

The custom Odoo addon is in `backend/addons/study_management`. It defines `study.course`, `study.task`, and `study.session` models, sample records, user access controls, and these HTTP endpoints:

- `GET /study/api/dashboard`
- `POST /study/api/tasks`
- `PATCH /study/api/tasks/<id>`
- `DELETE /study/api/tasks/<id>`

The Vite development server proxies `/study/api` to Odoo. The API currently uses Odoo's public user for a local demo; do not expose this development configuration to the internet. Add authentication, authorization, HTTPS, and strong database/master passwords before any shared or production deployment. Change the example passwords in `docker-compose.yml` and `backend/config/odoo.conf` for your environment.

## Project layout

```text
backend/
  addons/study_management/   Odoo models, sample data, access rules, and API
  config/odoo.conf
frontend/
  src/                       React dashboard, API client, and styles
docker-compose.yml           PostgreSQL + Odoo + Vite web app
```