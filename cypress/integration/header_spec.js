/* eslint-disable spaced-comment */
/// <reference types="Cypress" />

describe('Header', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shouldn\'t have any top-level broken links', () => {
    cy.get('.header-menu a').each(($a) => {
      const href = $a.prop('href');

      cy.request(href)
        .its('status')
        .should('eq', 200);
    });
  });

  it('shouldn\'t have any broken links in the dropdowns', () => {
    // Index of the items which have a dropdown menu
    // (index starts at 1)
    const itemsIndexWithDropdown = [1, 2, 4, 5];

    itemsIndexWithDropdown.forEach((index) => {
      cy.get(`.header-menu li:nth-of-type(${index}) a`)
        .trigger('mouseover');

      cy.get('.c-header-dropdown a').each(($a) => {
        const href = $a.prop('href');

        cy.request(href)
          .its('status')
          .should('eq', 200);
      });

      cy.get(`.header-menu li:nth-of-type(${index}) a`)
        .trigger('mouseout');
    });
  });

  it('should autofocus on the input when searching', () => {
    cy.get('.header-menu li:nth-last-of-type(2) .header-menu-link')
      .click();

    cy.focused().should('have.match', 'input[type="search"][placeholder="Search term"]');
  });

  it('should display suggestions when searching', () => {
    cy.get('.header-menu li:nth-last-of-type(2) .header-menu-link')
      .click();

    cy.get('.c-search--term input').type('data');

    cy.get('.c-search-list .search-list li').its('length').should('not.eq', 0);
  });
});
