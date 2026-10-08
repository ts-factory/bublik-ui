# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2024-2026 OKTET LTD
#
# Implemented by apps/bublik/e2e/chat.spec.ts — see features/README.md.

Feature: Assistant

  As an engineer asking the assistant about runs and results, I open a
  conversation, come back to it by its address, and start another one when I
  change the subject.

  Background:
    Given I am signed in

  # Every conversation needs a stable id before anything is persisted, so a
  # bare `/chat` is turned into `/chat/<thread id>` the moment it opens — in
  # place, so Back leaves the assistant rather than bouncing off the bare
  # address.
  @chat @url-params
  Scenario: Opening the assistant mints a thread address in place
    Given I open the dashboard
    When I open the assistant
    Then the address names a new thread
    When I go back
    Then the dashboard is open again

  @chat @url-params
  Scenario: A thread address survives a reload
    Given the assistant is open on a thread
    When I reload the page
    Then the same thread is open

  @chat @url-params
  Scenario: New Chat starts another thread and Back returns to the previous one
    Given the assistant is open on a thread
    When I start a new chat
    Then the address names a different thread
    When I go back
    Then the previous thread is open again

  @chat @needs-classification @url-params
  Scenario: The project scope is carried into the minted thread address
    Given a link to the assistant scoped to a project
    When I open that link
    Then the address names a new thread
    And the link still carries the project
