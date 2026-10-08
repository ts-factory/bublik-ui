# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/auth-tokens.spec.ts — see features/README.md.
#
# These scenarios run without the shared signed-in storage state.

Feature: Email activation link

  As an engineer who just registered, I follow the activation link in the
  email — `/auth/register/activate/<user>/<token>/` — and my address is
  verified the moment the page opens.

  # The token is sent for verification on mount, and the trailing slash is
  # part of the address the emails carry. A stale token leaves the page where
  # it is with the failure reported.
  Scenario: A stale activation link reports the failure and stays put
    Given an activation link for a user and a stale token
    When I open that link
    Then the page reports that it is verifying the email
    And the verification is reported as failed
    And the address keeps the user, the token and the trailing slash
