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

  Scenario: The sidebar shows the deployed versions
    Given I open the dashboard
    When I hover the version next to the Bublik label
    Then the deployed UI and API versions are shown

  Scenario: An unknown address shows the not-found page
    When I open an address that does not exist
    Then the not-found page is shown

  ####################################################################
  # URL parameters
  ####################################################################

  # These are the contracts no single page owns. The project scope and the
  # compressed sidebar state are injected into every programmatic navigation by
  # navigateWithProject, so they are the parameters most likely to be lost by a
  # change to any one page — and least likely to be noticed there.

  @url-params
  Scenario: The selected project follows me between the main pages
    Given I open the dashboard scoped to one project
    When I move to the runs page and then to the history page
    Then each page is still scoped to that project

  @url-params
  Scenario: The compressed sidebar state remembers the run I was last looking at
    Given I open an imported run's page
    When I move to the dashboard
    Then the compressed sidebar state names that run
    And it decodes at the version the app writes

  # The encoder prunes keys front to back once the payload passes its budget, so
  # a long session silently loses the earliest entries. Pinning the budget keeps
  # that a bounded, deliberate loss rather than a broken URL.
  @url-params
  Scenario: The compressed sidebar state stays inside its length budget
    Given I visit the dashboard, the runs page, a run and its log in turn
    Then the compressed sidebar state is never longer than its budget

  @url-params
  Scenario: Hiding the sidebar through the URL survives moving between pages
    Given I open the dashboard with the sidebar hidden
    When I move to the runs page
    Then no sidebar is shown
    And the URL still hides the sidebar

