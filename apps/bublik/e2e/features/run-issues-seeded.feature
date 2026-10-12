# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-issues-seeded.spec.ts — see features/README.md.
#
# Seeded scenarios: read-only against the classification the seed applied.
# They open the seeded run that carries the most seeded issues, and resolve
# its issues, rules and pins by plan id through
# support/seeded-classification.ts. Write scenarios may stamp other issues on
# a run, so rows and counts are only compared within the plan's own issues.

Feature: Run issues against seeded classification

  As an engineer opening a run someone already triaged, I see each issue that
  explains its failures with the effect it has on the run, narrow them down,
  page through them and look at the results each one stamps.

  Background:
    Given I am signed in

  @issues @needs-classification
  Scenario: Every seeded issue of a run shows its effect on the run
    Given the seed classified results of a run under issues with every effect
    When I open the run's issues page
    Then each of those issues shows the effect badge and stripe of its strongest rule

  @issues @needs-classification
  Scenario: An issue whose rules disagree shows the strongest effect on the run
    Given the seed classified a result of a run under an issue whose rules have different effects
    When I open the run's issues page
    Then the issue shows the strongest of those effects
    And it lists the category of every one of its rules

  @issues @needs-classification @url-params
  Scenario: The State and Category filters narrow a run's seeded issues
    Given the seed classified results of a run under open and closed issues of several categories
    And I open the run's issues page
    When I pick Closed in the State filter
    Then the state is written to the URL
    And only the closed seeded issues of the run are listed
    When I reset the filters
    And I pick the least used seeded category in the Category filter
    Then the category is written to the URL
    And only the seeded issues with a rule of that category are listed

  @issues @needs-classification @url-params
  Scenario: A run's seeded issues page through ten at a time
    Given the seed classified results of a run under more issues than one page of ten holds
    When I open the run's issues page ten issues at a time
    Then the first page lists ten issues
    When I page forward until the last page
    Then the page is written to the URL
    And every seeded issue of the run was listed on exactly one page

  @issues @needs-classification
  Scenario: The run issues footer counts the rows of the page it shows
    Given the seed classified results of a run under more issues than one page of ten holds
    When I open the run's issues page ten issues at a time
    Then the footer reads one to ten of all the run's issues
    When I open the second page
    Then the footer reads eleven to twenty of all the run's issues

  # Opens the drawer and cancels it: a seeded issue is never saved.
  @issues @needs-classification
  Scenario: Editing a seeded issue from its run issues row loads the whole issue
    Given the seed classified a result of a run under an open issue with a bug key and a description
    And I open the run's issues page
    When I edit the issue from its row
    Then the drawer holds the issue's title, description, tracker, bug key and state
    When I cancel the edit
    Then the issue is still listed with its effect on the run

  @issues @needs-classification
  Scenario: The expanded results of a seeded issue show the test, its package and its verdicts
    Given the seed classified a result of a run under an issue
    And I open the run's issues page
    When I expand the issue's results
    Then the classified result is listed with its test name and package path
    And it shows the verdicts the result obtained
