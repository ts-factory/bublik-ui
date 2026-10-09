# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/auth-tokens.spec.ts — see features/README.md.
#
# These scenarios run without the shared signed-in storage state.
#
# Route: /auth/forgot_password/password_reset/$userId/$resetToken

Feature: Password reset link

  As an engineer who asked for a password reset, I follow the link in the
  email — `/auth/forgot_password/password_reset/<user>/<token>` — and set a
  new password there.

  # The suite cannot read the email, so these scenarios pin the route and the
  # way its parameters are read: the page renders without touching them, and
  # they are parsed from the address only when the form is submitted.
  Scenario: The reset link opens the new password form without signing in
    Given a reset link for a user and a token
    When I open that link
    Then the new password form is shown
    And the address keeps the user and the token

  Scenario: Submitting a new password with a stale token is refused in place
    Given the new password form is open from a reset link with a stale token
    When I submit a new password
    Then the reset is reported as failed
    And I am still on the reset link
