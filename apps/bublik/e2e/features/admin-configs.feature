# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-configs.spec.ts — see features/README.md.
#
# Read-only paths only: the fixture projects and configs are created by the
# bublik-e2e CLI, and mutating them here would make re-runs non-idempotent.

Feature: Configuration

  As an administrator, I browse the projects and their configurations, open one
  to read its JSON, and inspect the schema it is validated against.

  Background:
    Given I am signed in as an admin

  @admin
  Scenario: The configuration page lists the fixture projects
    When I open the configuration page
    Then every project from the fixture manifest is listed

  @admin
  Scenario: Opening a configuration shows its JSON in the editor
    Given the API reports a configuration
    When I open that configuration
    Then the editor shows its content

  @admin
  Scenario: The editor can show the schema the configuration is validated against
    Given I open a configuration
    When I open the schema view
    Then the schema is shown
