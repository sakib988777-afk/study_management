import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, BookOpenCheck,
  CalendarDays, Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Command,
  Ellipsis, Flame, GraduationCap, LayoutDashboard, ListTodo, Plus, Search,
  Sparkles, Target, X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { api } from './api';
import type { Course, DashboardData, Priority, StudyTask, TaskState } from './types';

type Filter = 'all' | TaskState;
type View = 'Overview' | 'My tasks' | 'Courses' | 'Study planner';

const today = new Date();
const relativeDate = (days: number) => {
  const value = new Date(today);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

const sampleData: DashboardData = {
  courses: [
    { id: 1, name: 'Mathematics', subject: 'Calculus & algebra' },
    { id: 2, name: 'Computer science', subject: 'Algorithms & systems' },
    { id: 3, name: 'Physics', subject: 'Mechanics & waves' },
  ],
  tasks: [
    { id: 1, name: 'Review integration techniques', course_id: 1, course: 'Mathematics', date_deadline: relativeDate(1), priority: '2', state: 'in_progress', notes: '' },
    { id: 2, name: 'Summarize graph algorithms', course_id: 2, course: 'Computer science', date_deadline: relativeDate(2), priority: '1', state: 'todo', notes: '' },
    { id: 3, name: 'Complete wave motion problem set', course_id: 3, course: 'Physics', date_deadline: relativeDate(4), priority: '1', state: 'todo', notes: '' },
    { id: 4, name: 'Read chapter 6: eigenvalues', course_id: 1, course: 'Mathematics', date_deadline: relativeDate(5), priority: '0', state: 'done', notes: '' },
  ],
  sessions: [],
};

const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My tasks', icon: ListTodo },
  { label: 'Courses', icon: BookOpen },
  { label: 'Study planner', icon: CalendarDays },
];

function App() {
  const [data, setData] = useState<DashboardData>(sampleData);
  const [isDemo, setIsDemo] = useState(false);
  const [activeView, setActiveView] = useState<View>('Overview');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.dashboard().then((result) => {
      setData(result);
      setIsDemo(false);
    }).catch(() => setIsDemo(true));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(() => ({
    total: data.tasks.length,
    done: data.tasks.filter((task) => task.state === 'done').length,
    inProgress: data.tasks.filter((task) => task.state === 'in_progress').length,
    remaining: data.tasks.filter((task) => task.state !== 'done').length,
  }), [data.tasks]);

  const visibleTasks = useMemo(() => data.tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.state === filter;
    const matchesQuery = `${task.name} ${task.course}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [data.tasks, filter, query]);

  const changeTaskState = async (task: StudyTask) => {
    const state: TaskState = task.state === 'done' ? 'todo' : 'done';
    setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, state } : item) }));
    try { await api.updateTask(task.id, state); } catch { setIsDemo(true); }
    setToast(state === 'done' ? 'Task completed. Nice work!' : 'Task moved back to your list.');
  };

  const removeTask = async (taskId: number) => {
    setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
    try { await api.deleteTask(taskId); } catch { setIsDemo(true); }
    setToast('Task removed.');
  };

  const addTask = async (values: { name: string; course: Course; date: string; priority: Priority }) => {
    const localTask: StudyTask = {
      id: Date.now(), name: values.name, course_id: values.course.id,
      course: values.course.name, date_deadline: values.date || null,
      priority: values.priority, state: 'todo', notes: '',
    };
    try {
      const saved = await api.createTask({
        name: localTask.name,
        course_id: localTask.course_id,
        date_deadline: localTask.date_deadline,
        priority: localTask.priority,
        notes: localTask.notes,
      });
      setData((current) => ({ ...current, tasks: [saved, ...current.tasks] }));
    } catch {
      setIsDemo(true);
      setData((current) => ({ ...current, tasks: [localTask, ...current.tasks] }));
    }
    setModalOpen(false);
    setToast('Your new task is ready.');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveView('Overview')}>
          <span className="brand-mark"><BookOpenCheck size={20} strokeWidth={2.3} /></span>
          <span>study<span className="brand-light">flow</span><small>YOUR LEARNING SPACE</small></span>
        </a>
        <div className="workspace-label">WORKSPACE <ChevronDown size={13} /></div>
        <div className="workspace-card"><span className="workspace-avatar">S</span><span><b>My studies</b><small>Personal workspace</small></span><Ellipsis size={18} /></div>
        <div className="side-label">MENU</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button className={`nav-item ${activeView === label ? 'active' : ''}`} key={label} onClick={() => setActiveView(label)}>
              <Icon size={18} /><span>{label}</span>{label === 'My tasks' && <span className="nav-count">{counts.remaining}</span>}
            </button>
          ))}
        </nav>
        <div className="side-label course-label">YOUR COURSES <button aria-label="Add course" onClick={() => setToast('Add courses from the Odoo backend.') }><Plus size={15} /></button></div>
        <div className="course-list">
          {data.courses.map((course, index) => <button className="course-nav" key={course.id} onClick={() => { setActiveView('Courses'); setQuery(course.name); }}><span className={`course-dot dot-${index % 4}`} />{course.name}</button>)}
        </div>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><span className="upgrade-icon"><Sparkles size={16} /></span><b>Make study time count</b><p>Small steps every day add up to big things.</p><button onClick={() => setToast('You are doing great—keep your streak going!')}>Explore tips <ArrowRight size={14} /></button></div>
          <button className="nav-item muted-nav" onClick={() => setToast('Help center is coming soon.')}><CircleHelp size={18} /><span>Help & support</span></button>
          <div className="profile"><div className="profile-avatar">S</div><span><b>Student</b><small>Keep learning ✨</small></span><Ellipsis size={18} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><b>{activeView}</b></div>
          <div className="top-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." /><kbd><Command size={11} /> K</kbd></label><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast('You are all caught up!')}><Bell size={18} /><i /></button><div className="top-avatar">S</div></div>
        </header>
        <div className="page-content">
          {isDemo && <div className="connection-banner"><span className="connection-dot" /> Showing preview data — start Odoo to sync your study plan.</div>}
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> MONDAY, SEPTEMBER 28, 2026</div><h1>{activeView === 'Overview' ? 'Your learning, in focus.' : activeView}<span className="wave">✦</span></h1><p>A little progress each day adds up to remarkable results.</p></div>
            <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> New task</button>
          </section>

          <section className="summary-grid" aria-label="Study overview">
            <article className="summary-card focus-card"><div className="card-heading"><span className="summary-icon purple-icon"><Target size={19} /></span><span className="trend positive"><ArrowUpRight size={14} /> 12%</span></div><div className="summary-value">{counts.remaining}<span className="value-unit"> tasks</span></div><div className="summary-caption">Tasks to focus on <span className="caption-note">this week</span></div><div className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article className="summary-card"><div className="card-heading"><span className="summary-icon green-icon"><CheckCheck size={19} /></span><span className="trend positive"><ArrowUpRight size={14} /> 8.4%</span></div><div className="summary-value">{counts.done}<span className="value-unit"> / {counts.total}</span></div><div className="summary-caption">Tasks completed <span className="caption-note">so far</span></div><div className="progress-track"><span style={{ width: `${counts.total ? (counts.done / counts.total) * 100 : 0}%` }} /></div><div className="progress-meta"><span>Weekly goal</span><b>{counts.done} of 8 tasks</b></div></article>
            <article className="summary-card"><div className="card-heading"><span className="summary-icon orange-icon"><Flame size={19} /></span><span className="trend neutral"><ArrowDownRight size={14} /> Let's go</span></div><div className="summary-value">4<span className="value-unit"> days</span></div><div className="summary-caption">Current study streak <span className="caption-note">you're on fire</span></div><div className="streak-days"><span className="day-done">M</span><span className="day-done">T</span><span className="day-done">W</span><span className="day-done">T</span><span className="day-today">F</span><span>S</span><span>S</span></div></article>
          </section>

          <section className="content-grid">
            <article className="panel tasks-panel">
              <div className="panel-header"><div><div className="panel-title-row"><h2>{activeView === 'Courses' ? 'Your courses' : 'Upcoming tasks'}</h2><span className="soft-badge">{visibleTasks.length} tasks</span></div><p>Keep your momentum going</p></div><button className="text-button" onClick={() => { setActiveView('My tasks'); setFilter('all'); }}>View all <ArrowRight size={15} /></button></div>
              <div className="filter-row">{(['all', 'todo', 'in_progress', 'done'] as Filter[]).map((item) => <button key={item} className={`filter-chip ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item === 'all' ? 'All tasks' : item === 'todo' ? 'To do' : item === 'in_progress' ? 'In progress' : 'Completed'}{item === 'all' && <span>{data.tasks.length}</span>}</button>)}</div>
              <div className="task-list">
                {visibleTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} onToggle={() => void changeTaskState(task)} onDelete={() => void removeTask(task.id)} />)}
                {visibleTasks.length === 0 && <div className="empty-state"><span><Check size={20} /></span><b>Nothing on your list</b><p>Try another filter or add a new task.</p></div>}
              </div>
              <button className="add-task-row" onClick={() => setModalOpen(true)}><span><Plus size={16} /></span> Add a task to your plan</button>
            </article>

            <aside className="right-column">
              <article className="panel week-panel"><div className="panel-header compact-header"><div><h2>This week</h2><p>Your study rhythm</p></div><button className="icon-button tiny-button" aria-label="Weekly view options"><Ellipsis size={19} /></button></div><div className="week-chart"><div className="chart-y-labels"><span>4h</span><span>2h</span><span>0h</span></div><div className="chart-main"><div className="chart-grid-lines"><i /><i /><i /></div><div className="chart-bars">{[{ d: 'M', h: 74 }, { d: 'T', h: 48 }, { d: 'W', h: 90 }, { d: 'T', h: 62 }, { d: 'F', h: 36 }, { d: 'S', h: 18 }, { d: 'S', h: 12 }].map((bar, index) => <div className={`chart-day ${index === 4 ? 'today-chart-day' : ''}`} key={`${bar.d}-${index}`}><div className="bar-wrap"><i style={{ height: `${bar.h}%` }} /></div><span>{bar.d}</span></div>)}</div></div></div><div className="chart-footer"><span><i className="legend-dot" /> Study hours</span><b>+2.5h <small>vs last week</small></b></div></article>
              <article className="focus-note"><div className="focus-note-top"><span className="focus-spark"><Sparkles size={16} /></span><span>YOUR DAILY REMINDER</span><Ellipsis size={17} /></div><h3>Progress, not<br />perfection.</h3><p>Showing up for 25 minutes is better than waiting for the perfect time.</p><div className="focus-note-bottom"><span><Clock3 size={14} /> Try a focus session</span><button aria-label="Start focus session" onClick={() => setToast('Focus session started — see you in 25 minutes!')}><ArrowRight size={17} /></button></div><div className="note-decoration">✳</div></article>
            </aside>
          </section>

          <section className="bottom-grid"><div className="bottom-heading"><div><h2>Your courses</h2><p>Pick up where you left off</p></div><button className="text-button" onClick={() => setActiveView('Courses')}>All courses <ArrowRight size={15} /></button></div><div className="course-cards">{data.courses.map((course, index) => <button className={`course-card course-card-${index % 3}`} key={course.id} onClick={() => { setActiveView('Courses'); setQuery(course.name); }}><div className="course-card-top"><span className={`course-art art-${index % 3}`}><GraduationCap size={20} /></span><Ellipsis size={18} /></div><span className="course-tag">{['CORE SUBJECT', 'CURRENTLY LEARNING', 'UP NEXT'][index % 3]}</span><b>{course.name}</b><small>{course.subject || 'Your learning journey'}</small><div className="course-card-progress"><span><i style={{ width: `${[68, 42, 27][index % 3]}%` }} /></span><small>{[68, 42, 27][index % 3]}% complete</small></div></button>)}</div></section>
          <footer className="page-footer"><span>Made for your next big idea <span className="footer-heart">♥</span></span><span><BookOpen size={13} /> One page at a time</span></footer>
        </div>
      </main>
      {modalOpen && <TaskModal courses={data.courses} onClose={() => setModalOpen(false)} onSave={addTask} />}
      {toast && <div className="toast"><span><Check size={15} /></span>{toast}<button aria-label="Dismiss" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: StudyTask; onToggle: () => void; onDelete: () => void }) {
  const dueText = task.date_deadline ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${task.date_deadline}T12:00:00`)) : 'No due date';
  return <div className={`task-row ${task.state === 'done' ? 'task-complete' : ''}`}><button className={`task-check ${task.state === 'done' ? 'checked' : ''}`} onClick={onToggle} aria-label={task.state === 'done' ? 'Mark as to do' : 'Mark as completed'}>{task.state === 'done' && <Check size={13} />}</button><div className="task-info"><b>{task.name}</b><div className="task-meta"><span className="task-course-dot" />{task.course}<span className="meta-divider">·</span><span><CalendarDays size={12} /> {dueText}</span></div></div><span className={`priority-label priority-${task.priority}`}>{task.priority === '2' ? 'High' : task.priority === '0' ? 'Low' : 'Normal'}</span><button className="task-more" onClick={onDelete} aria-label="Delete task"><Ellipsis size={18} /></button></div>;
}

function TaskModal({ courses, onClose, onSave }: { courses: Course[]; onClose: () => void; onSave: (values: { name: string; course: Course; date: string; priority: Priority }) => void }) {
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? 0);
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<Priority>('1');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const course = courses.find((item) => item.id === courseId);
    if (course && name.trim()) onSave({ name: name.trim(), course, date, priority });
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="task-modal" onSubmit={submit}><div className="modal-heading"><div><span className="modal-icon"><ListTodo size={19} /></span><h2>Create a task</h2><p>Make a little room for progress.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><label className="field-label">Task name<input autoFocus required maxLength={120} placeholder="e.g. Review lecture notes" value={name} onChange={(event) => setName(event.target.value)} /></label><div className="form-two-col"><label className="field-label">Course<select value={courseId} onChange={(event) => setCourseId(Number(event.target.value))}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label><label className="field-label">Due date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><label className="field-label">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="0">Low</option><option value="1">Normal</option><option value="2">High</option></select></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Plus size={17} /> Add task</button></div></form></div>;
}

export default App;