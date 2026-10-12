[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd.]::

# bublik-router

`@/router`: the one module that owns URL encoding.

- `parseSearch` / `stringifySearch` — the raw query-string codec (`URLSearchParams`
  in and out, repeated keys as arrays, no coercion), and `createSearchCodec()`,
  the pair a router is created with: the same codec, except that an unchanged
  search keeps the query string as typed.
- the codec catalogue (`str`, `num`, `bool01`, `boolTrue`, `date`, `json`,
  `compressedJson`, `repeated`, `repeatedNum`, `delimited`, `enumOf`,
  `passthrough`, plus `keepRaw` to keep an unparsable string verbatim and
  `validated` to layer a zod schema) and `defineSearch`, which turns a shape of codecs into a route's
  `validateSearch`, its typed-to-wire search middleware and a `withDefaults` reader.
- `splitTo` / `joinTo` / `resolveTo` / `splitTarget` — split a
  `pathname?search#hash` string, join it back, resolve it against the current
  path.
- `useSearchWriter` / `writeSearch` — merge (or replace) keys into the current
  search through the route codecs, or a function of the search the router is
  at right now; replaces the entry (or pushes), keeps `location.state` (or
  drops it with `keepState: false`, as `setSearchParams` did, and then always
  navigates), drops the hash, skips a write that would not change the URL.
- `useAnySearch(select)` — the untyped `useSearch({ strict: false })` for a
  lib that reads its keys through a schema on several routes, or from above
  the page's match.
- `useRenderedLocation` (the location of the page on screen) and
  `useLatestLocation` / `currentLocation` (the location a write must build on,
  counting a navigation committed earlier in the same tick or still loading;
  `window.location` lags a microtask behind).
- `matchRoutePath({ to, fuzzy }, pathname)` — route-path matching for code
  that runs outside the route it tests (sidebar highlighting, analytics);
  `RoutePath` types `to` against the registered route tree.
- `RouterLink` — the TanStack `Link` for a target assembled at runtime, with
  the window scroll left alone and no active props. Links known when the code
  is written are typed: TanStack `Link` or the projects lib's
  `LinkWithProject`.
- `idParams` / `parseId` / `isIdSegment` — the `params` option of the routes
  whose path holds ids (`runId`, `resultId`, `issueId` as numbers, anything
  else not found), and the same rule for a pathname matched outside its
  route.
- `newTabPreload` — a link that opens a new tab never preloads; `RouterLink`
  and `LinkWithProject` apply it.
- `convertOldUrlSearch` / `isOldUrl` / `legacyStringifySearch` — the previous
  codec (`encodeURIComponent`, base64 JSON), kept for the history link
  producers and the redirect of old jsurl (`~`) links; the jsurl parser is
  vendored in `lib/parsing/jsurl.ts`.
- `HistoryState` — the typed `location.state` keys the pages pass each other.
- `@/router/testing` — `renderWithRouter` / `renderHookWithRouter` for specs
  (a `layout` element renders outside the page match).

Nothing outside this library touches `window.history`: TanStack keeps
`__TSR_index`/`__TSR_key` in `history.state`. `pnpm run router:check` enforces
it, together with the absence of `react-router-dom` and `use-query-params`.
`pnpm run links:check` fails on an internal link written as a string where
the route tree does not type it.

## Running unit tests

Run `nx test bublik-router` to execute the unit tests via [Vitest](https://vitest.dev).
