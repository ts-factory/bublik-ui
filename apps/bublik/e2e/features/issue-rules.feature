# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-rules.spec.ts — see features/README.md.
#
# Each scenario records the issue its rule hangs off through the issues page,
# writes the rule here, and deletes the issue — rule included — as its last
# step. The facets count only the rules the search leaves, so a scenario that
# wants a filter option to exist searches for its own test first.

Feature: Issue rules

  As an engineer keeping the triage honest, I review every rule across the
  issues: which test it matches, how narrowly, whether it still suppresses,
  and whether it is active at all.

  Background:
    Given I am signed in

  @issues @smoke
  Scenario: The rules page lists rules in a table
    When I open the rules page for the fixture project
    Then the rules table or its empty state is shown

  @issues @issues-write @needs-nok
  Scenario: A rule is written from the New Rule drawer and removed again
    Given I record an issue for the rule
    And I open the rules page for the fixture project
    When I open the New Rule drawer and submit it empty
    Then I am told to select an issue and a test
    When I pick the issue, a failing test and a verdict to match on and create the rule
    Then the rule is listed under the issue with Path and Verdicts in its match scope
    And hovering the Verdicts chip shows the verdict it matches
    When I delete the rule
    Then the rule is no longer listed
    And I delete the issue

  @issues @issues-write @needs-nok @url-params
  Scenario: Rule filters are written to the URL and cleared together
    Given I record an issue with an expected rule
    And I open the rules page for the fixture project and search for the rule's test
    When I pick Expected in the Disposition filter
    Then the disposition is written to the URL and the rule is still listed
    When I pick Active in the Rule filter
    Then the active state is written to the URL and the rule is still listed
    When I search for text no rule carries
    Then no matching rules are shown
    When I reset the filters
    Then the disposition, active state and search are cleared from the URL
    And I delete the issue

  @issues @issues-write @needs-nok @url-params
  Scenario: A verdict chip toggles the repeated verdicts parameter
    Given I record an issue with a rule matching a verdict
    And I open the rules page for the fixture project and search for the rule's test
    When I turn the Verdicts column on
    And I click the rule's verdict chip
    Then the verdict is written to the URL once per value
    When I click the chip again
    Then the verdict is cleared from the URL
    And I delete the issue

  @issues @url-params
  Scenario: Sorting rules by test is written to the URL
    Given I open the rules page for the fixture project with a rule listed
    When I sort by the Test column
    Then the sort is written to the URL as ascending
    When I sort by the Test column again
    Then the sort is written to the URL as descending
    And I delete the issue

  @issues @issues-write @needs-nok
  Scenario: Editing a rule keeps its test but changes its disposition
    Given I record an issue with an expected rule
    And I open the rules page for the fixture project and search for the rule's test
    When I edit the rule
    Then the issue and test cannot be changed and the matcher is read-only
    When I make the rule unexpected
    Then the Expected field says its results still count
    When I save the rule
    Then the Disposition column, once shown, reads Unexpected
    And I delete the issue

  @issues @issues-write @needs-nok
  Scenario: A narrow viewport folds a rule into an expander
    Given I record an issue with an expected rule
    And I open the rules page for the fixture project in a narrow window and search for the rule's test
    Then the rule's row carries an expander
    When I expand the row
    Then its match scope is shown in a detail panel
    And I delete the issue

  @issues @issues-write @needs-nok
  Scenario: Parameter and tag inputs become the new rule's parameters and tags
    Given I record an issue for the rule
    When I write a rule for a failing test with a parameter and a tag to match on
    Then the rule is listed matching on Path, Params and Tags
    And the Parameters and Tags columns, once shown, read the values I typed
    And I delete the issue

  @issues @issues-write @needs-nok
  Scenario: A rule created as inactive is listed inactive
    Given I record an issue for the rule
    When I write a rule for a failing test and set it to Inactive
    Then the rule is listed as inactive
    And its issue has no active rules
    And I delete the issue

  # The drawer keeps an entry with no "=" as a badge; creating the rule drops
  # it without a word, so the rule matches on its path alone.
  @issues @issues-write @needs-nok
  Scenario: A parameter typed without an equals sign is dropped from the rule
    Given I record an issue for the rule
    When I start an inactive rule for a failing test and type a parameter with no equals sign
    Then the drawer takes the entry without complaint
    When I create the rule
    Then the rule is listed matching on its Path alone, the entry gone
    And I delete the issue

  # Runs without the shared signed-in storage state.
  @issues @auth
  Scenario: Writing rules while signed out asks me to sign in
    Given I am signed out and open the rules page
    Then the New Rule action is disabled with a hint to log in
    When I click it anyway
    Then I am asked to sign in to create rules
    When I close the sign-in dialog
    Then the sign-in dialog is closed
