import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import getImageHeight from './utils/getImageHeight'
import getDate from './utils/getDate'

import styles from './styles.css'
const thumbnailSize = 10 // Height in px. Keeping it low seeing as it gets blurred anyway with a css filter

const Cell = React.memo(function Cell({ item, containerWidth, gridGap, getUrl, activeCell, handleClick, windowHeight, scrollY }) {

  const isExpanded = activeCell === item.url
  const [isFullSizeLoaded, setFullSizeLoaded] = useState(false)

  // When expanded, portrait and Landscape images are treated differently
  const isImgPortrait = item.aspectRatio <= 1
  // Based on the window height, calculate the max image width
  const widthDerivedFromMaxWindowHeight = (windowHeight - gridGap * 2) * item.aspectRatio
  
  const calcWidth = (() => {
    if (isImgPortrait) {
      if (widthDerivedFromMaxWindowHeight > containerWidth) {
        // 1. If image is portrait and when expanded it is too wide to fit in the container width, 
        // return containerWidth (basically a limiter)
        return containerWidth
      } else {
        // 2. If image is portrait and when expanded it fits within the container
        return widthDerivedFromMaxWindowHeight
      }
    } else {
      if ((containerWidth / item.aspectRatio) >= windowHeight) {
        // 3. If it's landscape, and if its too tall to fit in the viewport height, 
        // return the widthDerivedFromMaxWindowHeight
        return widthDerivedFromMaxWindowHeight - gridGap * 2
      } else {
        // 4. If it's landscape and when expanded fits within the container, return containerWidth
        return containerWidth - gridGap * 2
      }
    }
  })()

  // Once all of that is out of the way, calculating the height is straightforward;
  const calcHeight = (calcWidth / item.aspectRatio) //- gridGap

  // calculate the offset position in the center of the screen
  const offsetX = (containerWidth / 2) - (calcWidth / 2) 
  const offsetY = scrollY + (windowHeight / 2) - (calcHeight / 2) - gridGap

  // gridPosition is what has been set by the grid layout logic (in the parent component)
  const gridPosition = `translate3d(${item.style.translateX}px, ${item.style.translateY}px, 0)`
  // screenCenter is positioning logic for when the item is active and expanded
  const screenCenter = `translate3d(${offsetX}px, ${offsetY}, 0)`

  const { width, height, transform, zIndex, /*outlineColor*/ } = useSpring({
    transform: isExpanded ? screenCenter : gridPosition,
    // outlineColor: isExpanded ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
    zIndex: isExpanded ? 3 : 0,
    width: isExpanded ? Math.ceil(calcWidth) + 'px' : item.style.width + 'px',
    height: isExpanded ? Math.ceil(calcHeight) + 'px' : item.style.height + 'px',
    config: { mass: 1.5, tension: 400, friction: 40 }
  })

  return (
    <animated.button
      className={`${styles.pigBtn}${isExpanded ? ` ${styles.pigBtnActive}` : ''}`}
      onClick={() => handleClick(item.url)}
      style={{
        outlineWidth: `${gridGap}px`,
        // hidden to prevent blurry preloader from overflowing
        // visible so that the outline becomes visible when expanded
        overflow: isExpanded ? 'visible' : 'hidden', 
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
        // 1000 is arbitrary. It's just a bigger value so a better quality image.
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
  item: PropTypes.object.isRequired, // TODO: object shape
  containerWidth: PropTypes.number,
  gridGap: PropTypes.number,
  getUrl: PropTypes.func,
}
