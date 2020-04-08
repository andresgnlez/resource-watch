import React, { useEffect, useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMediaQuery } from 'react-responsive';

// Components
import Layout from 'layout/layout/layout-app';

// Explore components
import ExploreSidebar from 'layout/explore/explore-sidebar';
import ExploreMenu from 'layout/explore/explore-menu';
// import ExploreDatasetsHeader from 'layout/explore/explore-datasets-header';
import ExploreDatasets from 'layout/explore/explore-datasets';
import ExploreMap from 'layout/explore/explore-map';
import ExploreDetail from 'layout/explore/explore-detail';
import ExploreTopics from 'layout/explore/explore-topics';
import ExploreCollections from 'layout/explore/explore-collections';
import ExploreLogin from 'layout/explore/explore-login';
import ExploreDiscover from 'layout/explore/explore-discover';
import ExploreNearRealTime from 'layout/explore/explore-near-real-time';
import ExploreFavorites from 'layout/explore/explore-favorites';

// utils
import { breakpoints } from 'utils/responsive';
import { EXPLORE_SECTIONS } from './constants';

function Explore(props) {
  const {
    explore: { datasets: { selected }, sidebar: { section } },
    userIsLoggedIn
  } = props;
  const [exploreSectionAlreadyLoaded, setExploreSectionAlreadyLoaded] = useState(!selected);
  const exploreSectionShouldBeLoaded = !selected || exploreSectionAlreadyLoaded;
  const mediumBreakpointReached = useMediaQuery({ query: `(max-width: ${breakpoints.medium}px)` });
  
  useEffect(() => {
    if (!exploreSectionAlreadyLoaded) {
      setExploreSectionAlreadyLoaded(true);
    }
  }, [selected]);

  const getExploreLayout = (useSidebar) => (
    <Fragment>
      <ExploreMenu />
      <div
        className="explore-sidebar-content"
        id="sidebar-content-container"
        key={section}
      >
        {section === EXPLORE_SECTIONS.ALL_DATA &&
          exploreSectionShouldBeLoaded &&
          <ExploreDatasets />
        }
        {section === EXPLORE_SECTIONS.TOPICS &&
          exploreSectionShouldBeLoaded &&
          <ExploreTopics />
        }
        {section === EXPLORE_SECTIONS.COLLECTIONS && userIsLoggedIn
          && exploreSectionShouldBeLoaded &&
          <ExploreCollections />
        }
        {section === EXPLORE_SECTIONS.FAVORITES && userIsLoggedIn
          && exploreSectionShouldBeLoaded &&
          <ExploreFavorites />
        }
        {(section === EXPLORE_SECTIONS.COLLECTIONS ||
          section === EXPLORE_SECTIONS.FAVORITES) && !userIsLoggedIn
          && exploreSectionShouldBeLoaded &&
          <ExploreLogin />
        }
        {section === EXPLORE_SECTIONS.DISCOVER &&
          exploreSectionShouldBeLoaded &&
          <ExploreDiscover />
        }
        {section === EXPLORE_SECTIONS.NEAR_REAL_TIME
          && exploreSectionShouldBeLoaded &&
          <ExploreNearRealTime />
        }
      </div>
      {selected && 
        <ExploreDetail
          key={selected}
          {...(!useSidebar && { nosidebar: true })} 
        />
      }
    </Fragment>
  );

  return (
    <Layout
      title="Explore Data Sets — Resource Watch"
      description="Browse more than 200 global data sets on the state of our planet."
      className="-fullscreen"
    >
      <div className="c-page-explore">
        
        {!mediumBreakpointReached && 
          <ExploreSidebar
            key={section}
          >
            {/*
              We set the sidebar key so that, by rerendering the sidebar, the sections are
              scrolled to the top when the selected section changes.
            */}
            {getExploreLayout(true)}
          </ExploreSidebar>
        }
        
        {mediumBreakpointReached && 
          getExploreLayout(false)
        }
        {/* Desktop map */}
        {!mediumBreakpointReached && <ExploreMap />}
      </div>
    </Layout>
  );
}

Explore.propTypes = {
  explore: PropTypes.object.isRequired,
  userIsLoggedIn: PropTypes.bool.isRequired
};

export default Explore;
