
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";


type Memory = {
    id: string;
    content: string;
    category: string;
    createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "memories.json");

async function readMemories(): Promise<Memory[]> {
    await mkdir(dataDirectory, { recursive: true });

    try {
        const raw = await readFile(dataFile, "utf8");
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Memory[]) : [];
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function saveMemories(memories: Memory[]) {
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(dataFile, JSON.stringify(memories, null, 2), "utf8");
}

export async function GET() {
    try {
        return NextResponse.json({ memories: await readMemories() });
    } catch {
        return NextResponse.json(
            { error: "Could not load memories." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const content =
            typeof body.content === "string" ? body.content.trim() : "";
        const category =
            typeof body.category === "string" ? body.category.trim() : "General";

        if (!content || content.length > 1000) {
            return NextResponse.json(
                { error: "Memory must contain 1–1000 characters." },
                { status: 400 }
            );
        }

        const memory: Memory = {
            id: randomUUID(),
            content,
            category: category.slice(0, 40) || "General",
            createdAt: new Date().toISOString(),
        };

        const memories = await readMemories();
        memories.unshift(memory);
        await saveMemories(memories);

        return NextResponse.json({ memory }, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Could not save the memory." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (typeof id !== "string" || !id) {
            return NextResponse.json(
                { error: "A memory ID is required." },
                { status: 400 }
            );
        }

        const memories = await readMemories();
        const updated = memories.filter((memory) => memory.id !== id);

        if (updated.length === memories.length) {
            return NextResponse.json(
                { error: "Memory not found." },
                { status: 404 }
            );
        }

        await saveMemories(updated);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Could not delete the memory." },
            { status: 500 }
        );
    }
}
