# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-tokens.spec.ts — see features/README.md.
#
# Read-only: the scenarios inspect the table rather than revoking anyone's
# token, so the suite stays idempotent.

Feature: Access token administration

  As an administrator, I review every user's tokens so I can revoke ones that
  have leaked or belong to someone who has left. Values are never shown here.

  Background:
    Given I am signed in as an admin

  @admin @tokens
  Scenario: The admin tokens page lists tokens with their owner
    When I open the admin tokens page
    Then each listed token shows the account it acts as

  @admin @tokens
  Scenario: The admin tokens table never shows a token value
    When I open the admin tokens page
    Then only token handles are shown, never a full token
