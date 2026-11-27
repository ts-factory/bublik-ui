Feature: Project switcher

  The sidebar's project card opens a popover that lists every project in an
  order the user picks or drags together, narrows them by name and, for
  admins, links to project management.

  Scenario: Searching the project switcher narrows the list to one project
    Given two projects have runs imported
    When I open the project switcher and search for the first project's name
    Then that project is listed
    But the other project is not
    When I search for a name no project has
    Then the switcher says no project matches

  Scenario: Dragging a project in the switcher keeps its place after a reload
    Given the server lists at least two projects
    When I open the project switcher and drag the last project onto the first
    Then the dragged project is listed first
    And the switcher's order reads Custom Order
    When I reload the page and open the project switcher
    Then the dragged project is still listed first

  Scenario: Ordering the project switcher by Newest First lists the newest project first
    Given the server lists at least two projects
    When I open the project switcher and order it by Newest First
    Then the projects are listed from the newest to the oldest
    When I drag the first project onto the second
    Then the two projects have swapped places
    And the switcher's order reads Custom Order

  Scenario: Pressing P opens the project switcher
    Given I am on the runs page
    When I press P
    Then the project switcher is open with its search focused

  @admin
  Scenario: The project switcher takes an admin to the project configs
    Given I am signed in as an admin on the runs page
    When I open the project switcher
    Then it offers New Project and Manage
    When I choose Manage
    Then the configs page is open
    And the project switcher is closed

  Scenario: The project switcher has no project actions when signed out
    Given I am signed out on the runs page
    When I open the project switcher
    Then it offers neither New Project nor Manage
