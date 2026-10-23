# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/classify-import.spec.ts — see features/README.md.
#
# Write scenarios around the Classify drawer's match scope and what the next
# import makes of it. Each classifies a pinned failure of a seeded net-drv-ts
# run (one no seeded rule was written in) under an issue only it uses, then
# imports the run the seed held back for the Playwright suite — the twin the
# seeded scenarios read — again by force through the import form. Bublik keeps
# that run's id and imports in one transaction, so the twin reads whole to the
# other workers throughout, and the rules active by then stamp it as they
# would a run that did not exist when they were written. The twin is leased
# for the length of the scenario, so two never import it at once.
#
# The drawer keeps the run's important tags by default, and on this stack
# fixture_id is one of them, unique to its run; the scenarios drop it, except
# the one that shows what keeping it does. Dispositions stay Marked, so no
# count elsewhere shifts while an issue exists; each deletes its issues —
# rules and stamps with them — as its last step. simple_csum is never touched:
# the seeded suite asserts it is unstamped in the twin.
#
# If a force import fails, the import setup refuses to start the next run
# ("Latest fixture import tasks failed"): import the twin's URL again by hand
# from /admin/import, with force, before rerunning the suite.

Feature: The next import honours the match scope

  As an engineer classifying a failure, I narrow the rule to the parameters,
  verdicts and tags that matter, and the next run imported is stamped on
  exactly the results they describe.

  Background:
    Given I am signed in

  @run @issues @issues-write @needs-classification
  Scenario: Verdicts kept in the match scope reach the next import's failures with those verdicts only
    Given I classify a failing result of a seeded run under a new issue keeping only its verdicts for future runs
    When the run imported after the rules is imported again
    Then exactly the results of that test with those verdicts carry the issue's stamp, laid on import
    And the results with the test's other verdict carry none
    And I delete the issue

  @run @issues @issues-write @needs-classification
  Scenario: Parameters kept in the match scope reach only the next import's same iteration
    Given I classify a failing result of a seeded run under a new issue keeping only its parameters for future runs
    When the run imported after the rules is imported again
    Then only the result of the same iteration carries the issue's stamp, laid on import
    And I delete the issue

  @run @issues @issues-write @needs-classification
  Scenario: A match scope emptied to the path reaches every failure of the test in the next import
    Given I classify a failing result of a seeded run under a new issue matching on the path alone for future runs
    When the run imported after the rules is imported again
    Then every unexpected result of the test in that run carries the issue's stamp, laid on import
    And the results listed as expected carry none
    And I delete the issue

  @run @issues @issues-write @needs-classification
  Scenario: Keeping this run's fixture tag keeps the rule from the next import
    Given I classify a failing result of a seeded run under an issue keeping the run's tags and its verdicts for future runs
    And I classify it again under a second issue keeping only the tags the next run carries too
    When the run imported after the rules is imported again
    Then the second issue stamps the results with those verdicts and the first stamps none
    And the rules page shows both rules matching on the tags
    And I delete both issues

  @run @issues @issues-write @needs-classification
  Scenario: Just this result leaves the next import alone
    Given I classify a failing result of a seeded run under an issue for this result only, matching on the path alone
    And I classify it again under a second issue for future runs, matching on the path alone
    When the run imported after the rules is imported again
    Then the second issue stamps every unexpected result of the test and the first stamps none
    And the rules page lists the first issue's rule inactive and the second's active
    And I delete both issues
