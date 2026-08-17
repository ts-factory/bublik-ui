# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/help.spec.ts — see features/README.md.

Feature: Help

  As an engineer new to the instance, I open the help page to read the FAQ and to
  see which version is deployed.

  Background:
    Given I am signed in

  Scenario: The help page shows the FAQ and the deployment info
    When I open the help page
    Then the FAQ section is shown
    And the deployment information is shown
