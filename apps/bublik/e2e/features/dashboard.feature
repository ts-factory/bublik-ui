# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/dashboard.spec.ts — see features/README.md.

Feature: Dashboard

  As an engineer watching the test lab, I open the dashboard to see what ran on a
  given day, spot the runs with unexpected results, and get from a NOK counter to
  the failing tests in one click. The dashboard is public: it needs no sign-in.

  @dashboard @smoke
  Scenario: Dashboard lists the runs imported for a date
    Given a run was imported for a day
    When I open the dashboard for that day
    Then the run appears as a row in the dashboard table
    And the row shows its conclusion, total and NOK counters

  @dashboard
  Scenario: Dashboard shows an empty state for a date without runs
    Given a day with no imported runs
    When I open the dashboard for that day
    Then the dashboard shows the "No data" empty state
    And none of the imported runs are listed

  @dashboard @needs-nok
  Scenario: NOK counter reports the number of unexpected results
    Given an imported run has unexpected results
    When I open the dashboard for that run's day
    Then the run's NOK counter equals the number of unexpected results

  @dashboard @needs-nok
  Scenario: Clicking the NOK counter opens the run with unexpected rows previewed
    Given an imported run has unexpected results
    When I open the dashboard for that run's day
    And I click the run's NOK counter
    Then the run page for that run is open
    And the packages containing unexpected results are expanded
    And the tests with unexpected results are listed
    But no result table is expanded yet

  @dashboard @needs-nok
  Scenario: Ctrl-clicking the NOK counter opens the run with the result tables expanded
    Given an imported run has unexpected results
    When I open the dashboard for that run's day
    And I ctrl-click the run's NOK counter
    Then the run page for that run is open
    And the result table of a test with unexpected results is expanded

  # Which page a counter opens is deployment configuration (the backend attaches
  # a handler per column), so the scenario checks the mapping, not one layout.
  @dashboard
  Scenario: Clicking the total counter follows the destination the dashboard declares
    Given the dashboard declares where the run's total counter leads
    When I open the dashboard for that day
    And I click the run's total counter
    Then that declared destination is open

  @dashboard
  Scenario: Expanding a dashboard row reveals the run's pass rate history
    Given a run was imported for a day
    When I open the dashboard for that day
    And I expand the run's row
    Then the row's pass rate history is shown
    When I collapse the run's row
    Then the row's pass rate history is hidden

  @dashboard
  Scenario: Searching the dashboard narrows the table to matching runs
    Given a run was imported for a day
    When I open the dashboard for that day
    And I search for a term that no run matches
    Then the run is no longer listed
    When I clear the search
    Then the run is listed again

  @dashboard
  Scenario: Switching the layout mode shows two days side by side
    Given a run was imported for a day
    When I open the dashboard for that day
    And I switch the layout to two days per column
    Then the dashboard URL records the columns mode
    And the run is still listed

  @dashboard
  Scenario: The Today button returns the dashboard to the current day
    Given a run was imported for a day
    When I open the dashboard for that day
    And I press the Today button
    Then the dashboard URL no longer pins a date

  # "Today" is the latest day the backend has runs for, and that is resolved per
  # project — so with a project selected it lands on that project's latest runs.
  @dashboard
  Scenario: The Today button opens the latest day of the selected project
    Given a project whose runs span more than one day
    When I open the dashboard for that project on an older day
    And I press the Today button
    Then the dashboard shows that project's latest day
    And the runs of that latest day are listed
    But the older day's run is not listed

  @dashboard
  Scenario: Refreshing the dashboard refetches the day's runs
    Given a run was imported for a day
    When I open the dashboard for that day
    And I press the refresh button
    Then the dashboard fetches the day's runs again
    And the run is still listed

  @dashboard
  Scenario: Auto reload refreshes the dashboard on a timer
    Given a run was imported for a day
    When I open the dashboard for that day
    And I turn on Auto reload
    Then the dashboard reloads the day's runs on its own
    When I turn off Auto reload
    Then Auto reload is off

  @dashboard
  Scenario: TV mode shows the dashboard full screen until Escape
    Given a run was imported for a day
    When I open the dashboard for that day
    And I enter TV mode
    Then the dashboard fills the screen without the page controls
    And the run is listed on the TV screen
    When I press Escape
    Then TV mode is closed and the dashboard controls are back

  @dashboard
  Scenario: Selecting a project in the sidebar scopes the dashboard to it
    Given two runs of different projects were imported for the same day
    When I open the dashboard for that day
    Then both runs are listed
    When I select the first run's project in the sidebar
    Then only that project's run is listed
    And the sidebar shows the project as selected
    When I select All projects in the sidebar
    Then both runs are listed again

  # The dashboard keeps all of its state in the query string, so a link is the
  # only way a view is saved or shared. These scenarios pin that contract in both
  # directions — a parameter that stops being written, or stops being read, fails
  # here rather than shipping. See DASHBOARD_URL_PARAMS in pages/dashboard-page.ts.

  @dashboard @url-params
  Scenario: A dashboard link restores the date, mode and auto reload
    Given a link that pins a day, a layout, a project and auto reload
    When I open that link
    Then the runs of that day are listed
    And the layout the link asked for is selected
    And auto reload is on
    And the link still carries every parameter it was opened with

  @dashboard @url-params
  Scenario: Searching the dashboard records the term in the URL and survives a reload
    Given a run was imported for a day
    When I open the dashboard for that day
    And I search for a term that no run matches
    Then the search term is recorded in the URL
    And the run is no longer listed
    When I reload the page
    Then the search box still holds the term
    And the run is still not listed
    When I clear the search
    Then the URL keeps an empty search term
    And the run is listed again

  @dashboard @url-params
  Scenario: Switching to two-day mode pins the previous day as the second date
    Given I open the dashboard for a day in single-day mode
    When I switch the layout to two days per column
    Then the URL pins the day before as the second date
    And the day I opened is still pinned as the first date
    When I switch the layout back to a single day
    Then the URL no longer pins a second date

  @dashboard @url-params
  Scenario: Dashboard controls preserve the other URL parameters
    Given a link that pins a day, a search term and a project
    When I turn on Auto reload
    Then the day, the search term and the project are still pinned
    When I switch the layout to two days per column
    Then the day, the search term and the project are still pinned
    When I enter TV mode and press Escape
    Then the day, the search term and the project are still pinned

  # DateParam decodes an unparsable value to nothing, so the dashboard falls back
  # to the day it would have shown anyway rather than erroring.
  @dashboard @url-params
  Scenario: An unparsable date in the link falls back to the latest day
    Given a link whose pinned date cannot be parsed
    When I open that link
    Then the dashboard shows the latest day of that project
    And the URL still carries the unparsable date

  # The dashboard used to encode both of its days into one base64 parameter.
  # Links from that era are still in wikis and chat logs, and the page rewrites
  # them on load — losing everything except the layout, which is why the project
  # is deliberately absent from the assertions below.
  @dashboard @url-params
  Scenario: A legacy dates link is rewritten into the pinned days
    Given a link that pins its two days in the old encoded dates parameter
    When I open that link
    Then the URL pins the earlier day as the second date and the later as the first
    And the URL no longer carries the encoded dates parameter
    And the layout the link asked for is still selected

  # Deep-linking TV mode is not the same path as pressing the button: the button
  # forces auto reload on, a link leaves `reload` exactly as it found it.
  @dashboard @url-params
  Scenario: A TV mode link opens the dashboard full screen without forcing auto reload
    Given a link that pins a day and asks for TV mode
    When I open that link
    Then the TV screen is shown with that day's run
    And auto reload is left as the link set it

  # The mode picker writes `secondary` as the day before `main`. A link is free
  # to pin any two days, and reading them back is the half that sharing depends
  # on.
  @dashboard @url-params
  Scenario: A dashboard link pinning two days shows both of them
    Given a link that pins two days a project has runs on in the two-day layout
    When I open that link
    Then the runs of both days are listed
    And the link still carries both days


  # Clearing the search leaves `search=` behind rather than deleting the key, so
  # the read side has to treat an empty term as no filter. Treating it as a
  # filter would empty the table for anyone who cleared the box and shared the
  # link.
  @dashboard @url-params
  Scenario: A dashboard link with an empty search term lists every run of the day
    Given a link that pins a day and an empty search term
    When I open that link
    Then the runs of that day are listed
    And the URL still carries the empty search term
