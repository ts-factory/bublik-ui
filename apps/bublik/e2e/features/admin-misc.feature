# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/admin-misc.spec.ts — see features/README.md.

Feature: Admin tools

  As an administrator, I reach the Celery task monitor and the usage analytics
  from the admin section.

  Background:
    Given I am signed in as an admin

  @admin
  Scenario: The Flower page embeds the task monitor
    When I open the Flower page
    Then the task monitor frame is embedded

  @admin
  Scenario: The analytics page loads without error
    When I open the analytics page
    Then the page shell is rendered
