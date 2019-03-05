import React from 'react'
import PropTypes from 'prop-types'

import styles from './styles.css'

export default ({
  settings,
  group,
  activeTileUrl,
}) => (
  <header
    className={styles.headerPositioner}
    style={{
      top: `${group.groupTranslateY}px`,
      height: `${group.height - settings.gridGap}px`,
    }}
  >
    <div
      className={`${styles.headerInner} pig-header`}
      style={{
        backgroundColor: settings.bgColor,
        zIndex: activeTileUrl ? 1 : 2,
      }}
    >
      <span className={`${styles.description} pig-header_description`}>
        {group.description}
      </span>
      <span className={`${styles.date} pig-header_date`}>
        {group.date}
      </span>
    </div>
  </header>
)
