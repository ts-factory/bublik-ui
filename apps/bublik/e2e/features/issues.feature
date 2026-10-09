# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issues.spec.ts and issues-url.spec.ts — see features/README.md.
#
# No behaviour scenario relies on seeded issues: each one records the issue it
# needs through the New Issue drawer, under a title only it uses, and deletes
# it again as its last step. The stack may carry other issues, so nothing
# asserts an empty state or an absolute count — only the rows carrying the
# scenario's own title.
#
# The URL-contract scenarios at the end belong to the seeded family
# (`@needs-classification`): they read the seeded classification through
# `support/classification-data.ts` and change nothing.
#
# Route: /issues/

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
    Given I open the issues page for the fixture project
    When I open the New Issue drawer and submit it empty
    Then I am told that a title and a bug key are required
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
  Scenario: Results is the default sort and its first click turns it ascending
    Given I open the issues page for the fixture project with issues listed
    Then no sort is written to the URL
    When I sort by the Results column
    Then the ascending sort is written to the URL
    And I delete that issue

  @issues @url-params
  Scenario: The Actionable preset sets the Category filter and is written to the URL
    Given I open the issues page for the fixture project
    When I click the Actionable preset
    Then its categories are written to the URL and the preset is pressed
    When I click the Actionable preset again
    Then the categories are cleared from the URL and the preset is released

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

  ####################################################################
  # The URL contract (apps/bublik/e2e/issues-url.spec.ts)
  ####################################################################

  @issues @needs-classification @smoke
  Scenario: The issues list shows the seeded issues grouped by project
    Given the fixture manifest seeds issues into two projects
    When I open the issues list for every project
    Then both projects head a group of issues
    And a seeded issue of each project is listed

  @issues @needs-classification
  Scenario: Scoping the issues list to a project hides the other projects' issues
    Given the fixture manifest seeds issues into two projects
    When I open the issues list scoped to one of them
    Then only that project heads a group
    And the other project's issue is not listed

  @issues @needs-classification
  Scenario: An issue's title opens its page
    Given the issues list shows a seeded issue
    When I follow the issue's title
    Then that issue's page is open

  ####################################################################
  # URL parameters
  ####################################################################

  # The issues, rules and run issues tables share one URL codec
  # (`classification-table.params.ts`): `page`, `pageSize`, `q`, `sort`, the
  # facets, `cols` and `order`, every write a replaceIn, every default an
  # absent key. These scenarios pin that codec on the issues list; the rules
  # and run issues features pin only what differs there — their defaults,
  # their facets and, for a run's issues, `open`.

  @issues @needs-classification @url-params
  Scenario: Searching the issues list records the term and returns to the first page
    Given the issues list is open on its second page of ten
    When I search for a seeded issue's title
    Then the URL records the term and is back on the first page
    And that issue is listed
    When I clear the search
    Then the term is dropped from the URL

  @issues @needs-classification @url-params
  Scenario: Filtering issues by state records the facet and survives a reload
    Given the issues list is open
    When I narrow the list to closed issues
    Then the URL records the closed state
    And every listed issue is closed
    When I reload the page
    Then every listed issue is still closed
    When I reset the filters
    Then the state is dropped from the URL

  @issues @needs-classification @url-params
  Scenario: Sorting the issues list cycles through ascending, descending and none
    Given the issues list is open
    When I sort by the Issue column
    Then the URL records the ascending sort
    When I sort by the Issue column again
    Then the URL records the descending sort
    When I sort by the Issue column a third time
    Then the URL records that no sort is applied

  @issues @needs-classification @url-params
  Scenario: Changing the rows per page records the size and the page
    Given the issues list is open
    When I show ten issues per page
    Then the URL records ten rows per page
    When I open the next page
    Then the URL records the second page
    When I show a hundred issues per page
    Then the page size and the page are dropped from the URL

  # `clampPage` rewrites a page the data cannot fill, so a stale link lands on
  # the last page rather than on an empty one.
  @issues @needs-classification @url-params
  Scenario: A page past the end is clamped to the last page
    Given a link asking for the ninety-ninth page of ten
    When I open that link
    Then the URL is rewritten to the last page
    And issues are listed

  @issues @needs-classification @url-params
  Scenario: Hiding a column records it and showing it again drops it
    Given the issues list is open
    When I hide the Key column
    Then the URL records the Key column as hidden
    And the Key column is gone
    When I reload the page
    Then the Key column is still gone
    When I show the Key column
    Then the column override is dropped from the URL

  @issues @needs-classification @url-params
  Scenario: Reordering columns records the whole order
    Given the issues list is open
    When I drag the Issue column onto the Key column
    Then the URL records an order with Issue before Key
    And the Issue header comes before the Key header
    When I reload the page
    Then the Issue header still comes before the Key header

  # Every scenario above builds its state by clicking. This is the other half:
  # someone opening the link that state produced.
  @issues @needs-classification @url-params
  Scenario: An issues link restores the search, the facets, the sort and the columns
    Given a link that pins a search term, the open state, the Issue sort, a page size and a hidden column
    When I open that link
    Then the list is narrowed, sorted and laid out as the link says
    And the link still carries every parameter it was opened with

  @issues @needs-classification @url-params
  Scenario: Issues list controls preserve the project scope and the other parameters
    Given the issues list is open scoped to a project with closed issues shown
    When I search for a term
    Then the project scope and the state are still pinned

  @issues @needs-classification @url-params
  Scenario: The sidebar's Issues link returns to the last issues list address
    Given the issues list is open with a state filter
    When I move to the dashboard
    Then the compressed sidebar state remembers the filtered issues list
