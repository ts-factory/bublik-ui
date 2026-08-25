# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/compare-multiple.spec.ts — see features/README.md.

Feature: Multiple runs

  As an engineer reviewing a campaign, I merge several runs into one tree, switch
  which run's details are shown, and preview the unexpected results across all of
  them at once.

  Background:
    Given I am signed in

  Scenario: Opening the multiple view without runs explains what is missing
    When I open the multiple page without run parameters
    Then it reports that the run ids are missing

  Scenario: The multiple view switches which run is selected
    Given the fixture manifest describes two imported runs
    When I open the multiple page for both runs
    And I select the second run
    Then the selection is recorded in the URL
    When I follow the selected run's Log link
    Then the log page is open

  @needs-nok
  Scenario: Preview NOK applies across the merged runs
    Given I open the multiple page for a run with unexpected results
    When I press Preview NOK
    Then the tests with unexpected results are listed

  ####################################################################
  # URL parameters
  ####################################################################

  # `runIds` repeats its key rather than joining the ids, and `selected` is
  # resolved rather than written when a link omits it — so the rendered state
  # and the URL disagree on purpose, and both halves need pinning.

  @runs @url-params
  Scenario: A multiple-runs link restores every run it pins and the one it selected
    Given a link that pins two runs and selects the second
    When I open that link
    Then the merged tree of both runs is shown
    And the link still repeats both run ids and names the selection

  @runs @url-params
  Scenario: The multiple view falls back to the first run when the link names no selection
    Given a link that pins two runs without naming a selection
    When I open that link
    Then the merged tree of both runs is shown
    And no selection is written to the URL
    When I select the second run
    Then the selection is recorded in the URL
    And both run ids are still pinned

