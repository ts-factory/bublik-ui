# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-picker.spec.ts — see features/README.md.
#
# Every seeded project carries issues, so the empty-state scenario records a
# project of its own through the API, scoped to its browser project, and
# deletes it again. The two history scenarios only read the seeded
# classification: tests and issues are named through their plan ids, and no
# write scenario classifies a result of a seeded project.

Feature: Issue picker

  As an engineer picking an issue, I am told why the list is empty, and when
  the list is about one test, it offers only the issues that classify it.

  Background:
    Given I am signed in

  @issues
  Scenario: The issue picker says when it is searching, finds nothing or has no issues yet
    Given a project with no issues in it
    And the picker's answers are held back
    When I start a new rule in that project and open the rule's Issue picker
    Then the picker says it is searching
    When the answer arrives
    Then the picker says the project has no issues yet
    When I type text no issue carries
    Then the picker says nothing matches
    And I delete the project

  @issues @history @needs-classification
  Scenario: The history issue picker says when no issue classifies the test
    Given a test of a seeded project that no seeded rule is written for
    When I open the test's history, its search form and the Issue picker
    Then the picker says no issue classifies a result of the test

  @issues @history @needs-classification
  Scenario: The history issue picker lists only the issues that classify the test
    Given a test of a seeded project that several seeded issues classify
    When I open the test's history, its search form and the Issue picker
    Then exactly the issues that classify the test are offered, none of the project’s others
