[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd.]::

# Bublik UI

## Package manager

We use pnpm as our package manager so to start you will need to install it, please refer to [pnpm documentation](https://pnpm.io/) for installing instructions

All commands should be run like this `pnpm exec nx ...etc` or you can add alias to your .bashrc like this `alias pnx="pnpm nx --"`, then you can run like this `pnx ...`

## Monorepo tools

We use [Nx](https://nx.dev/getting-started/intro) for monorepo, you would need to install nx cli globally or run commands via `npx` or `pnpm dlx...`

## Project structure

```
📦 dist
 ┣ 📂 apps - Built production ready applications
📦 apps
┣ 📂 bublik - Bublik UI Application
📦 libs
 ┣ 📂 bublik - Bublik UI application specific libs
 ┃ ┣ 📂 +state - Redux state
 ┃ ┣ 📂 config - Different Bublik UI configs (needed for UI to work correctly)
 ┃ ┣ 📂 features - Specific Bublik UI featires implementation
 ┃ ┣ 📂 router - Router helpers, encoding/decoding search params
 ┣ 📂 env - Env helper lib
 ┣ 📂 services - General services for data-access
 ┃ ┗ 📂 bublik-api - Bublik API hooks/methods (RTK Query)
 ┣ 📂 shared - Shared libraries for multiple apps to consume
 ┃ ┣ 📂 charts - Apache Echarts components
 ┃ ┣ 📂 hooks - Shared react hooks
 ┃ ┣ 📂 icons - UI Icons
 ┃ ┣ 📂 tailwind-ui - Shared UI components
 ┃ ┣ 📂 types - Shared interfaces and types
 ┃ ┣ 📂 utils - Shared general utils
```

## Config

To create new Bublik UI frontend for deployment you would need to follow these steps:

1. Add needed configuration to `apps/bublik/project.json`
2. `base` - where the app will be mounted it **must start with `/`** and **no** trailing slash at the end

Example:

```json
{
	"demo": {
		"base": "/prefix",
		"outputPath": "dist/apps/bublik-app"
	}
}
```

## Local development

Make sure you installed nrwl [nx monorepo tools](https://nx.dev/getting-started/intro)
Example: 'pnpm add -g nx'

To start development, please follow this steps:

1. Clone repo 
2. Run `pnpm install` to install dependencies
3. Run `pnpm start` to start development server

## Commands

- `pnpm start` - starts Bublik UI in development mode
- `pnpm test` - runs tests in parallel for all projects
- `pnpm bublik:serve:prod` - starts Bublik UI in production mode
- `pnpm bublik:storybook` - starts storybook for Bublik UI
- `pnpm bublik:build-storybook` - builds storybook for Bublik UI
- `pnpm bublik:ci:build` - builds all Bublik UI application in production mode

## Misc

- If you want to connect to particular backend remote or local you can proxy all you requests with `apps/bublik/vite.config.ts`

## Common errors and solutions

- `pnpm ...` - command not working
  - try to run command with `pnpm exec nx ...`
- Error installing packages like `react-vtree` and `legacy-peer-deps` errors
  - try to add flag `legacy-peer-deps`
- Tailwind classes not working in storybook
  - try adding lib/app path to `libs/shared/storybook/tailwind.config.js`
- Storybook not finding stories in your lib/app
  - try adding lib/app path to `libs/shared/storybook/.storybook/main.js`
- Storybook tailwind classes not working
  - try removing `node_module` and installing with `pnpm install`

## Release

We are using release-it to automate releases. To release new version of Bublik UI you need to run `pnpm release` and follow the instructions.
Or run `pnpm release -- --dry-run` to see what will be done.
You can also release from GitHub actions menu specifying what type of release you want to do.
