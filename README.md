[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd.]::
# Bublik UI

## Before you start (skip if you want to run via docker)

1. Make sure you installed node, you can use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm)
2. Make sure you installed [pnpm](https://pnpm.io/)
3. Make sure you installed [nx](https://nx.dev/getting-started/installation#installing-nx-globally) globally
4. Make sure you installed [docker](https://docs.docker.com/desktop/) (you can install docker desktop or just docker engine)
5. Create env file `apps/bublik/.env.local` (see `apps/bublik/.env.local.example` for reference)

### To test everything working run following commands

1. `node -v` used node version in file `.nvmrc`
2. `pnpm -v`
3. `nx --version`
4. `docker version`

## Run locally (run with docker)

You can run UI the following way:

1. Create env file `apps/bublik/.env.local` (see `apps/bublik/.env.local.example` for reference)
2. Build image `pnpm run docker:build` OR `docker build -f apps/bublik/Dockerfile.dev . -t bublik-ui`
3. Run image `pnpm run docker:start` OR `docker run -it --rm -p 4200:4200 -v $(pwd):/app -v /app/node_modules --env-file apps/bublik/.env.local bublik-ui`

Caveats:
- Add flag --network host to run image command if django is served from host
- If you add new dependencies to package.json you need to rebuild image

