# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/report-measurements.spec.ts — see features/README.md.

Feature: Measurements

  As an engineer looking at a performance result, I open its measurements, switch
  between the chart and table layouts, and navigate back to the run or the log the
  result came from.

  Background:
    Given I am signed in
    And the fixture manifest describes a result with measurements

  @needs-measurements
  Scenario Outline: The measurements page renders every layout mode
    When I open the measurements page in the given mode
    Then the page reports that mode as its layout

    Examples:
      | mode    |
      | default |
      | charts  |
      | tables  |
      | split   |
      | overlay |

  @needs-measurements
  Scenario: The measurements header links back to the run and the log
    When I open the measurements page
    And I follow the Log link
    Then the log page is open
    When I open the measurements page again
    And I follow the Run link
    Then the run page is open

  # The manifest records measurements per test path, while the page shows one
  # result, so the per-result API is the accurate source to compare against.
  @needs-measurements
  Scenario: The measurement tables list every measurement reported for the result
    Given the API reports measurement tables for that result
    When I open the measurements page in the tables mode
    Then every reported measurement is listed with its tool and name
