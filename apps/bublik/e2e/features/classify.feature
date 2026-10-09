# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/classify.spec.ts — see features/README.md.
#
# Write scenarios that drive the Classify drawer's own controls. Each leases a
# failing result of the classifiable fixture runs (claimFailingResult()),
# classifies it under an issue title only it uses, reads back that issue —
# its row, its rule, its effect on the run — and deletes it as its last step.

Feature: Classify drawer

  As an engineer triaging a failure, I file it under a new issue with the
  tracker reference, category, disposition and match scope I choose, and see
  each choice in what the issue and its rule show afterwards.

  Background:
    Given I am signed in

  @issues @issues-write @needs-nok
  Scenario: Classifying into a new issue records its tracker and bug key
    Given I open the Classify drawer on a failing result of the fixture run
    When I pick a tracker, type a bug key and classify the result under a new issue
    Then the issues page shows the issue with that key
    And the key links to the tracker's page for it
    And I delete the issue

  @issues @needs-nok
  Scenario: Pasting a full reference splits it into tracker and key
    Given I open the Classify drawer on a failing result of the fixture run
    When I paste a full ref:// reference into the bug key
    Then the tracker takes the reference's tracker
    And the bug key keeps only the key
    And I close the drawer without classifying

  @issues @issues-write @needs-nok
  Scenario Outline: Classifying with a category shows it on the new issue
    Given I open the Classify drawer on a failing result of the fixture run
    When I pick the category for a new issue
    Then the Category field explains the picked category
    When I classify the result
    Then the issues page shows the issue with that category's badge
    And I delete the issue

    Examples:
      | category             |
      | Product defect       |
      | Test/automation bug  |
      | Environment / infra  |
      | Known issue          |
      | Flaky / intermittent |
      | To investigate       |

  @issues @issues-write @needs-nok
  Scenario: Classifying as unexpected still counts against the run
    Given I open the Classify drawer on a failing result of the fixture run
    When I classify the result under a new issue as unexpected
    Then the run's issues page lists the issue as still counting
    And I delete the issue from the run issues page

  @issues @issues-write @needs-nok
  Scenario: A narrower match scope is what the new rule matches on
    Given I open the Classify drawer on a failing result of the fixture run
    When I narrow the match scope to the path and verdicts and classify just this result
    Then the rules page shows the issue's rule matching on Path and Verdicts only
    And the rule is inactive, as a one-off
    And I delete the issue
