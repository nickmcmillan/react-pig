import React from 'react'
import getMinAspectRatio from './utils/getMinAspectRatio'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import Cell from './Cell'

import styles from './styles.css'

export default class Pig extends React.Component {
  constructor(props) {
    super(props)

    if (!props.imageData) throw new Error('imageData is missing')
    if (!props.urlGenerator) throw new Error('urlGenerator is missing')

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

  doLayout() {

    // Set the container height
    this.container.style.height = this.totalHeight + 'px'

    // Get the top and bottom buffers heights.
    const bufferTop =
      (this.scrollDirection === 'up') ?
        this.settings.primaryImageBufferHeight :
        this.settings.secondaryImageBufferHeight
    const bufferBottom =
      (this.scrollDirection === 'down') ?
        this.settings.secondaryImageBufferHeight :
        this.settings.primaryImageBufferHeight

    // Now we compute the location of the top and bottom buffers:
    // const containerOffset = getOffsetTop(this.container)
    const windowHeight = window.innerHeight

    // This is the top of the top buffer. If the bottom of an image is above
    // this line, it will be removed.
    const minTranslateYPlusHeight = this.latestYOffset - this.containerOffset - bufferTop

    // This is the bottom of the bottom buffer.  If the top of an image is
    // below this line, it will be removed.
    const maxTranslateY = this.latestYOffset + windowHeight + bufferBottom


    // Here, we loop over every image, determine if it is inside our buffers or
    // no, and either insert it or remove it appropriately.

    const renderedItems = this.state.imageData.filter(img => {
      if (img.style.translateX === null || img.style.translateY === null) return false

      if (img.style.translateY + img.style.height < minTranslateYPlusHeight || img.style.translateY > maxTranslateY) {
        return false
      } else {
        return true
      }
    })

    this.setState({ renderedItems })
  }

  onScroll = () => {
    // Compute the scroll direction using the latestYOffset and the previousYOffset
    const newYOffset = window.pageYOffset
    this.previousYOffset = this.latestYOffset || newYOffset
    this.latestYOffset = newYOffset
    this.scrollDirection = (this.latestYOffset > this.previousYOffset) ? 'down' : 'up'

    // Call this.doLayout, guarded by window.requestAnimationFrame
    window.requestAnimationFrame(() => {
      this.doLayout()
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
  computeLayout() {
    // runs once
    // or on resize
    // TODO: this.container should use resizeObserver inside of window.resize event

    const wrapperWidth = this.container.offsetWidth

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

  onResize = () => {
    this.computeLayout()
    this.doLayout()
  }

  componentDidMount() {
    this.container = this.containerRef.current

    this.containerOffset = this.container.offsetTop

    this.computeLayout()
    this.onScroll()

    window.addEventListener('scroll', throttle(this.onScroll, 50))
    window.addEventListener('resize', debounce(this.onResize, 800))
  }

  componentWillUnmount() {
    // TODO:
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
        {this.state.renderedItems.map(item => (
          <Cell
            key={item.url}
            item={item}
            containerWidth={this.container.offsetWidth}
            gridGap={this.settings.gridGap}
            urlGenerator={this.props.urlGenerator}
          />
        ))}
      </div>
    )
  }
}
