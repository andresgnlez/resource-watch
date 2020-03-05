import React from 'react';
import PropTypes from 'prop-types';

// Constants
import { TOPICS } from './constants';

import './styles.scss';

function ExploreTopicsComponent(props) {
  const clickHandler = (id) => {
    props.setFiltersSelected({ key: 'topics', list: [id] });
    props.setDatasetsPage(1);
    props.fetchDatasets();
  };

  return (
    <div className="c-explore-topics">
      <div className="row">
        {TOPICS.map(topic => (
          <div className="column small-6">
            <div
              id={topic.id}
              className="explore-topic-button"
              role="button"
              tabIndex={0}
              onClick={() => clickHandler(topic.id)}
              onKeyPress={() => clickHandler(topic.id)}
            >
              <div
                className="topic-image"
                style={{
 background: `linear-gradient(${topic.backgroundColor},${topic.backgroundColor}),
                linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.30)),url(${topic.backgroundURL})`
}}
              />
              <div className="topic-title">
                {topic.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ExploreTopicsComponent.propTypes = {
  setFiltersSelected: PropTypes.func.isRequired,
  setDatasetsPage: PropTypes.func.isRequired,
  fetchDatasets: PropTypes.func.isRequired
};

export default ExploreTopicsComponent;
