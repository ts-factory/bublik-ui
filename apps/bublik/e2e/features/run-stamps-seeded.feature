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
  Scenario: The unruled pin is untriaged in the run imported after it
    Given the seed left a pin of a run imported later without any rule
    When I open the pin's test results in that run and filter them to the pin's verdict
    Then each of the pin's results is listed without a stamp
    When I pick Untriaged in the Classification filter
    Then the pin's results are all still listed

  @run @issues @needs-classification
  Scenario: A result stamped under several issues shows one stamp per issue
    Given the seed wrote rules of several open issues over one pin of a run imported later
    When I open the pin's test results in that run
    Then a result carries exactly one stamp of each of those issues
    And each stamp shows the category of every one of its issue's rules over the pin

  # Matching discriminates: the seed's rules leave the twin's other results
  # alone. Each scenario below reads the twin, and where it helps, the run the
  # rule was written against, to show the contrast.

  @run @issues @needs-classification
  Scenario: A verdict rule stamps only the results that failed with its verdict list
    Given the seed wrote verdict rules over two pins of one test, each with its own verdict, in a run imported later
    When I open the test's results in that run filtered to one pin's verdict
    Then every listed result carries a stamp of each of that pin's issues
    When I filter them to the other pin's verdict instead
    Then none of them carries a stamp of those issues

  @run @issues @needs-classification
  Scenario: A parameters rule stamps only the iteration whose parameters it kept
    Given the seed wrote parameters rules over single-iteration pins of a run imported later
    When I open each pin's test results in that run
    Then the test lists more results than the pin has
    And each of those rules' issues stamps exactly the pin's results

  @run @issues @needs-classification
  Scenario: A rule gated to the seeded run’s tags does not reach a run with other tags
    Given the seed wrote a tags rule beside other rules of its issue over a pin of a run imported later
    When I open the pin's test results in that run
    Then the issue's stamp shows the other rules' categories but not the tags rule's
    And in the run the rule was written against the stamp shows it

  @run @issues @needs-classification
  Scenario: A rule over a result that passed as expected does not stamp it in the run imported after it
    Given the seed wrote a rule over a pin that passes as expected in a run imported later
    When I open the pin's test results in that run
    Then the rule's issue stamps none of them
    And in the run the rule was written against it stamps the pin's result

  @run @issues @issues-write @needs-nok
  Scenario: A result stamped by one issue's rules of different origins says so in its tooltip
    Given I record an issue for the fixture project
    And I classify a failing result of the fixture run under that issue for future runs
    When I classify the same result under that issue again for this result only
    Then the result still carries a single stamp of that issue
    And its tooltip says several rules stamped it, by hand and one-off
    And I delete the issue
