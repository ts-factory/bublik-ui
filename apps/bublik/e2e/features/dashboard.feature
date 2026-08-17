# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/dashboard.spec.ts — see features/README.md.

Feature: Dashboard

  As an engineer watching the test lab, I open the dashboard to see what ran on a
  given day, spot the runs with unexpected results, and get from a NOK counter to
  the failing tests in one click.

  Background:
    Given I am signed in

  @smoke
  Scenario: Dashboard lists the runs imported for a date
    Given the fixture manifest describes a run with a dashboard date
    When I open the dashboard for that date
    Then the run appears as a row in the dashboard table
    And the row shows its conclusion, total and NOK counters

  Scenario: Dashboard shows an empty state for a date without runs
    Given the fixture manifest declares a date with no runs
    When I open the dashboard for that date
    Then the dashboard shows the "No data" empty state
    And none of the imported runs are listed

  @needs-nok
  Scenario: NOK counter reports the number of unexpected results from the manifest
    Given the fixture manifest describes a run with unexpected results
    When I open the dashboard for that run's date
    Then the run's NOK counter equals the unexpected result count from the manifest

  @needs-nok
  Scenario: Clicking the NOK counter opens the run with unexpected rows previewed
    Given the fixture manifest describes a run with unexpected results
    When I open the dashboard for that run's date
    And I click the run's NOK counter
    Then the run page for that run is open
    And the packages containing unexpected results are expanded
    And the tests with unexpected results are listed
    But no result table is expanded yet

  @needs-nok
  Scenario: Ctrl-clicking the NOK counter opens the run with the result tables expanded
    Given the fixture manifest describes a run with unexpected results
    When I open the dashboard for that run's date
    And I ctrl-click the run's NOK counter
    Then the run page for that run is open
    And the result table of a test with unexpected results is expanded

  # Which page a counter opens is deployment configuration (the backend attaches
  # a handler per column), so the scenario checks the mapping, not one layout.
  Scenario: Clicking the total counter follows the destination the dashboard declares
    Given the dashboard API declares a destination for the run's total counter
    When I open the dashboard for that date
    And I click the run's total counter
    Then that declared destination is open

  Scenario: Expanding a dashboard row reveals the run's pass rate history
    Given the fixture manifest describes a run with a dashboard date
    When I open the dashboard for that date
    And I expand the run's row
    Then the row's pass rate history is shown
    When I collapse the run's row
    Then the row's pass rate history is hidden

  Scenario: Searching the dashboard narrows the table to matching runs
    Given the fixture manifest describes a run with a dashboard date
    When I open the dashboard for that date
    And I search for a term that no run matches
    Then the run is no longer listed
    When I clear the search
    Then the run is listed again

  Scenario: Switching the layout mode shows two days side by side
    Given the fixture manifest describes a run with a dashboard date
    When I open the dashboard for that date
    And I switch the layout to two days per column
    Then the dashboard URL records the columns mode
    And the run is still listed

  Scenario: The Today button returns the dashboard to the current day
    Given the fixture manifest describes a run with a dashboard date
    When I open the dashboard for that date
    And I press the Today button
    Then the dashboard URL no longer pins a date
