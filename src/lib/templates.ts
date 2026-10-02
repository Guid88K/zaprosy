import type { Dict } from "./i18n";

export type TemplateFont = "serif" | "script" | "sans";
export type TemplateId = "romantic" | "night" | "sunset" | "garden" | "minimal" | "ukraine";

export type Template = {
  id: TemplateId;
  emoji: string;
  /** Фон усієї сторінки */
  page: string;
  /** Фон картки */
  card: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  font: TemplateFont;
  dark: boolean;
};

export const templates: Template[] = [
  {
    id: "romantic",
    emoji: "💌",
    page: "linear-gradient(135deg, #ffe4ec 0%, #fbcfe8 45%, #f9a8d4 100%)",
    card: "rgba(255, 255, 255, 0.88)",
    text: "#5b1a35",
    muted: "#9d4b6d",
    accent: "#e11d74",
    accentText: "#ffffff",
    border: "rgba(225, 29, 116, 0.18)",
    font: "serif",
    dark: false,
  },
  {
    id: "night",
    emoji: "✨",
    page:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0, transparent 2px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.14) 0, transparent 2px), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.1) 0, transparent 2px), linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
    card: "rgba(15, 23, 42, 0.72)",
    text: "#f1f5f9",
    muted: "#a5b4fc",
    accent: "#fbbf24",
    accentText: "#1e1b4b",
    border: "rgba(165, 180, 252, 0.25)",
    font: "serif",
    dark: true,
  },
  {
    id: "sunset",
    emoji: "🌅",
    page: "linear-gradient(160deg, #fde68a 0%, #fb923c 40%, #c026d3 100%)",
    card: "rgba(255, 251, 235, 0.9)",
    text: "#431407",
    muted: "#9a3412",
    accent: "#ea580c",
    accentText: "#ffffff",
    border: "rgba(234, 88, 12, 0.2)",
    font: "sans",
    dark: false,
  },
  {
    id: "garden",
    emoji: "🌿",
    page: "linear-gradient(140deg, #d9f99d 0%, #a7f3d0 50%, #c4b5fd 100%)",
    card: "rgba(255, 255, 255, 0.86)",
    text: "#14532d",
    muted: "#3f6212",
    accent: "#16a34a",
    accentText: "#ffffff",
    border: "rgba(22, 163, 74, 0.2)",
    font: "script",
    dark: false,
  },
  {
    id: "minimal",
    emoji: "🖤",
    page: "#f5f5f4",
    card: "#ffffff",
    text: "#0a0a0a",
    muted: "#525252",
    accent: "#0a0a0a",
    accentText: "#ffffff",
    border: "rgba(10, 10, 10, 0.12)",
    font: "sans",
    dark: false,
  },
  {
    id: "ukraine",
    emoji: "💙💛",
    page: "linear-gradient(180deg, #2563eb 0%, #3b82f6 48%, #facc15 52%, #fde047 100%)",
    card: "rgba(255, 255, 255, 0.92)",
    text: "#1e3a8a",
    muted: "#1d4ed8",
    accent: "#eab308",
    accentText: "#1e3a8a",
    border: "rgba(37, 99, 235, 0.2)",
    font: "serif",
    dark: false,
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "romantic";

export function getTemplate(id: string | null | undefined): Template {
  return templates.find((t) => t.id === id) ?? templates[0];
}

/** Назва й опис шаблону вибраною мовою. */
export function templateText(id: TemplateId, dict: Dict): { name: string; description: string } {
  return dict.templates[id];
}

export const fontClassByKey: Record<TemplateFont, string> = {
  serif: "font-serif",
  script: "font-script",
  sans: "font-sans",
};
