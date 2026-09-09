# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/runs-page.spec.ts — see features/README.md.

Feature: Runs

  As an engineer looking for a particular test session, I filter the runs list by
  date, metadata and tag expressions, read each run's OK/NOK summary, and go from
  there to a run, its log, or a comparison of several runs.

  Background:
    Given I am signed in

  @smoke
  Scenario: Runs table lists a run matching a tag expression
    Given the fixture manifest describes an imported run
    When I open the runs page filtered by that run's fixture tag
    Then the runs table lists that run

  Scenario: The Run link opens the run details page
    Given the runs table lists a run
    When I follow the row's Run link
    Then the run details page is open

  Scenario: The Log link opens the log page
    Given the runs table lists a run
    When I follow the row's Log link
    Then the log page for that run is open

  Scenario: Sorting by statistic summary keeps the run listed
    Given the runs table lists a run
    When I sort the table by statistic summary
    Then the table is still healthy and the run is listed

  @needs-nok
  Scenario: The NOK summary badge reports the unexpected result count
    Given the fixture manifest describes a run with unexpected results
    When I open the runs page filtered by that run's fixture tag
    Then the row's NOK badge shows the unexpected result count from the manifest

  @needs-nok
  Scenario: Clicking the NOK badge opens the run with unexpected rows previewed
    Given the fixture manifest describes a run with unexpected results
    When I open the runs page filtered by that run's fixture tag
    And I click the row's NOK badge
    Then the run page for that run is open
    And the tests with unexpected results are listed on the run page

  Scenario: Applying a tag expression writes it to the URL
    Given I open the runs page for a date covered by the fixtures
    When I type a tag expression and submit the form
    Then the tag expression is recorded in the URL

  Scenario: Resetting the form clears the filters from the URL
    Given I open the runs page with a date range and a tag expression
    When I reset the form
    Then the URL no longer carries the filters

  Scenario: A tag expression that matches nothing shows the empty state
    When I open the runs page filtered by a tag that no run carries
    Then the runs page shows the "No runs found" empty state

  Scenario: Selecting two runs offers comparison and multi-run views
    Given the fixture manifest describes two imported runs
    When I open the runs page covering both runs
    And I select both rows
    Then the selection popover reports two selected runs
    And it offers to open them in the multiple-runs view
    And it offers to compare them

  ###########################################
  #         Filtering by badge              #
  ###########################################

  # A tag, metadata or important-tag badge is not decoration: clicking one writes
  # `runData` into the URL and refetches, because `runs.autoApplyBadgeFilters` is
  # on by default. That makes the badge and the Metas field two spellings of the
  # same filter, and these scenarios pin them to each other. Which tag lands in
  # which column is the backend's decision, so the scenarios pick a badge that
  # only some of the listed runs carry rather than naming a fixture value.

  @runs @url-params
  Scenario: Clicking a run tag badge filters the runs table and records it in the URL
    Given the runs table lists the runs imported on a fixture date
    When I click a tag badge that only some of those runs carry
    Then that tag is recorded in the URL as run data
    And the URL is back on the first page
    And only the runs carrying that tag are listed
    And the badge is shown as selected

  @runs @url-params
  Scenario: Clicking the same run tag badge again clears the run data filter
    Given the runs table is filtered by a tag badge
    When I click that badge again
    Then the run data is dropped from the URL
    And the runs the badge had filtered out are listed again

  # The filter is an AND, so two badges of the same row can never empty the table
  # — which is what makes this a test of the joining rather than of the query.
  @runs @url-params
  Scenario: Clicking two badges of the same run combines both into the run data filter
    Given the runs table lists the runs imported on a fixture date
    When I click an important tag badge of a run
    And I click a metadata badge of the same run
    Then both values are recorded in the URL as run data
    And that run is still listed

  # Badges render `key: value` but filter, and travel, as `key=value`. A link is
  # read back into the form, so this is the round trip in the other direction.
  @runs @url-params
  Scenario: A run data filter in the link is reflected in the Metas field
    Given a link that pins a run data value the fixture runs carry
    When I open that link
    Then the Metas field reports that value as selected
    And only the runs carrying it are listed

  @runs @url-params
  Scenario: Selecting a meta in the Metas field filters the runs table on submit
    Given the runs table lists the runs imported on a fixture date
    When I select a meta in the Metas field and submit the form
    Then that meta is recorded in the URL as run data
    And only the runs carrying it are listed

  @runs
  Scenario: Resetting the form clears the run data applied by a badge
    Given the runs table is filtered by a tag badge
    When I reset the form
    Then the run data is dropped from the URL
    And the runs the badge had filtered out are listed again

  # The form writes its whole block on submit, so a badge filter the form did not
  # know about would be dropped here rather than kept.
  @runs @url-params
  Scenario: Submitting a tag expression keeps the run data applied by a badge
    Given the runs table is filtered by a tag badge
    When I type a tag expression and submit the form
    Then the URL carries both the tag expression and the run data

  ####################################################################
  # URL parameters
  ####################################################################

  # The runs page reads its query string raw, with no codec and no validation,
  # so nothing catches a parameter that stops being written or stops being read
  # until a shared link quietly lists the wrong runs. See RUNS_URL_PARAMS in
  # pages/runs-page.ts for the inventory these scenarios are written against.

  @runs @url-params
  Scenario: A runs link restores the date range, the tag expression and the page size
    Given a link that pins a date range, a tag expression and a page size
    When I open that link
    Then the runs table lists the runs of that range
    And the form shows the tag expression the link pinned
    And the link still carries every parameter it was opened with

  # The pager is the one control that does not go through the form, so it is
  # also the one that can drift from it. Reloading proves the page it wrote is
  # read back rather than merely displayed.
  @runs @url-params
  Scenario: Paging the runs table records the page and page size and survives a reload
    Given I open the runs page for a date with more runs than fit on one page
    When I open the next page of runs
    Then the page and the page size are recorded in the URL
    When I reload the page
    Then the page and the page size are still recorded in the URL
    And the runs table is listing results again

  # A filter that narrowed the results while the table sat on a later page
  # would otherwise land the user on an empty page they never asked for.
  @runs @url-params
  Scenario: Submitting the runs form sends the table back to the first page
    Given I open the second page of a runs query
    When I type a tag expression and submit the form
    Then the URL is back on the first page
    And the page size and the tag expression are pinned

  # Reset deletes `duration` outright rather than emptying it, because an empty
  # duration in duration mode would describe a zero-length window.
  @runs @url-params
  Scenario: Resetting the runs form drops the duration but keeps the calendar mode
    Given I open the runs page with a duration window applied
    When I reset the form
    Then the duration is dropped from the URL
    And the calendar mode is still recorded in the URL

  # `duration` is recomputed against the current time on every read, so the
  # dates beside it are ignored rather than merged — a link that carries both
  # must not resolve to the stale ones.
  @runs @url-params
  Scenario: A duration link overrides the dates pinned beside it
    Given a link that pins a duration alongside a stale date range
    When I open that link
    Then the runs table is listing results again
    And the link still carries the duration and both dates

  # The selection is the one piece of state a user builds by clicking that is
  # not a query parameter of its own: it lives in the compressed sidebar blob.
  # Asserting the Compare link would pass wherever it was stored, so these read
  # `_s` itself. See support/sidebar-state.ts.
  @runs @url-params
  Scenario: Selecting runs records the selection in the compressed sidebar state
    Given the runs table lists two runs imported on a fixture date
    When I select both rows
    Then the selection popover reports two selected runs
    And the compressed sidebar state lists both run ids
    And no plain selection parameter is written to the URL

  @runs @url-params
  Scenario: A selected pair of runs survives a reload of the runs page
    Given I have selected two runs in the runs table
    When I reload the page
    Then the selection popover still reports two selected runs
    And the compressed sidebar state still lists both run ids

  @runs @url-params
  Scenario: Clearing the run selection removes it from the compressed sidebar state
    Given I have selected two runs in the runs table
    When I clear the selection
    Then the compressed sidebar state carries no selected runs
    And nothing reports a selection any more

  Scenario Outline: The runs page renders every view mode
    When I open the runs page in the given mode
    Then the mode's own section is rendered

    Examples:
      | mode     |
      | charts   |
      | progress |
