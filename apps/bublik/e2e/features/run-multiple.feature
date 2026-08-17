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
