import json

from odoo import http
from odoo.http import request


class StudyManagementController(http.Controller):
    """Small REST API consumed by the local React development server."""

    def _json(self, payload, status=200):
        response = request.make_response(
            json.dumps(payload),
            headers=[("Content-Type", "application/json; charset=utf-8")],
        )
        response.status_code = status
        return response

    def _task_payload(self, task):
        return {
            "id": task.id,
            "name": task.name,
            "course_id": task.course_id.id,
            "course": task.course_id.name,
            "date_deadline": fields_date(task.date_deadline),
            "priority": task.priority,
            "state": task.state,
            "notes": task.notes or "",
        }

    @http.route("/study/api/dashboard", type="http", auth="public", methods=["GET"], csrf=False)
    def dashboard(self, **kwargs):
        Task = request.env["study.task"].sudo()
        Course = request.env["study.course"].sudo()
        tasks = Task.search([])
        courses = Course.search([("active", "=", True)])
        sessions = request.env["study.session"].sudo().search([], limit=5, order="date_start desc")
        return self._json({
            "tasks": [self._task_payload(task) for task in tasks],
            "courses": [{"id": course.id, "name": course.name, "subject": course.subject or ""} for course in courses],
            "sessions": [{
                "id": session.id,
                "name": session.name,
                "course": session.course_id.name,
                "date_start": fields_date(session.date_start),
                "duration": session.duration,
            } for session in sessions],
        })

    @http.route("/study/api/tasks", type="http", auth="public", methods=["POST"], csrf=False)
    def create_task(self, **kwargs):
        data = request.httprequest.get_json(silent=True) or {}
        if not data.get("name") or not data.get("course_id"):
            return self._json({"error": "Task name and course are required."}, status=400)
        try:
            task = request.env["study.task"].sudo().create({
                "name": str(data["name"]).strip(),
                "course_id": int(data["course_id"]),
                "date_deadline": data.get("date_deadline") or False,
                "priority": str(data.get("priority", "1")),
                "state": "todo",
                "notes": data.get("notes", ""),
            })
        except (TypeError, ValueError):
            return self._json({"error": "Invalid course or task details."}, status=400)
        return self._json(self._task_payload(task), status=201)

    @http.route("/study/api/tasks/<int:task_id>", type="http", auth="public", methods=["PATCH"], csrf=False)
    def update_task(self, task_id, **kwargs):
        data = request.httprequest.get_json(silent=True) or {}
        task = request.env["study.task"].sudo().browse(task_id).exists()
        if not task:
            return self._json({"error": "Task not found."}, status=404)
        allowed = {key: data[key] for key in ("name", "date_deadline", "priority", "state", "notes") if key in data}
        if "state" in allowed and allowed["state"] not in {"todo", "in_progress", "done"}:
            return self._json({"error": "Invalid task state."}, status=400)
        task.write(allowed)
        return self._json(self._task_payload(task))

    @http.route("/study/api/tasks/<int:task_id>", type="http", auth="public", methods=["DELETE"], csrf=False)
    def delete_task(self, task_id, **kwargs):
        task = request.env["study.task"].sudo().browse(task_id).exists()
        if not task:
            return self._json({"error": "Task not found."}, status=404)
        task.unlink()
        return self._json({"ok": True})


def fields_date(value):
    return value.isoformat() if value else None