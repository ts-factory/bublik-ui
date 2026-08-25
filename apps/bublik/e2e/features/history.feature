# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/history-page.spec.ts — see features/README.md.

Feature: History

  As an engineer asking "has this test ever passed?", I build a query in the
  global search form — test path, parameters, run metadata, verdicts — apply it,
  and then read the answer in whichever shape suits the question: the flat list
  of results, the same results grouped by iteration hash, or, when the test
  reports measurements, as trend, series and stacked charts.

  The query lives entirely in the URL, so every applied filter is shareable, and
  the project selected in the sidebar scopes all of it.

  Background:
    Given I am signed in

  ###########################################
  #         Building a query                #
  ###########################################

  @history @smoke
  Scenario: Searching by test path queries the history API
    Given the fixture manifest describes a tested path
    When I search the history for that test path
    Then the history request is sent for that test path
    And the search form closes

  @history
  Scenario: The applied search is reflected in the URL
    Given I open the history page
    When I search the history for a test path
    Then the test path is recorded in the URL

  @history
  Scenario: The verdict lookup type can be switched to regex
    Given I open the global search form
    When I switch the verdict lookup to regex
    Then the regex lookup is selected

  # Turning the lookup off is not the same as clearing it — the entered verdicts
  # are kept in the form, the field just stops accepting input.
  @history
  Scenario: Disabling the verdict lookup disables the verdict field
    Given I open the global search form
    When I switch the verdict lookup off
    Then the verdict field is disabled

  # The footer Reset restores the form's defaults rather than emptying it: the
  # test path anchors a history query, so only the narrowing fields are cleared.
  @history
  Scenario: Resetting the search form clears the narrowing fields but keeps the test path
    Given I open the global search form with a test path and a hash entered
    When I reset the form
    Then the hash is cleared
    And the test path is kept

  @history
  Scenario: A search without a test path is rejected
    Given I open the global search form
    When I clear the test section
    And I apply the search
    Then the form reports that the test name is required
    And the search form stays open

  @history
  Scenario: A search with no obtained result types is rejected
    Given I open the global search form with a test path entered
    When I clear the result section
    And I apply the search
    Then the form reports that an obtained result type is required

  @history
  Scenario: Ctrl+Enter submits the search form
    Given I open the global search form with a test path entered
    When I press Ctrl+Enter
    Then the test path is recorded in the URL
    And the search form closes

  @history
  Scenario: The applied query is described by the filter legend
    Given the fixture manifest describes a tested path
    When I open the history page for that path
    Then the filter legend names the test path
    And the filter legend names the obtained results

  ###########################################
  #         Reading the results             #
  ###########################################

  @history
  Scenario: The results table lists the test path's results with log and run links
    Given the fixture manifest describes a tested path
    When I open the history page for that path
    Then the results table lists results
    And each result links to its log and its run

  @history
  Scenario: The substring filter narrows the results already loaded
    Given I search the history for a test path
    When I type a substring that no result matches
    Then the substring filter holds that value
    And no results are left in the table

  # The table is server-paginated, so the page has to survive a reload — which
  # means it belongs in the URL, not in component state.
  @history
  Scenario: Paging through the results records the page in the URL
    Given I open the history page for a path with more results than one page
    When I open the next page of results
    Then the second page is recorded in the URL

  @history
  Scenario: The legend counts the runs and results the query returned
    Given the fixture manifest describes a tested path
    When I open the history page for that path
    Then the legend counts at least one run
    And the legend counts at least one test result

  # Reset Filter is the header's escape hatch: it drops everything the user
  # narrowed by, but not the test path that makes the query a history query.
  @history
  Scenario: Reset Filter restores the defaults but keeps the test path
    Given I open the history page for a path with a hash filter applied
    When I press Reset Filter
    Then the hash is dropped from the URL
    And the test path is kept in the URL

  # A path the instance has never seen is a 404; the honest empty case is a real
  # path on a day the lab did not run it.
  @history
  Scenario: A test path with no matching results shows the empty state
    Given a tested path and a day the lab did not run it
    When I open the history page for that path on that day
    Then the page reports that there are no results

  @history
  Scenario: Opening history without a test path asks for one
    When I open the history page with no query
    Then the page reports that a test name is missing

  ###########################################
  #         Grouped results                 #
  ###########################################

  @history
  Scenario: Grouped results list each parameter hash with the results it produced
    Given the fixture manifest describes a tested path
    When I open the history page for that path in the aggregation mode
    Then the grouped table is listed by parameters and hash
    And each group lists the results it produced

  @history
  Scenario: A grouped result links to the log of that result
    Given I open the history page for a path in the aggregation mode
    When I follow the first numbered result link
    Then the log page for that result is open

  ###########################################
  #         Filtering by badge              #
  ###########################################

  # Left-clicking a badge in either table is a *client-side* filter over the rows
  # already loaded: the table's own global filter, nothing else. Right-clicking
  # the same cell is a different thing entirely — the context menu rewrites the
  # query in the URL and refetches. The two are easy to conflate, so both are
  # pinned here, in both directions.
  #
  # The rows are cut relative to what was listed rather than to a fixed count:
  # the list is server-paginated, so its first page is not a fixed set. The
  # grouped table is, which is where the exact assertions live.

  @history
  Scenario: Clicking a parameter badge narrows the history list to the matching results
    Given I open the history page for a path with more than one parameter set
    When I click a parameter badge that only some of the listed results carry
    Then only the results carrying that parameter are listed
    And the badge is shown as selected

  @history
  Scenario: Clicking a metadata badge narrows the history list to that configuration
    Given I open the history page for a path with more than one parameter set
    When I click a metadata badge that only some of the listed results carry
    Then only the results carrying that metadata are listed

  @history
  Scenario: Clicking an obtained result badge narrows the history list to that result
    Given I open the history page for a path with more than one obtained result
    When I click the obtained result badge of a listed result
    Then only the results of that type are listed

  # The contract that separates the badge from the context menu: a left click
  # must not touch the query, or a shared link would carry a filter the page
  # never applied — and every click would cost a round trip.
  @history @url-params
  Scenario: Badge filtering in the history list leaves the query untouched
    Given I open the history page for a path with more than one parameter set
    When I click a parameter badge
    Then the URL is unchanged
    And no history request was sent

  @history
  Scenario: Clicking a parameter badge in the grouped table narrows it to the matching hashes
    Given I open the history page for that path in the aggregation mode
    When I click a parameter badge of the first group
    Then only the groups carrying that parameter are listed

  @history
  Scenario: Clicking a verdict badge in the grouped table narrows it to the groups reporting it
    Given I open the history page for that path in the aggregation mode
    When I click a verdict badge of a group that reports one
    Then only the groups reporting that verdict are listed

  # The context menu rebuilds the query from the form state, which is hydrated
  # from the URL on mount — so this also proves the test path survives a filter
  # applied from a link rather than from the form.
  @history @url-params
  Scenario: Selecting parameters from the grouped table context menu applies them to the query
    Given I open the history page for that path in the aggregation mode
    When I right-click a group's parameters and choose Select parameters
    Then those parameters are recorded in the URL
    And the test path, the mode and the page size are still pinned
    And the URL is back on the first page
    And the history request carries the parameters as test args

  @history
  Scenario: Applying the search form replaces the badge filters with the form's own
    Given I open the history page narrowed by a parameter badge
    When I open the search form and apply it unchanged
    Then every result of the query is listed again

  ###########################################
  #         Charts                          #
  ###########################################

  @history @needs-measurements
  Scenario: Trend charts render for a test path with measurements
    Given the fixture manifest describes a path with measurements
    When I open the history page for that path in the trend charts mode
    Then the trend charts are rendered

  @history @needs-measurements
  Scenario: Series charts render one block per measurement result
    Given the fixture manifest describes a path with measurements
    When I open the history page for that path in the series charts mode
    Then the series charts are rendered

  # The chart filters narrow which plots are drawn, so they are part of the
  # query and have to survive a reload the same way the search does.
  @history @needs-measurements
  Scenario: Series charts can be narrowed by the chart name filter
    Given I open the history page for a path with measurements in the series charts mode
    When I pick the first chart in the Charts filter
    Then the picked chart is recorded in the URL

  # Stacking is a two-step flow: charts are collected from the trend view into a
  # selection carried by the URL, and the stacked view draws that selection.
  @history @needs-measurements
  Scenario: Adding trend charts to the combined view opens the stacked page
    Given I open the history page for a path with measurements in the trend charts mode
    When I add the first chart to the combined view
    And I open the stacked view from the selection
    Then the stacked mode is open with the selected chart in the URL

  @history
  Scenario: The stacked view asks for a selection when none was made
    When I open the history page in the stacked charts mode with nothing selected
    Then the page reports that no plots were selected

  ###########################################
  #         Modes                           #
  ###########################################

  # The rows are the `mode=` values themselves — an unknown one falls back to
  # the list of results, so each has to be asserted as the mode the page
  # actually resolved.
  @history
  Scenario Outline: The history page renders every result mode
    Given the fixture manifest describes a path with measurements
    When I open the history page for that path in the given mode
    Then the history page reports that mode as its layout

    Examples:
      | mode                      |
      | linear                    |
      | aggregation               |
      | measurements              |
      | measurements-by-iteration |
      | measurements-combined     |

  ###########################################
  #         Project scoping                 #
  ###########################################

  # Each fixture project runs its own test suite, so a path of one project is
  # proof of scoping: under another project it has to return nothing at all.
  @history
  Scenario: Selecting a project in the sidebar scopes the history results to it
    Given two projects with test paths that do not overlap
    When I select the first project in the sidebar
    And I open the history page for that project's test path
    Then the history request carries that project
    And the results table lists results
    When I open the history page for the other project's test path
    Then the page reports that there are no results
    When I select All projects in the sidebar
    Then the results table lists results

  @history
  Scenario Outline: Every history mode stays scoped to the selected project
    Given a project with a test path that reports measurements
    When I select that project in the sidebar
    And I open the history page for that path in the given mode
    Then the history request carries that project

    Examples:
      | mode              |
      | List Of Results   |
      | Groups Of Results |
      | Trend Charts      |

  ###########################################
  #         URL parameters                  #
  ###########################################

  # The whole query lives in the query string — the search form is not persisted
  # anywhere else, so a link is the only way a query is saved or shared. These
  # scenarios pin that contract in both directions: a parameter that stops being
  # written, stops being read, or is renamed on one side of the URL/backend
  # translation fails here rather than shipping a filter that silently matches
  # everything. See HISTORY_URL_PARAMS in pages/history-page.ts for the
  # inventory, including the name each parameter is sent to the API under.

  @history @url-params
  Scenario: A history link restores the query it pins
    Given a link that pins a test path, a date range, a layout and a page size
    When I open that link
    Then the results table lists the results of that query
    And the link still carries every parameter it was opened with

  # The one that catches a rename: `parameters` is sent as `test_args`,
  # `runData` as `tags`, `startDate` as `from_date` — and nothing validates the
  # URL on the way in, so a half-applied rename filters by nothing at all.
  @history @url-params
  Scenario: The history request translates the URL parameters into the API's names
    Given a link that pins every parameter the API renames
    When I open that link
    Then the history request carries each of them under its API name

  @history @url-params
  Scenario: Applying the search form writes the whole query into the URL
    Given I open the global search form with a test path, a hash and a verdict
    When I apply the search
    Then the values I entered are recorded in the URL
    And every search form parameter is written to the URL

  # resolveHistoryMode normalises an unknown mode for rendering only; the value
  # itself is left in the URL, and every later write stamps it back.
  @history @url-params
  Scenario: An unknown mode in the link falls back to the list of results
    Given a link whose mode is not a mode the page renders
    When I open that link
    Then the page renders the list of results
    And the URL still carries the unknown mode

  @history @url-params
  Scenario: Paging records the page and page size and survives a reload
    Given I open the history page for a path with more results than one page
    When I open the next page of results
    Then the page and the page size are recorded in the URL
    When I reload the page
    Then the page and the page size are still recorded in the URL
    And the results table lists the results of that query

  @history @url-params
  Scenario: Submitting the search form resets the page but keeps the mode, page size and project
    Given I open the second page of a scoped history query in the aggregation mode
    When I apply the search again
    Then the URL is back on the first page
    And the mode, the page size and the project are still pinned

  @history @url-params
  Scenario: Reset Filter keeps the test path, dates, mode and project and clears the rest
    Given I open a scoped history query narrowed by hash, parameters and verdict
    When I press Reset Filter
    Then the test path, the dates, the mode and the project are still pinned
    And the narrowing parameters are cleared

  @history @url-params @needs-measurements
  Scenario: The chart name filter survives a reload
    Given I open the history page for a path with measurements in the series charts mode
    When I pick the first chart in the Charts filter
    And I reload the page
    Then the picked chart is still recorded in the URL
    And the series charts are rendered

  # The trend view's stacked selection is the one chart state a link carries.
  # `combinedPlots` joins its ids with `;` while the series filters repeat their
  # keys — two encodings on one page, so a scenario that asserts the wrong one
  # passes against a filter matching nothing.
  @history @url-params @needs-measurements
  Scenario: Adding trend charts to the combined view records them in the URL
    Given I open the history page for a path with measurements in the trend charts mode
    When I add two charts to the combined view
    Then both chart ids are recorded in the URL as combined plots
    And the chart group is recorded in the URL

  # The substring filter is deliberately Redux-only: it narrows what is already
  # on screen rather than the query. A regression that started writing it would
  # make every shared link narrower than the sender meant — and one that started
  # *reading* it would re-apply a filter the sender had already dismissed.
  @history @url-params
  Scenario: The substring filter is not recorded in the URL and is lost on a reload
    Given I open a history query with results listed
    When I narrow the results with the substring filter
    Then fewer results are listed
    And the query parameters are unchanged
    When I reload the page
    Then every result of the query is listed again

  # Switching mode from the sidebar goes through the sidebar's own writer rather
  # than the search form, so it is the path most likely to drop the query.
  @history @url-params
  Scenario: Switching the history mode from the sidebar keeps the query it was showing
    Given I open a history query in the list of results
    When I switch to the grouped results from the sidebar
    Then the mode is recorded in the URL
    And the test path and the dates are still pinned

  @history @url-params @needs-measurements
  Scenario: The parameter filter of the series charts repeats one key per parameter
    Given I open the history page for a path with measurements in the series charts mode
    When I pick a parameter in the Parameters filter
    Then the parameter filter is recorded in the URL as a repeated key
    When I reload the page
    Then the parameter filter is still recorded in the URL
    And the series charts are rendered

  # The rename scenario above covers the value filters. The expression filters
  # are renamed too, and a dropped one is worse than a dropped value: the query
  # widens silently to every result instead of erroring, so the page looks like
  # it worked and simply found more.
  @history @url-params
  Scenario: The history request translates the expression filters into the API's names
    Given a link that pins every expression filter the form offers
    When I open that link
    Then the history request carries each expression under its API name
    And the link still carries every expression unchanged

  # The inverse of "Applying the search form writes the whole query into the
  # URL": a shared link has to be readable back into the form, or the recipient
  # cannot edit the query they were sent without retyping it.
  @history @url-params
  Scenario: A history link is read back into the search form
    Given a link that pins a test path, a hash and a tag expression
    When I open that link and edit the search
    Then the form shows the test path, the hash and the tag expression the link pinned

