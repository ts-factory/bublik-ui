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

  ####################################################################
  # URL parameters
  ####################################################################

  # This page is the app's only remaining `useSearchState` consumer, whose
  # serializer writes scalars plain and objects as base64 of their JSON — so the
  # mode looks ordinary while the machinery behind it is not shared with any
  # other page. See MEASUREMENTS_URL_PARAMS in pages/measurements-page.ts.

  @measurements @url-params @needs-measurements
  Scenario: A measurements link restores the layout and the selected charts
    Given a link that pins the overlay layout and two selected charts
    When I open that link
    Then the page reports the overlay layout
    And the link still carries both chart ids as repeated keys

  # `selectedCharts` is a NumericArrayParam: one key per chart rather than a
  # joined list, unlike the semicolon-joined lists on the history page.
  @measurements @url-params @needs-measurements
  Scenario: Selecting charts records one repeated key per chart and survives a reload
    Given I open the measurements page in the charts layout
    When I select two charts
    Then each chart id is written as its own repeated key in the URL
    When I reload the page
    Then both chart ids are still recorded in the URL

