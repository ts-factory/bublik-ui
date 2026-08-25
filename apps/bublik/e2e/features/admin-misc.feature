# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-misc.spec.ts — see features/README.md.

Feature: Admin tools

  As an administrator, I reach the Celery task monitor and the usage analytics
  from the admin section.

  Background:
    Given I am signed in as an admin

  @admin
  Scenario: The Flower page embeds the task monitor
    When I open the Flower page
    Then the task monitor frame is embedded

  @admin
  Scenario: The analytics page loads without error
    When I open the analytics page
    Then the page shell is rendered

  # The analytics page is the one place that names its parameters in snake case,
  # matching the API rather than the rest of the app. Its content is rendered
  # conditionally and may fetch nothing on a given deployment, so this pins what
  # holds either way: the link survives the page reading it.
  @admin @url-params
  Scenario: An analytics link keeps its snake case parameters
    Given a link that pins an event type, a path and a page size
    When I open that link
    Then the page shell is rendered
    And the link still carries every parameter it was opened with

