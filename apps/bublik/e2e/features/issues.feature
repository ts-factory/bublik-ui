# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issues.spec.ts — see features/README.md.
#
# No scenario here relies on seeded issues: each one records the issue it
# needs through the New Issue drawer, under a title only it uses, and deletes
# it again as its last step. The stack may carry other issues, so nothing
# asserts an empty state or an absolute count — only the rows carrying the
# scenario's own title.

Feature: Issues

  As an engineer triaging failures, I keep a list of the issues behind them:
  I record one, give it a tracker key, find it again by title or state, and
  remove it when it was a mistake.

  Background:
    Given I am signed in

  @issues @smoke
  Scenario: The issues page lists issues in a project-grouped table
    When I open the issues page for the fixture project
    Then the issues table or its empty state is shown
    And the footer tells how many issues are listed

  @issues @issues-write
  Scenario: A new issue is recorded from the New Issue drawer and removed again
    Given I open the issues page for the fixture project
    When I record an issue with a unique title
    Then the issue is listed as open with no rules and no results
    When I delete that issue from its row and confirm
    Then the issue is no longer listed

  @issues
  Scenario: The New Issue drawer refuses an empty form
    Given I open the issues page for every project
    When I open the New Issue drawer and submit it empty
    Then I am told to select a project and that a title is required
    When I cancel the drawer
    Then the drawer is closed

  @issues
  Scenario: The New Issue drawer checks the tracker and bug key halves
    Given I open the New Issue drawer for the fixture project
    When I enter a tracker with a space in it
    Then I am told a tracker cannot contain spaces
    When I clear the tracker and enter only a bug key
    Then I am told to choose a tracker
    When I enter a bug key with forbidden characters
    Then I am told which characters a bug key may contain
    And I cancel the drawer

  @issues @issues-write
  Scenario: An issue with a bug key shows the key in its row
    Given I open the issues page for the fixture project
    When I record an issue with a tracker and a bug key
    Then the issue's row shows the key
    And I delete that issue

  @issues @issues-write
  Scenario: Editing an issue from the list renames it
    Given I open the issues page for the fixture project
    And I record an issue with a unique title
    When I edit the issue from its row and save it under a new title
    Then the issue is listed under the new title
    And I delete that issue

  @issues @issues-write
  Scenario: Cancelling the delete confirmation keeps the issue
    Given I open the issues page for the fixture project
    And I record an issue with a unique title
    When I ask to delete the issue but cancel the confirmation
    Then the issue is still listed
    And I delete that issue

  ####################################################################
  # URL parameters
  ####################################################################

  @issues @issues-write @url-params
  Scenario: Searching issues writes q and returns to the first page
    Given I open the issues page for the fixture project
    And I record an issue with a unique title
    When I search for that title
    Then the search is written to the URL and the page is the first
    And only that issue is listed
    When I search for text no issue carries
    Then no matching issues are shown
    When I reset the filters
    Then the search is cleared from the URL
    And the reset button is disabled
    And I delete that issue

  @issues @issues-write @url-params
  Scenario: The State filter and the state badge write state to the URL
    Given I open the issues page for the fixture project
    And I record an issue with a unique title
    And I search for that title
    When I pick the open state in the State filter
    Then the state is written to the URL and the issue is still listed
    When I reset the filters
    Then the state is cleared from the URL
    When I click the issue's state badge
    Then the state is written to the URL again
    And I delete that issue

  @issues @issues-write @url-params
  Scenario: The Rules filter singles out unruled issues
    Given I open the issues page for the fixture project
    And I record an issue with a unique title
    And I search for that title
    When I pick issues without rules in the Rules filter
    Then the rules state is written to the URL and the issue is still listed
    When I click the issue's rules badge
    Then the rules state is cleared from the URL
    And I delete that issue

  @issues @issues-write @url-params
  Scenario: Showing the Created column and sorting by Issue are written to the URL
    Given I open the issues page for the fixture project with issues listed
    When I turn the Created column on
    Then the Created column is shown and the columns are written to the URL
    When I sort by the Issue column
    Then the sort is written to the URL
    And I delete that issue

  @issues @issues-write @url-params
  Scenario: The rows-per-page choice is written to the URL
    Given I open the issues page for the fixture project with issues listed
    When I choose ten rows per page
    Then the page size is written to the URL
    And I delete that issue

  @issues @issues-write @url-params
  Scenario: Collapsing a project group hides its rows
    Given I open the issues page for the fixture project with issues listed
    When I collapse the project's group
    Then the group is folded and its rows are hidden
    When I expand the group again
    Then the issue is listed again
    And I delete that issue

  @issues @issues-write
  Scenario: A long description opens in a popover
    Given I open the issues page for the fixture project
    When I record an issue with a long description
    Then its description cell opens the full text in a popover
    And I delete that issue

  # Runs without the shared signed-in storage state.
  @issues @auth
  Scenario: Creating issues while signed out asks me to sign in
    Given I am signed out and open the issues page
    Then the New Issue action is disabled with a hint to log in
    When I click it anyway
    Then I am asked to sign in to create issues
    When I click outside the sign-in dialog
    Then the sign-in dialog closes
    And I am still on the issues page
