# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issues-seeded.spec.ts — see features/README.md.
#
# Seeded scenarios: read-only against the classification the seed applied.
# Issues are named by their plan ids and resolved through
# support/seeded-classification.ts, never by title or database id. Write
# scenarios may add issues to the same projects at any time, so counts are
# only compared within the plan's own issues.

Feature: Issues against seeded classification

  As an engineer opening an instance someone already triaged, I find every
  issue recorded against a project under that project's heading.

  Background:
    Given I am signed in

  @issues @needs-classification
  Scenario: Every seeded issue of a project is listed under its project group
    Given the seed recorded several issues in one project
    When I open the issues page for every project
    Then each of those issues is listed under that project's group
    And the group's heading names the project and counts at least those issues

  @issues @needs-classification
  Scenario: Every rules state shows its own stripe and Rules badge
    Given the seed recorded an issue in each of the four rules states
    When I open the issues page
    Then each issue's stripe and Rules badge name its rules state

  @issues @needs-classification
  Scenario: The Category filter counts and narrows to the seeded categories
    Given the seed filed issues under every category
    When I open the issues page
    Then each Category option counts at least the seeded issues filed under it
    When I filter by the category with the fewest seeded issues
    Then every seeded issue filed under it is listed and no other seeded issue is

  @issues @needs-classification
  Scenario: Closed seeded issues are listed as Closed
    Given the seed closed some of its issues
    When I open the issues page
    Then each closed issue is listed with the Closed state

  # Expected to fail: the issues table never strikes a closed issue's key
  # through (not filed yet). The scenario is annotated with the defect.
  @issues @needs-classification
  Scenario: A closed seeded issue has its key struck through
    Given the seed closed an issue that has a bug key
    When I open the issues page
    Then the issue's key is struck through

  @issues @needs-classification
  Scenario: A resolvable bug key links out and a missing one falls back to the id
    Given the seed recorded a key its project tracks, a key it does not, and no key
    When I open the issues page
    Then the tracked key shows the key and links to the tracker's page for it
    And the untracked key shows the key with no tracker link
    And the issue without a key shows its id with no tracker link

  @issues @needs-classification
  Scenario: The long and the escaped seeded descriptions open in full and render literally
    Given the seed recorded a long description and one full of markup characters
    When I open the issues page
    Then the long description's popover holds it from its first line to its last
    And the other description's markup characters read as plain text

  @issues @needs-classification
  Scenario: Paging through seeded issues ten at a time moves the range and clamps past the end
    Given the seed recorded at least two full pages of ten issues
    When I open the issues page ten rows at a time
    Then the first page lists ten issues, the range reads from 1 to 10 and there are enough pages for the seeded issues
    When I go to the next page
    Then page 2 is written to the URL and the range reads from 11 to 20
    When I open a page far past the end
    Then the page is clamped to the last one, in the URL and the footer

  @issues @needs-classification
  Scenario: The range past the first page counts every issue, not the page
    Given the seed recorded at least two full pages of ten issues
    When I open the second page of ten issues
    Then the range reads 11 to 20 of a total that counts at least the seeded issues

  @issues @needs-classification @url-params
  Scenario: A dragged column order is written to the URL and restored from it
    Given the seed recorded issues to list
    And I open the issues page with Key left of Issue
    When I drag the Issue column above the Key column in the Columns menu
    Then Issue is left of Key and the URL lists it first
    When I open that URL again with the stored column order forgotten
    Then Issue is still left of Key

  @issues @needs-classification
  Scenario: A project group's New Issue button opens with that project locked
    Given the seed configured two trackers in a project it recorded issues in
    When I click New Issue in that project's group heading
    Then the New Issue drawer asks for no project
    And its Tracker starts on the project's first tracker and lists the project's trackers in order
    And I cancel without recording anything
