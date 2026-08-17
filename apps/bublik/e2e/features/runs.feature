# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/runs-page.spec.ts — see features/README.md.

Feature: Runs

  As an engineer looking for a particular test session, I filter the runs list by
  date, metadata and tag expressions, read each run's OK/NOK summary, and go from
  there to a run, its log, or a comparison of several runs.

  Background:
    Given I am signed in

  @smoke
  Scenario: Runs table lists a run matching a tag expression
    Given the fixture manifest describes an imported run
    When I open the runs page filtered by that run's fixture tag
    Then the runs table lists that run

  Scenario: The Run link opens the run details page
    Given the runs table lists a run
    When I follow the row's Run link
    Then the run details page is open

  Scenario: The Log link opens the log page
    Given the runs table lists a run
    When I follow the row's Log link
    Then the log page for that run is open

  Scenario: Sorting by statistic summary keeps the run listed
    Given the runs table lists a run
    When I sort the table by statistic summary
    Then the table is still healthy and the run is listed

  @needs-nok
  Scenario: The NOK summary badge reports the unexpected result count
    Given the fixture manifest describes a run with unexpected results
    When I open the runs page filtered by that run's fixture tag
    Then the row's NOK badge shows the unexpected result count from the manifest

  @needs-nok
  Scenario: Clicking the NOK badge opens the run with unexpected rows previewed
    Given the fixture manifest describes a run with unexpected results
    When I open the runs page filtered by that run's fixture tag
    And I click the row's NOK badge
    Then the run page for that run is open
    And the tests with unexpected results are listed on the run page

  Scenario: Applying a tag expression writes it to the URL
    Given I open the runs page for a date covered by the fixtures
    When I type a tag expression and submit the form
    Then the tag expression is recorded in the URL

  Scenario: Resetting the form clears the filters from the URL
    Given I open the runs page with a date range and a tag expression
    When I reset the form
    Then the URL no longer carries the filters

  Scenario: A tag expression that matches nothing shows the empty state
    When I open the runs page filtered by a tag that no run carries
    Then the runs page shows the "No runs found" empty state

  Scenario: Selecting two runs offers comparison and multi-run views
    Given the fixture manifest describes two imported runs
    When I open the runs page covering both runs
    And I select both rows
    Then the selection popover reports two selected runs
    And it offers to open them in the multiple-runs view
    And it offers to compare them

  Scenario Outline: The runs page renders every view mode
    When I open the runs page in the given mode
    Then the mode's own section is rendered

    Examples:
      | mode     |
      | charts   |
      | progress |
