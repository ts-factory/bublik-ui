# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-users.spec.ts — see features/README.md.
#
# No user is actually created or deactivated: the scenarios stop at validation
# and refusals so the suite stays idempotent. The pending and deactivated
# states and reactivation are not scripted: they need a second account and the
# verification email the E2E stack has nowhere to deliver.

Feature: User administration

  As an administrator, I review the accounts that can sign in, see whether
  each is pending, active or deactivated and since when it exists, and create
  new ones through a form that refuses a mismatched password confirmation. My
  own account cannot be deactivated from here.

  Background:
    Given I am signed in as an admin

  @admin
  Scenario: The users table lists the signed-in administrator
    When I open the users page
    Then the administrator's own account is listed

  @admin
  Scenario: The create-user form refuses a mismatched password confirmation
    Given I open the create-user form
    When I submit it with two different passwords
    Then the form reports that the passwords do not match
    When I close the form
    Then no user was created

  @admin
  Scenario: The users table shows the administrator as active
    When I open the users page
    Then the administrator's row shows the status Active and a joined date

  @admin
  Scenario: Deactivating your own account is refused
    Given I open the users page
    When I deactivate my own account and confirm
    Then I am told that users cannot deactivate themselves
    And the administrator's account is still listed as Active
