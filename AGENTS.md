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

### UI Styling
- **Tailwind CSS** with `@/shared/tailwind-ui` components
- **Radix UI** primitives for accessible components
- Use `cn` for conditional class names
- Follow utility-first approach with Tailwind classes

### Module Boundaries
Enforced by ESLint rule `@nx/enforce-module-boundaries`:
- Libraries can only depend on other buildable libraries
- Follow the dependency graph defined in nx.json

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
- Use `react-router-dom` v6
- `useSearchParams` for query parameters
- `useParams` with typed route params from `@/shared/types`
