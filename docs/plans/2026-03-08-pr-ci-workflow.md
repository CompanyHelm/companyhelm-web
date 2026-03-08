# Pull Request CI Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a pull request workflow that always runs frontend test and build validation, and only runs a Docker image build check when Docker packaging files change.

**Architecture:** Keep deployment and validation separate by adding a new PR workflow file instead of extending the existing deploy workflow. Use one always-on validation job for `npm ci`, `npm test`, and `npm run build`, plus a second Docker build job gated by path-change detection on `Dockerfile` and `.dockerignore`.

**Tech Stack:** GitHub Actions, Node.js, npm, Docker

---

### Task 1: Add the PR validation workflow file

**Files:**
- Create: `.github/workflows/pr.yml`

**Step 1: Write the failing check**

There is no automated local failure harness for GitHub Actions semantics in this repo, so the red step is the absence of a PR workflow file that defines the requested jobs.

**Step 2: Verify current state**

Run: `find .github/workflows -maxdepth 1 -type f -print`
Expected: only `deploy.yml` is present; there is no PR validation workflow.

**Step 3: Write minimal implementation**

```yaml
name: Pull Request CI

on:
  pull_request:
    branches: ["main"]

permissions:
  contents: read

concurrency:
  group: pr-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
```

Add a second Docker job only after the path-filter step is in place.

**Step 4: Run local verification**

Run: `sed -n '1,240p' .github/workflows/pr.yml`
Expected: the new workflow exists and contains the requested PR trigger and validation steps.

**Step 5: Commit**

```bash
git add .github/workflows/pr.yml
git commit -m "ci: add pull request validation workflow"
```

### Task 2: Gate Docker build checks on Docker packaging file changes

**Files:**
- Modify: `.github/workflows/pr.yml`

**Step 1: Write the failing check**

The initial workflow from Task 1 does not yet support conditional Docker build validation.

**Step 2: Verify current state**

Run: `sed -n '1,260p' .github/workflows/pr.yml`
Expected: no job yet detects Docker file changes or runs `docker build`.

**Step 3: Write minimal implementation**

```yaml
  detect-docker-changes:
    runs-on: ubuntu-latest
    outputs:
      docker_changed: ${{ steps.filter.outputs.docker }}
    steps:
      - uses: actions/checkout@v4
      - id: filter
        uses: dorny/paths-filter@v3
        with:
          filters: |
            docker:
              - 'Dockerfile'
              - '.dockerignore'

  docker-build:
    needs: detect-docker-changes
    if: needs.detect-docker-changes.outputs.docker_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build .
```

Keep this job free of AWS auth and image push steps.

**Step 4: Run local verification**

Run: `sed -n '1,260p' .github/workflows/pr.yml`
Expected: the workflow now has a path-filter job and a conditional `docker build` job.

**Step 5: Commit**

```bash
git add .github/workflows/pr.yml
git commit -m "ci: add conditional docker build validation"
```

### Task 3: Verify locally and confirm PR behavior

**Files:**
- Modify: `.github/workflows/pr.yml` (only if verification reveals a problem)

**Step 1: Run local project verification**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

**Step 2: Inspect workflow configuration**

Run: `sed -n '1,260p' .github/workflows/pr.yml`
Expected: `pull_request` trigger, minimal permissions, concurrency, validation job, and conditional Docker job are all present.

**Step 3: Push branch update and confirm workflow appears on PR**

Run: `git push`
Expected: branch updates successfully

Run: `gh pr view 132 --json statusCheckRollup,url`
Expected: the PR now shows the new workflow checks or queued runs.

**Step 4: If necessary, inspect workflow runs**

Run: `gh run list --limit 10`
Expected: recent PR workflow runs are visible for the branch.

**Step 5: Commit only if verification required fixes**

```bash
git add .github/workflows/pr.yml
git commit -m "ci: fix pull request workflow validation"
```
