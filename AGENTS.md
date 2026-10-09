## Build, Lint, Test Commands
```bash
# Build
nx build                   # Build all projects
nx run bublik:build        # Build specific app/lib
nx affected:build          # Build only affected projects

# Test
nx test                    # Run all tests
nx test <project-name>     # Run tests for specific project
nx test libs/shared/hooks  # Run tests for specific lib
nx affected:test           # Test only affected projects

# For running a single test file:
nx test <project> -- <path-to-spec-file>

# Lint
nx lint                    # Lint all projects
nx lint <project-name>     # Lint specific project
nx affected:lint           # Lint only affected projects

# Format
pnpm run format:check      # Check formatting
pnpm run format            # Format all files with Prettier
```

## Code Style Guidelines

### File Headers
Every source file MUST include SPDX license headers:
```typescript
/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
```

### Imports & Path Aliases
Use defined path aliases from tsconfig.base.json:
- `@/bublik/*` - Bublik-specific features and state
- `@/shared/*` - Shared libraries (hooks, utils, types, UI components)
- `@/services/bublik-api` - API service with RTK Query
- `@/icons` - Icon library
- `@/router` - Routing utilities

Import order: external libs, then internal shared libs, then project-specific imports.

### Component Architecture
Use **Container/Component pattern**:
- `*.container.tsx` - Connected components with hooks/state
- `*.component.tsx` - Presentational components receiving props

Example:
```typescript
function MyComponent(props: MyComponentProps) { ... }
function MyComponentContainer() { /* hooks and state */ }
```

### Exports
Use exports at the end of the file for components and types:
```typescript
export { MyComponent, MyComponentContainer };
```

### Naming Conventions
- **Components**: PascalCase (e.g., `RunsTable`, `UserProfile`)
- **Hooks**: camelCase with `use` prefix (e.g., `useRunsQuery`, `useDebounce`)
- **Redux actions/reducers**: camelCase (e.g., `updateGlobalFilter`, `resetSelection`)
- **Files**: kebab-case for folders, camelCase or PascalCase for files
- **Constants**: UPPER_SNAKE_CASE (e.g., `RUNS_PAGE_SLICE`, `AUTH_ERROR_CODE`)

### State Management (Redux Toolkit)
- Use RTK Query for API calls (`@/services/bublik-api`)

### Error Handling
Centralized error handling via `getErrorMessage` from `@/services/bublik-api`:
- Returns standardized `BublikError` type with `status`, `title`, `description`
- Handles HTTP errors, validation errors (Zod), fetch errors
- Display errors using UI components from `@/shared/tailwind-ui`

### TypeScript
- **Strict mode** enabled
- Type all function parameters and return values explicitly in public APIs

### Testing
- **Vitest** for most libraries (configured via project.json)
- **React Testing Library** for component testing
- **Test files**: `*.spec.tsx` or `*.test.tsx` alongside source files

### E2E Testing (Playwright)
- Specs live in `apps/bublik/e2e/`, page objects in `e2e/pages/`, fixture-data
  helpers in `e2e/support/`
- Every route has a Gherkin `.feature` file in `e2e/features/` whose `Scenario`
  names are used verbatim as `test()` titles — read
  **`apps/bublik/e2e/features/README.md`** before adding or renaming a test
- `pnpm run e2e:features:check` fails when a scenario has no test; it also runs
  as part of `nx run bublik:e2e` and `task e2e:types:check`
- Test data comes from the fixture manifest (`requireManifest()`), never from
  hardcoded run ids; missing fixture data must fail via `requireCapability`
  rather than skip
- The stack is dockerized: `task e2e:up && task e2e:seed && task e2e:test` from
  `bublik-docker`. App source changes only reach the suite after a rebuild
  (`task e2e:up` does one), since the served UI is baked into the image

### UI Styling
- **Tailwind CSS** with `@/shared/tailwind-ui` components
- **Radix UI** primitives for accessible components
- Use `cn` for conditional class names
- Follow utility-first approach with Tailwind classes

### Module Boundaries
Enforced by ESLint rule `@nx/enforce-module-boundaries`:
- Libraries can only depend on other buildable libraries
- Follow the dependency graph defined in nx.json
- Libraries never import from `apps/`. The route tree and its `Register`
  augmentation live in `apps/bublik`; a feature lib gets typed `to`/`params`
  only because it compiles inside the app's program, so `nx run
  bublik:typecheck` (not the lib's own tsc) is the gate for typed routing code

### API Integration
Use RTK Query hooks from `@/services/bublik-api`:
- Query hooks: `useGet...Query`, `useLazyGet...Query`
- Mutation hooks: `use...Mutation`
- Prefetch with `usePrefetch`

### File Organization within Libraries
```
libs/<scope>/<lib-name>/src/
├── lib/
│   ├── *.component.tsx     # Presentational components
│   ├── *.container.tsx     # Connected components
│   ├── *.hooks.ts          # Custom hooks
├── index.ts                # Public API exports
└── types.ts                # Shared types (if any)
```

### Validation
Use **Zod** for runtime validation:
- Import from `'zod'`
- Define schemas alongside types where needed

### Utilities
Use shared utilities from `@/shared/utils`:
- `uniqBy`, `equals`, `differenceWith` from remeda
- Custom utilities for time, tree, formatting, etc.

### Router Integration
- TanStack Router is the only router. URLs are a byte-identical contract with
  the pre-migration app: keep every one when changing a route, a search
  key, a link or a write's push/replace
- Routes are files under `apps/bublik/src/routes/` (`routeTree.gen.ts` is
  generated and committed; a build regenerates it). A route file stays thin:
  its `defineSearch` schema, `beforeLoad` redirects and the page component.
  Every page route needs a `# Route: <fullPath>` line in an e2e feature file
  (`pnpm run e2e:features:check` fails otherwise)
- Search params are declared with the `@/router` codecs (`str`, `num`,
  `bool01`, `enumOf`, `compressedJson`, `keepRaw`, …) in
  `defineSearch(shape, defaults)`, never with TanStack's default JSON codec.
  Read through `getRouteApi('<route id>').useSearch({ select })` over the
  schema's `withDefaults` (defaults live in the reader, never in
  `validateSearch`); write through `useSearchWriter` (replace, merge) or the
  route's `useNavigate` with a functional `search`
- Links and navigation are typed: TanStack `Link`/`useNavigate`/`linkOptions`
  with `to` + `params` + `search`, passing `resetScroll={false}` and
  `activeProps={{}}` (React Router neither scrolled nor added an active
  class); `LinkWithProject`/`useNavigateWithProject` to carry `project`, `_s`
  and `hide-sidebar`; the `routes.*` builders for run, log, measurements and
  issue targets. `RouterLink` from `@/router` (those defaults built in) is
  only for a target assembled at runtime. Never hand-build an internal URL
  string
- Location: `useRenderedLocation()` is the page on screen;
  `useLatestLocation()`/`currentLocation(router)` is what a write builds on.
  Never write from `window.location` and never touch `window.history`
  (`pnpm run router:check`, part of CI lint, fails on `history.pushState`,
  `replaceState` or `history.state` outside `@/router`, and on any
  `react-router-dom` or `use-query-params` import)
- Matching a pathname outside its route (sidebar highlighting, analytics):
  `matchRoutePath({ to, fuzzy }, pathname)` from `@/router`
- Path params come from the route API (`getRouteApi(id).useParams()`), or
  `useParams({ strict: false })` in a lib that renders above the page's match
- Specs render through `renderWithRouter`/`renderHookWithRouter` from
  `@/router/testing` and assert on `router.history.location`; never mock a
  router module
