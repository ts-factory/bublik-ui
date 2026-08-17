# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/log-page.spec.ts — see features/README.md.

Feature: Log

  As an engineer reading a failing session, I open the run log, walk the result
  tree, focus a single test, narrow the tree to the failures, bookmark a log line
  to share, and jump from a result to its measurements.

  Background:
    Given I am signed in

  @smoke
  Scenario: The log layout follows the selected mode
    Given the fixture manifest describes an imported run
    When I open its log in the tree-and-info mode
    Then both the tree and the info panel are shown
    When I open its log in the log-only mode
    Then neither the tree nor the info panel is shown

  Scenario: Focusing a tree item loads that result's log
    Given the run's tree contains a test result
    When I open the log focused on that result
    Then the tree marks that result as focused
    And the JSON log is rendered
    When I go back to the run log
    Then the JSON log is rendered

  @needs-nok
  Scenario: The NOK-only tree keeps the focused error result reachable
    Given a run with unexpected results has an error result in its tree
    When I open the log focused on that error result
    And I turn on the NOK-only tree
    And I scroll to the focused result
    Then the tree marks that result as focused

  Scenario: The legacy toggle switches the log renderer
    Given I open the log of an imported run
    Then the JSON log is rendered
    When I turn on the legacy log
    Then the legacy log frame is shown
    When I turn off the legacy log
    Then the JSON log is rendered

  Scenario: Bookmarking a log line survives a reload
    Given I open the log focused on a test result
    When I click a log line number
    And I reload the page
    Then the bookmarked line is still recorded in the URL

  @needs-measurements
  Scenario: A result with measurements links to its measurements page
    Given the fixture manifest describes a result with measurements
    When I open the log focused on that result
    And I follow the Result link
    Then the measurements page is open
