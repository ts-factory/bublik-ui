# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue.spec.ts and issue-url.spec.ts — see features/README.md.
#
# The issue each behaviour scenario opens is recorded through the issues page first,
# under a title only that scenario uses, and deleted from the issue page as
# the last step — which also removes the rules written under it.
#
# The URL-contract scenarios at the end belong to the seeded family
# (`@needs-classification`): they read the seeded classification through
# `support/classification-data.ts` and change nothing.

Feature: Issue

  As an engineer triaging failures, I open one issue to see what is known
  about it, write the rules that stamp results with it, close it once it is
  fixed, and reopen it when it comes back.

  Background:
    Given I am signed in

  @issues @issues-write @smoke
  Scenario: The issue page shows the facts of a freshly recorded issue
    Given I record an issue and open its page
    Then the page is headed by the issue's title and its open state
    And the facts list the key, rules, created and updated times
    And the rules badge says the issue has no rules
    And the rules table says the issue has no rules yet
    When I delete the issue from its page
    Then I am back on the issues page and the issue is gone

  @issues @issues-write @needs-nok
  Scenario: A rule written from the issue page is locked to that issue
    Given I record an issue and open its page
    When I open the New Rule drawer
    Then the issue is already picked and cannot be changed
    When I submit the rule without a test
    Then I am told to select a test
    When I pick a failing test of the fixture run and create the rule
    Then the rule is listed as active
    And the rules badge says one of one rules is active
    When I edit the rule and make it inactive
    Then the rule is listed as inactive
    And the test cannot be changed while editing
    When I delete the rule
    Then the rules table says the issue has no rules yet
    And I delete the issue from its page

  @issues @issues-write @needs-nok
  Scenario: Closing an issue deactivates its rules and reopening leaves them inactive
    Given I record an issue with an active rule and open its page
    When I close the issue
    Then the issue is closed and its closed time is listed
    And the rules badge says the rules were deactivated
    And the rule is listed as inactive
    When I reopen the issue
    Then the issue is open again
    And the rules badge says the issue has no active rules
    And the rule is still listed as inactive
    And I delete the issue from its page

  @issues @issues-write
  Scenario: Editing from the issue page changes the description and state
    Given I record an issue and open its page
    When I edit the issue with a description and the closed state
    Then the state field shows the closed badge and what closing does
    When I save the edit
    Then the description is shown beside the facts
    And the issue is closed
    And I delete the issue from its page

  @issues
  Scenario: An invalid issue id shows the no-data state
    When I open the issue page with an id that is not a number
    Then I am told the issue id is missing or invalid

  # Runs without the shared signed-in storage state; the issue it looks at is
  # recorded and removed from a second, signed-in browser context.
  @issues @auth
  Scenario: Issue actions while signed out point to signing in
    Given an issue was recorded by a signed-in session
    And I am signed out and open that issue's page
    Then closing, editing and deleting the issue and writing rules are disabled with hints to log in
    When I click the close action anyway
    Then I am asked to sign in to close or reopen issues
    When I close the sign-in dialog
    Then the sign-in dialog is closed
    And the signed-in session deletes that issue

  ####################################################################
  # The URL contract (apps/bublik/e2e/issue-url.spec.ts)
  ####################################################################

  @issues @needs-classification @smoke
  Scenario: An issue page shows the issue and its rules
    Given the fixture manifest seeds an open issue with rules
    When I open that issue's page
    Then the issue's title is shown
    And each of its rules is listed

  # The id is validated before anything is fetched: a word in its place is the
  # page's own empty state, not a request for issue NaN.
  @issues
  Scenario: An issue address that is not a number shows the empty state
    When I open the issues address with a word in place of the id
    Then the page reports the id as missing or invalid

  ####################################################################
  # URL parameters
  ####################################################################

  # One issue's rules table shares the all-rules codec and keys; what differs
  # is that its column choices are remembered apart from the rules list's.

  @issues @needs-classification @url-params
  Scenario: Searching an issue's rules records the term
    Given an issue's page is open
    When I search its rules for the test of one of them
    Then the URL records the term
    And that rule is still listed

  @issues @needs-classification @url-params
  Scenario: Hiding a column on an issue's rules does not hide it on the rules list
    Given an issue's page is open
    When I hide the Test column
    Then the URL records the Test column as hidden
    And the Test column is gone
    When I open the rules list
    Then the Test column is shown there

  @issues @needs-classification @url-params
  Scenario: An issue link keeps the project scope
    Given a link to a seeded issue scoped to its project
    When I open that link
    Then the issue's title is shown
    And the link still carries the project
