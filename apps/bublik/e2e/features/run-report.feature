# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/report-measurements.spec.ts — see features/README.md.

Feature: Run report

  As an engineer preparing a performance summary, I open a run's report for a
  given configuration, navigate it through its table of contents, and follow it
  back to the configuration that produced it.

  Background:
    Given I am signed in

  Scenario: A report without a configuration reports the missing config
    Given the fixture manifest describes a run whose project has a report config
    When I open that run's report without choosing a configuration
    Then the page reports that the config id is missing

  @needs-report
  Scenario: A report renders for the configured report config
    Given a report config exists for that run
    When I open the run's report for that config
    Then the report page is rendered

  @needs-report
  Scenario: The report links back to the configuration that produced it
    Given I open a rendered report
    When I follow the Config link
    Then the configuration editor opens for that config
