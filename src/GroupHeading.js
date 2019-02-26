import React from 'react'
import PropTypes from 'prop-types'

import styles from './styles.css'

export default ({
  settings,
  group,
  activeCell,
}) => (
  <header
    className={styles.headerPositioner}
    style={{
      top: `${group.groupTranslateY}px`,
      height: `${group.height - settings.gridGap}px`,
    }}
  >
    <div
      className={styles.headerInner}
      style={{
        backgroundColor: settings.bgColor,
        zIndex: activeCell ? 1 : 2,
      }}
    >
      <span className={styles.description}>
        {group.description}
      </span>
      <span className={styles.date}>
        {group.date}
      </span>
    </div>
  </header>
)
