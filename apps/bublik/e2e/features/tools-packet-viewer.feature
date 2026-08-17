# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/tools-packet-viewer.spec.ts — see features/README.md.

Feature: Packet viewer

  As an engineer opening a capture from a log, I reach the packet viewer through
  a link that carries the capture's URL, and I am told plainly when those
  parameters are missing or malformed.

  Background:
    Given I am signed in

  Scenario: Opening the packet viewer without a capture explains what is required
    When I open the packet viewer without parameters
    Then it reports invalid URL parameters
    And it offers to show the validation errors

  Scenario: A capture URL that is not a URL is rejected
    When I open the packet viewer with a capture reference that is not a URL
    Then it reports invalid URL parameters
