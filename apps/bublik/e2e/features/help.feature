# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/help.spec.ts — see features/README.md.

Feature: Help

  As an engineer new to the instance, I open the help page to read the FAQ.

  Background:
    Given I am signed in

  Scenario: The help page shows the FAQ
    When I open the help page
    Then the FAQ section is shown
