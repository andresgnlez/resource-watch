import 'isomorphic-fetch';

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import MediaQuery from 'react-responsive';

// Utils
import { logEvent } from 'utils/analytics';

// Redux
import withRedux from 'next-redux-wrapper';
import { initStore } from 'store';
import {
  toggleLayerGroupVisibility,
  toggleLayerGroup,
  setLayerGroupsOrder,
  setLayerGroupActiveLayer,
  setLayerGroups,
  getDatasets,
  getFavoriteDatasets,
  setDatasetsPage,
  setDatasetsSearchFilter,
  setDatasetsFilteredByConcepts,
  setFiltersLoading,
  setZoom,
  setLatLng,
  setDatasetsSorting
} from 'redactions/explore';
import { setFilters } from 'components/app/explore/explore-dataset-filters/explore-dataset-filters-actions';
import { redirectTo } from 'redactions/common';
import { toggleModal, setModalOptions } from 'redactions/modal';
import { setUser } from 'redactions/user';
import { setRouter } from 'redactions/routes';
import { Link } from 'routes';

// Selectors
import getFilteredDatasets from 'selectors/explore/filterDatasets';
import getLayerGroups from 'selectors/explore/layersExplore';

// Components
import Sidebar from 'components/app/layout/Sidebar';
import DatasetListHeader from 'components/app/explore/DatasetListHeader';
import DatasetList from 'components/app/explore/DatasetList';
import Paginator from 'components/ui/Paginator';
import Map from 'components/widgets/editor/map/Map';
import MapControls from 'components/widgets/editor/map/MapControls';
import BasemapControl from 'components/widgets/editor/map/controls/BasemapControl';
import ShareControl from 'components/widgets/editor/map/controls/ShareControl';
import Legend from 'components/widgets/editor/ui/Legend';
import Spinner from 'components/ui/Spinner';
import SearchInput from 'components/ui/SearchInput';
import ExploreDatasetFilters from 'components/app/explore/explore-dataset-filters/explore-dataset-filters';

// Layout
import Page from 'components/app/layout/Page';
import Layout from 'components/app/layout/Layout';

// Utils
import LayerManager from 'components/widgets/editor/helpers/LayerManager';

// Services
import DatasetService from 'services/DatasetService';

class Explore extends Page {
  static async getInitialProps({ asPath, pathname, query, req, store, isServer }) {
    const { user } = isServer ? req : store.getState();
    const url = { asPath, pathname, query };
    const botUserAgent = isServer && /AddSearchBot/.test(req.headers['user-agent']);
    await store.dispatch(setUser(user));
    store.dispatch(setRouter(url));

    // We set the initial state of the map
    // NOTE: we can't move these two dispatch in
    // componentWillMount or componentDidMount
    // because the map only take into account its props
    // at instantiation (and we can't change that
    // without breaking panning and zooming)
    if (query.zoom) store.dispatch(setZoom(+query.zoom, false));
    if (query.latLng) {
      store.dispatch(setLatLng(JSON.parse(query.latLng), false));
    }

    if (isServer && botUserAgent) await store.dispatch(getDatasets({}));
    return { user, isServer, url, botUserAgent };
  }

  constructor(props) {
    super(props);

    this.state = {
      showFilters: false
    };

    // Services
    this.datasetService = new DatasetService(null, {
      apiURL: process.env.WRI_API_URL,
      language: props.locale
    });

    // ------------------------ BINDINGS -----------------------
    this.handleFilterDatasetsSearch = debounce(this.handleFilterDatasetsSearch.bind(this), 500);
    this.handleRedirect = this.handleRedirect.bind(this);
    this.onToggleLayerGroupVisibility = this.onToggleLayerGroupVisibility.bind(this);
    this.onRemoveLayerGroup = this.onRemoveLayerGroup.bind(this);
    this.onSetLayerGroupsOrder = this.onSetLayerGroupsOrder.bind(this);
    this.onSetLayerGroupActiveLayer = this.onSetLayerGroupActiveLayer.bind(this);
    this.handleTagSelected = this.handleTagSelected.bind(this);
    // ----------------------------------------------------------
  }

  componentDidMount() {
    const { url, user } = this.props;
    const query = url.query;
    const { topics, geographies, dataType } = query || {};

    if (query.page) {
      this.props.setDatasetsPage(+query.page);
    }

    if (topics || geographies || dataType) {
      const filters = {
        topics: topics ? JSON.parse(topics) : [],
        geographies: geographies ? JSON.parse(geographies) : [],
        dataType: dataType ? JSON.parse(dataType) : []
      };
      this.props.setFilters(filters);
    }

    if (query.layers) {
      try {
        const layerGroups = JSON.parse(decodeURIComponent(query.layers));
        this.props.setLayerGroups(layerGroups);
      } catch (e) {
        this.props.setLayerGroups([]);
      }
    }

    if (query.search) {
      this.props.setDatasetsSearchFilter({ value: query.search, key: 'name' });
    }

    if (query.sort) {
      this.props.setDatasetsSorting(query.sort);
    }

    this.props.getDatasets({});
    if (user && user.id) {
      const token = user.token.includes('Bearer') ? user.token : `Bearer ${user.token}`;
      this.props.getFavoriteDatasets(token);
    }
  }

  componentWillReceiveProps(nextProps) {
    const oldFilters = this.props.exploreDatasetFilters.filters;
    const { topics, geographies, dataTypes } = oldFilters;
    const newFilters = nextProps.exploreDatasetFilters.filters;

    const conceptsUpdated = topics !== newFilters.topics ||
      geographies !== newFilters.geographies ||
      dataTypes !== newFilters.dataTypes;

    const newFiltersHaveData = (newFilters.topics && newFilters.topics.length > 0) ||
      (newFilters.dataTypes && newFilters.dataTypes.length > 0) ||
      (newFilters.geographies && newFilters.geographies.length > 0);

    if (conceptsUpdated) {
      if (newFiltersHaveData) {
        this.props.setFiltersLoading(true);
        this.datasetService.searchDatasetsByConcepts(
          newFilters.topics, newFilters.geographies, newFilters.dataTypes)
          .then((datasetList) => {
            this.props.setFiltersLoading(false);
            this.props.setDatasetsFilteredByConcepts(datasetList || []);
          });
      } else {
        this.props.setDatasetsFilteredByConcepts([]);
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(nextProps.explore, this.props.explore)
      || !isEqual(nextState, this.state);
  }

  handleRedirect(item) {
    if (item && item.value) {
      this.props.redirectTo(`explore/${item.value}`);
    }
  }

  handleTagSelected(tag) {
    const newFilters = {};
    if (tag.type === 'TOPIC') {
      newFilters.topics = [tag.id];
    } else if (tag.type === 'GEOGRAPHY') {
      newFilters.geographies = [tag.id];
    } else if (tag.type === 'DATA_TYPE') {
      newFilters.dataTypes = [tag.id];
    }
    this.props.setFilters(newFilters);
  }

  handleFilterDatasetsSearch(value) {
    const filter = { value: value || '', key: 'name' };
    this.props.setDatasetsSearchFilter(filter);

    // We move the user to the first page
    this.props.setDatasetsPage(1);

    logEvent('Explore', 'search', value);
  }

  /**
   * Event handler executed when the user toggles the visibility
   * of a layer group in the legend
   * @param {LayerGroup} layerGroup
   */
  onToggleLayerGroupVisibility(layerGroup) {
    this.props.toggleLayerGroupVisibility(layerGroup.dataset, !layerGroup.visible);
  }

  /**
   * Event handler executed when the user removes a layer
   * group from the map
   * @param {LayerGroup} layerGroup
   */
  onRemoveLayerGroup(layerGroup) {
    this.props.removeLayerGroup(layerGroup.dataset);
  }

  /**
   * Event handler executed when the user re-orders the
   * layer groups
   * @param {string[]} datasets - List of datasets IDs
   */
  onSetLayerGroupsOrder(datasets) {
    this.props.setLayerGroupsOrder(datasets);
  }

  /**
   * Event handler executed when the user change the active
   * layer of a layer group
   * @param {string} dataset - Dataset ID
   * @param {string} layer - Layer ID
   */
  onSetLayerGroupActiveLayer(dataset, layer) {
    this.props.setLayerGroupActiveLayer(dataset, layer);
  }

  toggleFilters() {
    this.setState({
      showFilters: !this.state.showFilters
    });
  }

  /**
   * Return the center of the map as the user sees it
   * (if the sidebar is opened, the center is displaced)
   * @returns { lat: number, lng: number }
   */
  getPerceivedMapCenter() {
    const { explore } = this.props;

    const isOpenedSidebar = explore.sidebar.open;
    if (!isOpenedSidebar || !this.map) {
      return explore.latLng;
    }

    const { latLng, sidebar } = explore;
    const sidebarWidth = sidebar.width;
    const center = this.map.latLngToContainerPoint([latLng.lat, latLng.lng]);
    const newCenter = [center.x + sidebarWidth / 2, center.y];

    return this.map.containerPointToLatLng(newCenter);
  }

  render() {
    // It will render a list of links for AddSearch Bot
    if (this.props.botUserAgent) {
      return (
        <ul>
          {this.props.totalDatasets.map(d =>
            (<li key={d.id}>
              <Link
                route="explore_detail"
                params={{ id: d.id }}
              >
                <a>{d.attributes.name}</a>
              </Link>
            </li>)
          )}
        </ul>
      );
    }

    const { explore, totalDatasets, filteredDatasets, user } = this.props;
    const { search } = explore.filters;
    const { zoom, latLng } = explore;
    const { showFilters } = this.state;

    const buttonFilterContent = showFilters ? 'Hide filters' : 'Show filters';

    const showFiltersClassName = classnames({
      'c-btn': true,
      '-b': !showFilters,
      '-a': showFilters
    });

    return (
      <Layout
        title="Explore"
        description="Explore description"
        url={this.props.url}
        user={this.props.user}
      >
        <div className="p-explore">
          <div className="c-page -dark">
            <Sidebar ref={(node) => { this.sidebar = node; }}>
              <div className="row collapse">
                <div className="column small-12">
                  <h1>Explore</h1>
                  <div className="search-container">
                    <SearchInput
                      onSearch={this.handleFilterDatasetsSearch}
                      input={{
                        value: search && search.value,
                        placeholder: 'Search dataset'
                      }}
                      escapeText={false}
                    />
                    <button
                      className={showFiltersClassName}
                      onClick={() => this.toggleFilters()}
                    >
                      {buttonFilterContent}
                    </button>
                  </div>
                  <ExploreDatasetFilters
                    showFilters={showFilters}
                  />
                  <DatasetListHeader
                    list={totalDatasets}
                    mode={explore.datasets.mode}
                  />
                  <Spinner
                    isLoading={explore.datasets.loading || explore.filters.loading}
                    className="-light"
                  />

                  <div className="row collapse">
                    <div className="column small-12">
                      <DatasetList
                        list={filteredDatasets}
                        favourites={user.favourites}
                        mode={explore.datasets.mode}
                        showActions
                        showFavorite
                        onTagSelected={this.handleTagSelected}
                      />
                    </div>
                  </div>

                  <Paginator
                    options={{
                      page: explore.datasets.page,
                      limit: explore.datasets.limit,
                      size: totalDatasets.length
                    }}
                    onChange={(page) => {
                      this.props.setDatasetsPage(page);
                      // Scroll to the top of the list
                      document.getElementsByClassName('sidebar-content')[0].scrollTop = 0;
                    }}
                  />
                </div>
              </div>
            </Sidebar>
            <MediaQuery minDeviceWidth={720} values={{ deviceWidth: 720 }}>
              <div className="l-map">
                <Map
                  LayerManager={LayerManager}
                  mapConfig={{ zoom, latLng }}
                  layerGroups={this.props.layerGroups}
                  setMapParams={params => this.props.setMapParams(params)}
                  setMapInstance={(map) => { this.map = map; }}
                />

                <MapControls>
                  <ShareControl
                    zoom={zoom}
                    latLng={this.getPerceivedMapCenter()}
                    layerGroups={this.props.rawLayerGroups}
                  />
                  <BasemapControl />
                </MapControls>

                {this.props.layerGroups && this.props.layerGroups.length &&
                  <Legend
                    layerGroups={this.props.layerGroups}
                    className={{ color: '-dark' }}
                    toggleLayerGroupVisibility={this.onToggleLayerGroupVisibility}
                    setLayerGroupsOrder={this.onSetLayerGroupsOrder}
                    removeLayerGroup={this.onRemoveLayerGroup}
                    setLayerGroupActiveLayer={this.onSetLayerGroupActiveLayer}
                  />
                }
              </div>
            </MediaQuery>
          </div>
        </div>
      </Layout>
    );
  }
}

Explore.propTypes = {
  // ROUTER
  url: PropTypes.object,

  // STORE
  explore: PropTypes.object,
  filteredDatasets: PropTypes.array,
  totalDatasets: PropTypes.array,
  layerGroups: PropTypes.array,
  toggledDataset: PropTypes.string,
  locale: PropTypes.string.isRequired,


  // ACTIONS

  getDatasets: PropTypes.func.isRequired,
  getFavoriteDatasets: PropTypes.func.isRequired,
  setDatasetsPage: PropTypes.func.isRequired,
  redirectTo: PropTypes.func.isRequired,
  toggleModal: PropTypes.func.isRequired,
  setModalOptions: PropTypes.func.isRequired,
  setDatasetsSorting: PropTypes.func.isRequired,

  // Toggle the visibility of a layer group based on the layer passed as argument
  toggleLayerGroupVisibility: PropTypes.func.isRequired,
  // Remove the layer group
  removeLayerGroup: PropTypes.func.isRequired,
  // Set the active layer of a layer group
  setLayerGroupActiveLayer: PropTypes.func.isRequired,
  // Set the layer groups
  setLayerGroups: PropTypes.func.isRequired
};

Explore.defaultProps = {
  filteredDatasets: [],
  totalDatasets: []
};

const mapStateToProps = (state) => {
  const { totalFilteredDatasets, filteredDatasets } = getFilteredDatasets(state);
  return {
    user: state.user,
    explore: state.explore,
    exploreDatasetFilters: state.exploreDatasetFilters,
    filteredDatasets,
    totalDatasets: totalFilteredDatasets,
    layerGroups: getLayerGroups(state),
    rawLayerGroups: state.explore.layers,
    locale: state.common.locale
  };
};

const mapDispatchToProps = dispatch => ({
  getDatasets: () => { dispatch(getDatasets({})); },
  getFavoriteDatasets: (token) => { dispatch(getFavoriteDatasets(token)); },
  setDatasetsSearchFilter: search => dispatch(setDatasetsSearchFilter(search)),
  setDatasetsFilteredByConcepts: datasetList =>
    dispatch(setDatasetsFilteredByConcepts(datasetList)),
  setFilters: (filters) => { dispatch(setFilters(filters)); },
  setFiltersLoading: isLoading => dispatch(setFiltersLoading(isLoading)),
  redirectTo: (url) => { dispatch(redirectTo(url)); },
  toggleModal: (open, options) => dispatch(toggleModal(open, options)),
  setModalOptions: (options) => { dispatch(setModalOptions(options)); },
  setDatasetsPage: page => dispatch(setDatasetsPage(page)),
  toggleLayerGroupVisibility: (dataset, visible) => {
    dispatch(toggleLayerGroupVisibility(dataset, visible));
  },
  removeLayerGroup: dataset => dispatch(toggleLayerGroup(dataset, false)),
  setLayerGroupsOrder: datasets => dispatch(setLayerGroupsOrder(datasets)),
  setLayerGroupActiveLayer: (dataset, layer) => dispatch(setLayerGroupActiveLayer(dataset, layer)),
  setLayerGroups: layerGroups => dispatch(setLayerGroups(layerGroups)),
  setZoom: (zoom, updateUrl) => dispatch(setZoom(zoom, updateUrl)),
  setLatLng: (latLng, updateUrl) => dispatch(setLatLng(latLng, updateUrl)),
  setMapParams: debounce((params) => { // Debounce for performance reasons
    dispatch(setZoom(params.zoom));
    dispatch(setLatLng(params.latLng));
  }, 1000),
  setDatasetsSorting: sorting => dispatch(setDatasetsSorting(sorting))
});

export default withRedux(initStore, mapStateToProps, mapDispatchToProps)(Explore);
