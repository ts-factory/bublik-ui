[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2026 OKTET Labs Ltd.]::

# access-tokens

Managing personal access tokens: the tokens a user issues so a headless client
-- an LLM agent talking to the MCP server, a CI job, a script -- can call
Bublik on their behalf.

A token's value is shown exactly once, at creation, and the server keeps
nothing that could reproduce it, so the reveal dialog is the only place it
ever appears.

## Running unit tests

Run `nx test access-tokens` to execute the unit tests via [Vitest](https://vitest.dev/).
