import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'routes';

import { connect } from 'react-redux';

// Selectors
import areaAlerts from 'selectors/user/areaAlerts';

// Components
import { getLabel } from 'utils/datasets/dataset-helpers';
import AlertWidget from 'components/areas/AlertWidget';

// Services
import { fetchSubscription } from 'services/subscriptions';
import { fetchArea } from 'services/areas';
import { getUserAreas } from 'redactions/user';

class AreasAlerts extends React.Component {
  state = {
    isLoadSubscription: false,
    subscriptionData: null
  }

  componentDidMount() {
    const { user } = this.props;
    getUserAreas(user.token);
  }

  componentDidUpdate(prevProps, prevState) {
    const { isLoadSubscription } = this.state;
    const { user } = this.props;
    if (!isLoadSubscription && user.areas.items.length) {
      this.getSubscription();
    }
  }

  getSubscription = () => {
    const { user, id } = this.props;
    const { subscriptions } = user.areas.items.find(alert => alert.id === id);
    fetchSubscription(subscriptions[0].id, user.token).then(((data) => {
      this.setState({ subscriptionData: data.data });
    }));
    this.setState({ isLoadSubscription: true });
  }

  render() {
    const { user, id, alerts } = this.props;
    const { subscriptionData } = this.state;
    const { subscriptions } = user.areas.items.length ? user.areas.items.find(alert => alert.id === id) : {};
    const subscription = subscriptions ? subscriptions[0] : {};

    return (
      <div className="c-alerts-page">
        {subscription && subscription.datasets &&
          subscription.datasets.map((dataset, key) => (
            <AlertWidget
              key
              dataset={dataset}
              id={id}
              layerGroup={id}
              subscription={subscription}
              subscriptionData={subscriptionData}
            />
          ))
        }
        {/* {subscription && subscription.attributes && subscription.attributes.datasets &&
          subscription.attributes.datasets.map((dataset, key) => (
            <AlertWidget
              key={id}
              dataset={dataset}
              id={id}
              layerGroup={id}
              subscription={subscription}
              subscriptionData={subscriptionData}
            />
          ))
        } */}
        <p>
          This notification reports {id in alerts ? alerts[id].map(a => getLabel(a.dataset)).join(', ') : null} for the area of interest you subscribed to.
          You will receive a separate email for each area and each alert you subscribe to.
          Date of alerts refers to the date range within which change was detected.
          There may be a lag between detection and when you receive this notification.
        </p>

        <p>
          For questions or if you would like more information,
          please email: [resourcewatch@wri.org]
        </p>

        <p>
          Please note that this information is subject to the
          <Link route="terms-of-service">
            <a>Resource Watch Terms of Service</a>
          </Link>.
          You can unsubscribe or manage your subscriptions at
          <Link route="myrw" params={{ tab: 'areas' }}><a> My Resource Watch</a>
          </Link> [my resource watch aoi page].
        </p>

      </div>
    );
  }
}

AreasAlerts.propTypes = {
  id: PropTypes.string,
  user: PropTypes.object.isRequired,
  alerts: PropTypes.object,
  getUserAreas: PropTypes.func
};

const mapStateToProps = state => ({
  user: state.user,
  alerts: areaAlerts(state)
});

export default connect(mapStateToProps, null)(AreasAlerts);
