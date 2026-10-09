# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-errors.spec.ts — see features/README.md.
#
# Each scenario sends a seeded issue's data at the server in a request the
# server refuses, then checks the issue is exactly as it was. The seeded issue
# is named by its plan id and resolved through support/seeded-classification.ts.

Feature: Issue server errors

  As an engineer editing issues, I am told on the form what the server
  refused and why, and the issue is left as it was.

  Background:
    Given I am signed in

  @issues @needs-classification
  Scenario: Changing the bug key of an issue with results is refused on the Bug Key field
    Given a seeded issue that has classified results is open on its page
    When I edit it, change only its bug key and save
    Then the Bug Key field shows the server's refusal
    When I cancel the edit
    Then the issue still shows its key
    And the server recorded no change to it

  @issues @issues-write @needs-classification
  Scenario: Recording an issue under a bug key the project already uses is refused
    Given I open the issues page for a seeded issue's project
    When I record a new issue under that issue's tracker and key
    Then the drawer shows that the key is already taken
    When I cancel the new issue
    Then no issue was recorded under my title
    And the seeded issue is unchanged
