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

  ####################################################################
  # URL parameters
  ####################################################################

  # The diff opens with its first row already expanded, so toggling it collapses
  # it — which is the same contract in the other direction, and the reason these
  # steps say "toggle" rather than "expand". The round trip is asserted through
  # the rendered rows rather than the parameter's value, so it holds whichever
  # encoding the state travels in.

  @runs @url-params
  Scenario: Toggling a row in the comparison is recorded in the URL and survives a reload
    Given I open the compare page for two runs
    When I toggle the first row of the diff
    Then the diff records the expanded rows in the URL
    And the rows it renders have changed
    When I reload the page
    Then the diff renders the same rows again

  @runs @url-params
  Scenario: A compare link restores both sides it names
    Given a link that pins two runs to compare
    When I open that link
    Then the diff is rendered
    And the link still carries both sides

