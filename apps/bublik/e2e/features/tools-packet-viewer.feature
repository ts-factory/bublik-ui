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

  # The happy path is about the parameters being accepted, not about the capture
  # parsing — the viewer fetches the file separately, and a scenario that waited
  # for a rendered packet list would be testing the fixture's captures rather
  # than the link.
  @url-params
  Scenario: A packet viewer link carrying a capture, a run and a result is accepted
    Given a link that names a capture URL, a run id and a result id
    When I open that link
    Then the invalid parameters panel is not shown
    And the link still carries all three parameters

  # `runId` is coerced to a number, so anything that is not one fails validation
  # rather than reaching the viewer as NaN.
  @url-params
  Scenario: A packet viewer link whose run id is not a number is rejected
    When I open the packet viewer with a run reference that is not a number
    Then it reports invalid URL parameters

