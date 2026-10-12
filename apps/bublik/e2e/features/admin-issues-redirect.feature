# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/legacy-redirects.spec.ts — see features/README.md.
#
# Route: /admin/issues/$

Feature: Legacy admin issues addresses

  As an engineer following a link to the issues pages from when they lived
  under `/admin`, I land on the page at its new address with everything the
  link carried, and Back takes me where I came from rather than bouncing.

  Background:
    Given I am signed in

  # The search string and the hash are forwarded verbatim: `project` is
  # multi-valued and `_s` carries the whole sidebar memory, so nothing is
  # rebuilt on the way.
  @issues @needs-classification @url-params
  Scenario: The legacy issues address opens the issues list with its search and hash
    Given a legacy admin issues link scoped to a project with sidebar memory and an anchor
    When I open that link
    Then the issues list is open
    And the URL still carries the project, the sidebar memory and the anchor

  @issues @needs-classification @url-params
  Scenario: The legacy rules address opens the rules list with its filters
    Given a legacy admin rules link with the active facet
    When I open that link
    Then the rules list is open
    And the URL still carries the facet

  @issues @needs-classification @url-params
  Scenario: The legacy issue address opens that issue
    Given a legacy admin link to a seeded issue
    When I open that link
    Then that issue's page is open

  @issues @url-params
  Scenario: A legacy admin issues address is replaced rather than kept in history
    Given I open the dashboard
    When I open a legacy admin issues link
    Then the issues list is open
    When I go back
    Then the dashboard is open again
