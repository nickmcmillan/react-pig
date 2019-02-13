import React, { useState } from 'react'
import { useSpring, animated } from 'react-spring'
import getImageHeight from './utils/getImageHeight'
import getDate from './utils/getDate'

import styles from './styles.css'
const thumbnailSize = 10 // Height in px. Keeping it low seeing as it gets blurred anyway with a css filter

const Cell = React.memo(function Cell({ item, containerWidth, gridGap, urlGenerator }) {

  const [isExpanded, setExpanded] = useState(false)
  const [isThumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [isFullSizeLoaded, setFullSizeLoaded] = useState(false)

  // When expanded, portrait and Landscape images are treated differently
  const isImgPortrait = item.aspectRatio <= 1
  // Based on the window height, calculate the max image width
  const widthDerivedFromMaxWindowHeight = (window.innerHeight - gridGap * 2) * item.aspectRatio
  // 1. If image is portrait and when expanded it is too wide to fit in the container el, return containerWidth (basically like a limiter)
  // 2. If image is portrait and when expanded it fits within the container el, return widthDerivedFromMaxWindowHeight
  // 3. If it is not portrait, ie landscape, return containerWidth
  const calcWidth = isImgPortrait ? widthDerivedFromMaxWindowHeight > containerWidth ? containerWidth : widthDerivedFromMaxWindowHeight : containerWidth
  // Once all of that is out of the way, calculating the height is easy;
  const calcHeight = calcWidth / item.aspectRatio

  // Portrait images need to be centered along the x axis. Landscape images go full width, so just need to translate to 0
  const offsetX = isImgPortrait ? (containerWidth / 2) - (calcWidth / 2) : 0
  const offsetY = window.scrollY + (window.innerHeight / 2) - (calcHeight / 2) - gridGap

  // gridPosition is what has been set by the grid layout logic (in the parent component)
  const gridPosition = `translate3d(${item.style.translateX}px, ${item.style.translateY}px, 0)`
  // screenCenter is positioning logic for when the item is active and expanded
  const screenCenter = `translate3d(${offsetX}px, ${offsetY}, 0)`

  const { width, height, transform, zIndex, outlineColor } = useSpring({
    transform: isExpanded ? screenCenter : gridPosition,
    outlineColor: isExpanded ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
    zIndex: isExpanded ? 1 : 0,
    width: isExpanded ? calcWidth + 'px' : item.style.width + 'px',
    height: isExpanded ? calcHeight  + 'px' : item.style.height + 'px',
    config: { mass: 1.5, tension: 400, friction: 40 }
  })

  return (
    <animated.button
      onScroll={isExpanded ? () => setExpanded(false) : null}
      onWheel={isExpanded ? () => setExpanded(false) : null}
      onTouchMove={isExpanded ? () => setExpanded(false) : null}
      className={`${styles.pigBtn}${isExpanded ? ` ${styles.pigBtnActive}` : ''}`}
      onClick={() => setExpanded(!isExpanded)}
      style={{
        outlineStyle: 'solid',
        outlineWidth: `${gridGap}px`,
        outlineColor: outlineColor.interpolate(t => t),
        backgroundColor: item.dominantColor,
        zIndex: zIndex.interpolate(t => Math.ceil(t)),
        width: width.interpolate(t => t),
        height: height.interpolate(t => t),
        transform: transform.interpolate(t => t)
      }}
    >

      <img
        className={`${styles.pigImg} ${styles.pigThumbnail}${isFullSizeLoaded ? ` ${styles.pigThumbnailLoaded}` : ''}`}
        // display none the thumb if everything we need has loaded
        style={isFullSizeLoaded && isThumbnailLoaded ? { display: 'none' } : null}
        src={urlGenerator(item.url, thumbnailSize)}
        alt=""
        onLoad={() => setThumbnailLoaded(true)}
      />
      <img
        className={`${styles.pigImg} ${styles.pigFull}${isFullSizeLoaded ? ` ${styles.pigFullLoaded}` : ''}`}
        src={urlGenerator(item.url, getImageHeight(containerWidth))}
        alt=""
        onLoad={() => setFullSizeLoaded(true)}
      />

      {isExpanded && (
        // when active, load in the full size image.
        // 1000 is arbitrary. It's just a bigger value so a better quality image.
        <img
          className={styles.pigImg}
          src={urlGenerator(item.url, 1000)}
          alt=""
        />
      )}

      <figcaption className={styles.caption}>
        <span>{getDate(item.birthTime)}</span>
        {/* {item.exif.ISO &&
          <ul className="exif">
            <li>Exp {item.exif.ExposureTime}</li>
            <li><em>f</em> {item.exif.ApertureValue}</li>
            <li>ISO {item.exif.ISO}</li>
          </ul>
        } */}
      </figcaption>
    </animated.button>
  )
})

export default Cell
