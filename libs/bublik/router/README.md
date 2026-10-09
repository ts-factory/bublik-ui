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
- `splitTo` / `joinTo` — split a `pathname?search#hash` string and join it back.
- `legacyParseSearch` / `legacyStringifySearch` — the previous codec
  (`encodeURIComponent`, base64 JSON), kept for the history link producers and
  the jsurl redirect until those are migrated.
- the Phase 2 compat layer (`lib/compat`): `react-router-dom` shaped
  `useSearchParams`, `useParams`, `useLocation`, `useNavigate`, `Link`,
  `Navigate`, `Outlet`, `matchPath`, `parsePath`/`createPath`, and
  `use-query-params` shaped `useQueryParam`/`useQueryParams`, `withDefault` and
  the standard param configs, all on the TanStack router with the same push and
  replace semantics and byte-identical query strings. Pages move off it in
  Phase 3; nothing new should import from it.

The compat shims never reset the window scroll or scroll to the hash (the
TanStack router would do both on every navigation). Reads see the rendered
location, as React Router's did; a write builds its whole target on
`useLatestLocation`, the location the router holds right now (a navigation
committed earlier in the same tick, or one whose page is still loading),
because `window.location` only catches up a microtask later.

## Running unit tests

Run `nx test bublik-router` to execute the unit tests via [Vitest](https://vitest.dev).
