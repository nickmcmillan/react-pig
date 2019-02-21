import React from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'react-resize-observer'

import getMinAspectRatio from './utils/getMinAspectRatio'
import Cell from './Cell'
import doLayout from './doLayout'
import computeLayout from './computeLayout'
import getUrl from './utils/getUrl'

import styles from './styles.css'

export default class Pig extends React.Component {
  constructor(props) {
    super(props)

    if (!props.imageData) throw new Error('imageData is missing')

    // if getUrl has been provided as a prop, use it. otherwise use the default getUrl from /utils
    this.getUrl = props.getUrl || getUrl

    // sort newest to old, by birthTime
    const sortedByDate = props.imageData.sort((a, b) => new Date(b.birthTime) - new Date(a.birthTime))

    const imageDataWithDefaults = sortedByDate.map(x => {
      x.style = {
        translateX: null,
        translateY: null,
        width: null,
        height: null,
      }
      return x
    })

    this.state = {
      imageData: imageDataWithDefaults,
      renderedItems: [],
    }

    this.containerOffset = null

    this.containerRef = React.createRef()
    this.minAspectRatio = null
    this.latestYOffset = 0
    this.scrollDirection = 'down'

    // These are the default settings, which may be overridden.
    this.settings = {

      gridGap: Number.isInteger(props.gridGap) ? props.gridGap : 8,

      /**
       * Type: Number
       * Default: 3000
       * Description: Height in pixels of images to preload in the direction
       *   that the user is scrolling. For example, in the default case, if the
       *   user is scrolling down, 1000px worth of images will be loaded below
       *   the viewport.
       */
      primaryImageBufferHeight: props.primaryImageBufferHeight || 1500,

      /**
       * Type: Number
       * Default: 100
       * Description: Height in pixels of images to preload in the direction
       *   that the user is NOT scrolling. For example, in the default case, if
       *   the user is scrolling down, 300px worth of images will be loaded
       *   above the viewport.  Images further up will be removed.
       */
      secondaryImageBufferHeight: props.secondaryImageBufferHeight || 1500,
    }
  }

  setRenderedItems() {
    if (!this.container) return

    const renderedItems = doLayout({
      container: this.container,
      containerOffset: this.containerOffset,
      totalHeight: this.totalHeight,
      scrollDirection: this.scrollDirection,
      settings: this.settings,
      latestYOffset: this.latestYOffset,
      imageData: this.state.imageData
    })

    this.setState({ renderedItems })
  }

  onScroll = (yOffset) => {
    // Compute the scroll direction using the latestYOffset and the previousYOffset
    const newYOffset = -(yOffset - this.settings.gridGap)
    this.previousYOffset = this.latestYOffset || newYOffset
    this.latestYOffset = newYOffset
    this.scrollDirection = (this.latestYOffset > this.previousYOffset) ? 'down' : 'up'

    // Call this.setRenderedItems, guarded by window.requestAnimationFrame
    window.requestAnimationFrame(() => {
      this.setRenderedItems()
    })
  }

  /**
   * This computes the layout of the entire grid, setting the height, width,
   * translateX, translateY, and transtion values for each ProgessiveImage in
   * `this.props.imageData`. These styles are set on the ProgressiveImage.style property,
   * but are not set on the DOM.
   *
   * This separation of concerns (computing layout and DOM manipulation) is
   * paramount to the performance of the PIG. While we need to manipulate the
   * DOM every time we scroll (adding or remove images, etc.), we only need to
   * compute the layout of the PIG on load and on resize. Therefore, this
   * function will compute the entire grid layout but will not manipulate the
   * DOM at all.
   *
   * All DOM manipulation occurs in `doLayout`.
   */
  computeLayout(wrapperWidth) {
    // Runs once or on resize
    // Compute the minimum aspect ratio that should be applied to the rows.
    this.minAspectRatio = getMinAspectRatio(wrapperWidth)

    // State
    let row = []           // The list of images in the current row.
    let translateX = 0     // The current translateX value that we are at
    let translateY = 0     // The current translateY value that we are at
    let rowAspectRatio = 0 // The aspect ratio of the row we are building

    // Loop through all our images, building them up into rows and computing
    // the working rowAspectRatio.
    const tempImgData = []
    this.state.imageData.forEach((image, index) => {
      row.push(image)

      // When the rowAspectRatio exceeeds the minimum acceptable aspect ratio,
      // or when we're out of images, we say that we have all the images we
      // need for this row, and compute the style values for each of these
      // images.
      rowAspectRatio += parseFloat(image.aspectRatio)
      if (rowAspectRatio >= this.minAspectRatio || index + 1 === this.state.imageData.length) {

        // Compute this row's height.
        let totalDesiredWidthOfImages = wrapperWidth - this.settings.gridGap * (row.length - 1)
        let rowHeight = totalDesiredWidthOfImages / rowAspectRatio

        // Handles cases where we don't have enough images to fill a row
        if (rowAspectRatio < this.minAspectRatio) {
          rowHeight = totalDesiredWidthOfImages / this.minAspectRatio
        }

        // For each image in the row, compute the width, height, translateX,
        // and translateY values, and set them (and the transition value we
        // found above) on each image.
        //
        // NOTE: This does not manipulate the DOM, rather it just sets the
        //       style values on the ProgressiveImage instance. The DOM nodes
        //       will be updated in doLayout.       

        row.forEach((img) => {

          const imageWidth = rowHeight * img.aspectRatio

          tempImgData.push({
            ...img,
            style: {
              width: parseInt(imageWidth, 10),
              height: parseInt(rowHeight, 10),
              translateX: translateX,
              translateY: translateY,
            }
          })

          // The next image is this.settings.gridGap pixels to the
          // right of this image.
          translateX += imageWidth + this.settings.gridGap

        })

        // Reset our state variables for next row.
        row = []
        rowAspectRatio = 0
        translateY += parseInt(rowHeight, 10) + this.settings.gridGap
        translateX = 0
      }
    })

    this.setState({
      imageData: tempImgData
    })
    // No space below the last image
    this.totalHeight = translateY - this.settings.gridGap
  }

  componentDidMount() {
    this.container = this.containerRef.current
    this.containerOffset = this.container.offsetTop
    this.computeLayout(this.container.offsetWidth)
  }

  render() {
    return (
      <div
        className={styles.output}
        ref={this.containerRef}
        style={{
          margin: `${this.settings.gridGap}px`
        }}
      >
        <ResizeObserver
          onResize={rect => {
            this.computeLayout(rect.width)
            this.setRenderedItems()
          }}
          onPosition={rect => this.onScroll(rect.top)}
        />
        {this.state.renderedItems.map(item => (
          <Cell
            key={item.url}
            item={item}
            containerWidth={this.container.offsetWidth}
            gridGap={this.settings.gridGap}
            getUrl={this.getUrl}
          />
        ))}
      </div>
    )
  }
}

Pig.propTypes = {
  imageData: PropTypes.array.isRequired,
  gridGap: PropTypes.number,
  getUrl: PropTypes.func,
  primaryImageBufferHeight: PropTypes.number,
  secondaryImageBufferHeight: PropTypes.number,
}
