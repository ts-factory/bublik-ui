# Bublik UI

## Before you start (skip if you want to run via docker)

1. Make sure you installed [pnpm](https://pnpm.io/)
2. Make sure you installed [nx](https://nx.dev/getting-started/installation#installing-nx-globally) globally
3. Make sure you installed [docker](https://docs.docker.com/desktop/) (you can install docker desktop or just docker engine)
4. Create env file `apps/bublik/.env.local` (see `apps/bublik/.env.local.example` for reference)

### To test everything working run following commands

1. `pnpm -v`
2. `nx --version`
3. `docker version`

## Run locally (run with docker)

You would need to name your image ${YOUR_IMAGE_NAME} replace with your value in below commands
You can run UI the following way:

1. Create env file `apps/bublik/.env.local` (see `apps/bublik/.env.local.example` for reference)
2. Build image `docker build -f apps/bublik/Dockerfile.dev . -t ${YOUR_IMAGE_NAME}`
3. Run image `docker run -it --rm -p 4200:4200 -v $(pwd):/app -v /app/node_modules --env-file apps/bublik/.env.local ${YOU_IMAGE_NAME}`
   > If your backend is served from localhost you need to run container on host network
   > Add flag --network host to run image command

> If you add new dependencies to package.json you need to rebuild image

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
