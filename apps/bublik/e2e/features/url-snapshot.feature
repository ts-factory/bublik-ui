# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/url-snapshot.spec.ts — see features/README.md.

Feature: URL snapshot

  As an engineer changing how Bublik routes, I want every address the app
  lands on, every internal link it renders and every query string it writes
  pinned in a committed snapshot, so that a change to the router cannot alter
  a URL without the diff showing it.

  The snapshot lives in apps/bublik/e2e/snapshots/url-snapshot.json. It is
  recorded with `playwright test --grep @url-snapshot --update-snapshots` and
  compared on every other run. Three things are normalised: the compressed
  sidebar memory `_s` (kept as a presence flag), chat thread UUIDs, and the key
  order inside JSON or lz-string values (recorded as `json:`/`lz:` plus the
  sorted object, so a codec change still shows). Everything else, including
  percent-encoding and the order of the query keys, is compared verbatim.
  Pages that list whatever the database holds record their address only, not
  their links. A write is recorded with whether it pushed a history entry or
  replaced the current one, and whether the sidebar memory changed with it.
  The URLs are produced by the app's own code, not by the browser, so the
  snapshot runs on the first requested browser only.

  Background:
    Given I am signed in

  @url-snapshot
  Scenario: The shell routes match the recorded URL snapshot
    When I open the root address, an unknown address, the hidden-sidebar and settings variants of the dashboard, the help page, the bare admin page, the legacy admin issues addresses, the chat page and the packet viewer
    And I navigate with the command palette and open a settings section
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The auth routes match the recorded URL snapshot
    When I open the login page with and without a return address, the forgot page, a password reset link and an activation link
    Then every address and link matches the recorded snapshot

  @url-snapshot
  Scenario: The dashboard matches the recorded URL snapshot
    When I open the dashboard plain, for a fixture date, in columns mode, in TV mode and through a legacy dates link
    And I change the mode, search, switch auto reload, enter and leave TV mode and press Today
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The runs list matches the recorded URL snapshot
    When I open the runs list plain, for a fixture date, in charts and progress mode and with a tag expression
    And I submit and reset the filter form and select two runs
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The compare and multiple pages match the recorded URL snapshot
    When I open the compare page with and without a pair and the multiple page with and without pinned runs
    And I expand a diff row, show the info diff and select another pinned run
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The run page matches the recorded URL snapshot
    When I open a run plain, at a target iteration, with a result filter and through a legacy plain-JSON expanded link
    And I expand a package and preview NOK results
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The log page matches the recorded URL snapshot
    When I open a run's log plain, in each layout mode, focused on a result, through the legacy two-segment address and in legacy rendering
    And I focus a result, return to the run log and toggle the legacy renderer
    Then every address, link and write matches the recorded snapshot

  # Needs the fixture logs served by the stack's log server; the tree and the
  # layout modes above work from the database alone.
  @url-snapshot @needs-log-pagination
  Scenario: The log content writes match the recorded URL snapshot
    When I open a result's log and bookmark a line, then open a paginated log and move between its pages
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The run report matches the recorded URL snapshot
    When I open a report with its config, without a config, through the trailing-slash link and at an anchor
    And I open a table-of-contents entry, collapse a block and step to the next block
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The measurements page matches the recorded URL snapshot
    When I open a result's measurements plain, in default mode and in overlay mode
    And I add a chart to the selection and open the overlay
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The history page matches the recorded URL snapshot
    When I open history plain, for a fixture test path in each mode and through the v2 alias
    And I submit the global search form
    Then every address, link and write matches the recorded snapshot

  @url-snapshot
  Scenario: The issues pages match the recorded URL snapshot
    When I open the issues list, the rules list, an issue and a run's issues
    Then every address and link matches the recorded snapshot

  @url-snapshot
  Scenario: The admin pages match the recorded URL snapshot
    When I open the import, config, users, flower and analytics pages with and without their parameters
    Then every address and link matches the recorded snapshot
