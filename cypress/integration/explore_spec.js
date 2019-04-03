/* eslint-disable spaced-comment, no-useless-escape */
/// <reference types="Cypress" />

import { resolveFetch } from '../utils';

describe('Explore', () => {
  it('should let the user search by string', () => {
    // We register when fetch is called
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We search for "vizzuality"
    cy.get('.c-dataset-search .search-input').type('vizzuality{enter}');

    // We expect the request to contain "vizzuality" as a search term
    cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*search=vizzuality`));
  });

  it('should let the user search by topic', () => {
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We open the search dropdown
    cy.get('.c-dataset-search .search-input').click();

    cy.get('.c-dataset-search .search-dropdown-list input[type="checkbox"]').first().as('checkbox');
    cy.get('@checkbox').then(($checkbox) => {
      const topic = $checkbox.prop('value');
      cy.get('@checkbox').check({ force: true });

      // We expect the request to contain the name of the first topic
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*concepts\\(%5B|%5D|\\\d+\\)+=${topic}`));
    });
  });

  it('should let the user search by data type', () => {
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We open the search dropdown
    cy.get('.c-dataset-search .search-input').click();

    // We click the tab
    cy.get('.c-dataset-search .c-tabs button').eq(1).click();

    cy.get('.c-dataset-search .search-dropdown-list input[type="checkbox"]').first().as('checkbox');
    cy.get('@checkbox').then(($checkbox) => {
      const dataType = $checkbox.prop('value');
      cy.get('@checkbox').check({ force: true });

      // We expect the request to contain the name of the first data type
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*concepts\\(%5B|%5D|\\\d+\\)+=${dataType}`));
    });
  });

  it('should let the user search by frequency', () => {
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We open the search dropdown
    cy.get('.c-dataset-search .search-input').click();

    // We click the tab
    cy.get('.c-dataset-search .c-tabs button').eq(2).click();

    cy.get('.c-dataset-search .search-dropdown-list input[type="checkbox"]').first().as('checkbox');
    cy.get('@checkbox').then(($checkbox) => {
      const frequency = $checkbox.prop('value');
      cy.get('@checkbox').check({ force: true });

      // We expect the request to contain the name of the first frequency
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*concepts\\(%5B|%5D|\\\d+\\)+=${frequency}`));
    });
  });

  it('should let the user search by time periods', () => {
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We open the search dropdown
    cy.get('.c-dataset-search .search-input').click();

    // We click the tab
    cy.get('.c-dataset-search .c-tabs button').eq(3).click();

    cy.get('.c-dataset-search .search-dropdown-list input[type="checkbox"]').first().as('checkbox');
    cy.get('@checkbox').then(($checkbox) => {
      const timePeriod = $checkbox.prop('value');
      cy.get('@checkbox').check({ force: true });

      // We expect the request to contain the name of the first time period
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*concepts\\(%5B|%5D|\\\d+\\)+=${timePeriod}`));
    });
  });

  it('should tell the user if there\'s no datasets', () => {
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.stub(win, 'fetch', (url, ...params) => {
          if (new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*`).test(url)) {
            return resolveFetch({
              data: [],
              meta: {
                'total-items': 0,
                'total-pages': 1
              }
            });
          }

          return fetch(url, ...params);
        });
      }
    });

    // We need to force the browser to fetch the datasets
    // so we just search for nothing
    cy.get('.c-dataset-search .search-input').type('{enter}');

    cy.get('.c-explore-datasets-header .total').should('have.text', '0 datasets');
  });

  it('should show the correct datasets', () => {
    cy.fixture('dataset').then((datasetStub) => {
      cy.visit('/data/explore', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch', (url, ...params) => {
            if (new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*`).test(url)) {
              return resolveFetch({
                data: [datasetStub],
                meta: {
                  'total-items': 1,
                  'total-pages': 1
                }
              });
            }

            return fetch(url, ...params);
          });
        }
      });

      // We need to force the browser to fetch the datasets
      // so we just search for nothing
      cy.get('.c-dataset-search .search-input').type('{enter}');

      // We check if we display the correct number of items
      cy.get('.c-explore-datasets-header .total').should('have.text', '1 datasets');

      // We check if we have just one dataset
      cy.get('.c-dataset-list-item').its('length').should('eq', 1);

      cy.get('.c-dataset-list-item').find('.title-container').should('have.text', datasetStub.attributes.metadata[0].attributes.name);
    });
  });

  it('should correctly order the datasets', () => {
    // We register when fetch is called
    cy.visit('/data/explore', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We open the tooltip to sort
    cy.get('.c-explore-datasets-sort button').first().click();

    // We select the first option
    cy.get('.c-rc-tooltip input[type="radio"]').first().as('radio');

    cy.get('@radio').then(($radio) => {
      const column = $radio.prop('value');
      cy.get('@radio').check({ force: true });

      // We expect the request to contain the name of the column with the correct order
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*sort=-${column}`));

      // We change the order of the sort
      cy.get('.c-explore-datasets-sort button').eq(1).click();

      // We expect the request to contain the name of the column with the correct order
      cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*sort=${column}`));
    });
  });

  it('should correctly display the correct view of the datasets', () => {
    cy.visit('/data/explore');

    cy.get('.c-explore-datasets-mode button').as('buttons');
    cy.get('.c-dataset-list-item').as('grid');

    cy.get('@buttons').first().click();
    cy.get('@grid').should('have.class', '-grid');

    cy.get('@buttons').eq(1).click();
    cy.get('@grid').should('have.class', '-list');
  });

  it('should restore the configuration of the URL', () => {
    cy.visit('/data/explore?sort=most-viewed&sortDirection=-1&search=vizzuality&topics=%255B%2522biodiversity%2522%255D', {
      onBeforeLoad(win) {
        cy.spy(win, 'fetch');
      }
    });

    // We can't test if the search term is correctly applied looking
    // at the call made to the API because we need to make a search
    // in order to fetch the datasets (see below)
    // So we're looking at whether the search is displayed in the UI
    cy.get('.c-tag-list').contains('vizzuality').should('contain', 'vizzuality');

    // We need to force the browser to fetch the datasets
    // so we just search for nothing
    cy.get('.c-dataset-search .search-input').type('{enter}');

    cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*concepts\\(%5B|%5D|\\\d+\\)+=biodiversity`));
    cy.window().its('fetch').should('be.calledWithMatch', new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*sort=-most-viewed`));
  });

  it('should let the user add/remove a layer from the map', () => {
    cy.fixture('dataset').then((datasetStub) => {
      cy.visit('/data/explore', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch', (url, ...params) => {
            if (new RegExp(`${Cypress.env('WRI_API_URL')}/dataset\\?.*`).test(url)) {
              return resolveFetch({
                data: [datasetStub],
                meta: {
                  'total-items': 1,
                  'total-pages': 1
                }
              });
            }

            return fetch(url, ...params);
          });
        }
      });

      // We need to force the browser to fetch the datasets
      // so we just search for nothing
      cy.get('.c-dataset-search .search-input').type('{enter}');

      cy.get('.c-dataset-list-item .actions button').first().as('button');

      // We add the dataset to the map
      cy.get('@button').click();

      // We check the legend is shown (i.e. the layer is displayed)
      cy.get('.wri_api__legend-item-header').should('have.text', datasetStub.attributes.layer.find(l => l.attributes.default).attributes.name);

      // We remove the dataset from the map
      cy.get('@button').click();

      // We check the legend doesn't exist anymore
      cy.get('.wri_api__legend-item-header').should('not.exist');
    });
  });
});
