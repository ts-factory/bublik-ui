# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/history-v2.spec.ts — see features/README.md.
#
# Route: /history/v2

Feature: History v2 alias

  As an engineer following a link from the days the new history page lived
  at `/history/v2`, I land on the same history page, and the next search I
  apply takes me to the canonical address.

  Background:
    Given I am signed in

  @history @url-params
  Scenario: The v2 alias renders the history page at its own address
    Given a v2 history link for a fixture test path
    When I open that link
    Then the history results for that test path are shown
    And the address is still the v2 alias

  # Every writer of the history search navigates to `/history` by name, so
  # the alias collapses the moment the search is applied.
  @history @url-params
  Scenario: Applying a search from the v2 alias lands on the canonical history address
    Given the history page is open through the v2 alias
    When I apply the search for the same test path
    Then the canonical history address is open
    And the test path is still pinned
