import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import getImageHeight from '../../utils/getImageHeight'
import getTileMeasurements from '../../utils/getTileMeasurements'
import styles from './styles.css'

const Tile = React.memo(function Tile({
  item,
  useLqip,
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
  const isVideo = item.url.includes('.mp4') || item.url.includes('.mov')
  const [isFullSizeLoaded, setFullSizeLoaded] = useState(isVideo ? true : false)
  const [showSecondaryImage, setShowSecondaryImage] = useState(false)

  const { calcWidth, calcHeight, offsetX, offsetY } = getTileMeasurements({ item, windowHeight, settings, containerWidth, containerOffsetTop })

  // gridPosition is what has been set by the grid layout logic (in the parent component)
  const gridPosition = `translate3d(${item.style.translateX}px, ${item.style.translateY}px, 0)`
  // screenCenter is positioning logic for when the item is active and expanded
  const screenCenter = `translate3d(${offsetX}px, ${offsetY}px, 0)`

  const { width, height, transform, zIndex } = useSpring({
    transform: isExpanded ? screenCenter : gridPosition,
    zIndex: isExpanded ? 10 : 0, // 10 so that it takes a little longer before settling at 0
    width: isExpanded ? Math.ceil(calcWidth) + 'px' : item.style.width + 'px',
    height: isExpanded ? Math.ceil(calcHeight) + 'px' : item.style.height + 'px',
    config: { mass: 1.5, tension: 400, friction: 40 }
  })

  return (
    <animated.button
      className={`${styles.pigBtn}${isExpanded ? ` ${styles.pigBtnActive}` : ''} pig-btn`}
      onClick={() => handleClick(item)}
      onMouseEnter={() => {console.log("detectedmousein"); setShowSecondaryImage(true)}}
      onMouseLeave={() => {setShowSecondaryImage(false)}}
      style={{
        outline: isExpanded ? `${settings.gridGap}px solid ${settings.bgColor}` : null,
        backgroundColor: item.dominantColor,
        zIndex: zIndex.interpolate(t => Math.round(t)),
        width: width.interpolate(t => t),
        height: height.interpolate(t => t),
        transform: transform.interpolate(t => t)
      }}
    >

      {useLqip &&
        // LQIP
        <img
          className={`${styles.pigImg} ${styles.pigThumbnail}${isFullSizeLoaded ? ` ${styles.pigThumbnailLoaded}` : ''} lowqual`}
          src={getUrl(item.url, settings.thumbnailSize)}
          loading="lazy"
          width={item.style.width}
          height={item.style.height}
          alt=""
        />
      }

      {(scrollSpeed === 'slow' ) && !isVideo && (item.secondaryUrl !== undefined) && showSecondaryImage &&
        // grid image
        <img
          className={`${styles.pigImg} ${styles.pigFull}${isFullSizeLoaded ? ` ${styles.pigFullLoaded}` : ''} secondaryimg`}
          style={{'filter': 'grayscale(100%)'}}
          src={getUrl(item.secondaryUrl, getImageHeight(containerWidth))}
          alt=""
          onLoad={() => setFullSizeLoaded(true)}
        />
      }
      
      {(scrollSpeed === 'slow' ) && !isVideo && ((item.secondaryUrl === undefined) || (item.secondaryUrl !== undefined && !showSecondaryImage)) &&
        // grid image
        <img
          className={`${styles.pigImg} ${styles.pigFull}${isFullSizeLoaded ? ` ${styles.pigFullLoaded}` : ''} midqual`}
          src={getUrl(item.url, getImageHeight(containerWidth))}
          alt=""
          onLoad={() => setFullSizeLoaded(true)}
        />
      }

      {(scrollSpeed === 'slow' ) && isVideo &&
        <video
          className={`${styles.pigImg} ${styles.pigThumbnail}${isFullSizeLoaded ? ` ${styles.pigThumbnailLoaded}` : ''}`}
          src={getUrl(item.url, getImageHeight(containerWidth))}
          onCanPlay={() => setFullSizeLoaded(true)}
          autoPlay
          muted
          loop
          playsInline
        />
      }

      {isExpanded && !isVideo && (
        // full size expanded image
        <img
          className={`${styles.pigImg} fullqual`}
          src={getUrl(item.url, settings.expandedSize)}
          alt=""
        />
      )}
      
      {isExpanded && isVideo && (
        // full size expanded video
        <video
          className={styles.pigImg}
          src={getUrl(item.url, settings.expandedSize)}
          autoPlay
          muted
          loop
          playsInline
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
