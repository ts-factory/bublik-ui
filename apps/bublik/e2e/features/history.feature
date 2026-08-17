# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/history-page.spec.ts — see features/README.md.

Feature: History

  As an engineer asking "has this test ever passed?", I build a query in the
  global search form — test path, parameters, run metadata, verdicts — apply it,
  narrow the results further, and switch between the list and chart views.

  Background:
    Given I am signed in

  @smoke
  Scenario: Searching by test path queries the history API
    Given the fixture manifest describes a tested path
    When I search the history for that test path
    Then the history request is sent for that test path
    And the search form closes

  Scenario: The applied search is reflected in the URL
    Given I open the history page
    When I search the history for a test path
    Then the test path is recorded in the URL

  Scenario: The verdict lookup type can be switched to regex
    Given I open the global search form
    When I switch the verdict lookup to regex
    Then the regex lookup is selected

  # The footer Reset restores the form's defaults rather than emptying it: the
  # test path anchors a history query, so only the narrowing fields are cleared.
  Scenario: Resetting the search form clears the narrowing fields but keeps the test path
    Given I open the global search form with a test path and a hash entered
    When I reset the form
    Then the hash is cleared
    And the test path is kept

  Scenario: The substring filter narrows the results already loaded
    Given I search the history for a test path
    When I type a substring that no result matches
    Then the substring filter holds that value

  Scenario Outline: The history page renders every result mode
    When I open the history page in the given mode
    Then the history page is ready

    Examples:
      | mode        |
      | aggregation |
      | linear      |
