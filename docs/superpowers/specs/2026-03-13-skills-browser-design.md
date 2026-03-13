# Skills Browser Design

## Goal

Turn the Skills page into a pure skills browser by removing role-management controls and role-focused sections from the page while keeping the existing skill detail route.

## Scope

This change applies only to the `companyhelm-web` skills page UI.

In scope:

- remove the page-level `+` action from the Skills page
- remove role-management lists and modals from the Skills page
- show a flat list of all skills on the Skills landing view
- remove role metadata from the skill detail header

Out of scope:

- changes to the dedicated Roles page
- changes to role data models or GraphQL payloads
- changes to git skill package detail behavior

## Design

### Skills landing view

The Skills landing view should render a simple list of all skills for the selected company.

Behavior:

- each list item opens the existing skill detail route
- the list is no longer split into `Roles` and `Skills without roles`
- if there are no skills, show an empty-state message for skills rather than roles
- loading and error handling stay consistent with the current page shell

### Page actions

The Skills page should not register any page-level actions. The existing `+` button currently opens role creation and should be removed entirely from this page.

### Skill detail view

The skill detail header should stop showing role associations. Package metadata, file count, package navigation, rendered/raw content toggle, and file list should remain unchanged.

## Testing

Add or update frontend tests to cover:

- no create-role action rendered for the Skills page
- list view renders skills directly
- role-focused headings and empty states are absent
- skill detail metadata no longer renders the `Roles:` summary

## Risks

- `SkillsPage` currently receives role-management props from `App`, so removing UI may leave temporarily unused props unless the parent wiring is cleaned up too.
- existing tests may assert role text on the skills page and will need to be updated with the new behavior.
