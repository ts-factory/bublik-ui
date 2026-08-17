# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-details.spec.ts — see features/README.md.

Feature: Run details

  As an engineer investigating a test session, I open a run to read its metadata,
  walk the package/test tree, open the result table of an individual test, and
  jump from a result to its log, history or measurements.

  Background:
    Given I am signed in

  @smoke
  Scenario: Run details show the metadata recorded in the manifest
    Given the fixture manifest describes an imported run
    When I open that run's page
    Then the info card shows the run id
    And the info card shows the conclusion

  Scenario: Exposing the run info reveals the full detail set
    Given I open an imported run's page
    When I expose the full run info
    Then the info card also shows the run status and duration

  Scenario: Expanding a package reveals the tests it contains
    Given I open an imported run's page
    When I expand the first collapsed package of the tree
    Then more rows are shown than before

  @needs-nok
  Scenario: Open NOK expands the result tables of the unexpected results
    Given I open a run that has unexpected results
    When I press Open NOK
    Then at least one result table is expanded
    When I press Reset
    Then no result table is expanded

  @needs-nok
  Scenario: Preview NOK expands the tree without opening result tables
    Given I open a run that has unexpected results
    When I press Preview NOK
    Then the tests with unexpected results are listed
    And no result table is expanded

  Scenario: Clicking a count badge opens that test's result table
    Given I open an imported run's page and expand the tree down to a test
    When I click a count badge of that test row
    Then that test's result table is expanded

  Scenario: A result row links to the log of that result
    Given I open an imported run's page with a result table expanded
    When I follow the result's Log link
    Then the log page opens focused on that result

  Scenario: The compare form rejects a value that is not a run
    Given I open an imported run's page
    When I open the compare form and submit an invalid run reference
    Then the form reports that the value is not a valid URL or run id

  @needs-report
  Scenario: The reports menu lists the configured report
    Given I open a run whose project has a report config
    When I open the reports menu
    Then the configured report is offered
