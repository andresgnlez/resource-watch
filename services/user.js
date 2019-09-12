import 'isomorphic-fetch';

export default class UserService {
  constructor(options) {
    if (!options) {
      throw new Error('options params is required.');
    }
    if (!options.apiURL || options.apiURL === '') {
      throw new Error('options.apiURL param is required.');
    }
    this.opts = options;
  }

  /**
   * Creates a subscription for a pair of dataset and country
   * @param {datasetID} ID of the dataset
   * @param {object} Either { type; 'iso', id:'ESP' } or { type: 'geostore', id: 'sakldfa7ads0ka'}
   * @param {string} language Two-letter locale
   * @returns {Promise}
   */
  createSubscriptionToArea(areaId, datasets, datasetsQuery, user, language, name = '') {
    const bodyObj = {
      name,
      application: process.env.APPLICATIONS,
      language: language || 'en',
      datasets,
      datasetsQuery,
      resource: {
        type: 'EMAIL',
        content: user.email
      },
      params: { area: areaId }
    };

    return fetch(`${this.opts.apiURL}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(bodyObj),
      headers: {
        'Content-Type': 'application/json',
        Authorization: user.token
      }
    })
      .then(response => response.json());
  }

  /**
   *  Update Subscription
   */
  updateSubscriptionToArea(subscriptionId, datasets, datasetsQuery, user, language) {
    const bodyObj = {
      application: process.env.APPLICATIONS,
      language: language || 'en',
      datasets,
      datasetsQuery
    };

    return fetch(`${this.opts.apiURL}/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(bodyObj),
      headers: {
        'Content-Type': 'application/json',
        Authorization: user.token
      }
    })
      .then(response => response.json());
  }

  /**
   *  Get Subscription
   */
  getSubscription(subscriptionId, token) {
    return new Promise((resolve) => {
      fetch(`${this.opts.apiURL}/v1/subscriptions/${subscriptionId}/data?application=${process.env.APPLICATIONS}&env=${process.env.API_ENV}`, { headers: { Authorization: token } })
        .then(response => response.json())
        .then(jsonData => resolve(jsonData.data));
    });
  }

  /**
   * Deletes a subscription
   * @param {subscriptionId} ID of the subscription that will be deleted
   * @param {token} User token
   * @returns {Promise}
   */
  deleteSubscription(subscriptionId, token) {
    return fetch(`${this.opts.apiURL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: token }
    })
      .then(response => response.json());
  }

  /**
   * Get area
   */
  getArea(id, token) {
    return fetch(`${this.opts.apiURL}/area/${id}?application=${process.env.APPLICATIONS}&env=${process.env.API_ENV}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'Upgrade-Insecure-Requests': 1
      }
    })
      .then(response => response.json());
  }


}
