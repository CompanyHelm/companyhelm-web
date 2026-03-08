# Pull Request CI Workflow Design

## Summary

This change adds pull request validation for the frontend repository without changing deploy behavior on `main`.

Pull requests should always run:

- `npm ci`
- `npm test`
- `npm run build`

Pull requests should also run a Docker image build check only when the container packaging inputs change. In this repository that means:

- `Dockerfile`
- `.dockerignore`

The Docker build should validate that the image still builds, but it must not push anything to ECR.

## Goals

- Add visible CI checks to pull requests.
- Keep deploy-to-ECR behavior isolated to pushes on `main`.
- Avoid AWS credential use in PR validation.
- Avoid paying the Docker build cost on PRs that do not touch Docker packaging files.

## Non-Goals

- Reworking the existing deploy workflow.
- Publishing preview images for pull requests.
- Adding linting or extra static analysis beyond the requested test and build steps.

## Current State

The repository currently has one GitHub Actions workflow, `deploy.yml`, which runs only on pushes to `main`. It builds and pushes the production container image to ECR. Because there is no `pull_request` workflow, PRs show no automated checks.

## Proposed Approach

### Separate PR Validation Workflow

Add a new workflow file for PR validation instead of folding PR logic into `deploy.yml`.

This keeps concerns clean:

- `deploy.yml` remains production deployment automation
- the new PR workflow becomes the branch validation gate

The PR workflow should trigger on `pull_request` events targeting `main`.

### Validation Job

The main validation job should:

1. check out the repository
2. set up Node.js
3. cache npm dependencies
4. run `npm ci`
5. run `npm test`
6. run `npm run build`

Permissions should stay minimal with `contents: read`.

Add workflow concurrency so new pushes cancel older runs for the same PR branch.

### Conditional Docker Build Job

Add a second job that runs `docker build` only when Docker packaging files changed in the PR.

Use a lightweight path filter step to detect changes to:

- `Dockerfile`
- `.dockerignore`

If neither file changed, the Docker job should be skipped. If either file changed, the job should:

1. check out the repository
2. build the image locally with `docker build .`

It should not log in to ECR and should not push anything.

## Testing Strategy

- Validate the workflow YAML locally as plain file changes.
- Run the frontend verification commands locally:
  - `npm test`
  - `npm run build`
- Push the branch update and confirm the new PR workflow appears on the existing pull request.
- Confirm the Docker build job only appears or runs when the Docker files are changed.

## Risks

- Using the wrong path filter action or output key could cause the Docker job to always skip or always run.
- If the PR workflow duplicates too much setup work, it can be slower than necessary.
- If the workflow uses broad permissions, it would expand PR blast radius unnecessarily.
