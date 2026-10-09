# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/run-stamps-seeded.spec.ts — see features/README.md.
#
# Seeded scenarios: read-only against the classification the seed applied.
# The seed writes its rules against pins in API-seeded runs; the manifest
# lists, per pin, the runs imported after those rules (its applies-to runs,
# the UI-imported twins). Pins, rules and issues are named by plan id and
# resolved through support/seeded-classification.ts. Only the plan's own
# issues are looked for, because write scenarios may stamp the same tests.
#
# The one write scenario needs two stamps of one issue with different
# origins on one result, which the seed cannot lay; it classifies a result of
# the classifiable fixture run under an issue only it uses, and deletes that
# issue as its last step.

Feature: Rules stamp runs imported after them

  As an engineer who classified a failure once, I see every later import of
  that test arrive already stamped by the rules I wrote — and only by the ones
  still in force.

  Background:
    Given I am signed in

  @run @issues @needs-classification
  Scenario: Every active seeded rule stamps its pin's results in the run imported after it
    Given the seed wrote active rules of open issues over pins of a run imported later
    When I open each pin's test results in that run
    Then each of those rules' issues stamps the test's results with the rule's category

  @run @issues @needs-classification
  Scenario: Stamps laid when the run was imported name the Import origin
    Given the seed wrote active rules of open issues over pins of a run imported later
    When I open each pin's test results in that run
    Then each of those issues' stamps says it was laid on import

  @run @issues @needs-classification
  Scenario: A seeded rule that is not active does not stamp the run imported after it
    Given the seed wrote one-off and deactivated rules of open issues over pins of a run imported later
    When I open each pin's test results in that run
    Then none of those rules' issues stamps the test's results

  @run @issues @needs-classification
  Scenario: A closed seeded issue does not stamp the run imported after it
    Given the seed closed issues whose rules sit over pins of a run imported later
    When I open each pin's test results in that run
    Then none of those issues stamps the test's results

  @run @issues @needs-classification
  Scenario: The unruled pin is untriaged with a Classify button in the run imported after it
    Given the seed left a pin of a run imported later without any rule
    When I open the pin's test results in that run and filter them to the pin's verdict
    Then each of the pin's results has a Classify button and no stamp
    When I pick Untriaged in the Classification filter
    Then the pin's results are all still listed

  @run @issues @needs-classification
  Scenario: A result stamped under several issues shows one stamp per issue
    Given the seed wrote rules of several open issues over one pin of a run imported later
    When I open the pin's test results in that run
    Then a result carries exactly one stamp of each of those issues
    And each stamp shows the category of every one of its issue's rules over the pin

  @run @issues @issues-write @needs-nok
  Scenario: A result stamped by one issue's rules of different origins says so in its tooltip
    Given I record an issue for the fixture project
    And I classify a failing result of the fixture run under that issue for future runs
    When I classify the same result under that issue again for this result only
    Then the result still carries a single stamp of that issue
    And its tooltip says several rules stamped it, by hand and one-off
    And I delete the issue
