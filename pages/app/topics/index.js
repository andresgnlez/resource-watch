import React, { PureComponent } from 'react';

// actions
import { getStaticPage } from 'modules/static-pages/actions';
import { getHighlightedDashboards } from 'modules/dashboards/actions';

// components
import Topics from 'layout/topics';

class TopicsPage extends PureComponent {
  static async getInitialProps({ store }) {
    const { getState, dispatch } = store;
    const { dashboards: { isHighlighted }, staticPages: { topics } } = getState();
    if (!Object.keys(topics).length) await dispatch(getStaticPage('topics'));
    if (!isHighlighted.list.length) await dispatch(getHighlightedDashboards());

    return {};
  }

  render() {
    return (<Topics />);
  }
}

export default TopicsPage;
