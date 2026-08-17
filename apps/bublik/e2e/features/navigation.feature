# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/route-smoke.spec.ts — see features/README.md.

Feature: Navigation

  As an engineer moving around Bublik, I land on the dashboard, reach every main
  page from the sidebar or the command palette, and get a clear not-found page
  when a link is wrong.

  Background:
    Given I am signed in

  @smoke
  Scenario: The root address opens the dashboard
    When I open the root address
    Then the dashboard is open

  @smoke
  Scenario: The main pages load their shells
    When I open the dashboard for a fixture date
    Then the run of that date is listed
    When I open the runs page for that date
    Then the runs filter form is ready
    When I open the history page
    Then the history page is ready

  @smoke
  Scenario: The admin pages load their shells
    When I open the configuration page
    Then the configuration page is ready
    When I open the import page
    Then the import page is ready

  Scenario: The command palette navigates to a main page
    Given I open the dashboard
    When I open the command palette and choose Runs
    Then the runs page is open

  Scenario: The sidebar can be hidden through the URL
    When I open the dashboard with the sidebar hidden
    Then no sidebar is shown

  Scenario: An unknown address shows the not-found page
    When I open an address that does not exist
    Then the not-found page is shown
