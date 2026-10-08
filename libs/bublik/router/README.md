[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd.]::

# bublik-router

`@/router`: the one module that owns URL encoding.

- `parseSearch` / `stringifySearch` — the raw query-string codec (`URLSearchParams`
  in and out, repeated keys as arrays, no coercion).
- the codec catalogue (`str`, `num`, `bool01`, `boolTrue`, `date`, `json`,
  `compressedJson`, `repeated`, `repeatedNum`, `delimited`, `enumOf`,
  `passthrough`) and `defineSearch`, which turns a shape of codecs into a route's
  `validateSearch`, its typed-to-wire search middleware and a `withDefaults` reader.
- `splitTo` / `joinTo` — split a `pathname?search#hash` string and join it back.
- `legacyParseSearch` / `legacyStringifySearch` — the previous codec
  (`encodeURIComponent`, base64 JSON), kept for the history link producers and
  the jsurl redirect until those are migrated.

## Running unit tests

Run `nx test bublik-router` to execute the unit tests via [Vitest](https://vitest.dev).
