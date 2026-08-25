# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-users.spec.ts — see features/README.md.
#
# No user is actually created or deactivated: the scenarios stop at validation
# and cancellation so the suite stays idempotent.

Feature: User administration

  As an administrator, I review the accounts that can sign in, and create new
  ones through a form that refuses a mismatched password confirmation.

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
