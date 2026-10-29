"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Sparkles,
  Brain,
  Zap,
  Cpu,
  Check,
  Copy,
  Bookmark,
  Mic,
  MicOff,
  Send,
  Plus,
  Search,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  HelpCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

export type Priority = "Low" | "Medium" | "High";

export type Message = {
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp?: number;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export type StoredTask = {
  id: string;
  title: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
};

export type StoredProject = {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  tasks: StoredTask[];
};

export type AgentAction =
  | {
      type: "create_task";
      projectId: string;
      projectName: string;
      task: {
        title: string;
        priority: Priority;
        dueDate: string;
      };
    }
  | {
      type: "set_task_completed";
      projectId: string;
      projectName: string;
      taskId: string;
      taskTitle: string;
      completed: boolean;
    }
  | {
      type: "update_task";
      projectId: string;
      projectName: string;
      taskId: string;
      taskTitle: string;
      updates: {
        title?: string;
        priority?: Priority;
        dueDate?: string;
      };
    };

export type PendingAction = {
  chatId: string;
  action: AgentAction;
};

export type ModelOption = {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: typeof Sparkles;
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "nvidia/Nemotron-3-Ultra-550b-a55b",
    name: "Nemotron 3 Ultra (550B)",
    tagline: "Flagship Deep Reasoning",
    badge: "550B Ultra",
    badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    description: "NVIDIA's flagship 550B reasoning model. Best for high-level strategy, multi-step planning, and deep project synthesis.",
    icon: Brain,
  },
  {
    id: "nvidia/Nemotron-3_5-Lightning",
    name: "Nemotron 3.5 Lightning",
    tagline: "Sub-Second Ultra Fast",
    badge: "Lightning",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "High-speed conversational model for rapid everyday checks, quick tasks, and instantaneous replies.",
    icon: Zap,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super (120B)",
    tagline: "Balanced Powerhouse",
    badge: "120B Super",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    description: "Great balance of reasoning depth and fast execution across complex developer workflows.",
    icon: Cpu,
  },
  {
    id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    name: "Nemotron 3 Nano (30B)",
    tagline: "Lightweight Edge Efficiency",
    badge: "30B Nano",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    description: "Efficient architecture for quick categorization and minimal latency operations.",
    icon: Layers,
  },
];

const CHATS_KEY = "mnemo.chats.v1";
const ACTIVE_CHAT_KEY = "mnemo.activeChat.v1";
const PROJECTS_KEY = "mnemo.projects.v1";
const MODEL_KEY = "mnemo.model.v1";

function makeChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function makeTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, " ");
  return cleaned.length > 36 ? `${cleaned.slice(0, 36)}…` : cleaned;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPriority(value: unknown): value is Priority {
  return value === "Low" || value === "Medium" || value === "High";
}

function readStoredProjects(): StoredProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): StoredProject[] => {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        !Array.isArray(item.tasks)
      ) {
        return [];
      }

      const tasks = item.tasks.flatMap((task): StoredTask[] => {
        if (
          !isRecord(task) ||
          typeof task.id !== "string" ||
          typeof task.title !== "string" ||
          !isPriority(task.priority) ||
          typeof task.dueDate !== "string" ||
          typeof task.completed !== "boolean"
        ) {
          return [];
        }

        return [
          {
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate,
            completed: task.completed,
          },
        ];
      });

      return [
        {
          id: item.id,
          name: item.name,
          description:
            typeof item.description === "string" ? item.description : "",
          updatedAt:
            typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
          tasks,
        },
      ];
    });
  } catch {
    return [];
  }
}

function isAgentAction(value: unknown): value is AgentAction {
  if (
    !isRecord(value) ||
    typeof value.projectId !== "string" ||
    typeof value.projectName !== "string"
  ) {
    return false;
  }

  if (value.type === "create_task") {
    return (
      isRecord(value.task) &&
      typeof value.task.title === "string" &&
      value.task.title.trim().length > 0 &&
      isPriority(value.task.priority) &&
      typeof value.task.dueDate === "string"
    );
  }

  if (value.type === "set_task_completed") {
    return (
      typeof value.taskId === "string" &&
      typeof value.taskTitle === "string" &&
      typeof value.completed === "boolean"
    );
  }

  if (value.type === "update_task") {
    if (
      typeof value.taskId !== "string" ||
      typeof value.taskTitle !== "string" ||
      !isRecord(value.updates)
    ) {
      return false;
    }

    const updates = value.updates;
    return (
      (updates.title === undefined ||
        (typeof updates.title === "string" && updates.title.trim().length > 0)) &&
      (updates.priority === undefined || isPriority(updates.priority)) &&
      (updates.dueDate === undefined || typeof updates.dueDate === "string") &&
      Object.keys(updates).length > 0
    );
  }

  return false;
}

function looksLikeTaskAction(message: string): boolean {
  const text = message.toLowerCase();
  const mentionsTask = /\b(tasks?|task list|priority|deadline|due date)\b/.test(text);
  const asksToCreate =
    /\b(add|create|make)\b/.test(text) &&
    /\b(task|to-do|todo)\b/.test(text);
  const asksToComplete =
    /\b(mark|set)\b/.test(text) &&
    /\b(done|complete|completed|unfinished|incomplete)\b/.test(text) &&
    mentionsTask;
  const asksToUpdate =
    /\b(update|edit|change|reschedule|set)\b/.test(text) && mentionsTask;

  return asksToCreate || asksToComplete || asksToUpdate;
}

function describeAgentAction(action: AgentAction): string {
  if (action.type === "create_task") {
    return (
      `Create “${action.task.title}” in “${action.projectName}” ` +
      `with ${action.task.priority} priority` +
      (action.task.dueDate ? ` and due date ${action.task.dueDate}` : "") +
      "."
    );
  }

  if (action.type === "set_task_completed") {
    return (
      `${action.completed ? "Mark" : "Reopen"} “${action.taskTitle}” ` +
      `in “${action.projectName}” as ${
        action.completed ? "completed" : "unfinished"
      }.`
    );
  }

  const changes = [
    action.updates.title !== undefined ? `title to “${action.updates.title}”` : "",
    action.updates.priority !== undefined
      ? `priority to ${action.updates.priority}`
      : "",
    action.updates.dueDate !== undefined
      ? `due date to ${action.updates.dueDate || "none"}`
      : "",
  ].filter(Boolean);

  return (
    `Update “${action.taskTitle}” in “${action.projectName}”: ` +
    changes.join(", ") +
    "."
  );
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [input, setInput] = useState("");
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string>(
    "nvidia/Nemotron-3-Ultra-550b-a55b"
  );
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Speech Recognition / Voice Input
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Mobile sidebar and desktop sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Quick Memory Capture Modal / prompt
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryCategory, setMemoryCategory] = useState("Other");
  const [savingMemory, setSavingMemory] = useState(false);

  // Copy feedback state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Flash toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  }, []);

  // Load saved model preference
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(MODEL_KEY);
      if (savedModel && AVAILABLE_MODELS.some((m) => m.id === savedModel)) {
        setSelectedModel(savedModel);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
    try {
      localStorage.setItem(MODEL_KEY, modelId);
      const chosen = AVAILABLE_MODELS.find((m) => m.id === modelId);
      showToast(`Model switched to ${chosen?.name || modelId}`);
    } catch {
      // ignore
    }
  };

  // Load saved chats after page mounts
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem(CHATS_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);

      if (savedChats) {
        const parsed: unknown = JSON.parse(savedChats);

        if (Array.isArray(parsed)) {
          const validChats = parsed.filter(
            (chat): chat is Chat =>
              typeof chat?.id === "string" &&
              typeof chat?.title === "string" &&
              Array.isArray(chat?.messages) &&
              typeof chat?.updatedAt === "number" &&
              chat.messages.every(
                (message: unknown) =>
                  isRecord(message) &&
                  (message.role === "user" || message.role === "assistant") &&
                  typeof message.content === "string"
              )
          );

          if (validChats.length > 0) {
            setChats(validChats);

            const activeExists = validChats.some(
              (chat) => chat.id === savedActiveId
            );

            setActiveChatId(activeExists ? savedActiveId! : validChats[0].id);
            setStorageReady(true);
            return;
          }
        }
      }

      const firstChat = makeChat();
      setChats([firstChat]);
      setActiveChatId(firstChat.id);
    } catch {
      const firstChat = makeChat();
      setChats([firstChat]);
      setActiveChatId(firstChat.id);
    }

    setStorageReady(true);
  }, []);

  // Persist chat history
  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
      localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
    } catch {
      setError("Couldn't save chat history in this browser.");
    }
  }, [chats, activeChatId, storageReady]);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages ?? [];
  const isBusy = loadingChatId !== null;
  const isCurrentChatLoading = loadingChatId === activeChatId;

  const currentModelMeta = useMemo(() => {
    return (
      AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[0]
    );
  }, [selectedModel]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((chat) => {
        if (!term) return true;

        return (
          chat.title.toLowerCase().includes(term) ||
          chat.messages.some((message) =>
            message.content.toLowerCase().includes(term)
          )
        );
      });
  }, [chats, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isCurrentChatLoading, pendingAction]);

  // Reliable "Home" / New Chat action
  const handleHomeClick = useCallback(() => {
    // If active chat has messages, start a fresh new chat
    if (activeChat && activeChat.messages.length > 0) {
      const chat = makeChat();
      setChats((previous) => [chat, ...previous]);
      setActiveChatId(chat.id);
    }
    setInput("");
    setError("");
    setPendingAction(null);
    setSidebarOpen(false);
  }, [activeChat]);

  const startNewChat = useCallback(() => {
    const chat = makeChat();
    setChats((previous) => [chat, ...previous]);
    setActiveChatId(chat.id);
    setInput("");
    setError("");
    setPendingAction(null);
    setSidebarOpen(false);
  }, []);

  function deleteChat(chatId: string) {
    const remaining = chats.filter((chat) => chat.id !== chatId);

    if (remaining.length === 0) {
      const replacement = makeChat();
      setChats([replacement]);
      setActiveChatId(replacement.id);
    } else {
      setChats(remaining);

      if (chatId === activeChatId) {
        setActiveChatId(remaining[0].id);
      }
    }

    if (pendingAction?.chatId === chatId) setPendingAction(null);
    setError("");
  }

  // Voice Recognition toggle
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        showToast("Listening... Speak your prompt");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  // Copy message text
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Quick Save to Second Brain Memory
  const handleSaveToMemory = async (contentToSave: string) => {
    setMemoryContent(contentToSave.slice(0, 1000));
    setMemoryModalOpen(true);
  };

  const submitSaveMemory = async (e: FormEvent) => {
    e.preventDefault();
    if (!memoryContent.trim()) return;

    setSavingMemory(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: memoryContent.trim(),
          category: memoryCategory,
        }),
      });

      if (!res.ok) throw new Error("Failed to save memory.");

      showToast("✨ Memory saved to your Second Brain!");
      setMemoryModalOpen(false);
      setMemoryContent("");
    } catch (err: any) {
      setError(err?.message || "Could not save memory.");
    } finally {
      setSavingMemory(false);
    }
  };

  // Quick Action Trigger
  const triggerQuickAction = (promptText: string) => {
    setInput(promptText);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content || isBusy || !activeChat || !storageReady) return;

    const chatId = activeChat.id;
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };
    const updatedMessages = [...activeChat.messages, userMessage];
    const useAgent = looksLikeTaskAction(content);

    setInput("");
    setError("");
    setPendingAction(null);
    setLoadingChatId(chatId);

    setChats((previous) =>
      previous.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: chat.messages.length === 0 ? makeTitle(content) : chat.title,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : chat
      )
    );

    try {
      const projects = readStoredProjects();

      if (useAgent && projects.length === 0) {
        throw new Error(
          "There are no saved projects yet. Create a project in Projects & Tasks first, then ask Mnemo to add a task."
        );
      }

      const response = await fetch(useAgent ? "/api/agent" : "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          useAgent
            ? { instruction: content, projects, model: selectedModel }
            : { messages: updatedMessages, projects, model: selectedModel }
        ),
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Mnemo couldn't complete that message.";
        throw new Error(message);
      }

      if (!isRecord(data) || typeof data.reply !== "string") {
        throw new Error("The API returned an unexpected response.");
      }

      let proposedAction: AgentAction | null = null;

      if (useAgent && data.action != null) {
        const candidateAction: unknown = data.action;
        if (!isAgentAction(candidateAction)) {
          throw new Error("Mnemo returned an invalid task action. Please try again.");
        }

        const action: AgentAction = candidateAction;
        const project = projects.find((item) => item.id === action.projectId);
        if (!project) {
          throw new Error(
            "Mnemo referred to a project that isn't in your saved project list. Check the project name and try again."
          );
        }

        if (
          action.type !== "create_task" &&
          !project.tasks.some((task) => task.id === action.taskId)
        ) {
          throw new Error(
            "Mnemo referred to a task that wasn't found in that project. Try naming the task exactly as it appears in Projects & Tasks."
          );
        }

        proposedAction = action;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        model: typeof data.model === "string" ? data.model : selectedModel,
        timestamp: Date.now(),
      };

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : chat
        )
      );

      if (proposedAction) {
        setPendingAction({ chatId, action: proposedAction });
      } else if (useAgent) {
        setError(
          "Mnemo didn't prepare a task change. Check the project name and try a specific instruction, such as: Add a high-priority task called Test memory retrieval to my Nebius Hackathon project."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while contacting Mnemo.";
      setError(message);
    } finally {
      setLoadingChatId(null);
    }
  }

  function applyPendingAction() {
    const pending = pendingAction;
    if (!pending) return;

    try {
      const projects = readStoredProjects();
      const action = pending.action;

      const project = projects.find((item) => item.id === action.projectId);
      if (!project) {
        throw new Error(
          "That project no longer exists. Refresh Projects & Tasks and prepare the action again."
        );
      }

      if (
        action.type !== "create_task" &&
        !project.tasks.some((task) => task.id === action.taskId)
      ) {
        throw new Error(
          "That task no longer exists. Ask Mnemo to prepare the change again."
        );
      }

      const updatedProjects = projects.map((item) => {
        if (item.id !== action.projectId) return item;

        if (action.type === "create_task") {
          const newTask: StoredTask = {
            id: crypto.randomUUID(),
            title: action.task.title.trim(),
            priority: action.task.priority,
            dueDate: action.task.dueDate,
            completed: false,
          };

          return {
            ...item,
            tasks: [...item.tasks, newTask],
            updatedAt: Date.now(),
          };
        }

        if (action.type === "set_task_completed") {
          return {
            ...item,
            tasks: item.tasks.map((task) =>
              task.id === action.taskId
                ? { ...task, completed: action.completed }
                : task
            ),
            updatedAt: Date.now(),
          };
        }

        return {
          ...item,
          tasks: item.tasks.map((task) =>
            task.id === action.taskId
              ? {
                  ...task,
                  ...(action.updates.title !== undefined
                    ? { title: action.updates.title.trim() }
                    : {}),
                  ...(action.updates.priority !== undefined
                    ? { priority: action.updates.priority }
                    : {}),
                  ...(action.updates.dueDate !== undefined
                    ? { dueDate: action.updates.dueDate }
                    : {}),
                }
              : task
          ),
          updatedAt: Date.now(),
        };
      });

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));

      let confirmation: string;
      if (action.type === "create_task") {
        confirmation =
          `Done — I added “${action.task.title}” to “${project.name}” ` +
          `with ${action.task.priority} priority.`;
      } else if (action.type === "set_task_completed") {
        confirmation = action.completed
          ? `Done — “${action.taskTitle}” is now marked completed.`
          : `Done — “${action.taskTitle}” is now marked unfinished.`;
      } else {
        confirmation = `Done — I updated “${action.taskTitle}” in “${project.name}”.`;
      }

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === pending.chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: "assistant",
                    content: confirmation,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : chat
        )
      );

      setPendingAction(null);
      setError("");
      showToast("✅ Task change applied to Projects!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save the approved task change."
      );
    }
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-[#09090d] text-zinc-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform rounded-full border border-violet-400/30 bg-[#161622]/90 px-4 py-2 text-xs font-medium text-violet-200 shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-white/[0.07] bg-[#0e0e14] transition-all duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          sidebarCollapsed
            ? "lg:w-0 lg:min-w-0 lg:overflow-hidden lg:border-r-0"
            : "lg:w-[280px]"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-[68px] shrink-0 items-center justify-between px-5 border-b border-white/[0.05]">
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-3 text-left group"
            title="Go to Home / New Chat"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-lg text-violet-300 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="whitespace-nowrap">
              <div className="text-[17px] font-semibold tracking-tight text-white flex items-center gap-1">
                mnemo<span className="text-violet-400">.</span>
                <span className="text-[9px] font-mono tracking-widest text-violet-300/70 border border-violet-400/20 px-1 rounded-sm bg-violet-500/10">
                  AI
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Second Brain
              </div>
            </div>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="shrink-0 p-3">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs font-medium text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-500/20 group"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-violet-400 group-hover:rotate-90 transition-transform duration-200" />
              New Conversation
            </span>
            <span className="text-[10px] text-violet-300/50 font-mono">⌘K</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="shrink-0 space-y-1 px-3">
          <button
            onClick={handleHomeClick}
            className="flex w-full items-center gap-3 rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-100 transition"
          >
            <Brain className="h-4 w-4 text-violet-400" />
            <span>Chat Assistant</span>
            <span className="ml-auto text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full border border-violet-500/30">
              Active
            </span>
          </button>

          <Link
            href="/overview"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 transition hover:bg-violet-500/20"
          >
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span>✦ Product Showcase</span>
          </Link>

          <Link
            href="/memories"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
          >
            <Bookmark className="h-4 w-4 text-zinc-500" />
            <span>Memory Library</span>
          </Link>

          <Link
            href="/projects"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
          >
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span>Projects &amp; Tasks</span>
          </Link>
        </nav>

        <div className="mx-4 my-3 shrink-0 border-t border-white/[0.06]" />

        {/* Recent Chats Search & List */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Recent chats
          </p>
          <span className="text-[10px] text-zinc-600 font-mono">{chats.length}</span>
        </div>

        <div className="shrink-0 px-3 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input
              aria-label="Search chats"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-1 rounded-lg transition ${
                chat.id === activeChatId
                  ? "bg-white/[0.08] text-white"
                  : "hover:bg-white/[0.03] text-zinc-400"
              }`}
            >
              <button
                onClick={() => {
                  setActiveChatId(chat.id);
                  setError("");
                  setSidebarOpen(false);
                }}
                className="min-w-0 flex-1 px-3 py-2 text-left text-xs"
              >
                <span className="block truncate font-medium">{chat.title}</span>
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                aria-label={`Delete ${chat.title}`}
                title="Delete chat"
                className="mr-1 hidden rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-red-400 group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {filteredChats.length === 0 && (
            <p className="px-3 py-4 text-xs text-zinc-600 text-center">
              No matching chats.
            </p>
          )}
        </div>

        {/* Sidebar Footer: NVIDIA Nemotron Sovereign Notice */}
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-zinc-200 flex items-center gap-1.5">
                <span>Private &amp; Sovereign</span>
              </div>
              <p className="truncate text-[9px] text-zinc-500">
                Nebius Token Factory
              </p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex min-w-0 flex-1 flex-col relative">
        {/* Top Header */}
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6 bg-[#09090d]/80 backdrop-blur-md z-20">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((previous) => !previous)}
              aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              className="hidden rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:inline-flex"
            >
              <Layers className="h-4 w-4" />
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            >
              ☰
            </button>

            {/* Header Brand Link / Title */}
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-2 text-left group"
              title="Go to Home"
            >
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                  <span>{activeChat?.title ?? "Mnemo Workspace"}</span>
                </p>
                <p className="text-[10px] text-zinc-500 hidden sm:block">
                  Personal Second Brain
                </p>
              </div>
            </button>
          </div>

          {/* Right Controls: Model Switcher & Daily Briefing */}
          <div className="flex items-center gap-2">
            {/* Showcase Scrollytelling Link */}
            <Link
              href="/overview"
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/50 transition shadow-xs"
              title="View Product Story &amp; Scrollytelling Showcase"
            >
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span>✦ Showcase</span>
            </Link>

            {/* Quick 1-Click Daily Briefing Button */}
            <button
              onClick={() =>
                triggerQuickAction(
                  "Give me an executive daily briefing: review all my active projects, deadlines, overdue items, and relevant memories to recommend my top 3 focus priorities today."
                )
              }
              className="hidden md:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300 hover:bg-white/[0.07] hover:border-white/[0.15] transition shadow-xs"
              title="Generate Instant Daily Briefing"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Daily Briefing</span>
            </button>

            {/* Interactive Model Switcher Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setModelDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] px-3 py-1.5 text-xs text-zinc-200 transition"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {currentModelMeta.badge}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {/* Model Selection Dropdown Menu */}
              {modelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/[0.1] bg-[#12121a]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <p className="text-[11px] font-semibold text-zinc-300">
                      NVIDIA Nemotron Engine
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Powered by Nebius Token Factory
                    </p>
                  </div>
                  <div className="mt-1 space-y-1">
                    {AVAILABLE_MODELS.map((model) => {
                      const IconComponent = model.icon;
                      const isSelected = model.id === selectedModel;
                      return (
                        <button
                          key={model.id}
                          onClick={() => handleSelectModel(model.id)}
                          className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition ${
                            isSelected
                              ? "bg-violet-500/15 border border-violet-500/30 text-white"
                              : "hover:bg-white/[0.04] text-zinc-400"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-violet-500 text-white"
                                : "bg-white/[0.05] text-zinc-400"
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-100">
                                {model.name}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-violet-400" />
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">
                              {model.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto">
          {!storageReady ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Opening your workspace…
            </div>
          ) : messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Nebius Token Factory &bull; {currentModelMeta.name}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
                    Your Cognitive Second Brain
                  </h1>
                </div>
              </div>

              <p className="max-w-xl text-sm leading-6 text-zinc-400 mb-8">
                Mnemo organizes your projects, remembers important facts, and acts on your daily workflows with grounded executive intelligence.
              </p>

              {/* Quick Prompt Cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Executive Daily Briefing",
                    subtitle: "Synthesize unfinished tasks, deadlines, and memories",
                    prompt:
                      "Give me an executive daily briefing: review all my active projects, deadlines, overdue items, and relevant memories to recommend my top 3 focus priorities today.",
                    icon: Zap,
                    badge: "Standup",
                  },
                  {
                    title: "Decompose a Big Objective",
                    subtitle: "Break a goal into structured, prioritized tasks",
                    prompt:
                      "Help me break down my hackathon submission and demo video into clear, prioritized next steps with suggested deadlines.",
                    icon: Layers,
                    badge: "Planning",
                  },
                  {
                    title: "Recall Memory Library",
                    subtitle: "Query all personal facts, goals, and preferences",
                    prompt:
                      "Summarize all the key facts, preferences, and project goals you currently have saved in my Memory Library.",
                    icon: Bookmark,
                    badge: "Memory",
                  },
                  {
                    title: "Prioritize Unfinished Work",
                    subtitle: "Urgency vs. Importance task assessment",
                    prompt:
                      "What should I work on next? Prioritize my unfinished tasks by urgency, deadline proximity, and stated importance.",
                    icon: Clock,
                    badge: "Focus",
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.title}
                      onClick={() => setInput(item.prompt)}
                      className="glass-card group rounded-2xl p-4 text-left transition"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                          {item.badge}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-200">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
              {messages.map((message, index) => (
                <div
                  key={`${activeChatId}-${index}`}
                  className={`flex gap-3 sm:gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-600/10 text-violet-300 shadow-xs">
                      <Brain className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`min-w-0 max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#251f33] text-zinc-100 border border-violet-500/20"
                        : "glass-card text-zinc-200"
                    }`}
                  >
                    {/* Header info on assistant message */}
                    {message.role === "assistant" && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05] text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1 font-mono text-violet-300/80">
                          <Cpu className="h-3 w-3" />
                          {message.model ? message.model.replace("nvidia/", "") : currentModelMeta.badge}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(message.content, index)}
                            title="Copy reply"
                            className="hover:text-zinc-200 transition flex items-center gap-1"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleSaveToMemory(message.content)}
                            title="Save key information to Memory Library"
                            className="hover:text-violet-300 transition flex items-center gap-1"
                          >
                            <Bookmark className="h-3 w-3" />
                            <span className="hidden sm:inline">Save Memory</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {message.role === "assistant" ? (
                      <div className="space-y-3 text-sm leading-7 [&_a]:text-violet-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-violet-400/40 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/50 [&_pre]:p-4 [&_ul]:list-disc">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Pending Action Card */}
              {pendingAction?.chatId === activeChatId && (
                <div className="ml-11 max-w-xl rounded-2xl border border-violet-400/30 bg-violet-600/[0.08] p-4.5 shadow-xl animate-fade-in backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Executive Agent: Confirm Task Action</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-200 font-medium">
                    {describeAgentAction(pendingAction.action)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    Sovereign human-in-the-loop: No project change is written until you explicitly approve.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={applyPendingAction}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-md hover:bg-violet-500 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve &amp; Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction(null)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Thinking Indicator */}
              {isCurrentChatLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-600/10 text-violet-300">
                    <Brain className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2.5 pt-2 text-xs text-zinc-400">
                    <span className="h-2 w-2 animate-ping rounded-full bg-violet-400" />
                    <span>Reasoning with {currentModelMeta.name}…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="shrink-0 px-3 pb-3 pt-2 sm:px-6 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200 backdrop-blur-md animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="shrink-0 text-red-300 hover:text-white"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/[0.12] bg-[#12121a]/90 p-2.5 shadow-[0_15px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition focus-within:border-violet-400/50 focus-within:shadow-[0_0_25px_rgba(139,92,246,0.15)]"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={!storageReady || isBusy}
                rows={2}
                placeholder="Ask Mnemo, plan a project, or say 'Add a high priority task'..."
                aria-label="Message Mnemo"
                className="max-h-40 min-h-[52px] w-full resize-y bg-transparent px-3 py-1.5 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-1.5 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-zinc-500">
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    title={isRecording ? "Stop voice input" : "Voice dictation"}
                    className={`rounded-lg p-1.5 transition ${
                      isRecording
                        ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
                        : "hover:bg-white/5 hover:text-zinc-300"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                  <span className="text-[10px] hidden sm:inline text-zinc-600 font-mono">
                    Enter to send &bull; Shift + Enter for newline
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isBusy || !storageReady}
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-white/[0.07] disabled:text-zinc-600 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            <div className="mt-2.5 flex items-center justify-between px-2 text-[10px] text-zinc-600">
              <span>Sovereign local memory &bull; Zero training on personal data</span>
              <span className="font-mono">{currentModelMeta.badge} active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Save to Memory Modal */}
      {memoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#14141e] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">
                  Save to Memory Library
                </h3>
              </div>
              <button
                onClick={() => setMemoryModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitSaveMemory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={memoryCategory}
                  onChange={(e) => setMemoryCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-400"
                >
                  <option value="Projects" className="bg-[#14141e]">Projects</option>
                  <option value="Goals" className="bg-[#14141e]">Goals</option>
                  <option value="Preferences" className="bg-[#14141e]">Preferences</option>
                  <option value="People" className="bg-[#14141e]">People</option>
                  <option value="Learning" className="bg-[#14141e]">Learning</option>
                  <option value="Other" className="bg-[#14141e]">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Memory Content
                </label>
                <textarea
                  value={memoryContent}
                  onChange={(e) => setMemoryContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] p-3 text-xs leading-5 text-zinc-200 outline-none focus:border-violet-400"
                  placeholder="Fact, note, or preference to remember forever..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMemoryModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMemory || !memoryContent.trim()}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {savingMemory ? "Saving..." : "Save Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
