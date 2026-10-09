# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/legacy-redirects.spec.ts — see features/README.md.
#
# Route: /log/$runId/$old

Feature: Legacy log address

  As an engineer following a log link from before the layout mode was a
  parameter — `/log/<run>/<anything>` — I land on the run's log in the full
  layout, with whatever the link carried kept.

  Background:
    Given I am signed in

  # The redirect appends `mode=treeAndinfoAndlog` to whatever search the link
  # carried. Whether it pushes or replaces, and what it does when the link
  # already names a mode, is left open on purpose: both are decisions the
  # router migration made, and an oracle must not pin what is
  # about to change deliberately.
  @log @url-params
  Scenario: A two-segment log address opens the run log in the full layout
    Given a legacy two-segment log address for an imported run
    When I open that address
    Then the run's log is open in the full layout
    And the URL records the full layout

  @log @url-params
  Scenario: A two-segment log address keeps the focused result it carried
    Given a legacy two-segment log address that focuses a result
    When I open that address
    Then the run's log is open in the full layout
    And the URL still focuses that result
