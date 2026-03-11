# Frontend Runtime Config S3 Delivery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move frontend deployment config to infra-owned YAML in S3, switch frontend runtime loading to explicit `--config-path`, and make the frontend repo publish images only.

**Architecture:** Update `frontend` so runtime config is always loaded from an explicit YAML path, with container startup optionally downloading that YAML from S3 before rebuilding the bundle. Update `companyhelm-infra` to own dev/prod frontend YAML, config buckets, ECS task wiring, and config publish workflows, mirroring the existing API pattern. Keep image creation in `frontend`, but remove ECS deployment logic from its workflows.

**Tech Stack:** TypeScript, node:test, shell scripts, Docker, GitHub Actions, Terraform, AWS ECS, AWS S3

---

## Chunk 1: Frontend Config Path Contract

### Task 1: Add failing generator tests for `--config-path`

**Files:**
- Modify: `frontend/tests/config/generate-runtime-config.test.ts`
- Modify: `frontend/scripts/config/generate-runtime-config.js`

- [ ] **Step 1: Write the failing tests**

Add tests covering:
- `--config-path <path>`
- `--config-path=<path>`
- `COMPANYHELM_CONFIG_PATH` fallback
- default fallback to `config/local.yaml`
- rejection of `--environment`

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/config/generate-runtime-config.test.ts`
Expected: FAIL because the generator still only understands `--environment`.

- [ ] **Step 3: Implement the minimal parser and path-resolution changes**

Update `frontend/scripts/config/generate-runtime-config.js` to:
- replace environment parsing with config-path parsing
- reject `--environment`
- resolve in this order: CLI arg, `COMPANYHELM_CONFIG_PATH`, `config/local.yaml`
- keep placeholder resolution and schema validation unchanged

- [ ] **Step 4: Run the targeted test again**

Run: `npm test -- tests/config/generate-runtime-config.test.ts`
Expected: PASS

### Task 2: Add failing container-start tests for S3/path startup

**Files:**
- Modify: `frontend/tests/config/start-preview-container.test.ts`
- Modify: `frontend/scripts/start-preview-container.js`
- Create: `frontend/scripts/docker-entrypoint.sh`
- Modify: `frontend/Dockerfile`

- [ ] **Step 1: Write the failing tests**

Add tests covering:
- `COMPANYHELM_CONFIG_PATH` defaulting to `/run/companyhelm/config.yaml`
- `COMPANYHELM_ENVIRONMENT` no longer influencing config selection
- the preview script building from the resolved config path

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/config/start-preview-container.test.ts`
Expected: FAIL because the container startup still resolves `COMPANYHELM_ENVIRONMENT`.

- [ ] **Step 3: Implement the startup contract**

Update the frontend container/runtime startup so that:
- `scripts/start-preview-container.js` uses `COMPANYHELM_CONFIG_PATH`
- `scripts/docker-entrypoint.sh` mirrors the API S3-download behavior
- `Dockerfile` uses the new entrypoint and no longer sets `COMPANYHELM_ENVIRONMENT`

- [ ] **Step 4: Run the targeted test again**

Run: `npm test -- tests/config/start-preview-container.test.ts`
Expected: PASS

### Task 3: Update frontend scripts, docs, and local config layout

**Files:**
- Modify: `frontend/package.json`
- Delete: `frontend/config/dev.yaml`
- Delete: `frontend/config/prod.yaml`
- Modify: `frontend/README.md`
- Modify: `frontend/AGENTS.md`

- [ ] **Step 1: Update scripts**

Change `package.json` so:
- `dev` uses the default local fallback
- `build` and `preview` accept explicit `--config-path` through the startup path rather than hardcoded `prod`

- [ ] **Step 2: Update docs and repo guidance**

Remove references to repo-local `config/dev.yaml` and `config/prod.yaml`, and document:
- `config/local.yaml` remains local-only
- deployment YAML lives in `companyhelm-infra`
- `--config-path` and `COMPANYHELM_CONFIG_PATH` are the supported interfaces

- [ ] **Step 3: Run focused frontend verification**

Run:
- `npm test -- tests/config/generate-runtime-config.test.ts tests/config/start-preview-container.test.ts`

Expected: PASS

## Chunk 2: Frontend Image Publish Workflow

### Task 4: Add failing workflow coverage for publish-only tagging

**Files:**
- Modify: `frontend/.github/workflows/deploy.yml`
- Delete: `frontend/.github/workflows/release.yml`
- Modify: `frontend/README.md`

- [ ] **Step 1: Capture the target workflow contract**

Define the required behavior in the plan implementation:
- one workflow triggered by `main` and `v*`
- `main` publishes `main-<shortsha>` and `latest`
- `v0.0.1` publishes `0.0.1`
- no ECS deploy steps remain

- [ ] **Step 2: Implement the workflow**

Mirror the API repo’s image publish logic in `frontend/.github/workflows/deploy.yml`, targeting the `companyhelm-web` ECR repository and deleting `release.yml`.

- [ ] **Step 3: Validate the YAML**

Run:
- `python - <<'PY'
import pathlib, yaml
path = pathlib.Path('.github/workflows/deploy.yml')
yaml.safe_load(path.read_text())
print('deploy.yml ok')
PY`

Expected: PASS

## Chunk 3: Infra Frontend Config Delivery

### Task 5: Add deployment-owned frontend YAML and publish workflow

**Files:**
- Create: `companyhelm-infra/config/companyhelm-web/dev.yaml`
- Create: `companyhelm-infra/config/companyhelm-web/prod.yaml`
- Create or Modify: `companyhelm-infra/.github/workflows/publish-frontend-config.yml`
- Modify: `companyhelm-infra/README.md`

- [ ] **Step 1: Add the frontend runtime YAML files**

Create dev/prod frontend config files with the current deployed values now stored in the frontend repo’s `config/dev.yaml` and `config/prod.yaml`.

- [ ] **Step 2: Add the publish workflow**

Create a workflow parallel to the API publisher:
- `main` publishes dev YAML
- `v*` publishes prod YAML
- prod validates tag ancestry against `main`

- [ ] **Step 3: Validate the workflow YAML**

Run:
- `python - <<'PY'
import pathlib, yaml
path = pathlib.Path('.github/workflows/publish-frontend-config.yml')
yaml.safe_load(path.read_text())
print('publish-frontend-config.yml ok')
PY`

Expected: PASS

### Task 6: Add Terraform buckets, policies, roles, and ECS wiring

**Files:**
- Modify: `companyhelm-infra/envs/dev/main.tf`
- Modify: `companyhelm-infra/envs/dev/variables.tf`
- Modify: `companyhelm-infra/envs/dev/outputs.tf`
- Modify: `companyhelm-infra/envs/prod/main.tf`
- Modify: `companyhelm-infra/envs/prod/variables.tf`
- Modify: `companyhelm-infra/envs/prod/outputs.tf`

- [ ] **Step 1: Write the minimal Terraform additions**

Mirror the API config resources for frontend:
- config buckets
- bucket versioning/encryption/public-access blocking
- bucket policy granting ECS task-role read access
- GitHub Actions S3 publisher roles
- ECS `COMPANYHELM_CONFIG_PATH` and `COMPANYHELM_CONFIG_S3_URI` plain environment values for web tasks

- [ ] **Step 2: Keep existing image wiring unchanged**

Do not redesign the web ECS module. Only add the frontend config resources and environment wiring needed for this slice.

- [ ] **Step 3: Run Terraform formatting and validation**

Run:
- `terraform fmt -check -recursive`
- `terraform -chdir=envs/dev init -backend=false`
- `terraform -chdir=envs/dev validate`
- `terraform -chdir=envs/prod init -backend=false`
- `terraform -chdir=envs/prod validate`

Expected: PASS

## Chunk 4: Cross-Repo Verification And Review

### Task 7: Inspect `companyhelm-common` e2e coverage and run final checks

**Files:**
- Inspect only: `companyhelm-common/tests/system/05-configuration/configuration.spec.ts`
- Inspect only: nearby `companyhelm-common` config/system helpers

- [ ] **Step 1: Inspect e2e assumptions**

Search for frontend runtime config assumptions tied to `COMPANYHELM_ENVIRONMENT` or repo-local `config/dev.yaml` and `config/prod.yaml`.

- [ ] **Step 2: Run final frontend verification**

Run in `frontend`:
- `npm test`
- targeted startup command using an explicit config path fixture if needed

- [ ] **Step 3: Record whether `companyhelm-common` needs updates**

If no e2e changes are required, record that outcome in the final summary. If a config-path assumption exists, make the smallest corresponding update.

- [ ] **Step 4: Prepare git branches, commits, and PRs**

For each touched repo:
- create a feature branch
- commit only the repo’s relevant changes
- rebase onto latest `origin/main`
- push and open PR with a body file

- [ ] **Step 5: Watch PR checks and fix issues if needed**

Do not conclude until the PR checks for both repos are green or a concrete blocker is identified.
