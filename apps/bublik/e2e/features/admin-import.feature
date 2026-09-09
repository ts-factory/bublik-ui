# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-import.spec.ts — see features/README.md.
#
# The fixture runs are imported by import.setup.ts; these scenarios only exercise
# the page around that, so a run of the suite never imports the same log twice.

Feature: Run import

  As an engineer feeding logs into Bublik, I watch the import event log, filter
  it down to a particular source, and schedule new imports through the import
  form.

  Background:
    Given I am signed in as an admin

  @admin
  Scenario: The import page lists the events of the fixture imports
    When I open the import page
    Then the import event log lists at least one event

  # The API matches ?url= exactly, and the importer records the source with a
  # trailing slash the manifest does not carry — so filter by what was recorded.
  @admin
  Scenario: Filtering the event log by source URL narrows it to that import
    Given an import event was recorded for a source URL
    When I filter the import events by that URL
    Then every listed event belongs to that URL

  @admin
  Scenario: Filtering by a URL nothing was imported from reports no matching tasks
    When I filter the import events by a URL no run was imported from
    Then the page reports that no tasks match the parameters

  @admin
  Scenario: The import form collects several log URLs before submitting
    Given I open the import form
    When I add another URL row
    Then the form offers one more URL input than before
    When I close the form without importing
    Then the import form is gone

  # The task log is a drawer whose only state is the URL: `taskId` opens it and
  # closing clears both it and the polling flag together. Leaving `poll` behind
  # would keep a closed drawer refetching for as long as the tab stayed open.
  @admin @url-params
  Scenario: An import task link opens that task's log and closing it clears the URL
    Given a link that names a recorded import task and asks to follow it
    When I open that link
    Then the import task log is open
    When I close the log
    Then the task and the polling flag are both dropped from the URL

