# Frontend Runtime Config Path And S3 Delivery Design

**Date:** 2026-03-11

## Goal

Move frontend runtime configuration off environment-selected app config by introducing explicit `--config-path` support, relocating deployment-owned dev/prod YAML into `companyhelm-infra`, and wiring ECS tasks to download the selected config from S3 at container startup.

## Current Context

- [`scripts/config/generate-runtime-config.js`](/workspace/src/frontend/scripts/config/generate-runtime-config.js) currently requires `--environment <local|dev|prod>` and resolves `config/<environment>.yaml` inside the frontend repo.
- [`scripts/start-preview-container.js`](/workspace/src/frontend/scripts/start-preview-container.js) rebuilds the bundle at container startup using `COMPANYHELM_ENVIRONMENT`, which keeps deployment selection coupled to app behavior.
- [`Dockerfile`](/workspace/src/frontend/Dockerfile) bakes in `COMPANYHELM_ENVIRONMENT=prod` rather than a config file path contract.
- [`frontend/.github/workflows/deploy.yml`](/workspace/src/frontend/.github/workflows/deploy.yml) and [`frontend/.github/workflows/release.yml`](/workspace/src/frontend/.github/workflows/release.yml) both mutate ECS task definitions directly.
- [`companyhelm-infra/.github/workflows/publish-api-config.yml`](/workspace/src/companyhelm-infra/.github/workflows/publish-api-config.yml) already publishes API YAML to S3, and [`envs/dev/main.tf`](/workspace/src/companyhelm-infra/envs/dev/main.tf) plus [`envs/prod/main.tf`](/workspace/src/companyhelm-infra/envs/prod/main.tf) already wire API ECS tasks to download config from S3 before launching with `--config-path /run/companyhelm/config.yaml`.

## Chosen Approach

Mirror the API runtime-config model for frontend.

In `frontend`, make the generator and container entrypoint path-driven:

- `--config-path <path>` is the explicit CLI interface
- `COMPANYHELM_CONFIG_PATH` is the environment fallback
- local development still defaults to `config/local.yaml`
- `--environment` and `COMPANYHELM_ENVIRONMENT` become unsupported for runtime config selection

In `companyhelm-infra`, move deployment-owned frontend YAML into:

- `config/companyhelm-web/dev.yaml`
- `config/companyhelm-web/prod.yaml`

Terraform then owns the S3 buckets, bucket policies, ECS environment variables, and GitHub publisher roles needed for frontend runtime config delivery. Frontend GitHub Actions stop deploying ECS services and only publish immutable images, matching the API repository’s `main-<shortsha>`, `latest`, and release-tag behavior.

## Frontend Design

### Config Generator Contract

[`scripts/config/generate-runtime-config.js`](/workspace/src/frontend/scripts/config/generate-runtime-config.js) should expose the same contract shape the API uses:

- accept `--config-path /path/to/config.yaml`
- accept `--config-path=/path/to/config.yaml`
- reject any use of `--environment`
- if the CLI flag is absent, look for `COMPANYHELM_CONFIG_PATH`
- if both are absent, fall back to `config/local.yaml`

The generator still:

- reads YAML
- resolves `${ENV_VAR}` placeholders
- validates against [`src/config/schema.ts`](/workspace/src/frontend/src/config/schema.ts)
- writes [`src/generated/config.js`](/workspace/src/frontend/src/generated/config.js)

This keeps the runtime config source explicit without changing the config schema itself.

### Local Development

Only [`config/local.yaml`](/workspace/src/frontend/config/local.yaml) remains in the frontend repo. Local commands should use that default automatically, so `npm run dev` keeps working without extra flags.

`npm run build` and `npm run preview` should also become path-driven rather than hardcoding `prod`. They should run the generator against:

- an explicit local path when invoked for local verification
- the container-provided `/run/companyhelm/config.yaml` path during container startup

The repo should no longer document or rely on `config/dev.yaml` or `config/prod.yaml`.

### Container Startup

Frontend container startup should mirror the API entrypoint pattern:

- default `COMPANYHELM_CONFIG_PATH` to `/run/companyhelm/config.yaml`
- if `COMPANYHELM_CONFIG_S3_URI` is present, create the parent directory and download the YAML with `aws s3 cp`
- export `COMPANYHELM_CONFIG_PATH` before launching the preview/start script
- run the existing frontend build/preview flow against the resolved path

This keeps the image environment-agnostic. The task definition chooses the runtime config object; the app process only knows the file path it must load.

### Image Publish Workflow

Frontend GitHub Actions should match the API image-publish-only workflow:

- one workflow file handles pushes to `main` and `v*`
- `main` publishes:
  - `main-<shortsha>`
  - `latest`
- a `v0.0.1` tag publishes:
  - `0.0.1`

If a version tag points at a commit on `main`, the workflow may also publish the release tag when that same commit is built from `main`, matching the API behavior. There should be no ECS deployment, task-definition registration, or service update steps in the frontend repo after this change.

## Infra Design

### Deployment-Owned Frontend YAML

Add deployment-owned frontend YAML files in `companyhelm-infra`:

- [`config/companyhelm-web/dev.yaml`](/workspace/src/companyhelm-infra/config/companyhelm-web/dev.yaml)
- [`config/companyhelm-web/prod.yaml`](/workspace/src/companyhelm-infra/config/companyhelm-web/prod.yaml)

These files become the source of truth for deployed frontend runtime config. The frontend repo keeps only `config/local.yaml` for local development.

### S3 Buckets And Publisher Workflow

Follow the existing API config pattern for frontend:

- create dedicated config buckets for dev and prod frontend
- add bucket versioning, server-side encryption, and public-access blocking
- add bucket policies granting ECS task-role read access to the specific object
- add GitHub Actions S3 publisher roles for `CompanyHelm/companyhelm-infra`
- add a workflow that publishes:
  - `config/companyhelm-web/dev.yaml` on `main`
  - `config/companyhelm-web/prod.yaml` on `v*`

The published object key should be stable, for example `companyhelm-web.yaml`, so ECS does not need task-definition churn for config-only updates.

### ECS Task Wiring

Update both dev and prod frontend ECS tasks in Terraform to inject:

- `COMPANYHELM_CONFIG_PATH=/run/companyhelm/config.yaml`
- `COMPANYHELM_CONFIG_S3_URI=s3://<frontend-config-bucket>/companyhelm-web.yaml`

No per-field frontend runtime values should be passed directly through Terraform environment variables after this change. The task definition points only at the config file path and config object location.

### Deployment Ownership Boundary

After this slice:

- `frontend` repo owns image creation only
- `companyhelm-infra` owns deployed frontend runtime YAML and ECS runtime wiring
- Terraform remains the source of truth for live task definitions

This is the same boundary already established for API runtime config, and it gets frontend off environment-selected app config without expanding into a broader secret-management redesign.

## Error Handling

Frontend generator and startup behavior should fail fast for:

- missing `--config-path` value
- unsupported `--environment`
- missing config file
- invalid YAML
- schema validation failure
- missing placeholder environment variables
- failed `aws s3 cp` during container startup

The failure mode should stay explicit and process-terminating so bad deployments fail quickly instead of starting with partial config.

## Testing

### Frontend

Add or update tests for:

- `--config-path` parsing
- `--environment` rejection
- default fallback to `config/local.yaml`
- `COMPANYHELM_CONFIG_PATH` environment fallback
- runtime config generation from an explicit path
- container startup path resolution and S3 download behavior

Verification should include:

- `npm test`
- a targeted local build using `--config-path` against a temporary YAML fixture
- workflow YAML validation for the updated publish workflow

### Infra

Verify:

- `terraform fmt -check -recursive`
- `terraform validate` in [`envs/dev`](/workspace/src/companyhelm-infra/envs/dev)
- `terraform validate` in [`envs/prod`](/workspace/src/companyhelm-infra/envs/prod)
- workflow YAML validity for the new frontend config publish workflow

### E2E Coverage Check

Inspect `companyhelm-common` e2e coverage for frontend runtime-config assumptions. This slice changes deployment plumbing rather than frontend behavior, so no e2e test changes are expected unless an existing configuration test hardcodes the old env-based contract.

## Out Of Scope

- Redesigning frontend secret management
- Moving local development config out of the frontend repo
- Adding config hot-reload inside running ECS tasks
- Reworking Terraform module structure beyond what is required for frontend config buckets and wiring
- Converting landing or other services to the same pattern in this pass
