import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';
import { getDashboards, setFilters } from 'redactions/admin/dashboards';

// Selectors
import getFilteredDashboards from 'selectors/admin/dashboards';

// Components
import Spinner from 'components/ui/Spinner';
import CustomTable from 'components/ui/customtable/CustomTable';
import SearchInput from 'components/ui/SearchInput';

// constants
import { INITIAL_PAGINATION } from './constants';

// Table components
import EditAction from './actions/EditAction';
import DeleteAction from './actions/DeleteAction';

// TDs
import NameTD from './td/NameTD';
import PublishedTD from './td/PublishedTD';
import PreviewTD from './td/PreviewTD';

class DashboardsTable extends PureComponent {
  static propTypes = {
    authorization: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    filteredDashboards: PropTypes.array.isRequired,
    error: PropTypes.string,
    getDashboards: PropTypes.func.isRequired,
    setFilters: PropTypes.func.isRequired
  };

  state = { pagination: INITIAL_PAGINATION }

  componentDidMount() {
    this.props.setFilters([]);
    this.props.getDashboards();
  }

  componentWillReceiveProps(nextProps) {
    const { filteredDashboards: dashboards } = this.props;
    const { filteredDashboards: nextDashboards } = nextProps;
    const { pagination } = this.state;
    const dashboardsChanged = dashboards.length !== nextDashboards.length;

    this.setState({
      pagination: {
        ...pagination,
        size: nextDashboards.length,
        ...dashboardsChanged && { page: 1 },
        pages: Math.ceil(nextDashboards.length / pagination.limit)
      }
    });
  }

  /**
   * Event handler executed when the user search for a dataset
   * @param {string} { value } Search keywords
   */
  onSearch = (value) => {
    if (!value.length) {
      this.props.setFilters([]);
    } else {
      this.props.setFilters([{ key: 'name', value }]);
    }
  }

  onChangePage = (page) => {
    const { pagination } = this.state;

    this.setState({
      pagination: {
        ...pagination,
        page
      }
    });
  }

  render() {
    const { filteredDashboards } = this.props;
    const { pagination } = this.state;

    return (
      <div className="c-dashboards-table">
        <Spinner className="-light" isLoading={this.props.loading} />

        {this.props.error && (
          <p>Error: {this.props.error}</p>
        )}

        <SearchInput
          input={{ placeholder: 'Search dashboard' }}
          link={{
            label: 'New dashboard',
            route: 'admin_dashboards_detail',
            params: { tab: 'dashboards', id: 'new' }
          }}
          onSearch={this.onSearch}
        />

        {!this.props.error && (
          <CustomTable
            columns={[
              { label: 'Name', value: 'name', td: NameTD },
              { label: 'Preview', value: 'slug', td: PreviewTD },
              { label: 'Published', value: 'published', td: PublishedTD }
            ]}
            actions={{
              show: true,
              list: [
                { name: 'Edit', route: 'admin_dashboards_detail', params: { tab: 'dashboards', subtab: 'edit', id: '{{id}}' }, show: true, component: EditAction },
                { name: 'Remove', route: 'admin_dashboards_detail', params: { tab: 'dashboards', subtab: 'remove', id: '{{id}}' }, component: DeleteAction, componentProps: { authorization: this.props.authorization } }
              ]
            }}
            sort={{
              field: 'name',
              value: 1
            }}
            filters={false}
            data={filteredDashboards}
            manualPagination
            onChangePage={this.onChangePage}
            onRowDelete={() => this.props.getDashboards({ env: 'production,preproduction' })}
            pagination={pagination}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loading: state.adminDashboards.dashboards.loading,
  dashboards: state.adminDashboards.dashboards.list,
  filteredDashboards: getFilteredDashboards(state),
  error: state.adminDashboards.dashboards.error
});
const mapDispatchToProps = {
  getDashboards,
  setFilters
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardsTable);
