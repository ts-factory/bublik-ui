# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/log-page.spec.ts — see features/README.md.

Feature: Log

  As an engineer reading a failing session, I open the run log, walk the result
  tree, focus a single test, narrow the tree to the failures, bookmark a log line
  to share, and jump from a result to its measurements.

  Background:
    Given I am signed in

  @smoke
  Scenario: The log layout follows the selected mode
    Given the fixture manifest describes an imported run
    When I open its log in the tree-and-info mode
    Then both the tree and the info panel are shown
    When I open its log in the log-only mode
    Then neither the tree nor the info panel is shown

  Scenario: Focusing a tree item loads that result's log
    Given the run's tree contains a test result
    When I open the log focused on that result
    Then the tree marks that result as focused
    And the JSON log is rendered
    When I go back to the run log
    Then the JSON log is rendered

  @needs-nok
  Scenario: The NOK-only tree keeps the focused error result reachable
    Given a run with unexpected results has an error result in its tree
    When I open the log focused on that error result
    And I turn on the NOK-only tree
    And I scroll to the focused result
    Then the tree marks that result as focused

  Scenario: The legacy toggle switches the log renderer
    Given I open the log of an imported run
    Then the JSON log is rendered
    When I turn on the legacy log
    Then the legacy log frame is shown
    When I turn off the legacy log
    Then the JSON log is rendered

  Scenario: Bookmarking a log line survives a reload
    Given I open the log focused on a test result
    When I click a log line number
    And I reload the page
    Then the bookmarked line is still recorded in the URL

  @needs-measurements
  Scenario: A result with measurements links to its measurements page
    Given the fixture manifest describes a result with measurements
    When I open the log focused on that result
    And I follow the Result link
    Then the measurements page is open

  ####################################################################
  # URL parameters
  ####################################################################

  # A log link is how one engineer sends another to the exact line they are
  # looking at, so the parameters below are the whole point of the page. Three
  # of them delete each other on write — focusing a result throws away the
  # bookmarked line and the page, and so does paging — because a bookmark
  # belongs to one result and would otherwise be restored against another. See
  # LOG_URL_PARAMS in pages/log-page.ts.

  @log @url-params
  Scenario: A log link restores the focused result and the layout
    Given a link that focuses one result of a run in the tree-and-log layout
    When I open that link
    Then the tree marks that result as focused
    And the tree is shown and the info panel is not
    And the link still carries the focused result and the layout

  @log @url-params
  Scenario: Focusing a result clears the bookmarked line and the page
    Given I open a log carrying a bookmarked line and a page
    When I focus a result in the tree
    Then the focused result is recorded in the URL
    And the bookmarked line and the page are dropped from the URL

  @log @url-params
  Scenario: Going back to the run log drops the focus, the line and the page
    Given I open a log focused on a result with a bookmarked line
    When I go back to the run log
    Then the focused result, the bookmarked line and the page are all dropped from the URL
    And the JSON log is rendered

  # There is no fallback here, unlike the dashboard and the history page: the
  # layout conditions compare the raw value against LogPageMode by equality, so
  # an unrecognised mode matches neither panel and renders the log alone. That
  # is the contract, not a bug to be papered over by a test that accepts any
  # layout.
  @log @url-params
  Scenario: An unknown log layout in the link renders the log on its own
    Given a link whose layout is not a layout the log renders
    When I open that link
    Then neither the tree nor the info panel is shown
    And the URL still carries the unknown layout

  @log @url-params
  Scenario: Turning on the legacy log records it in the URL and survives a reload
    Given I open the log of an imported run
    When I turn on the legacy log
    Then the URL records the legacy renderer
    When I reload the page
    Then the legacy log frame is shown
    When I turn off the legacy log
    Then the URL records the legacy renderer as off

  # `experimental` is read but never written any more. A link that still carries
  # it must keep working, and the toggle must clear it rather than leave two
  # parameters disagreeing about which renderer is in use.
  @log @url-params
  Scenario: A link using the deprecated experimental parameter still opens the legacy log
    Given a link that asks for the legacy log through the deprecated parameter
    When I open that link
    Then the legacy log frame is shown
    When I turn off the legacy log
    Then the deprecated parameter is dropped from the URL
    And the URL records the legacy renderer as off

  # `page` selects one page of a result's log. Page one is the log's canonical
  # file and is written as an ABSENT parameter, never as `page=1`: the publisher
  # only suffixes pages above one, so against a published bundle `?page=1` asks
  # for a file nobody wrote. That is why the pager deletes the key on the way
  # back to page one, and why there is no `?page=1` scenario below — it would
  # pin a 404 rather than a contract.
  #
  # Paging applies only to a focused result; the run log never carries a page.
  # `page=0` is every page at once, and is also remembered in localStorage for a
  # day, so these scenarios clear that memory first — otherwise "no page" would
  # silently mean page zero.
  #
  # Which results paginate is a property of the fixture, not of a row count: rgt
  # cuts pages on raw-log byte size per node, so the manifest records the page
  # count (`logPages`) and these scenarios read it from there.

  @log @url-params @needs-log-pagination
  Scenario: A log with several pages opens on its first page
    Given a fixture result whose log spans several pages
    When I open that result's log
    Then the pager offers every page of the log
    And the first page is the one shown
    And the URL carries no page

  @log @url-params @needs-log-pagination
  Scenario: A link to a later page of a log opens that page
    Given a fixture result whose log spans several pages
    When I open a link to its second page
    Then the second page is the one shown
    And the URL still carries the second page
    And the rows shown are not the rows of the first page

  @log @url-params @needs-log-pagination
  Scenario: Paging back to the first page drops the page and the bookmarked line
    Given I open the second page of a result's log
    When I bookmark a log line
    And I page back to the first page
    Then the page is dropped from the URL
    And the bookmarked line is dropped from the URL
    And the first page is the one shown

  @log @url-params @needs-log-pagination
  Scenario: Asking for all pages records page zero and shows the whole log
    Given I open a result's log that spans several pages
    When I ask for all pages
    Then the URL records page zero
    And the All pages button is pressed
    And the log shows every row of every page

  # The all-pages file reports no page count of its own, so the pager's numbers
  # are recovered from the numbered page the app loads alongside it. Showing
  # every page is therefore not "no pagination": the pager stays, and the only
  # thing that changes is that no single page is current any more — which is
  # what makes the All pages button, not the pager, the signal for this state.
  @log @needs-log-pagination
  Scenario: A link that asks for every page keeps the pager but marks no page current
    Given a fixture result whose log spans several pages
    When I open a link that asks for all pages
    Then the All pages button is pressed
    And the pager still offers every page of the log
    And no page is marked as the current one
    When I go back to the first page
    Then the first page is the one shown

  # A bookmarked line is only worth restoring if it was off screen to begin
  # with, which needs a log far taller than a screen. This one is published as a
  # single file, so nothing here is about paging.
  @log @url-params @needs-long-log
  Scenario: A bookmarked line deep in a long log is scrolled back into view
    Given I open a result with a long single-page log
    When I bookmark a line near the end of the log
    And I reload the page
    Then the bookmarked line is still recorded in the URL
    And that line is back in view
    And the top of the log is out of view

  # The tree filter is deliberately not shareable: it is a reading aid, not part
  # of the view a link describes. A regression that started writing it would
  # make every shared link narrower than the sender meant.
  @log @url-params
  Scenario: The NOK-only tree toggle is not recorded in the URL
    Given I open the log of a run with unexpected results
    When I turn on the NOK-only tree
    Then the tree lists fewer results
    And the log parameters are unchanged
