"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedLesson, LessonSlide } from "@/lib/types";
import { DiagramRenderer } from "@/components/diagrams/DiagramRenderer";
import { LatexRenderer } from "./LatexRenderer";

interface LessonPageClientProps {
  treeId: string;
  nodeId: string;
  subject: string;
  goal: string;
  nodeName: string;
  nodeDescription: string;
  dashboardHref: string;
}

interface CompletionResult {
  completed: boolean;
  dashboardHref: string;
  nextNode: null | { id: string; name: string; href: string };
}

type LoadState = "idle" | "loading" | "ready" | "error";

interface SlideItem {
  num: string;
  meta: string;
  name: string;
  slide: LessonSlide;
  isCheckpoint?: boolean;
}

const CSS = `
  .lp {
    --lp-ink:         #0F1411;
    --lp-ink-soft:    #1F2A23;
    --lp-ink-mid:     #3D4A42;
    --lp-ink-dim:     #5C7066;
    --lp-ink-faint:   #94A89E;
    --lp-paper:       #FBFEFC;
    --lp-sage-50:     #EEF7F1;
    --lp-sage-100:    #E8F5EE;
    --lp-sage-200:    #D4E8DD;
    --lp-sage-600:    #1F8755;
    --lp-sage-700:    #176544;
    --lp-mint:        #5EE2A8;
    --lp-clay:        #C44536;
    --lp-clay-soft:   #E8C4BD;
    --lp-line:        #DCE8E0;
    --lp-line-strong: #B8C9BE;
    --lp-shadow-sm:   0 1px 2px rgba(15,20,17,0.04);
    --lp-shadow-md:   0 6px 24px -8px rgba(15,20,17,0.12);
    --lp-shadow-lg:   0 24px 60px -20px rgba(15,20,17,0.25);
    font-family: var(--font-sans, 'Bricolage Grotesque', system-ui, sans-serif);
    -webkit-font-smoothing: antialiased;
    height: 100vh;
    overflow: hidden;
    background: var(--lp-sage-100);
    background-image:
      linear-gradient(rgba(15,20,17,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,20,17,0.035) 1px, transparent 1px);
    background-size: 80px 80px;
    color: var(--lp-ink);
  }
  .lp-mono {
    font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
    font-feature-settings: normal;
  }

  /* ── TOP BAR ── */
  .lp-topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 30;
    height: 60px;
    background: rgba(232,245,238,0.88);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--lp-line);
    display: flex; align-items: center; padding: 0 20px; gap: 14px;
  }
  .lp-brand {
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 800; font-size: 18px; letter-spacing: -0.04em;
    text-decoration: none; color: var(--lp-ink); flex-shrink: 0;
  }
  .lp-brand img { width: 28px; height: 28px; display: block; }
  .lp-divider { width: 1px; height: 20px; background: var(--lp-line-strong); flex-shrink: 0; }
  .lp-crumb { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
  .lp-crumb-title {
    font-weight: 700; font-size: 14.5px; letter-spacing: -0.015em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .lp-crumb-sub {
    font-family: var(--font-mono, monospace); font-size: 10.5px;
    color: var(--lp-ink-dim); letter-spacing: 0.04em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .lp-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* ── BUTTONS ── */
  .lp-btn {
    height: 34px; padding: 0 13px; border-radius: 8px;
    border: 1px solid transparent; cursor: pointer;
    font-family: inherit; font-size: 13px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    letter-spacing: -0.01em;
    transition: background .15s, border-color .15s, color .15s;
    white-space: nowrap;
  }
  .lp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .lp-btn-ghost {
    background: transparent; color: var(--lp-ink-mid);
    border-color: var(--lp-line-strong);
  }
  .lp-btn-ghost:hover:not(:disabled) { color: var(--lp-ink); border-color: var(--lp-ink); background: var(--lp-paper); }
  .lp-btn-secondary {
    background: var(--lp-paper); color: var(--lp-ink); border-color: var(--lp-ink);
  }
  .lp-btn-secondary:hover:not(:disabled) { background: var(--lp-sage-50); }
  .lp-btn-primary { background: var(--lp-ink); color: var(--lp-sage-100); }
  .lp-btn-primary:hover:not(:disabled) { background: var(--lp-ink-soft); }
  .lp-btn-mint { background: var(--lp-mint); color: var(--lp-ink); }
  .lp-btn-mint:hover:not(:disabled) { background: #4ed99a; }
  .lp-btn-sm { height: 30px; padding: 0 11px; font-size: 12.5px; border-radius: 7px; }
  .lp-btn-bookmarked { background: var(--lp-clay) !important; color: #fff !important; border-color: var(--lp-clay) !important; }

  /* ── LAYOUT ── */
  .lp-app {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: 100vh; padding-top: 60px;
    transition: grid-template-columns .25s cubic-bezier(.4,0,.2,1);
  }
  .lp-app--collapsed { grid-template-columns: 52px 1fr; }

  /* ── SIDEBAR ── */
  .lp-sidebar {
    border-right: 1px solid var(--lp-line);
    background: rgba(238,247,241,0.7);
    overflow-y: auto; overflow-x: hidden;
    display: flex; flex-direction: column;
  }
  .lp-sidebar::-webkit-scrollbar { width: 6px; }
  .lp-sidebar::-webkit-scrollbar-thumb { background: var(--lp-line-strong); border-radius: 99px; }
  .lp-sidebar-head {
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--lp-line);
    display: flex; align-items: center; gap: 8px;
    flex-shrink: 0;
  }
  .lp-sidebar-head-label {
    font-family: var(--font-mono, monospace); font-size: 10.5px;
    color: var(--lp-ink-dim); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600;
  }
  .lp-collapse-btn {
    margin-left: auto; width: 26px; height: 26px; border-radius: 6px;
    border: 1px solid var(--lp-line-strong); background: var(--lp-paper);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    color: var(--lp-ink-mid); flex-shrink: 0;
  }
  .lp-collapse-btn:hover { color: var(--lp-ink); border-color: var(--lp-ink); }
  .lp-app--collapsed .lp-sidebar > *:not(.lp-sidebar-head) { display: none; }
  .lp-app--collapsed .lp-sidebar-head-label { display: none; }

  .lp-concept-block { padding: 14px 16px; border-bottom: 1px solid var(--lp-line); flex-shrink: 0; }
  .lp-eyebrow {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-ink-dim); letter-spacing: 0.1em; font-weight: 600;
    text-transform: uppercase; margin-bottom: 5px;
  }
  .lp-concept-block h3 {
    font-size: 15px; font-weight: 700; letter-spacing: -0.02em;
    margin: 0 0 5px; line-height: 1.25;
  }
  .lp-concept-block p {
    font-size: 12px; color: var(--lp-ink-mid); line-height: 1.5; margin: 0;
  }

  .lp-progress-block { padding: 14px 16px; border-bottom: 1px solid var(--lp-line); flex-shrink: 0; }
  .lp-progress-meta {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-ink-dim); letter-spacing: 0.02em;
  }
  .lp-progress-bar { height: 4px; background: var(--lp-sage-200); border-radius: 99px; overflow: hidden; }
  .lp-progress-fill {
    display: block; height: 100%;
    background: linear-gradient(90deg, var(--lp-sage-600), var(--lp-mint));
    border-radius: 99px;
    transition: width .35s ease;
  }

  .lp-outline { padding: 10px 8px 14px; list-style: none; margin: 0; display: flex; flex-direction: column; gap: 2px; }
  .lp-outline-item {
    display: flex; align-items: stretch; gap: 10px;
    padding: 9px 9px 9px 7px; border-radius: 9px; cursor: pointer;
    position: relative; transition: background .12s;
    border: 1px solid transparent;
  }
  .lp-outline-item:hover { background: rgba(212,232,221,0.5); }
  .lp-outline-item--active {
    background: var(--lp-paper) !important;
    box-shadow: var(--lp-shadow-sm);
    border-color: var(--lp-line) !important;
  }
  .lp-outline-item--active::before {
    content: ""; position: absolute; left: -8px; top: 12px; bottom: 12px;
    width: 3px; background: var(--lp-clay); border-radius: 99px;
  }
  .lp-outline-rail {
    position: relative; width: 20px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
  }
  .lp-outline-dot {
    width: 13px; height: 13px; border-radius: 99px;
    border: 1.5px solid var(--lp-line-strong);
    background: var(--lp-paper);
    margin-top: 2px; flex-shrink: 0; z-index: 2;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-outline-dot--done { background: var(--lp-ink); border-color: var(--lp-ink); color: var(--lp-mint); }
  .lp-outline-dot--done svg { width: 8px; height: 8px; }
  .lp-outline-dot--active {
    border-color: var(--lp-sage-600); background: var(--lp-paper);
    box-shadow: 0 0 0 3px rgba(31,135,85,0.18);
  }
  .lp-outline-dot--active::after {
    content: ""; width: 5px; height: 5px; border-radius: 99px; background: var(--lp-sage-600);
  }
  .lp-outline-dot--checkpoint { border-color: var(--lp-clay); }
  .lp-outline-dot--checkpoint::after {
    content: ""; width: 5px; height: 5px; background: var(--lp-clay); transform: rotate(45deg);
    border-radius: 1px;
  }
  .lp-outline-rail-line {
    position: absolute; left: 50%; top: 17px; bottom: -8px;
    width: 1.5px; background: var(--lp-line-strong); transform: translateX(-50%); z-index: 1;
  }
  .lp-outline-item--done .lp-outline-rail-line { background: var(--lp-ink); }
  .lp-outline-item:last-child .lp-outline-rail-line { display: none; }
  .lp-outline-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .lp-outline-num {
    font-family: var(--font-mono, monospace); font-size: 9.5px;
    color: var(--lp-ink-faint); letter-spacing: 0.06em; font-weight: 500;
    text-transform: uppercase; line-height: 1.2;
  }
  .lp-outline-name {
    font-size: 12.5px; font-weight: 500; letter-spacing: -0.01em;
    color: var(--lp-ink); line-height: 1.3; margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .lp-outline-item--active .lp-outline-name { font-weight: 600; }

  .lp-sidebar-goal {
    padding: 12px 16px 24px;
    border-top: 1px solid var(--lp-line);
    margin-top: auto; flex-shrink: 0;
  }

  /* ── MAIN ── */
  .lp-main { position: relative; overflow: hidden; display: flex; flex-direction: column; }
  .lp-stage {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    display: flex; align-items: stretch; justify-content: stretch;
    background: var(--lp-paper);
  }
  .lp-stage::-webkit-scrollbar { width: 10px; }
  .lp-stage::-webkit-scrollbar-thumb { background: var(--lp-line-strong); border-radius: 99px; }

  /* ── SLIDES ── */
  .lp-slide {
    width: 100%; background: var(--lp-paper);
    padding: 60px 80px 110px;
    display: none; min-height: 100%;
    animation: lp-fadeIn .3s ease;
  }
  .lp-slide--active { display: block; }
  @keyframes lp-fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-slide-inner { max-width: 1000px; margin: 0 auto; }

  .lp-slide-eyebrow {
    display: flex; align-items: center; gap: 9px;
    font-family: var(--font-mono, monospace); font-size: 10.5px;
    color: var(--lp-ink-dim); letter-spacing: 0.1em; font-weight: 600;
    text-transform: uppercase; margin-bottom: 16px;
  }
  .lp-sq { width: 7px; height: 7px; background: var(--lp-clay); border-radius: 2px; flex-shrink: 0; }
  .lp-sq--green { background: var(--lp-sage-600); }

  .lp-slide h2 {
    margin: 0 0 16px; font-size: 42px; font-weight: 800;
    letter-spacing: -0.035em; line-height: 1.0; color: var(--lp-ink);
  }
  .lp-slide h2.lp-h2-med { font-size: 34px; }
  .lp-slide h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.015em; margin: 24px 0 8px; }
  .lp-slide .lp-lede {
    font-size: 18px; line-height: 1.6; color: var(--lp-ink-mid);
    max-width: 700px; margin-bottom: 8px; font-weight: 400;
  }
  .lp-slide .lp-lede strong { color: var(--lp-ink); }
  .lp-slide-prose { font-size: 15px; color: var(--lp-ink-mid); line-height: 1.65; max-width: 720px; }
  .lp-slide-prose p { margin: 0 0 12px; }
  .lp-slide-prose p:last-child { margin-bottom: 0; }
  .lp-slide-prose strong { color: var(--lp-ink); font-weight: 650; }
  .lp-slide-prose em { font-style: italic; }
  .lp-slide-prose code {
    font-family: var(--font-mono, monospace); font-size: 13px;
    background: var(--lp-sage-50); border: 1px solid var(--lp-line);
    border-radius: 4px; padding: 1px 5px;
  }
  .lp-slide-prose pre {
    background: var(--lp-sage-50); border: 1px solid var(--lp-line);
    border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 12px 0;
  }
  .lp-slide-prose pre code { background: none; border: none; padding: 0; }
  .lp-slide-prose ul, .lp-slide-prose ol { padding-left: 20px; margin: 8px 0; }
  .lp-slide-prose li { line-height: 1.65; margin-bottom: 4px; }

  /* Cover */
  .lp-cover-super {
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-ink-dim); letter-spacing: 0.12em; font-weight: 600;
    text-transform: uppercase; margin-bottom: 20px;
  }
  .lp-cover-h2 { font-size: 60px !important; line-height: 0.95 !important; max-width: 680px; }
  .lp-cover-meta {
    display: flex; gap: 26px; margin-top: 32px;
    padding-top: 20px; border-top: 1px solid var(--lp-line);
    flex-wrap: wrap;
  }
  .lp-cover-meta-item .k {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-ink-dim); letter-spacing: 0.08em; font-weight: 600;
    text-transform: uppercase;
  }
  .lp-cover-meta-item .v { font-size: 13.5px; color: var(--lp-ink); font-weight: 600; margin-top: 3px; }

  /* Worked example */
  .lp-worked {
    background: var(--lp-sage-50);
    border: 1px solid var(--lp-line);
    border-radius: 12px;
    padding: 24px 28px;
    margin-top: 8px;
  }

  /* Misconceptions */
  .lp-misc-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
  .lp-misc-item {
    display: grid; grid-template-columns: 28px 1fr; gap: 10px;
    padding: 14px 16px; border-radius: 10px;
    background: rgba(196,69,54,0.04); border: 1px solid var(--lp-clay-soft);
    font-size: 14.5px; line-height: 1.6; color: var(--lp-ink-mid);
    max-width: 700px;
  }
  .lp-misc-num {
    font-family: var(--font-mono, monospace); font-size: 11px;
    font-weight: 600; color: var(--lp-clay); padding-top: 2px;
  }

  /* Try This */
  .lp-try-box {
    background: var(--lp-sage-50); border: 1px solid var(--lp-line);
    border-radius: 12px; padding: 24px 28px; max-width: 720px;
  }

  /* Wrap up */
  .lp-wrap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; max-width: 760px; }
  .lp-wrap-card { border: 1px solid var(--lp-line); border-radius: 12px; padding: 16px 18px; background: var(--lp-sage-50); }
  .lp-wrap-card .k {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-ink-dim); letter-spacing: 0.1em; font-weight: 600;
    text-transform: uppercase; margin-bottom: 6px;
  }
  .lp-wrap-card .v { font-size: 14.5px; font-weight: 600; line-height: 1.4; letter-spacing: -0.01em; }
  .lp-wrap-actions { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }

  /* Generating skeleton */
  .lp-gen-slide {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100%; padding: 60px 80px;
    gap: 28px; text-align: center;
  }
  .lp-gen-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 2.5px solid var(--lp-line-strong);
    border-top-color: var(--lp-sage-600);
    animation: lp-spin 0.8s linear infinite;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-gen-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--lp-ink); }
  .lp-gen-sub { font-size: 14px; color: var(--lp-ink-dim); line-height: 1.5; max-width: 320px; }

  /* Error */
  .lp-error-slide {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100%; padding: 60px 80px; gap: 16px; text-align: center;
  }

  /* ── FOOTER NAV ── */
  .lp-footer {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 12px 22px;
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(180deg, rgba(251,254,252,0) 0%, rgba(251,254,252,0.96) 28%);
    backdrop-filter: blur(6px);
    border-top: 1px solid var(--lp-line);
    z-index: 5;
  }
  .lp-footer-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .lp-counter {
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-ink-dim); letter-spacing: 0.06em; font-weight: 600;
  }
  .lp-pips { display: flex; gap: 5px; align-items: center; }
  .lp-pip {
    width: 20px; height: 4px; border-radius: 99px;
    background: var(--lp-line-strong); cursor: pointer;
    transition: background .15s, width .15s;
    border: none; padding: 0;
  }
  .lp-pip:hover { background: var(--lp-ink-dim); }
  .lp-pip--active { background: var(--lp-ink); width: 32px; }
  .lp-pip--done { background: var(--lp-sage-600); }

  /* ── CHAT FAB ── */
  .lp-chat-fab {
    position: fixed; right: 22px; bottom: 22px; z-index: 40;
    width: 54px; height: 54px; border-radius: 50%;
    background: var(--lp-ink); color: var(--lp-mint);
    border: none; cursor: pointer;
    box-shadow: var(--lp-shadow-lg);
    display: flex; align-items: center; justify-content: center;
    transition: transform .2s, box-shadow .2s;
  }
  .lp-chat-fab:hover { transform: translateY(-2px); }
  .lp-chat-fab--hidden { display: none; }
  .lp-chat-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1.5px solid var(--lp-mint); opacity: 0.4;
    animation: lp-pulse 2.4s ease-out infinite; pointer-events: none;
  }
  @keyframes lp-pulse {
    0%   { transform: scale(1); opacity: 0.45; }
    70%  { transform: scale(1.22); opacity: 0; }
    100% { transform: scale(1.22); opacity: 0; }
  }
  .lp-chat-glyph { font-weight: 800; font-size: 20px; letter-spacing: -0.04em; }

  /* ── CHAT PANEL ── */
  .lp-chat-panel {
    position: fixed; right: 22px; bottom: 22px; z-index: 41;
    width: 360px; height: min(540px, calc(100vh - 100px));
    background: var(--lp-paper); border: 1px solid var(--lp-line-strong);
    border-radius: 16px; box-shadow: var(--lp-shadow-lg);
    display: none; flex-direction: column; overflow: hidden;
    transform-origin: bottom right;
  }
  .lp-chat-panel--open { display: flex; animation: lp-chatIn .22s cubic-bezier(.4,0,.2,1); }
  @keyframes lp-chatIn {
    from { transform: scale(0.92) translateY(8px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  .lp-chat-head {
    padding: 12px 14px; border-bottom: 1px solid var(--lp-line);
    display: flex; align-items: center; gap: 10px;
    background: var(--lp-sage-50); flex-shrink: 0;
  }
  .lp-chat-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--lp-ink); color: var(--lp-mint);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; flex-shrink: 0;
  }
  .lp-chat-who { display: flex; flex-direction: column; line-height: 1.2; flex: 1; }
  .lp-chat-who-name { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; }
  .lp-chat-who-status {
    font-family: var(--font-mono, monospace); font-size: 9.5px;
    color: var(--lp-sage-600); letter-spacing: 0.06em; font-weight: 600;
  }
  .lp-chat-who-status::before {
    content: ""; display: inline-block; width: 5px; height: 5px;
    background: var(--lp-sage-600); border-radius: 99px; margin-right: 4px; vertical-align: 1px;
  }
  .lp-chat-close {
    width: 26px; height: 26px; border-radius: 6px;
    border: 1px solid var(--lp-line-strong); background: var(--lp-paper);
    cursor: pointer; color: var(--lp-ink-mid);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .lp-chat-close:hover { color: var(--lp-ink); border-color: var(--lp-ink); }
  .lp-chat-body {
    flex: 1; overflow-y: auto; padding: 16px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .lp-chat-body::-webkit-scrollbar { width: 5px; }
  .lp-chat-body::-webkit-scrollbar-thumb { background: var(--lp-line-strong); border-radius: 99px; }
  .lp-msg { display: flex; gap: 7px; max-width: 92%; }
  .lp-msg--user { align-self: flex-end; flex-direction: row-reverse; }
  .lp-bubble {
    padding: 9px 12px; border-radius: 11px;
    font-size: 13px; line-height: 1.5;
    background: var(--lp-sage-100); color: var(--lp-ink);
  }
  .lp-msg--user .lp-bubble { background: var(--lp-ink); color: var(--lp-sage-100); }
  .lp-bubble strong { font-weight: 700; }
  .lp-lcite {
    display: block; margin-top: 5px;
    font-family: var(--font-mono, monospace); font-size: 9.5px;
    color: var(--lp-ink-dim); letter-spacing: 0.06em;
  }
  .lp-typing {
    display: inline-flex; gap: 3px; padding: 9px 12px;
    background: var(--lp-sage-100); border-radius: 11px;
  }
  .lp-typing span {
    width: 5px; height: 5px; background: var(--lp-ink-dim); border-radius: 50%;
    animation: lp-bounce 1.2s infinite;
  }
  .lp-typing span:nth-child(2) { animation-delay: .15s; }
  .lp-typing span:nth-child(3) { animation-delay: .3s; }
  @keyframes lp-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
  .lp-chat-context {
    padding: 7px 13px; border-top: 1px solid var(--lp-line);
    background: rgba(238,247,241,0.6);
    display: flex; align-items: center; gap: 7px;
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-ink-dim); letter-spacing: 0.04em; flex-shrink: 0;
  }
  .lp-ctx-pin { width: 5px; height: 5px; background: var(--lp-clay); border-radius: 99px; flex-shrink: 0; }
  .lp-ctx-name { color: var(--lp-ink); font-weight: 600; }
  .lp-chat-foot {
    padding: 10px 12px; border-top: 1px solid var(--lp-line);
    display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
  }
  .lp-suggestions { display: flex; flex-wrap: wrap; gap: 5px; }
  .lp-sg {
    padding: 4px 9px; font-family: inherit; font-size: 11px;
    background: var(--lp-paper); border: 1px solid var(--lp-line);
    border-radius: 99px; cursor: pointer; color: var(--lp-ink-mid);
    font-weight: 500; transition: border-color .15s, color .15s;
  }
  .lp-sg:hover { border-color: var(--lp-ink); color: var(--lp-ink); }
  .lp-chat-input-row { display: flex; gap: 7px; }
  .lp-chat-input {
    flex: 1; height: 36px; padding: 0 11px;
    background: var(--lp-paper); border: 1px solid var(--lp-line-strong);
    border-radius: 8px; font-family: inherit; font-size: 13px;
    color: var(--lp-ink);
  }
  .lp-chat-input:focus { outline: none; border-color: var(--lp-ink); }
  .lp-chat-send {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--lp-ink); color: var(--lp-mint);
    border: none; cursor: pointer; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .lp-chat-send:hover { background: var(--lp-ink-soft); }

  @media (max-width: 900px) {
    .lp-app { grid-template-columns: 1fr; }
    .lp-sidebar { display: none; }
    .lp-slide { padding: 36px 24px 100px; }
    .lp-slide h2 { font-size: 30px; }
    .lp-cover-h2 { font-size: 38px !important; }
    .lp-chat-panel { right: 10px; left: 10px; width: auto; }
    .lp-wrap-grid { grid-template-columns: 1fr; }
  }
`;

const CANNED_REPLIES: Record<string, string> = {
  eli12: "Think of atoms like kids who each want exactly 8 marbles. Some have too many, some too few — so they either <strong>give away</strong> extras (ionic bonding) or <strong>share</strong> with a friend (covalent bonding). The lesson you're reading is about why that marble-trading matters for everything we build.",
  why: "Because every decision downstream — choice of materials, reaction rates, safety margins — comes back to <strong>which bonds exist and how they break under stress</strong>. Understanding this unlocks the 'why' behind every formula and rule you'll encounter.",
  quiz: "Quick one: <strong>If A and B form an ionic bond, what happens to the electron count of each atom?</strong> (Hint: one loses, one gains — how does that change their charges?)",
  default: "Great question! This slide covers a key concept in this lesson. The main idea is that understanding the foundational principles here will unlock everything that comes next. Try re-reading the main paragraph slowly — the key insight is usually in the first sentence.",
};

function slideMeta(slide: LessonSlide) {
  switch (slide.kind) {
    case "cover": return "INTRO";
    case "concept": return "CONCEPT";
    case "compare": return "COMPARE";
    case "workedExample": return "EXAMPLE";
    case "misconceptions": return "WATCH FOR";
    case "tryThis": return "CHALLENGE";
    case "wrapUp": return "SUMMARY";
  }
}

function slideName(slide: LessonSlide) {
  switch (slide.kind) {
    case "cover": return slide.title;
    case "concept":
    case "compare":
    case "workedExample":
    case "misconceptions":
    case "tryThis":
    case "wrapUp":
      return slide.heading;
  }
}

export function LessonPageClient({
  treeId,
  nodeId,
  subject,
  goal,
  nodeName,
  nodeDescription,
  dashboardHref,
}: LessonPageClientProps) {
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [completeState, setCompleteState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "ai" | "user"; html: string; cite?: string }>>([
    { role: "ai", html: "Hey — I'm Nova. I'm reading along with you. Ask me anything about <strong>this slide</strong>, or zoom out to the whole lesson." },
  ]);
  const [chatInput, setChatInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const slides = useMemo<SlideItem[]>(() => {
    if (!lesson) return [];
    return lesson.slides.map((slide, index) => ({
      slide,
      num: String(index + 1).padStart(2, "0"),
      meta: slideMeta(slide),
      name: slideName(slide),
      isCheckpoint: slide.kind === "misconceptions" || slide.kind === "wrapUp",
    }));
  }, [lesson]);

  const generateLesson = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    setLesson(null);
    setCurrent(0);
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treeId, nodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Lesson could not be generated");
      setLesson(data as GeneratedLesson);
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lesson could not be generated");
      setLoadState("error");
    }
  }, [nodeId, treeId]);

  useEffect(() => {
    void generateLesson();
  }, [generateLesson]);

  function goTo(idx: number) {
    if (idx < 0 || idx >= slides.length) return;
    setCurrent(idx);
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function handleComplete() {
    setCompleteState("saving");
    setCompleteError(null);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treeId, nodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Progress could not be saved");
      setCompletion(data as CompletionResult);
      setCompleteState("done");
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Progress could not be saved");
      setCompleteState("error");
    }
  }

  function sendChat(text: string) {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setChatInputValue("");
    setChatMessages((prev) => [...prev, { role: "user", html: userMsg }]);
    setIsTyping(true);
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let answer = CANNED_REPLIES.default;
      if (/eli|12|simple|like a kid|metaphor/.test(lower)) answer = CANNED_REPLIES.eli12;
      else if (/why|matter|important|use|relevant/.test(lower)) answer = CANNED_REPLIES.why;
      else if (/quiz|test|question|check/.test(lower)) answer = CANNED_REPLIES.quiz;
      const slide = slides[current];
      const cite = slide ? `ANCHORED · SLIDE ${slide.num}` : undefined;
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: "ai", html: answer, cite }]);
    }, 700 + Math.random() * 400);
  }

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatMessages, isTyping]);

  const slideCount = slides.length;
  const pct = slideCount > 0 ? Math.round(((current + 1) / slideCount) * 100) : 0;
  const activeSlide = slides[current];

  function renderSlideContent() {
    if (loadState === "loading" || loadState === "idle") {
      return (
        <div className="lp-gen-slide">
          <div className="lp-gen-spinner" />
          <div>
            <div className="lp-gen-title">Generating your lesson…</div>
            <div className="lp-gen-sub">We&apos;re crafting a personalised lesson for this concept. This takes about 20–30 seconds.</div>
          </div>
        </div>
      );
    }

    if (loadState === "error") {
      return (
        <div className="lp-error-slide">
          <div style={{ fontSize: 40 }}>⚠</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--lp-ink)" }}>
            Lesson could not load
          </div>
          <div style={{ fontSize: 14, color: "var(--lp-ink-dim)", maxWidth: 320, lineHeight: 1.5 }}>{error}</div>
          <button className="lp-btn lp-btn-secondary" onClick={generateLesson}>Retry</button>
        </div>
      );
    }

    if (!lesson || !activeSlide) return null;

    const slide = activeSlide.slide;

    if (slide.kind === "cover") {
      return (
        <div className="lp-slide lp-slide--active" key="cover">
          <div className="lp-slide-inner">
            <div className="lp-cover-super">LESSON · {String(slideCount).padStart(2, "0")} SLIDES</div>
            <h2 className="lp-cover-h2">{slide.title}.</h2>
            <p className="lp-lede">{slide.lede}</p>
            <div className="lp-cover-meta">
              <div className="lp-cover-meta-item"><div className="k">Subject</div><div className="v">{subject}</div></div>
              <div className="lp-cover-meta-item"><div className="k">Time</div><div className="v">{slide.meta.estTime}</div></div>
              <div className="lp-cover-meta-item"><div className="k">Difficulty</div><div className="v">{slide.meta.difficulty}</div></div>
              <div className="lp-cover-meta-item"><div className="k">Concept</div><div className="v">{nodeName}</div></div>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === "concept") {
      return (
        <div className="lp-slide lp-slide--active" key={activeSlide.num}>
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq" />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2>{slide.heading}.</h2>
            {slide.lede && <p className="lp-lede">{slide.lede}</p>}
            <div className="lp-slide-prose">
              <LatexRenderer text={slide.body} />
            </div>
            {slide.diagram && <DiagramRenderer diagram={slide.diagram} />}
          </div>
        </div>
      );
    }

    if (slide.kind === "compare") {
      return (
        <div className="lp-slide lp-slide--active" key={activeSlide.num}>
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq" />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2 className="lp-h2-med">{slide.heading}.</h2>
            {slide.lede && <p className="lp-lede">{slide.lede}</p>}
            <div className="lp-wrap-grid" style={{ marginTop: 24 }}>
              <div className="lp-wrap-card">
                <div className="k">{slide.left.label}</div>
                <div className="lp-slide-prose">
                  <LatexRenderer text={slide.left.body} />
                </div>
              </div>
              <div className="lp-wrap-card">
                <div className="k">{slide.right.label}</div>
                <div className="lp-slide-prose">
                  <LatexRenderer text={slide.right.body} />
                </div>
              </div>
            </div>
            {slide.summary && <p className="lp-lede" style={{ marginTop: 22 }}>{slide.summary}</p>}
          </div>
        </div>
      );
    }

    if (slide.kind === "workedExample") {
      return (
        <div className="lp-slide lp-slide--active" key="worked-example">
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq" />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2 className="lp-h2-med">{slide.heading}.</h2>
            <div className="lp-worked">
              <div className="lp-eyebrow" style={{ marginBottom: 10 }}>PROBLEM</div>
              <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {slide.problem}
              </h3>
              <div className="lp-slide-prose">
                <LatexRenderer text={slide.solution} />
              </div>
            </div>
            {slide.diagram && <DiagramRenderer diagram={slide.diagram} />}
          </div>
        </div>
      );
    }

    if (slide.kind === "misconceptions") {
      return (
        <div className="lp-slide lp-slide--active" key="misconceptions">
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq" />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2 className="lp-h2-med">{slide.heading}.</h2>
            <ol className="lp-misc-list">
              {slide.items.map((item, i) => (
                <li key={i} className="lp-misc-item">
                  <span className="lp-misc-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--lp-ink)", marginBottom: 4 }}>Wrong: <LatexRenderer text={item.wrong} /></div>
                    <div><strong style={{ color: "var(--lp-ink)" }}>Right:</strong> <LatexRenderer text={item.right} /></div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    if (slide.kind === "tryThis") {
      return (
        <div className="lp-slide lp-slide--active" key="try-this">
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq" style={{ background: "var(--lp-sage-600)" }} />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2 className="lp-h2-med">{slide.heading}.</h2>
            <p className="lp-lede" style={{ marginBottom: 24 }}>
              Work through this on your own before checking with Nova.
            </p>
            <div className="lp-try-box">
              <div className="lp-eyebrow" style={{ marginBottom: 10 }}>YOUR TURN</div>
              <div className="lp-slide-prose">
                <LatexRenderer text={slide.prompt} />
              </div>
            </div>
            <p style={{ marginTop: 20, fontSize: 13.5, color: "var(--lp-ink-dim)", lineHeight: 1.5 }}>
              {slide.hint || "Stuck? Tap the Nova button in the bottom-right corner and ask for a hint."}
            </p>
          </div>
        </div>
      );
    }

    if (slide.kind === "wrapUp") {
      return (
        <div className="lp-slide lp-slide--active" key="wrap-up">
          <div className="lp-slide-inner">
            <div className="lp-slide-eyebrow">
              <span className="lp-sq lp-sq--green" />
              {activeSlide.num} · {activeSlide.meta}
            </div>
            <h2 className="lp-h2-med">{slide.heading}.</h2>
            <p className="lp-lede">
              {slide.nextHook || <>You&apos;ve covered the key ideas in <strong>{nodeName}</strong>. Mark it complete to unlock the next concept on your path.</>}
            </p>
            <div className="lp-wrap-grid">
              {slide.keyIdeas.map((idea, i) => (
                <div key={i} className="lp-wrap-card">
                  <div className="k">Key idea {String(i + 1).padStart(2, "0")}</div>
                  <div className="v">{idea}</div>
                </div>
              ))}
              {goal && (
                <div className="lp-wrap-card" style={{ background: "var(--lp-ink)", borderColor: "var(--lp-ink)" }}>
                  <div className="k" style={{ color: "var(--lp-ink-faint)" }}>End goal</div>
                  <div className="v" style={{ color: "var(--lp-sage-100)", fontSize: 13 }}>{goal}</div>
                </div>
              )}
            </div>

            <div className="lp-wrap-actions">
              <button
                type="button"
                className={`lp-btn ${completeState === "done" ? "lp-btn-ghost" : "lp-btn-mint"}`}
                onClick={handleComplete}
                disabled={completeState === "saving" || completeState === "done"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {completeState === "saving" ? "Saving…" : completeState === "done" ? "Marked complete" : "Mark complete"}
              </button>

              {completion?.nextNode && (
                <a href={completion.nextNode.href} className="lp-btn lp-btn-secondary">
                  Next: {completion.nextNode.name} →
                </a>
              )}
              <a href={dashboardHref} className="lp-btn lp-btn-ghost">← Back to graph</a>
            </div>

            {completeError && (
              <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--lp-clay)" }}>{completeError}</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp">
        {/* ── TOP BAR ── */}
        <div className="lp-topbar">
          <a href="/" className="lp-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={28} height={28} />
            <span>pathwise</span>
          </a>
          <div className="lp-divider" />
          <div className="lp-crumb">
            <div className="lp-crumb-title">{nodeName}</div>
            <div className="lp-crumb-sub lp-mono">{subject.toUpperCase()}</div>
          </div>
          <div className="lp-topbar-right">
            <button
              type="button"
              className={`lp-btn lp-btn-ghost lp-btn-sm ${bookmarked ? "lp-btn-bookmarked" : ""}`}
              onClick={() => setBookmarked(!bookmarked)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <a href={dashboardHref} className="lp-btn lp-btn-secondary lp-btn-sm">← Back to graph</a>
          </div>
        </div>

        <div className={`lp-app${sidebarOpen ? "" : " lp-app--collapsed"}`}>
          {/* ── SIDEBAR ── */}
          <aside className="lp-sidebar">
            <div className="lp-sidebar-head">
              <span className="lp-sidebar-head-label lp-mono">Lesson outline</span>
              <button
                type="button"
                className="lp-collapse-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Collapse" : "Expand"}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d={sidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                </svg>
              </button>
            </div>

            <div className="lp-concept-block">
              <div className="lp-eyebrow">CONCEPT</div>
              <h3>{nodeName}</h3>
              <p>{nodeDescription}</p>
            </div>

            <div className="lp-progress-block">
              <div className="lp-progress-meta lp-mono">
                <span>{Math.min(current + 1, slideCount)} / {slideCount || "—"}</span>
                <span style={{ marginLeft: "auto" }}>{pct}% complete</span>
              </div>
              <div className="lp-progress-bar">
                <i className="lp-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <ul className="lp-outline" style={{ margin: 0, padding: "10px 8px 14px" }}>
              {loadState === "ready" && slides.map((s, i) => {
                const isDone = i < current;
                const isActive = i === current;
                const isCheckpoint = s.isCheckpoint;
                let cls = "lp-outline-item";
                if (isDone) cls += " lp-outline-item--done";
                if (isActive) cls += " lp-outline-item--active";
                return (
                  <li key={s.num} className={cls} onClick={() => goTo(i)} style={{ listStyle: "none" }}>
                    <div className="lp-outline-rail">
                      <span className={`lp-outline-dot${isDone ? " lp-outline-dot--done" : isActive ? " lp-outline-dot--active" : isCheckpoint ? " lp-outline-dot--checkpoint" : ""}`}>
                        {isDone && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="lp-outline-rail-line" />
                    </div>
                    <div className="lp-outline-text">
                      <span className="lp-outline-num lp-mono">{s.num} · {s.meta}</span>
                      <span className="lp-outline-name">{s.name}</span>
                    </div>
                  </li>
                );
              })}
              {(loadState === "loading" || loadState === "idle") && (
                <li style={{ padding: "12px 8px", color: "var(--lp-ink-dim)", fontSize: 12.5, lineHeight: 1.5, listStyle: "none" }}>
                  Generating lesson outline…
                </li>
              )}
            </ul>

            <div className="lp-sidebar-goal">
              <div className="lp-eyebrow lp-mono" style={{ marginBottom: 8 }}>END GOAL</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--lp-ink-mid)" }}>{goal}</div>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="lp-main">
            <div className="lp-stage" ref={stageRef}>
              {renderSlideContent()}
            </div>

            {/* ── FOOTER NAV ── */}
            <div className="lp-footer">
              <button
                type="button"
                className="lp-btn lp-btn-ghost lp-btn-sm"
                onClick={() => goTo(current - 1)}
                disabled={current === 0 || loadState !== "ready"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Previous
              </button>

              <div className="lp-footer-center">
                {loadState === "ready" && (
                  <>
                    <span className="lp-counter lp-mono">
                      {String(current + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
                    </span>
                    <div className="lp-pips">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`lp-pip${i === current ? " lp-pip--active" : i < current ? " lp-pip--done" : ""}`}
                          onClick={() => goTo(i)}
                          title={slides[i].name}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                className="lp-btn lp-btn-primary lp-btn-sm"
                onClick={() => goTo(current + 1)}
                disabled={current >= slideCount - 1 || loadState !== "ready"}
              >
                Next
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </main>
        </div>

        {/* ── CHAT FAB ── */}
        <button
          type="button"
          className={`lp-chat-fab${chatOpen ? " lp-chat-fab--hidden" : ""}`}
          onClick={() => {
            setChatOpen(true);
            setTimeout(() => chatInputRef.current?.focus(), 60);
          }}
          title="Ask Nova"
        >
          <span className="lp-chat-ring" />
          <span className="lp-chat-glyph">N</span>
        </button>

        {/* ── CHAT PANEL ── */}
        <div className={`lp-chat-panel${chatOpen ? " lp-chat-panel--open" : ""}`}>
          <div className="lp-chat-head">
            <div className="lp-chat-avatar">N</div>
            <div className="lp-chat-who">
              <span className="lp-chat-who-name">Nova · AI tutor</span>
              <span className="lp-chat-who-status lp-mono">ONLINE · GROUNDED IN THIS LESSON</span>
            </div>
            <button type="button" className="lp-chat-close" onClick={() => setChatOpen(false)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="lp-chat-body" ref={chatBodyRef}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`lp-msg${msg.role === "user" ? " lp-msg--user" : ""}`}>
                <div
                  className="lp-bubble"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: msg.cite
                      ? `${msg.html}<span class="lp-lcite lp-mono">↳ ${msg.cite}</span>`
                      : msg.html,
                  }}
                />
              </div>
            ))}
            {isTyping && (
              <div className="lp-msg">
                <div className="lp-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <div className="lp-chat-context">
            <span className="lp-ctx-pin" />
            <span>Context:</span>
            <span className="lp-ctx-name lp-mono">
              {activeSlide ? `Slide ${activeSlide.num} · ${activeSlide.name}` : "Lesson"}
            </span>
          </div>

          <div className="lp-chat-foot">
            <div className="lp-suggestions">
              {["Explain like I'm 12", "Why does this matter?", "Quiz me"].map((sg) => (
                <button key={sg} type="button" className="lp-sg" onClick={() => sendChat(sg)}>{sg}</button>
              ))}
            </div>
            <div className="lp-chat-input-row">
              <input
                ref={chatInputRef}
                className="lp-chat-input"
                placeholder="Ask Nova about this slide…"
                value={chatInput}
                onChange={(e) => setChatInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChat(chatInput); }}
              />
              <button type="button" className="lp-chat-send" onClick={() => sendChat(chatInput)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
