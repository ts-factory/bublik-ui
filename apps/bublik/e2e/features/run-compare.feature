# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/compare-multiple.spec.ts — see features/README.md.

Feature: Run comparison

  As an engineer asking "what changed between these two sessions?", I open two
  runs side by side, switch between the full detail views and the diff, and jump
  into either run's log from there.

  Background:
    Given I am signed in

  Scenario: Comparing without a run selection explains what is missing
    When I open the compare page without run parameters
    Then it reports that no runs are selected

  Scenario: Comparing two runs shows the diff and links to a run's log
    Given the fixture manifest describes two imported runs
    When I open the compare page for both runs
    Then the diff is rendered
    When I switch to the info diff
    And I follow the left run's Log link
    Then the log page is open
