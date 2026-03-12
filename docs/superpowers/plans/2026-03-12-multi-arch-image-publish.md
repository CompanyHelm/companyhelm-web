# Frontend Multi-Arch Image Publish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the frontend image publish workflow to push a single multi-arch manifest for `linux/amd64` and `linux/arm64`.

**Architecture:** Keep the existing single publish workflow and current tag resolution logic. Add QEMU setup so Buildx can publish both target architectures in one `docker buildx build --push` invocation.

**Tech Stack:** GitHub Actions, Docker Buildx, Amazon ECR Public, shell scripting

---

## Chunk 1: Workflow Update

### Task 1: Convert Frontend Publish Job To Multi-Arch

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Test: `.github/workflows/deploy.yml`

- [ ] **Step 1: Inspect the current workflow before editing**

Run: `sed -n '1,220p' .github/workflows/deploy.yml`
Expected: one `publish` job with existing AWS auth, Buildx setup, and `docker buildx build --platform linux/amd64`

- [ ] **Step 2: Update the workflow to prepare cross-architecture builds**

Change `.github/workflows/deploy.yml` to:
- insert a `docker/setup-qemu-action@v3` step before the Buildx step
- keep the existing tag resolution shell logic unchanged
- change the Buildx invocation to `--platform linux/amd64,linux/arm64`

- [ ] **Step 3: Verify the edited workflow diff**

Run: `git diff -- .github/workflows/deploy.yml`
Expected: only the QEMU step and platform list changed

## Chunk 2: Local Verification

### Task 2: Validate Frontend Workflow Syntax And Scope

**Files:**
- Test: `.github/workflows/deploy.yml`

- [ ] **Step 1: Parse the workflow YAML locally**

Run: `python3 -c "import pathlib, sys, yaml; yaml.safe_load(pathlib.Path('.github/workflows/deploy.yml').read_text())"`
Expected: command exits `0`

- [ ] **Step 2: Check for formatting or whitespace regressions**

Run: `git diff --check`
Expected: no output and exit `0`

- [ ] **Step 3: Confirm no frontend app or e2e code changed**

Run: `git status --short`
Expected: only `.github/workflows/deploy.yml` and this plan/spec documentation are modified
