[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2026 OKTET Labs Ltd.]::

# mcp-servers

Managing the MCP servers a user attaches to their own chat runs: registering
a Streamable HTTP endpoint with the headers it needs, editing or disabling it,
and deleting it.

Header values are write-only. The server stores them encrypted and only ever
reports their names, so the edit form lets a user replace or remove a header
without ever seeing what is stored.

The settings tab is offered only when an administrator has allowed at least one
host in the `user_mcp_servers` block of the AI config.

## Running unit tests

Run `nx test mcp-servers` to execute the unit tests via [Vitest](https://vitest.dev/).
