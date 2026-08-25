# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-details.spec.ts — see features/README.md.

Feature: Run details

  As an engineer investigating a test session, I open a run to read its metadata,
  walk the package/test tree, open the result table of an individual test, and
  jump from a result to its log, history or measurements.

  Background:
    Given I am signed in

  @smoke
  Scenario: Run details show the metadata recorded in the manifest
    Given the fixture manifest describes an imported run
    When I open that run's page
    Then the info card shows the run id
    And the info card shows the conclusion

  Scenario: Exposing the run info reveals the full detail set
    Given I open an imported run's page
    When I expose the full run info
    Then the info card also shows the run status and duration

  Scenario: Expanding a package reveals the tests it contains
    Given I open an imported run's page
    When I expand the first collapsed package of the tree
    Then more rows are shown than before

  @needs-nok
  Scenario: Open NOK expands the result tables of the unexpected results
    Given I open a run that has unexpected results
    When I press Open NOK
    Then at least one result table is expanded
    When I press Reset
    Then no result table is expanded

  @needs-nok
  Scenario: Preview NOK expands the tree without opening result tables
    Given I open a run that has unexpected results
    When I press Preview NOK
    Then the tests with unexpected results are listed
    And no result table is expanded

  Scenario: Clicking a count badge opens that test's result table
    Given I open an imported run's page and expand the tree down to a test
    When I click a count badge of that test row
    Then that test's result table is expanded

  Scenario: The run header opens the log of the whole run
    Given I open an imported run's page
    When I follow the header's Log link
    Then the log page for that run is open

  Scenario: A result row links to the log of that result
    Given I open an imported run's page with a result table expanded
    When I follow the result's Log link
    Then the log page opens focused on that result

  Scenario: The compare form rejects a value that is not a run
    Given I open an imported run's page
    When I open the compare form and submit an invalid run reference
    Then the form reports that the value is not a valid URL or run id

  @needs-report
  Scenario: The reports menu lists the configured report
    Given I open a run whose project has a report config
    When I open the reports menu
    Then the configured report is offered

  ###########################################
  #         Filtering the result table      #
  ###########################################

  # Inside an expanded result table every badge is a filter over that table's own
  # rows: the obtained result, its verdicts, the artifacts, the parameters and the
  # requirements. The Expected Results column looks the same and is deliberately
  # inert. The filters are column filters, kept in the compressed `columnFilters`
  # query parameter, so they have to survive a reload — and the toolbar's faceted
  # pickers are the same state seen from the other side.
  #
  # Two runs are used: no fixture test reports both artifacts and requirements,
  # and the runs that report requirements are the large ones.

  @run
  Scenario: Clicking an obtained result badge filters the result table to that result
    Given I open a run with the result table of a test that reports artifacts expanded
    When I click the obtained result badge of the first row
    Then only the results of that type are listed
    And the Obtained Result filter of the toolbar reports it

  @run
  Scenario: Clicking an artifact badge narrows the result table to the results reporting it
    Given I open a run with the result table of a test that reports artifacts expanded
    When I click an artifact badge that only some of the results carry
    Then only the results carrying that artifact are listed
    And the Artifacts filter of the toolbar reports it

  @run
  Scenario: Clicking a parameter badge narrows the result table to the matching iterations
    Given I open a run with the result table of a test that reports artifacts expanded
    When I click a parameter badge that only some of the iterations carry
    Then only the iterations carrying that parameter are listed
    And the Parameters filter of the toolbar reports it

  # The toolbar is shown whenever a filter is applied, whatever the toggle says,
  # so a badge click reveals it without the toggle being touched.
  @run
  Scenario: Clicking a badge reveals the result table filter toolbar
    Given I open a run with the result table of a test that reports artifacts expanded
    Then the filter toolbar is hidden
    When I click the obtained result badge of the first row
    Then the filter toolbar is shown

  @run
  Scenario: The Filters toggle shows and hides the result table toolbar
    Given I open a run with the result table of a test that reports artifacts expanded
    When I press Filters in the Requirements header
    Then the filter toolbar is shown
    When I press Filters again
    Then the filter toolbar is hidden

  # The toolbar is only kept on screen once it has been asked for, so Reset —
  # which drops the filters that were holding it open — would otherwise take the
  # toolbar with it and leave nothing to assert against.
  @run
  Scenario: Reset clears every result table filter
    Given I open a run with the result table of a test that reports artifacts expanded
    When I press Filters in the Requirements header
    And I click an artifact badge that only some of the results carry
    Then only the results carrying that artifact are listed
    When I press Reset in the filter toolbar
    Then every result of that test is listed again
    And no toolbar filter reports a selection

  # `columnFilters` is compressed, so the link cannot be read — the round trip is
  # proved by reloading and finding the same rows.
  @run @url-params
  Scenario: Result table filters are recorded in the URL and survive a reload
    Given I open a run with the result table narrowed by an artifact badge
    Then the URL carries the result table column filters
    When I reload the page
    Then the result table is still narrowed the same way

  @run @needs-nok
  Scenario: Clicking a verdict badge narrows the result table to the results reporting it
    Given I open a run whose results carry both requirements and verdicts
    When I click a verdict badge that only some of the results carry
    Then only the results carrying that verdict are listed
    And the Verdicts filter of the toolbar reports it

  # Requirements are the odd one out: they are shared by every result table on the
  # page and stripped out of `columnFilters`, so this scenario keeps a single
  # table open and claims nothing about the URL.
  @run @needs-nok
  Scenario: Clicking a requirement badge narrows the result table to that requirement
    Given I open a run whose results carry both requirements and verdicts
    When I click a requirement badge that only some of the results carry
    Then only the results carrying that requirement are listed

  @run @comments
  Scenario: A run comment can be added and then removed
    Given I open an imported run's page with no comment
    When I add a comment to the run
    Then the info card shows that comment
    When I remove the run comment
    Then the info card shows no comment

  # Notes are hidden by default, so the column has to be switched on first.
  @run @comments
  Scenario: A note can be added to a test node and then removed
    Given I open an imported run's page with the Notes column shown
    When I add a note to a test node
    Then that test node shows the note
    When I delete the note
    Then that test node has no note

  @run @runs @dashboard @compromised
  Scenario: Marking a run as compromised marks it on the run, runs and dashboard pages
    Given I open a run that is not compromised
    When I mark the run as compromised
    Then the run page reports the run as compromised
    And the run's conclusion is compromised
    When I open the runs page filtered to that run
    Then the runs row reports the run as compromised
    When I open the dashboard for that run's date
    Then the dashboard row reports the run as compromised
    When I remove the compromised status from the run
    Then the run page no longer reports the run as compromised

  @run @compromised
  Scenario: The compromise form requires a comment
    Given I open a run that is not compromised
    When I submit the compromise form without a comment
    Then the form reports that a comment is required

  @run @history
  Scenario: The History link opens the history for the test path, parameters and important tags
    Given I open an imported run's page with a result table expanded
    When I follow the result's History link
    Then the history page opens filtered by that test path
    And the history query carries the result parameters and the run's important tags

  # The first column names the scenario; the second is the menu item it drives.
  @run @history @needs-nok
  Scenario Outline: The result history menu filters the history by the chosen variant
    Given I open a run with unexpected results and a result table expanded
    When I choose the given variant from the result history menu
    Then the history query carries the parameters of that variant

    Examples:
      | variant                        | menu item                         |
      | Path only                      | Test Path                         |
      | Path and verdicts              | Test Path + Verdicts              |
      | Path and parameters            | Test Path + Parameters            |
      | Path, parameters and all tags  | Test Path + Parameters + All Tags |

  @run @history
  Scenario: A prefilled history link opens the global search form with the query prefilled
    Given I open an imported run's page with a result table expanded
    When I choose a prefilled variant from the result history menu
    Then the global search form opens with that test path prefilled

  @run @history
  Scenario: The test node history link opens the history scoped to that run
    Given I open an imported run's page and expand the tree down to a test node
    When I open the history view of that test node
    Then the history query is scoped to that run and test path

  ####################################################################
  # URL parameters
  ####################################################################

  # Most of this page's state is lz-string compressed, so a link cannot be read
  # and must not be asserted as a literal — reading it would pin the encoding
  # rather than the state. What a scenario can prove is that the key is written,
  # and that opening the same link again renders the same table. See
  # RUN_URL_PARAMS in pages/run-page.ts.

  @run @url-params
  Scenario: Expanding the run tree records the compressed state in the URL
    Given I open an imported run's page
    When I expand a collapsed package of the tree
    Then the URL carries the compressed expanded state
    When I reload the page
    Then the same rows are expanded

  # A hand-built compressed value would test lz-string rather than the page, so
  # this shares the link the app itself produced — which is exactly what a user
  # who copies the address bar sends.
  @run @url-params
  Scenario: A shared run link restores the tree the sender had expanded
    Given I have expanded a package of the run tree
    When I open the link that produced in a clean session
    Then the same rows are expanded

  # Older links carry these parameters as plain JSON. They are migrated on mount
  # rather than ignored, so the link keeps working and every later write uses
  # the compressed form.
  @run @url-params
  Scenario: A plainly encoded run table state in the link is rewritten as compressed
    Given a link whose column order is plain JSON and whose global filter is not
    When I open that link
    Then the run table is rendered
    And the global filter is rewritten into the compressed form

  # `targetIterationId` is one of the two parameters here that are plain rather
  # than compressed, and the one a log's Run link emits — so it is the link most
  # often followed into this page from somewhere else.
  @run @url-params
  Scenario: A run link targeting an iteration opens that result's table
    Given a link that targets one iteration of an imported run
    When I open that link
    Then that iteration's result table is shown
    And the link still carries the targeted iteration

  # The unexpected-only expansion arrives as react-router location state, not as
  # a parameter. That is deliberate — it is a one-shot intent, not a view — and
  # this scenario is what keeps it from quietly becoming shareable.
  @run @url-params @needs-nok
  Scenario: Opening a run from a NOK counter does not record the unexpected filter in the URL
    Given the dashboard lists a run with unexpected results
    When I click the run's NOK counter
    Then the run page for that run is open
    And no unexpected filter is recorded in the URL
