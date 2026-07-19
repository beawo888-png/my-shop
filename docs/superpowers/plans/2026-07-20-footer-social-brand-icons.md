# Footer Social Brand Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recognizable full-color platform icons before all four footer social labels.

**Architecture:** Add a focused `SocialIcon` SVG component in the existing footer file and select its path treatment from the social link data. Extend the existing capsule CSS without adding dependencies or image requests.

**Tech Stack:** React, TypeScript, inline SVG, CSS, Node test runner

## Global Constraints

- Keep all current social URLs and accessible link names unchanged.
- Use 18px decorative SVGs with `aria-hidden="true"`.
- Keep icons and labels on one line at every responsive breakpoint.

---

### Task 1: Add and verify platform icons

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/site-footer.tsx`
- Modify: `app/globals.css`

- [ ] Add a failing source test for `instagram`, `youtube`, `kakao`, and `tiktok` icon variants.
- [ ] Run the focused test and confirm it fails because `SocialIcon` is absent.
- [ ] Implement the four inline SVG treatments and render each before its label.
- [ ] Add fixed icon sizing and `white-space: nowrap` to the existing social capsule styles.
- [ ] Run focused and full tests, lint, build, then refresh the live footer preview.
