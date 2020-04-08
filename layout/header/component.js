import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Link } from 'routes';
import { useMediaQuery } from 'react-responsive';

// components
import HeaderMenu from 'layout/header/header-menu';
import HeaderMenuMobile from 'layout/header/header-menu-mobile';
import Icon from 'components/ui/icon';

// utils
import { breakpoints } from 'utils/responsive';

// styles
import './styles.scss';

function Header(props) {
  const {
    header: { admin },
    pageHeader
  } = props;
  const { medium } = breakpoints;
  const headerClass = classnames(
    'l-header',
    { '-transparent': pageHeader }
  );
  const containerClass = classnames(
    'l-container',
    { '-admin': admin }
  );
  const mobileMode = useMediaQuery({ maxWidth: medium });

  return (
    <header className={headerClass}>
      <div className={containerClass}>
        <div className="row">
          <div className="column">
            <div className="header-main">
              <div className="header-logo">
                <Link route="home">
                  <a>
                    <Icon name="icon-rw-logo" className="brand-logo" />
                    <h1 className="brand-title">Resource Watch</h1>
                  </a>
                </Link>
              </div>

              {/* Mobile header */}
              {mobileMode && <HeaderMenuMobile />}

              {/* Desktop header */}
              {!mobileMode && <HeaderMenu />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

}

Header.propTypes = {
  header: PropTypes.object.isRequired,
  pageHeader: PropTypes.bool
};

Header.defaultProps = { pageHeader: false };

export default Header;
