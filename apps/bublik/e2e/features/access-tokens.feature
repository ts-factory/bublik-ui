# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/access-tokens.spec.ts — see features/README.md.
#
# The scenarios that create a token revoke it again before finishing, so the
# suite stays idempotent; the rest stop at validation or cancellation.

Feature: Access tokens

  As a user, I issue tokens so an agent, a CI job or a script can call Bublik
  on my behalf. A token's value is shown once, at creation, and never again.

  Background:
    Given I am signed in as an admin

  @tokens
  Scenario: Creating an access token shows its value exactly once
    Given I open the access tokens settings
    When I create a token that never expires
    Then the new token's value is shown with a warning that it will not be shown again
    And the dialog offers a copyable MCP client configuration
    When I dismiss the token value
    Then the token is listed by its handle and the value is gone from the page

  @tokens
  Scenario: The create-token form refuses an empty token name
    Given I open the access tokens settings
    And I open the create-token form
    When I submit it without a name
    Then the form reports that a name is required
    When I close the create-token form
    Then no token was created

  @tokens
  Scenario: Revoking an access token asks for confirmation and can be cancelled
    Given I open the access tokens settings
    And I have a token to revoke
    When I ask to revoke it and cancel the confirmation
    Then the token is still active
    When I ask to revoke it and confirm
    Then the token is listed as revoked
