# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/auth.spec.ts — see features/README.md.
#
# These scenarios run without the shared signed-in storage state.

Feature: Authentication

  As an engineer, I sign in to reach Bublik, and when I follow a link while
  signed out I am asked to sign in and then taken to where I was going.

  Scenario: Signing in with valid credentials opens the dashboard
    Given I am signed out and on the login page
    When I sign in with the administrator credentials
    Then the dashboard is open

  Scenario: Signing in with the wrong password is refused
    Given I am signed out and on the login page
    When I sign in with a wrong password
    Then the sign-in is reported as failed
    And I am still on the login page

  Scenario: An address that is not an email is rejected before submitting
    Given I am signed out and on the login page
    When I try to sign in with something that is not an email address
    Then the form reports the invalid field
    And I am still on the login page

  Scenario: The login page offers password recovery
    Given I am signed out and on the login page
    When I follow the forgot-password link
    Then the password recovery page is open
