
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Priority = "Low" | "Medium" | "High";

type Task = {
    id: string;
    title: string;
    priority: Priority;
    dueDate: string;
    completed: boolean;
};

type Project = {
    id: string;
    name: string;
    description: string;
    updatedAt: number;
    tasks: Task[];
};

const STORAGE_KEY = "mnemo.projects.v1";

function createId() {
    return crypto.randomUUID();
}

function formatDate(value: string) {
    if (!value) return "No due date";

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [ready, setReady] = useState(false);

    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [showProjectForm, setShowProjectForm] = useState(false);

    const [taskTitle, setTaskTitle] = useState("");
    const [priority, setPriority] = useState<Priority>("Medium");
    const [dueDate, setDueDate] = useState("");

    const [search, setSearch] = useState("");
    const [showCompleted, setShowCompleted] = useState(true);
    const [error, setError] = useState("");

    // Load saved projects from this browser.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed: unknown = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    const valid = parsed.filter(
                        (item): item is Project =>
                            typeof item?.id === "string" &&
                            typeof item?.name === "string" &&
                            typeof item?.description === "string" &&
                            Array.isArray(item?.tasks)
                    );

                    setProjects(valid);

                    if (valid.length > 0) {
                        setSelectedId(valid[0].id);
                    }
                }
            }
        } catch {
            setError("Couldn't read your saved projects.");
        } finally {
            setReady(true);
        }
    }, []);

    // Save changes, but only after the initial load.
    useEffect(() => {
        if (!ready) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch {
            setError("Couldn't save projects in this browser.");
        }
    }, [projects, ready]);

    const selectedProject = projects.find(
        (project) => project.id === selectedId
    );

    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();

        return [...projects]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .filter((project) => {
                return (
                    !query ||
                    project.name.toLowerCase().includes(query) ||
                    project.description.toLowerCase().includes(query) ||
                    project.tasks.some((task) =>
                        task.title.toLowerCase().includes(query)
                    )
                );
            });
    }, [projects, search]);

    const totalTasks = projects.reduce(
        (sum, project) => sum + project.tasks.length,
        0
    );

    const completedTasks = projects.reduce(
        (sum, project) =>
            sum + project.tasks.filter((task) => task.completed).length,
        0
    );

    const visibleTasks =
        selectedProject?.tasks.filter(
            (task) => showCompleted || !task.completed
        ) ?? [];

    function createProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = projectName.trim();
        if (!name) return;

        const project: Project = {
            id: createId(),
            name,
            description: description.trim(),
            updatedAt: Date.now(),
            tasks: [],
        };

        setProjects((current) => [project, ...current]);
        setSelectedId(project.id);
        setProjectName("");
        setDescription("");
        setShowProjectForm(false);
        setError("");
    }

    function addTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const title = taskTitle.trim();
        if (!title || !selectedProject) return;

        const task: Task = {
            id: createId(),
            title,
            priority,
            dueDate,
            completed: false,
        };

        setProjects((current) =>
            current.map((project) =>
                project.id === selectedProject.id
                    ? {
                        ...project,
                        tasks: [task, ...project.tasks],
                        updatedAt: Date.now(),
                    }
                    : project
            )
        );

        setTaskTitle("");
        setPriority("Medium");
        setDueDate("");
        setError("");
    }

    function toggleTask(taskId: string) {
        if (!selectedProject) return;

        setProjects((current) =>
            current.map((project) =>
                project.id === selectedProject.id
                    ? {
                        ...project,
                        updatedAt: Date.now(),
                        tasks: project.tasks.map((task) =>
                            task.id === taskId
                                ? { ...task, completed: !task.completed }
                                : task
                        ),
                    }
                    : project
            )
        );
    }

    function deleteTask(taskId: string) {
        if (!selectedProject) return;

        setProjects((current) =>
            current.map((project) =>
                project.id === selectedProject.id
                    ? {
                        ...project,
                        updatedAt: Date.now(),
                        tasks: project.tasks.filter(
                            (task) => task.id !== taskId
                        ),
                    }
                    : project
            )
        );
    }

    function deleteProject(projectId: string) {
        const project = projects.find((item) => item.id === projectId);
        if (!project) return;

        if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) {
            return;
        }

        const remaining = projects.filter(
            (item) => item.id !== projectId
        );

        setProjects(remaining);

        if (selectedId === projectId) {
            setSelectedId(remaining[0]?.id ?? "");
        }
    }

    return (
        <main className="min-h-dvh bg-[#0b0b0f] text-zinc-100">
            <header className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                        ←
                    </Link>

                    <Link href="/" className="text-lg font-semibold">
                        mnemo<span className="text-violet-400">.</span>
                    </Link>

                    <span className="hidden text-sm text-zinc-500 sm:inline">
                        / Projects &amp; tasks
                    </span>
                </div>

                <Link
                    href="/memories"
                    className="text-xs text-zinc-400 hover:text-white"
                >
                    Memory Library →
                </Link>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-violet-300">
                            Your workspace
                        </p>

                        <h1 className="mt-2 text-3xl font-medium">
                            Projects &amp; tasks
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                            Turn ideas into projects, break them into tasks, and track
                            your progress.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowProjectForm((value) => !value)}
                        className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-200 hover:bg-violet-500/20"
                    >
                        + New project
                    </button>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <Stat label="Projects" value={String(projects.length)} />
                    <Stat label="Total tasks" value={String(totalTasks)} />
                    <Stat
                        label="Completed"
                        value={`${completedTasks} / ${totalTasks}`}
                    />
                </div>

                {showProjectForm && (
                    <form
                        onSubmit={createProject}
                        className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101015] p-5"
                    >
                        <h2 className="text-sm font-medium">Create a project</h2>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="text-xs text-zinc-400">
                                Project name
                                <input
                                    required
                                    maxLength={80}
                                    value={projectName}
                                    onChange={(event) =>
                                        setProjectName(event.target.value)
                                    }
                                    placeholder="e.g. Mnemo hackathon"
                                    className="mt-2 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-400/40"
                                />
                            </label>

                            <label className="text-xs text-zinc-400">
                                Description
                                <input
                                    maxLength={240}
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="What is the goal?"
                                    className="mt-2 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3 text-sm outline-none focus:border-violet-400/40"
                                />
                            </label>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="submit"
                                className="rounded-lg bg-violet-500 px-4 py-2.5 text-xs font-medium hover:bg-violet-400"
                            >
                                Create project
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowProjectForm(false)}
                                className="rounded-lg px-4 py-2.5 text-xs text-zinc-400 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-200">
                        {error}
                    </p>
                )}

                {!ready ? (
                    <p className="mt-10 text-sm text-zinc-500">
                        Loading projects…
                    </p>
                ) : projects.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
                        <div className="text-3xl text-violet-300">◇</div>
                        <h2 className="mt-4 text-lg font-medium">
                            Start with your first project
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                            Create a project for a hackathon, assignment, learning goal,
                            or personal idea. Then break it down into tasks.
                        </p>
                        <button
                            onClick={() => setShowProjectForm(true)}
                            className="mt-5 rounded-xl bg-violet-500 px-4 py-3 text-sm hover:bg-violet-400"
                        >
                            + Create your first project
                        </button>
                    </div>
                ) : (
                    <div className="mt-7 grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <aside className="rounded-2xl border border-white/[0.07] bg-[#101015] p-3">
                            <label className="block px-2 pt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                                Search projects and tasks
                            </label>

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search…"
                                className="mt-2 w-full rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-xs outline-none focus:border-violet-400/40"
                            />

                            <div className="mt-3 space-y-1">
                                {filteredProjects.map((project) => {
                                    const done = project.tasks.filter(
                                        (task) => task.completed
                                    ).length;

                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => setSelectedId(project.id)}
                                            className={`w-full rounded-xl border px-3 py-3 text-left ${selectedId === project.id
                                                    ? "border-violet-300/20 bg-violet-400/[0.08]"
                                                    : "border-transparent hover:bg-white/[0.035]"
                                                }`}
                                        >
                                            <span className="block truncate text-sm">
                                                {project.name}
                                            </span>
                                            <span className="mt-1 block text-[10px] text-zinc-500">
                                                {done}/{project.tasks.length} tasks complete
                                            </span>
                                            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.07]">
                                                <span
                                                    className="block h-full rounded-full bg-violet-400"
                                                    style={{
                                                        width: `${project.tasks.length
                                                                ? (done / project.tasks.length) * 100
                                                                : 0
                                                            }%`,
                                                    }}
                                                />
                                            </span>
                                        </button>
                                    );
                                })}

                                {filteredProjects.length === 0 && (
                                    <p className="px-3 py-4 text-xs text-zinc-500">
                                        No matching projects.
                                    </p>
                                )}
                            </div>
                        </aside>

                        {selectedProject ? (
                            <section className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#101015] p-4 sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-violet-300">
                                            Project workspace
                                        </p>
                                        <h2 className="mt-2 break-words text-2xl font-medium">
                                            {selectedProject.name}
                                        </h2>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-500">
                                            {selectedProject.description || "No description added yet."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => deleteProject(selectedProject.id)}
                                        className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 hover:border-red-400/30 hover:text-red-200"
                                    >
                                        Delete project
                                    </button>
                                </div>

                                <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/15 p-4">
                                    <h3 className="text-sm font-medium">Add a task</h3>

                                    <form onSubmit={addTask} className="mt-3 space-y-3">
                                        <input
                                            required
                                            maxLength={180}
                                            value={taskTitle}
                                            onChange={(event) =>
                                                setTaskTitle(event.target.value)
                                            }
                                            placeholder="What needs to get done?"
                                            className="w-full rounded-lg border border-white/[0.08] bg-[#0b0b0f] px-3 py-3 text-sm outline-none focus:border-violet-400/40"
                                        />

                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <label className="text-xs text-zinc-500">
                                                Priority
                                                <select
                                                    value={priority}
                                                    onChange={(event) =>
                                                        setPriority(event.target.value as Priority)
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0f] px-3 py-2.5 text-xs text-zinc-200"
                                                >
                                                    <option>Low</option>
                                                    <option>Medium</option>
                                                    <option>High</option>
                                                </select>
                                            </label>

                                            <label className="text-xs text-zinc-500">
                                                Due date
                                                <input
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(event) =>
                                                        setDueDate(event.target.value)
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0f] px-3 py-2.5 text-xs text-zinc-200"
                                                />
                                            </label>

                                            <button
                                                type="submit"
                                                className="self-end rounded-lg bg-violet-500 px-4 py-2.5 text-xs font-medium hover:bg-violet-400"
                                            >
                                                + Add task
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-medium">Tasks</h3>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {selectedProject.tasks.filter((task) => task.completed).length}
                                            {" "}of {selectedProject.tasks.length} completed
                                        </p>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                                        <input
                                            type="checkbox"
                                            checked={showCompleted}
                                            onChange={(event) =>
                                                setShowCompleted(event.target.checked)
                                            }
                                            className="accent-violet-400"
                                        />
                                        Show completed
                                    </label>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {visibleTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 sm:px-4"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"
                                                    }`}
                                                className="mt-1 h-4 w-4 accent-violet-400"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`break-words text-sm ${task.completed
                                                            ? "text-zinc-500 line-through"
                                                            : "text-zinc-200"
                                                        }`}
                                                >
                                                    {task.title}
                                                </p>

                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-md border px-2 py-1 text-[10px] ${task.priority === "High"
                                                                ? "border-red-300/20 bg-red-400/[0.06] text-red-200"
                                                                : task.priority === "Medium"
                                                                    ? "border-amber-300/20 text-amber-200"
                                                                    : "border-white/[0.08] text-zinc-400"
                                                            }`}
                                                    >
                                                        {task.priority} priority
                                                    </span>

                                                    <span className="text-[10px] text-zinc-500">
                                                        {formatDate(task.dueDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                aria-label={`Delete ${task.title}`}
                                                className="rounded px-2 py-1 text-zinc-600 hover:bg-white/5 hover:text-white"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                    {visibleTasks.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-white/10 px-4 py-9 text-center">
                                            <p className="text-sm text-zinc-400">
                                                {selectedProject.tasks.length === 0
                                                    ? "No tasks yet"
                                                    : "No tasks to show"}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-600">
                                                Add a task above to get started.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : (
                            <section className="rounded-2xl border border-white/[0.07] bg-[#101015] p-8 text-sm text-zinc-500">
                                Choose a project from the list.
                            </section>
                        )}
                    </div>
                )}

                <p className="mt-8 text-center text-[10px] leading-5 text-zinc-600">
                    Projects are saved in this browser for now. Keep backups of important information.
                </p>
            </div>
        </main>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#101015] p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {label}
            </p>
            <p className="mt-3 text-2xl font-medium">{value}</p>
        </div>
    );
}
