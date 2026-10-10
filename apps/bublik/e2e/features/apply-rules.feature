# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/apply-rules.spec.ts — see features/README.md.
#
# Write scenarios. Each leases a classifiable fixture run of its own
# (claimClassifiableTest()), records an issue only it uses, writes its rule
# gated to that run's fixture_id tag so the rule never reaches another run,
# applies the rules, and deletes the issue — rule and stamps with it — as its
# last step. Other active rules of the project may stamp the run too, so the
# toast is read for its shape, except where the run's other rules were applied
# first and the scenario's own rule is the only one left to apply.

Feature: Apply Rules

  As an engineer who wrote a rule after a run was imported, I apply the active
  rules to that run from any page that offers it, and only rules that are in
  force stamp it.

  Background:
    Given I am signed in

  @issues @issues-write @needs-nok @run
  Scenario: Apply Rules skips a rule that was deactivated
    Given I record an issue with a rule for a failing test of a run of my own, gated to that run
    And I deactivate the rule
    When I apply the rules to the run from its page
    Then the toast reports what was applied
    And no result of the test carries a stamp of the issue
    And the run's issues page does not list the issue
    And I delete the issue from its page

  @issues @issues-write @needs-nok @run
  Scenario: Apply Rules skips the rules of a closed issue
    Given I record an issue with a rule for a failing test of a run of my own, gated to that run
    And I close the issue
    When I apply the rules to the run from its page
    Then the toast reports what was applied
    And no result of the test carries a stamp of the issue
    And the run's issues page does not list the issue
    And I delete the issue from its page

  @issues @issues-write @needs-nok @run
  Scenario: A stamp laid by Apply Rules says it was stamped by hand
    Given I record an issue with a rule for a failing test of a run of my own, gated to that run
    When I apply the rules to the run from its page
    Then the toast reports how many stamps were created
    And the test's results carry a stamp of the issue
    And the stamp's tooltip says it was stamped by hand
    And I delete the issue from its page

  @issues @issues-write @needs-nok @log
  Scenario: Apply Rules stamps the run from the log page
    Given I record an issue with a rule for a failing test of a run of my own, gated to that run
    When I open the run's log focused on that test's failing result
    And I apply the rules from the log header
    Then the toast reports how many stamps were created
    And on the run page the test's results carry a stamp of the issue
    And I delete the issue from its page

  @issues @issues-write @needs-nok @measurements
  Scenario: Apply Rules stamps the run from the measurements page
    Given I record an issue with a rule for a failing test with measurements of a run of my own, gated to that run
    When I open the measurements page of that test's failing result
    And I apply the rules from the measurements header
    Then the toast reports how many stamps were created
    And on the run page the test's results carry a stamp of the issue
    And I delete the issue from its page

  @issues @issues-write @needs-nok @run
  Scenario: A rule that matches a single result reports a single stamp
    Given I record an issue with an inactive rule gated to a run of my own, matching one of its results by parameters
    And the run's other active rules are already applied
    When I activate the rule
    And I apply the rules to the run from its page
    Then the toast reports exactly one stamp created
    And only that result carries a stamp of the issue
    And I delete the issue from its page
