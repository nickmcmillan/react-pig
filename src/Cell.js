import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import getImageHeight from './utils/getImageHeight'
import getCellMeasurements from './utils/getCellMeasurements'
import styles from './styles.css'

const thumbnailSize = 10 // Height in px. Keeping it low seeing as it gets blurred anyway with a css filter

const Cell = React.memo(function Cell({ item, containerWidth, getUrl, activeCell, handleClick, windowHeight, scrollY, settings }) {

  const isExpanded = activeCell === item.url
  const [isFullSizeLoaded, setFullSizeLoaded] = useState(false)

  const { calcWidth, calcHeight, offsetX, offsetY } = getCellMeasurements({ item, windowHeight, settings, containerWidth })

  // gridPosition is what has been set by the grid layout logic (in the parent component)
  const gridPosition = `translate3d(${item.style.translateX}px, ${item.style.translateY}px, 0)`
  // screenCenter is positioning logic for when the item is active and expanded
  const screenCenter = `translate3d(${offsetX}px, ${offsetY}, 0)`

  const { width, height, transform, zIndex } = useSpring({
    transform: isExpanded ? screenCenter : gridPosition,
    zIndex: isExpanded ? 10 : 0, // 10 so that it takes a little longer before settling at 0
    width: isExpanded ? Math.ceil(calcWidth) + 'px' : item.style.width + 'px',
    height: isExpanded ? Math.ceil(calcHeight) + 'px' : item.style.height + 'px',
    config: { mass: 1.5, tension: 400, friction: 40 }
  })

  return (
    <animated.button
      className={`${styles.pigBtn}${isExpanded ? ` ${styles.pigBtnActive}` : ''}`}
      onClick={() => handleClick(item.url)}
      style={{
        outline: isExpanded ? `${settings.gridGap}px solid ${settings.bgColor}` : null,
        backgroundColor: item.dominantColor,
        zIndex: zIndex.interpolate(t => Math.round(t)),
        width: width.interpolate(t => t),
        height: height.interpolate(t => t),
        transform: transform.interpolate(t => t)
      }}
    >

      <img
        className={`${styles.pigImg} ${styles.pigThumbnail}${isFullSizeLoaded ? ` ${styles.pigThumbnailLoaded}` : ''}`}
        src={getUrl(item.url, thumbnailSize)}
        alt=""
      />
      <img
        className={`${styles.pigImg} ${styles.pigFull}${isFullSizeLoaded ? ` ${styles.pigFullLoaded}` : ''}`}
        src={getUrl(item.url, getImageHeight(containerWidth))}
        alt=""
        onLoad={() => setFullSizeLoaded(true)}
      />

      {isExpanded && (
        // when active, load in the full size image.
        // number is arbitrary. It's just a bigger value so a better quality image.
        <img
          className={styles.pigImg}
          src={getUrl(item.url, 1200)}
          alt=""
        />
      )}

      {/* <figcaption className={styles.caption}>
        <span>{getDate(item.birthTime)}</span>
      </figcaption> */}
    </animated.button>
  )
})

export default Cell

Cell.propTypes = {
  item: PropTypes.object.isRequired,
  containerWidth: PropTypes.number,
  settings: PropTypes.object.isRequired,
  getUrl: PropTypes.func,
}
