
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Memory = {
    id: string;
    content: string;
    category?: string;
    createdAt?: string | number;
};

const CATEGORIES = [
    "Projects",
    "Goals",
    "People",
    "Preferences",
    "Learning",
    "Other",
];

export default function MemoriesPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Other");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadMemories = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/memories", { cache: "no-store" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Couldn't load your memories.");
            }

            // Support either a plain array or an object containing a memory array.
            const entries = Array.isArray(data)
                ? data
                : Array.isArray(data.memories)
                    ? data.memories
                    : Array.isArray(data.items)
                        ? data.items
                        : [];

            setMemories(entries);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Couldn't load your memories."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMemories();
    }, [loadMemories]);

    const filteredMemories = useMemo(() => {
        const term = search.trim().toLowerCase();

        return memories.filter((memory) => {
            const text = memory.content ?? "";
            const label = memory.category ?? "Other";

            return (
                !term ||
                text.toLowerCase().includes(term) ||
                label.toLowerCase().includes(term)
            );
        });
    }, [memories, search]);

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedContent = content.trim();
        if (!trimmedContent || saving) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/memories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: trimmedContent,
                    category,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Couldn't save that memory.");
            }

            setContent("");
            setNotice("Memory saved.");
            await loadMemories();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Couldn't save that memory."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(memory: Memory) {
        const confirmed = window.confirm(
            "Delete this saved memory? This cannot be undone."
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `/api/memories?id=${encodeURIComponent(memory.id)}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: memory.id }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Couldn't delete that memory.");
            }

            setNotice("Memory deleted.");
            await loadMemories();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Couldn't delete that memory."
            );
        }
    }

    function formatDate(value?: string | number) {
        if (value === undefined || value === null || value === "") {
            return "Saved memory";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "Saved memory";

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    return (
        <main className="min-h-dvh bg-[#0b0b0f] text-zinc-100">
            <header className="flex h-[68px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
                        ✳
                    </div>
                    <span className="text-[17px] font-semibold tracking-tight">
                        mnemo<span className="text-violet-400">.</span>
                    </span>
                </Link>

                <Link
                    href="/"
                    className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                >
                    ← Back to chat
                </Link>
            </header>

            <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
                <div className="mb-9 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300/80">
                            Your second brain
                        </p>
                        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                            Memory Library
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                            Save important facts, ideas, goals, and project notes for Mnemo
                            to refer to later.
                        </p>
                    </div>

                    <div className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-right sm:block">
                        <p className="text-2xl font-medium tabular-nums">{memories.length}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                            Saved memories
                        </p>
                    </div>
                </div>

                {(error || notice) && (
                    <div
                        className={`mb-5 rounded-xl border px-4 py-3 text-xs leading-5 ${error
                                ? "border-red-400/20 bg-red-400/[0.06] text-red-200"
                                : "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200"
                            }`}
                    >
                        {error || notice}
                    </div>
                )}

                <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[#121218] p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/[0.1] text-lg text-violet-300">
                            ＋
                        </div>
                        <div>
                            <h2 className="text-sm font-medium">Save a memory</h2>
                            <p className="mt-1 text-xs text-zinc-500">
                                Add something you want to keep available.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-xs text-zinc-400">
                                What should Mnemo remember?
                            </span>
                            <textarea
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                rows={3}
                                maxLength={3000}
                                required
                                placeholder="Example: I'm building Mnemo for an AI hackathon. The current stack is Next.js, TypeScript, and Nebius Token Factory."
                                className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-300/30"
                            />
                        </label>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <label className="block sm:w-56">
                                <span className="mb-2 block text-xs text-zinc-400">
                                    Category
                                </span>
                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className="w-full rounded-xl border border-white/[0.09] bg-[#191920] px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-300/30"
                                >
                                    {CATEGORIES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                type="submit"
                                disabled={!content.trim() || saving}
                                className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {saving ? "Saving…" : "Save memory"}
                            </button>
                        </div>
                    </form>
                </section>

                <section>
                    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-base font-medium">Your saved memories</h2>
                            <p className="mt-1 text-xs text-zinc-500">
                                Browse, search, or remove anything you no longer need.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 sm:w-64 sm:flex-none">
                                <span className="text-zinc-600">⌕</span>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search memories"
                                    aria-label="Search memories"
                                    className="min-w-0 flex-1 bg-transparent py-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
                                />
                            </div>
                            <button
                                onClick={() => void loadMemories()}
                                disabled={loading}
                                className="rounded-xl border border-white/[0.08] px-3 py-3 text-xs text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                            >
                                ↻
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-white/[0.07] p-10 text-center text-sm text-zinc-500">
                            Loading memories…
                        </div>
                    ) : filteredMemories.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-14 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-xl text-zinc-500">
                                ▤
                            </div>
                            <p className="text-sm font-medium text-zinc-300">
                                {memories.length === 0
                                    ? "Your library is ready."
                                    : "No matching memories."}
                            </p>
                            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                                {memories.length === 0
                                    ? "Save your first memory above. You can keep useful details about projects, goals, and preferences here."
                                    : "Try a different search term, or clear your search."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredMemories.map((memory) => (
                                <article
                                    key={memory.id}
                                    className="group flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]"
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <span className="rounded-lg border border-violet-300/15 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-violet-200">
                                            {memory.category || "Other"}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">
                                            {formatDate(memory.createdAt)}
                                        </span>
                                    </div>

                                    <p className="flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                                        {memory.content}
                                    </p>

                                    <div className="mt-5 flex justify-end border-t border-white/[0.06] pt-3">
                                        <button
                                            onClick={() => void handleDelete(memory)}
                                            className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-red-400/[0.08] hover:text-red-200"
                                        >
                                            Delete memory
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <p className="mt-10 text-center text-[10px] leading-5 text-zinc-600">
                    Keep sensitive information such as passwords, API keys, and banking
                    details out of your memory library.
                </p>
            </div>
        </main>
    );
}
