# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/issue-rules-seeded.spec.ts — see features/README.md.
#
# Seeded scenarios: read-only against the classification the seed applied.
# Rules and issues are named by their plan ids and resolved through
# support/seeded-classification.ts, never by title or database id. Write
# scenarios may add rules at any time, so a scenario only ever asserts on the
# plan's own rules: which of them are listed, which are gone, what they show.

Feature: Issue rules against seeded classification

  As an engineer opening an instance someone already triaged, I read every
  rule at a glance — what it does to a run, whether it still acts, what it
  matches on — and narrow the list down to the rules I care about.

  Background:
    Given I am signed in

  @issues @needs-classification
  Scenario: Each seeded rule's stripe shows its disposition under its issue's state
    Given the seed wrote rules of every disposition under open and closed issues
    Then on its project's rules page each rule's stripe reads what its disposition does under its issue's state
    And the four stripe colours are all among them

  # A rule stops acting three ways: it was written one-off, it was
  # deactivated under an open issue, or its issue was closed.
  @issues @needs-classification
  Scenario: Inactive seeded rules show a muted stripe and read Inactive
    Given the seed left a one-off rule, a deactivated rule of an open issue and a rule of a closed issue
    And an active rule beside them
    Then on its project's rules page each inactive rule's stripe is muted and its Active badge reads Inactive
    And hovering the muted stripe explains that the rule is inactive
    And the active rule's stripe is not muted and its badge reads Active

  # The plan names the rule; the value is the one it carries for the facet —
  # its category, its disposition, or the first parameter, verdict or tag it
  # matches on, as its Match Scope hover card lists them.
  @issues @needs-classification @url-params
  Scenario Outline: A rule facet keeps only the seeded rules that carry the picked value
    Given a seeded rule and the seeded rules of its project that do not carry its value for the facet
    When I open the rules page for its project and pick the rule's value in the facet
    Then the value is written to the URL
    And the rule is listed and the seeded rules without that value are gone
    And every listed rule shows that value

    Examples:
      | facet       | rule              |
      | Category    | rx-timeout-3      |
      | Disposition | csum-corruption-2 |
      | Parameters  | csum-corruption-1 |
      | Verdicts    | mtu-tcp-frag-1    |
      | Tags        | rx-timeout-3      |

  # The verdict row is the seeded verdict with leading spaces and a `;` — the
  # character the single-valued filters join on — so it has to reach the URL,
  # and the server, as one value.
  @issues @needs-classification @url-params
  Scenario Outline: A matcher chip of a seeded rule toggles its filter
    Given a seeded rule that matches on the chip's kind and a seeded rule of its project that does not
    When I open the rules page for its project, turn the chip's column on and click the rule's chip
    Then the chip's value is written to the URL once, exactly as the rule holds it
    And the rule is still listed and the other rule is gone
    When I click the chip again
    Then the value is cleared from the URL and the other rule is listed again

    Examples:
      | chip                          | rule              |
      | Parameter chip                | csum-corruption-1 |
      | Tag chip                      | rx-timeout-3      |
      | Verdict chip with a semicolon | carrier-lost-1    |

  @issues @needs-classification
  Scenario: The Match Scope chips name each seeded rule's match shape
    Given the seed wrote path-only, parameter, verdict, tag and combined rules
    Then on its project's rules page each rule's Match Scope shows exactly the chips of its shape
    And hovering a combined rule's Verdicts chip lists the verdict it matches

  # Moved from issue-rules.feature, where it filtered a single open issue's
  # rule and so never saw a closed issue's rule disappear.
  @issues @needs-classification @url-params
  Scenario: The issue state filter hides the rules of closed issues
    Given the seed closed an issue with rules and left another issue of its project open
    When I open the rules page for their project
    Then the rules of both issues are listed
    When I pick Open in the State filter
    Then the issue state is written to the URL and only the open issue's rules are listed
    When I click the state badge of the open issue's rule
    Then the issue state is cleared from the URL and the closed issue's rules are listed again
    When I pick Closed in the State filter
    Then only the closed issue's rules are listed

  # The footer's "x–y of N" range is not asserted: it miscounts on later pages,
  # a known defect tracked on its own.
  @issues @needs-classification @url-params
  Scenario: Seeded rules page ten at a time
    Given a project with more than ten seeded rules
    When I open its rules page ten rules to a page
    Then the first page lists ten rules and the Rows per page select reads 10
    When I page forward to the last page
    Then each later page is written to the URL and lists at most ten rules
    And no rule is listed on two pages
    And every seeded rule of the project was listed on one of the pages

  @issues @needs-classification
  Scenario: A project group's New Rule button opens the drawer with that project set
    Given the seed wrote rules in several projects
    When I open the rules page for every project
    Then each of those projects heads a group of rules
    And each group's New Rule button opens the New Rule drawer with that project set
