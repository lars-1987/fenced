import "./style.css";
import { getHighlighter, THEMES, DEFAULT_THEME } from "./core/highlight.ts";
import { convert, convertPlain } from "./core/convert.ts";
import { type FenceMode } from "./core/fence.ts";
import { PREVIEW_CSS, type UiTheme } from "./core/styles.ts";
import { buildDocument, downloadFile } from "./core/export.ts";
import { initAnalytics, track } from "./core/analytics.ts";
import { SAMPLE } from "./sample.ts";

// Inject the shared fence/prose CSS so the preview matches the export exactly.
const sharedStyle = document.createElement("style");
sharedStyle.textContent = PREVIEW_CSS;
document.head.appendChild(sharedStyle);

// ── element handles ─────────────────────────────────────────────────────────
const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};
const editor = $<HTMLTextAreaElement>("editor");
const doc = $<HTMLElement>("doc");
const preview = $<HTMLElement>("preview");
const status = $<HTMLElement>("status");
const modeCtl = $<HTMLElement>("modeCtl");
const themeSelect = $<HTMLSelectElement>("themeSelect");
const themeBtn = $<HTMLButtonElement>("themeBtn");
const copyBtn = $<HTMLButtonElement>("copyBtn");
const downloadBtn = $<HTMLButtonElement>("downloadBtn");
const uploadBtn = $<HTMLButtonElement>("uploadBtn");
const sampleBtn = $<HTMLButtonElement>("sampleBtn");
const fileInput = $<HTMLInputElement>("fileInput");

// ── state + persistence ─────────────────────────────────────────────────────
const STORAGE_KEY = "fenced:v1";

const state = {
  mode: "term" as FenceMode,
  syntaxTheme: DEFAULT_THEME,
  uiTheme: "dark" as UiTheme,
  filename: "markdown",
};

interface Saved {
  content: string;
  mode: FenceMode;
  syntaxTheme: string;
  uiTheme: UiTheme;
  filename: string;
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

// Everything lives in localStorage only. Nothing leaves the browser.
function save(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        content: editor.value,
        mode: state.mode,
        syntaxTheme: state.syntaxTheme,
        uiTheme: state.uiTheme,
        filename: state.filename,
      } satisfies Saved),
    );
  } catch {
    /* storage unavailable (private mode); run without persistence */
  }
}

// populate the syntax theme picker
for (const group of THEMES) {
  const og = document.createElement("optgroup");
  og.label = group.group;
  for (const t of group.items) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.label;
    if (t.id === state.syntaxTheme) opt.selected = true;
    og.appendChild(opt);
  }
  themeSelect.appendChild(og);
}

// ── render ──────────────────────────────────────────────────────────────────
let highlighterReady = false;

function decoratedCount(): string {
  const n = doc.querySelectorAll(".fenced").length;
  return `${n} block${n === 1 ? "" : "s"} decorated`;
}

const EMPTY_HTML =
  '<p style="color:var(--ink-faint);font-family:var(--font-mono);font-size:var(--step--1)">paste or drop markdown on the left.</p>';

async function render(): Promise<void> {
  const src = editor.value;
  if (!src.trim()) {
    doc.innerHTML = EMPTY_HTML;
    status.textContent = "";
    return;
  }

  // Instant paint: show a plain-rendered preview before Shiki finishes loading.
  if (!highlighterReady) {
    doc.innerHTML = convertPlain(src);
    status.textContent = "highlighting…";
  }

  let hl;
  try {
    hl = await getHighlighter();
    highlighterReady = true;
  } catch {
    // Offline or blocked: keep the plain render, say so, carry on.
    doc.innerHTML = convertPlain(src);
    status.textContent = "plain mode · highlighter offline";
    return;
  }

  doc.innerHTML = convert(src, { hl, mode: state.mode, theme: state.syntaxTheme });
  status.textContent = decoratedCount();
}

let timer: number | undefined;
function scheduleRender(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    save();
    void render();
  }, 140);
}

// ── events ──────────────────────────────────────────────────────────────────
editor.addEventListener("input", scheduleRender);

modeCtl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-mode]");
  if (!btn) return;
  state.mode = btn.dataset.mode as FenceMode;
  for (const b of modeCtl.querySelectorAll("button")) {
    b.setAttribute("aria-selected", String(b === btn));
  }
  save();
  void render();
});

themeSelect.addEventListener("change", () => {
  state.syntaxTheme = themeSelect.value;
  save();
  void render();
});

themeBtn.addEventListener("click", () => {
  state.uiTheme = state.uiTheme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.uiTheme;
  themeBtn.textContent = `❯ theme: ${state.uiTheme}`;
  save();
});

// flash helper for button confirmations
function flash(btn: HTMLButtonElement, label = "✓ done"): void {
  const prev = btn.textContent;
  btn.textContent = label;
  btn.classList.add("done");
  window.setTimeout(() => {
    btn.textContent = prev;
    btn.classList.remove("done");
  }, 1300);
}

copyBtn.addEventListener("click", async () => {
  const html = buildDocument({
    title: state.filename,
    bodyHtml: doc.innerHTML,
    theme: state.uiTheme,
  });
  try {
    await navigator.clipboard.writeText(html);
    flash(copyBtn, "✓ copied");
    track("copy_html", { mode: state.mode });
  } catch {
    flash(copyBtn, "copy failed");
  }
});

downloadBtn.addEventListener("click", () => {
  const html = buildDocument({
    title: state.filename,
    bodyHtml: doc.innerHTML,
    theme: state.uiTheme,
  });
  downloadFile(`${state.filename}.html`, html);
  flash(downloadBtn, "✓ saved");
  track("download_html", { mode: state.mode });
});

// upload + drag/drop
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
});

async function loadFile(file: File): Promise<void> {
  editor.value = await file.text();
  state.filename = file.name.replace(/\.(md|markdown)$/i, "") || "markdown";
  save();
  void render();
}

for (const evt of ["dragenter", "dragover"] as const) {
  preview.addEventListener(evt, (e) => {
    e.preventDefault();
    preview.classList.add("dragover");
  });
  editor.addEventListener(evt, (e) => e.preventDefault());
}
for (const evt of ["dragleave", "drop"] as const) {
  preview.addEventListener(evt, () => preview.classList.remove("dragover"));
}
function onDrop(e: DragEvent): void {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) void loadFile(file);
}
preview.addEventListener("drop", onDrop);
editor.addEventListener("drop", onDrop);

sampleBtn.addEventListener("click", () => {
  editor.value = SAMPLE;
  state.filename = "sample";
  save();
  void render();
});

// ── boot ────────────────────────────────────────────────────────────────────
/** Reflect current state onto the UI controls. */
function syncUi(): void {
  document.documentElement.dataset.theme = state.uiTheme;
  themeBtn.textContent = `❯ theme: ${state.uiTheme}`;
  themeSelect.value = state.syntaxTheme;
  for (const b of modeCtl.querySelectorAll<HTMLButtonElement>("button[data-mode]")) {
    b.setAttribute("aria-selected", String(b.dataset.mode === state.mode));
  }
}

const saved = loadSaved();
if (saved && typeof saved.content === "string") {
  editor.value = saved.content;
  state.mode = saved.mode ?? state.mode;
  state.syntaxTheme = saved.syntaxTheme ?? state.syntaxTheme;
  state.uiTheme = saved.uiTheme ?? state.uiTheme;
  state.filename = saved.filename ?? state.filename;
} else {
  // First visit: let the page demo itself.
  editor.value = SAMPLE;
  state.filename = "sample";
}
syncUi();
void render();
void initAnalytics();
