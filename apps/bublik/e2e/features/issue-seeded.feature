# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-seeded.spec.ts — see features/README.md.
#
# Seeded scenarios: read-only against the classification the seed applied.
# Issues and rules are named by their plan ids and resolved through
# support/seeded-classification.ts, never by title or database id. Nothing
# here edits, closes or reopens a seeded issue.

Feature: Issue against seeded classification

  As an engineer opening an issue someone already triaged, I see how many of
  its rules still apply, read its description, and see when it was closed.

  Background:
    Given I am signed in

  @issues @needs-classification
  Scenario: A seeded issue with several rules counts how many of them are active
    Given the seed recorded an issue with several rules
    When I open that issue's page
    Then the rules fact counts its active rules out of all of them
    And each of its rules is listed as active or inactive as the seed left it
    When I open a seeded open issue whose only rule is inactive
    Then the rules fact counts none of its rules as active

  @issues @needs-classification
  Scenario: A long seeded description is clipped behind a popover and a short one is shown inline
    Given the seed recorded issues with a very long and a short description
    When I open the page of the issue with the long description
    Then its description is clipped behind a button
    When I open the description
    Then a popover shows the description to its last line
    When I open the page of the issue with the short description
    Then its description is shown inline to its last line, with no button

  @issues @needs-classification
  Scenario: A seeded closed issue lists the date it was closed
    Given the seed recorded a closed issue
    When I open that issue's page
    Then the issue is shown as closed
    And the facts list the date it was closed
    And the rules fact says its rules were deactivated
