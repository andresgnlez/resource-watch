import { connect } from 'react-redux';

// component
import LayoutHome from './component';

export default connect(
  state => ({
    dashFeatured: state.dashboards.featured.list
  }),
  null
)(LayoutHome);
