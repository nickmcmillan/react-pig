import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import getImageHeight from '../../utils/getImageHeight'
import getTileMeasurements from '../../utils/getTileMeasurements'
import styles from './styles.css'

const Tile = React.memo(function Tile({
  item,
  containerWidth,
  containerOffsetTop,
  getUrl,
  activeTileUrl,
  handleClick,
  windowHeight,
  scrollSpeed,
  settings,
}) {

  const isExpanded = activeTileUrl === item.url
  const [isFullSizeLoaded, setFullSizeLoaded] = useState(false)

  const { calcWidth, calcHeight, offsetX, offsetY } = getTileMeasurements({ item, windowHeight, settings, containerWidth, containerOffsetTop })

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
      onClick={() => handleClick(item)}
      style={{
        outline: isExpanded ? `${settings.gridGap}px solid ${settings.bgColor}` : null,
        backgroundColor: item.dominantColor,
        zIndex: zIndex.interpolate(t => Math.round(t)),
        width: width.interpolate(t => t),
        height: height.interpolate(t => t),
        transform: transform.interpolate(t => t)
      }}
    >
      {scrollSpeed === 'medium' &&
        // LQIP
        <img
          className={`${styles.pigImg} ${styles.pigThumbnail}${isFullSizeLoaded ? ` ${styles.pigThumbnailLoaded}` : ''}`}
          src={getUrl(item.url, settings.thumbnailSize)}
          alt=""
        />
      }
      {(scrollSpeed === 'slow' || scrollSpeed === 'medium') &&
        // grid image
        <img
          className={`${styles.pigImg} ${styles.pigFull}${isFullSizeLoaded ? ` ${styles.pigFullLoaded}` : ''}`}
          src={getUrl(item.url, getImageHeight(containerWidth))}
          alt=""
          onLoad={() => setFullSizeLoaded(true)}
        />
      }

      {isExpanded && (
        // full size expanded image
        <img
          className={styles.pigImg}
          src={getUrl(item.url, settings.expandedSize)}
          alt=""
        />
      )}
    </animated.button>
  )
})

export default Tile

Tile.propTypes = {
  item: PropTypes.object.isRequired,
  containerWidth: PropTypes.number,
  settings: PropTypes.object.isRequired,
  getUrl: PropTypes.func,
}
