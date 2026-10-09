# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-results.spec.ts — see features/README.md.
#
# Mostly seeded scenarios: read-only against the classification the seed
# applied. Issues, rules and pins are named by their plan ids and resolved
# through support/seeded-classification.ts, never by title or database id.
# Write scenarios may apply the seeded rules to a run and stamp more results
# under a seeded issue at any time, so counts are only ever "at least", and a
# scenario asserts on the plan's own results: which are listed, which are gone.
#
# Route: /issues/$issueId/results

Feature: Issue results

  As an engineer looking into one issue, I open every result it was stamped
  on, across runs, see which run and test each one came from, narrow them
  down to the ones I care about, and page through the rest.

  Background:
    Given I am signed in

  @issues @needs-classification @smoke
  Scenario: The results page lists every result the seed stamped under an issue
    Given the seed stamped results under an issue through its rules
    When I open the issue's results page
    Then each of those results is listed with a link to the run it belongs to
    And the footer counts at least that many results

  @issues @needs-classification
  Scenario: A stamped result on the issue results page names its test and links out
    Given a seeded result with a package path and a verdict
    When I open its issue's results page
    Then the result is listed with its test name and package path
    And it shows the verdicts the result obtained
    And it links to the run, the log, the history and the preview

  # The server narrows the rows, over every page, by the same selection the
  # run page's table keeps in the URL for one test's results.
  @issues @needs-classification @url-params
  Scenario: The Verdicts filter narrows an issue's results on the server and is written to the URL
    Given a seeded issue whose results obtained different verdicts
    When I open the issue's results page and pick one result's verdict in the Verdicts filter
    Then the filters are written to the URL
    And the results with that verdict are listed and the others are gone
    When I reset the filters
    Then the filters are cleared from the URL and every result is listed again

  @issues @needs-classification @url-params
  Scenario: The issue results page writes its page size to the URL
    Given a seeded issue with results
    When I open its results page and choose ten results to a page
    Then the page size is written to the URL and at most ten results are listed
    And the footer range starts at the first result

  @issues @needs-classification
  Scenario: The Rules link and the Results button lead between an issue's rules and its results
    Given a seeded issue with rules and results
    When I open the issue's results page
    Then the sidebar's Issue submenu counts its rules and its results
    When I follow the Rules link in the header
    Then the issue's page is open on its rules
    When I follow the Results button
    Then the issue's results page is open again

  @issues @needs-classification
  Scenario: The Results count on the issues page opens the issue's results
    Given a seeded issue with results
    When I open its project's issues page and click the issue's Results count
    Then the issue's results page is open
    And the footer counts as many results as the badge did

  @issues @needs-classification
  Scenario: A stamp's key on the run page opens the issue's results
    Given a seeded result the seed stamped in a run
    When I open the run, the test's results, and follow the stamp's key
    Then the issue's results page is open

  @issues @issues-write
  Scenario: A freshly recorded issue has no results yet
    Given I record an issue
    When I open its results page
    Then it says nothing is classified under the issue yet
    And the footer counts no results
    And I delete the issue from its results page

  @issues
  Scenario: An invalid issue id on the results page shows the no-data state
    When I open the issue results page with an id that is not a number
    Then I am told the issue id is missing or invalid
