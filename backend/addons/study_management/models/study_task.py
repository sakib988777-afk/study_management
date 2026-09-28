from odoo import fields, models


class StudyTask(models.Model):
    _name = "study.task"
    _description = "Study Task"
    _order = "date_deadline asc, id desc"

    name = fields.Char(required=True)
    course_id = fields.Many2one("study.course", required=True, ondelete="cascade")
    date_deadline = fields.Date()
    priority = fields.Selection(
        [("0", "Low"), ("1", "Normal"), ("2", "High")],
        default="1",
        required=True,
    )
    state = fields.Selection(
        [("todo", "To do"), ("in_progress", "In progress"), ("done", "Done")],
        default="todo",
        required=True,
    )
    notes = fields.Text()