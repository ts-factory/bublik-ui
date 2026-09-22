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

  Scenario: Opening a protected page while signed out asks to sign in in place
    Given I am signed out and open the users page
    Then I am asked to sign in
    When I sign in with the administrator credentials
    Then the sign-in dialog closes
    And I am still on the users page
    And the administrator's own account is listed

  Scenario: Dismissing the sign-in dialog leaves a page that needs it
    Given I am signed out and open the users page directly
    Then I am told the page needs an administrator
    And the dialog offers a way back instead of a close button
    When I click outside the sign-in dialog
    Then the sign-in dialog stays open
    When I choose to go to the dashboard
    Then the dialog is gone
    And with nowhere to go back to, the dashboard is open

  Scenario: Going back from a protected admin page returns to the previous page
    Given I open the dashboard
    When I open the users page from the admin sidebar
    Then I am told the page needs an administrator
    And the dialog offers to go back instead of a close button
    When I click the back button
    Then the dashboard is open and the dialog is gone

  Scenario: Public pages do not ask anonymous visitors to sign in
    Given I am signed out and open the dashboard
    Then the dashboard is open without a sign-in dialog

  Scenario: Signing in from the sidebar keeps me on the page
    Given I am signed out
    When I open the help page
    Then the sidebar offers to sign in
    When I choose Sign In in the sidebar
    Then the sign-in dialog opens without a reason note
    When I click outside the sign-in dialog
    Then the sign-in dialog closes
    When I choose Sign In in the sidebar again
    Then the sign-in dialog opens without a reason note
    When I sign in with the administrator credentials
    Then the sign-in dialog closes
    And I am still on the help page
    And the sidebar shows who I am signed in as

  Scenario: Signing out from a protected page returns me to the dashboard signed out
    Given I have signed in through the login page
    And I open the protected users page with a remembered history page
    And the sidebar shows who I am signed in as
    When I choose Sign Out from the account menu
    Then the dashboard is open
    And the sign-in dialog is not open
    And the sidebar still remembers the history page
    And the sidebar offers to sign in
