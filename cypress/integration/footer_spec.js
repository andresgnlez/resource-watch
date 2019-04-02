/* eslint-disable spaced-comment */
/// <reference types="Cypress" />

describe('Footer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shouldn\'t have any broken links', () => {
    cy.get('.footer-main a').each(($a) => {
      const href = $a.prop('href');

      cy.request(href)
        .its('status')
        .should('eq', 200);
    });
  });
});
