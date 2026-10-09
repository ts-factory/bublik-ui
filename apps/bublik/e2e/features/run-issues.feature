# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-issues.spec.ts — see features/README.md.
#
# Every scenario classifies a failing result of the classifiable fixture run
# through the Classify drawer on the run page, under an issue title only it
# uses, and deletes that issue — rules and stamps included — as its last step.
# Other rules on the stack may match the same tests, so Apply Rules asserts
# the shape of its toast and this scenario's own row, never a total.

Feature: Run issues

  As an engineer reviewing a run, I see which issues explain its failures,
  whether each still counts against the run, and which results carry it.

  Background:
    Given I am signed in

  @issues @issues-write @needs-nok @smoke
  Scenario: A suppressed classification is listed on the run issues page with its results
    Given I classify a failing result of the fixture run as an expected known issue
    When I open the run's issues page
    Then the issue is listed as suppressed
    When I expand the issue's results
    Then at least one result is listed with links to the run, log, history and preview
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok
  Scenario: An undecided classification still counts and says so
    Given I classify a failing result of the fixture run as a marked known issue
    When I open the run's issues page
    Then the issue is listed as undecided
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok
  Scenario: Closing the issue turns a suppressed result into counting again
    Given I classify a failing result of the fixture run as an expected known issue
    And I close the issue from its page
    When I open the run's issues page
    Then the issue is listed as counting again
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok @url-params
  Scenario: Run issue filters are written to the URL
    Given I classify a failing result of the fixture run as an expected known issue
    And I open the run's issues page
    When I search for the issue's title
    Then the search is written to the URL and the issue is listed
    When I pick Suppressed in the Effect On Run filter
    Then the effect is written to the URL and the issue is still listed
    When I search for text no issue carries
    Then no matching issues are shown
    When I reset the filters
    Then the search and effect are cleared from the URL
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok
  Scenario: Apply Rules stamps the run from a rule written in advance
    Given I record an issue with an expected rule for a failing test of the fixture run
    When I apply the rules to the run from its page
    Then the toast reports how many stamps were created
    And the run's issues page lists the issue with at least one result
    When I apply the rules again from there
    Then the toast reports no new stamps
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok
  Scenario: The run sidebar counts the issues of the run
    Given I classify a failing result of the fixture run as an expected known issue
    Then the run submenu's Issues item counts at least one issue
    When I follow it
    Then the run's issues page is open with the issue listed
    And I delete the issue from the run issues page

