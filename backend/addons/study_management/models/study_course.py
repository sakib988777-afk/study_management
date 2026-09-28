from odoo import fields, models


class StudyCourse(models.Model):
    _name = "study.course"
    _description = "Study Course"
    _order = "name"

    name = fields.Char(required=True)
    subject = fields.Char()
    color = fields.Integer(default=1)
    active = fields.Boolean(default=True)
    task_ids = fields.One2many("study.task", "course_id", string="Tasks")
    session_ids = fields.One2many("study.session", "course_id", string="Sessions")