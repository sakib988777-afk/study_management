from odoo import fields, models


class StudySession(models.Model):
    _name = "study.session"
    _description = "Study Session"
    _order = "date_start desc"

    name = fields.Char(required=True)
    course_id = fields.Many2one("study.course", required=True, ondelete="cascade")
    date_start = fields.Datetime(required=True, default=fields.Datetime.now)
    duration = fields.Float(string="Duration (hours)", default=1.0)
    notes = fields.Text()