import React from 'react';
import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';

import { getTools, setFilters } from 'redactions/admin/tools';

// Selectors
import getFilteredTools from 'selectors/admin/tools';

// Components
import Spinner from 'components/ui/Spinner';
import CustomTable from 'components/ui/customtable/CustomTable';
import SearchInput from 'components/ui/SearchInput';

// Table components
import EditAction from './actions/EditAction';
import DeleteAction from './actions/DeleteAction';

// TDs
import TitleTD from './td/name';
import PublishedTD from './td/published';
import RoleTD from './td/role';

class ToolsTable extends React.Component {
  static defaultProps = {
    columns: [],
    actions: {},
    // Store
    tools: [],
    filteredTools: []
  };

  static propTypes = {
    authorization: PropTypes.string,
    // Store
    loading: PropTypes.bool.isRequired,
    tools: PropTypes.array.isRequired,
    filteredTools: PropTypes.array.isRequired,
    error: PropTypes.string,

    // Actions
    getTools: PropTypes.func.isRequired,
    setFilters: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    // ------------------ Bindings ------------------------
    this.onSearch = this.onSearch.bind(this);
    // ----------------------------------------------------
  }

  componentDidMount() {
    this.props.setFilters([]);
    this.props.getTools();
  }

  /**
   * Event handler executed when the user search for a dataset
   * @param {string} { value } Search keywords
   */
  onSearch(value) {
    if (!value.length) {
      this.props.setFilters([]);
    } else {
      this.props.setFilters([{ key: 'name', value }]);
    }
  }

  /**
   * HELPERS
   * - getTools
   * - getFilteredTools
  */
  getTools() {
    return this.props.tools;
  }

  getFilteredTools() {
    return this.props.filteredTools;
  }

  render() {
    return (
      <div className="c-tools-table">
        <Spinner className="-light" isLoading={this.props.loading} />

        {this.props.error && (
          <p>Error: {this.props.error}</p>
        )}

        <SearchInput
          input={{
            placeholder: 'Search tool'
          }}
          link={{
            label: 'New tool',
            route: 'admin_tools_detail',
            params: { tab: 'tools', id: 'new' }
          }}
          onSearch={this.onSearch}
        />

        {!this.props.error && (
          <CustomTable
            columns={[
              { label: 'Name', value: 'title', td: TitleTD },
              { label: 'Role', value: 'role', td: RoleTD },
              { label: 'Published', value: 'published', td: PublishedTD }
            ]}
            actions={{
              show: true,
              list: [
                { name: 'Edit', route: 'admin_tools_detail', params: { tab: 'tools', subtab: 'edit', id: '{{id}}' }, show: true, component: EditAction },
                { name: 'Remove', route: 'admin_tools_detail', params: { tab: 'tools', subtab: 'remove', id: '{{id}}' }, component: DeleteAction, componentProps: { authorization: this.props.authorization } }
              ]
            }}
            sort={{
              field: 'title',
              value: 1
            }}
            filters={false}
            data={this.getFilteredTools()}
            pageSize={20}
            onRowDelete={() => this.props.getTools()}
            pagination={{
              enabled: true,
              pageSize: 20,
              page: 0
            }}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loading: state.tools.loading,
  tools: state.tools.list,
  filteredTools: getFilteredTools(state),
  error: state.tools.error
});
const mapDispatchToProps = dispatch => ({
  getTools: () => dispatch(getTools()),
  setFilters: filters => dispatch(setFilters(filters))
});

export default connect(mapStateToProps, mapDispatchToProps)(ToolsTable);
