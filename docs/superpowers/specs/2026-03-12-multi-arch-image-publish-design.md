# Frontend Multi-Arch Image Publish Design

## Goal

Make the frontend image publish workflow push a multi-architecture image manifest for `linux/amd64` and `linux/arm64`.

## Scope

- Change only `.github/workflows/deploy.yml`.
- Keep the existing ECR login, tag resolution, and trigger behavior.
- Do not change the Dockerfile, runtime configuration, or deployment wiring.

## Workflow Shape

- Keep the existing single `publish` job.
- Add QEMU setup before Buildx so the GitHub-hosted runner can build the non-native target architecture.
- Keep the current tag computation for:
  - `main-<shortsha>`
  - `latest`
  - stripped `v*` tags for release tags that point at the pushed commit
- Replace the current single-platform Buildx publish with a manifest publish for:
  - `linux/amd64`
  - `linux/arm64`

## Constraints

- Preserve the current publish-only boundary for the repo.
- Avoid matrix jobs or manifest assembly steps unless a single Buildx invocation is insufficient.
- Keep the workflow readable and close to the current structure so future image-tagging changes stay low-risk.

## Verification

- Validate the workflow YAML locally.
- Review the Buildx command to confirm both target platforms are published in one invocation.
- Check that no `companyhelm-common` end-to-end coverage needs updates for this CI-only workflow change.
