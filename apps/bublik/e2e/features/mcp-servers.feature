# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/mcp-servers.spec.ts — see features/README.md.
#
# The tab only exists once an administrator allowed at least one host in the
# `user_mcp_servers` block of the AI config, and a scenario needs a URL on such
# a host: E2E_MCP_SERVER_URL. Without both, the scenarios are skipped. Every
# scenario that adds a server deletes it again, so the suite stays idempotent.

Feature: MCP servers

  As a user, I register my own MCP servers so the AI assistant can use their
  tools in my chats. A header value I enter is stored encrypted and never
  shown again.

  Background:
    Given I am signed in as an admin
    And the administrator allows user MCP servers

  @mcp-servers
  Scenario: Adding an MCP server lists it without showing its header value
    Given I open the MCP servers settings
    When I add a server with an Authorization header
    Then the server is listed with the header's name
    And the header's value appears nowhere on the page

  @mcp-servers
  Scenario: Editing an MCP server keeps a header whose value is left blank
    Given I open the MCP servers settings
    And I have a server with an Authorization header
    When I rename it and leave the header value blank
    Then the server is listed under its new name with the header still present

  @mcp-servers
  Scenario: The MCP server form refuses a non-http URL
    Given I open the MCP servers settings
    And I open the new-server form
    When I submit it with a URL that has no http scheme
    Then the form reports that the URL must be http or https
    When I close the new-server form
    Then no server was added

  @mcp-servers
  Scenario: Deleting an MCP server asks for confirmation and can be cancelled
    Given I open the MCP servers settings
    And I have a server to delete
    When I ask to delete it and cancel the confirmation
    Then the server is still listed
    When I ask to delete it and confirm
    Then the server is gone from the list
