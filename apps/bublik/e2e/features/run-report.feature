# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-report.spec.ts — see features/README.md.

Feature: Run report

  As an engineer preparing a performance summary, I open a run's report for a
  given configuration, navigate it through its table of contents and the
  keyboard, follow a measurement back to the log that produced it, and expect
  the URL to describe exactly where I am so that I can share it or come back.

  Background:
    Given I am signed in

  @report
  Scenario: A report without a configuration reports the missing config
    Given the fixture manifest describes a run whose project has a report config
    When I open that run's report without choosing a configuration
    Then the page reports that the config id is missing

  @report @needs-report
  Scenario: A report renders for the configured report config
    Given a report config exists for that run
    When I open the run's report for that config
    Then the report page is rendered

  @report @needs-report
  Scenario: The report links back to the configuration that produced it
    Given I open a rendered report
    When I follow the Config link
    Then the configuration editor opens for that config

  @report @needs-report
  Scenario: A report opened with an unknown config id reports the failure
    Given the fixture manifest describes a run whose project has a report config
    When I open that run's report for a config id that does not exist
    Then the page reports that the config was not found

  @report @needs-report
  Scenario: The report renders every test block from the report payload
    Given the report payload lists the test blocks it contains
    When I open the rendered report
    Then every test block from the payload is on the page

  @report @needs-report
  Scenario: The table of contents lists every block in the report
    Given the report payload lists its blocks at every level
    When I open the rendered report
    Then every test, argument values and measurement block has an entry
    When I expand a measurement entry
    Then its records are listed too

  @report @needs-report @url-params
  Scenario: Clicking a table of contents entry scrolls to its block and records the anchor in the URL
    Given I open a rendered report
    When I follow a table of contents entry for a measurement
    Then the report scrolls to that block
    And the URL anchors that block on the same configuration

  @report @needs-report @url-params
  Scenario: Opening the report at an anchor scrolls straight to that block
    Given the report payload lists a record far down the report
    When I open the report at that record's anchor
    Then that record is rendered
    And the report scrolls to that block

  @report @needs-report @url-params
  Scenario: Reloading an anchored report restores the same block
    Given I open the report at a record's anchor
    When I reload the page
    Then that record is rendered
    And the report scrolls to that block

  @report @needs-report @url-params
  Scenario: Browser back returns to the previously anchored block
    Given I follow a table of contents entry for a measurement
    When I follow a table of contents entry for another measurement
    And I go back
    Then the URL anchors the first block again
    And the report scrolls to that block

  @report @needs-report
  Scenario: Saving a location from a record header confirms the anchor
    Given I open a rendered report
    When I follow a record's own header link
    Then the page confirms the location was saved
    And the URL anchors that record

  @report @needs-report @url-params
  Scenario: Collapsing a table of contents entry hides its children and survives a reload
    Given I open a rendered report
    When I collapse a test block in the table of contents
    Then its child entries are gone and the URL records the collapsed block
    When I reload the page
    Then the block is still collapsed
    When I expand it again
    Then its child entries are back

  @report @needs-report
  Scenario: Pressing j moves to the next argument values block
    Given I open a rendered report at its top
    When I press j
    Then the report scrolls to the first argument values block
    When I press j again
    Then the report scrolls to the second argument values block

  @report @needs-report
  Scenario: Pressing k moves back to the previous argument values block
    Given I have moved to the second argument values block
    When I press k
    Then the report scrolls to the first argument values block

  @report @needs-report
  Scenario: Pressing t returns to the table of contents
    Given I have moved away from the top of the report
    When I press t
    Then the report scrolls back to the table of contents

  @report @needs-report
  Scenario: Pressing p pairs the gain columns for the current test block
    Given I open a rendered report
    When I press p
    Then the first test block reports its gain columns as paired
    When I press p again
    Then the first test block reports its gain columns as unpaired

  @report @needs-report
  Scenario: The Next and Prev buttons move between argument values blocks
    Given I open a rendered report
    Then the first argument values block cannot go back
    When I use its Next button
    Then the report scrolls to the second argument values block
    When I use that block's Prev button
    Then the report scrolls to the first argument values block
    And the last argument values block cannot go forward

  @report @needs-report
  Scenario: Clicking a table cell opens the log preview for that result
    Given the report payload lists a table cell with a result
    When I click that cell
    Then the log preview opens for that result

  @report @needs-report @url-params
  Scenario: The log preview does not change the report URL
    Given I open a rendered report
    When I click a table cell with a result
    Then the report URL is unchanged
    When I close the log preview
    Then the report URL is still unchanged

  @report @needs-report
  Scenario: The log preview links to the log, run and result pages for the clicked cell
    Given I click a table cell with a result
    Then the preview links to the log, the run and the result

  @report @needs-report @url-params
  Scenario: Selecting charts for stacked mode records them in the URL
    Given I open a rendered report
    When I add two records to the stacked selection
    Then the URL lists both records as selected
    And the page reports two charts selected

  @report @needs-report @url-params
  Scenario: Opening the stacked drawer keeps the selection in the URL
    Given I have added two records to the stacked selection
    When I open the stacked drawer
    Then the stacked chart is shown and the URL records the open drawer
    When I reload the page
    Then the stacked chart is shown again with the same selection

  @report @needs-report @url-params
  Scenario: Toggling the run details mode is reflected in the URL
    Given I open a rendered report
    When I toggle the run details mode
    Then the URL records the short mode
    When I reload the page
    Then the run details are still in the short mode

  # Every scenario above builds its state by clicking. This is the other half:
  # someone opening the link that state produced, which is what a report is
  # shared as.
  @report @needs-report @url-params
  Scenario: A report link restores the configuration, the detail mode and the selected records
    Given a link that pins a config, the short detail mode and two selected records
    When I open that link
    Then the report is rendered in the short detail mode
    And the page reports two charts selected
    And the link still carries every parameter it was opened with


  # The report writes with replaceIn, merging into the query rather than
  # replacing it. If that ever became a full overwrite, the config would vanish
  # the moment an unrelated control was touched — and the page would report the
  # config as missing rather than doing anything visibly wrong.
  @report @needs-report @url-params
  Scenario: Report controls preserve the configuration and the selected records
    Given I have added two records to the stacked selection
    When I toggle the run details mode
    Then the config and both selected records are still pinned
    When I collapse a test block in the table of contents
    Then the config and both selected records are still pinned
