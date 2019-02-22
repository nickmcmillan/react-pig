import React from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'react-resize-observer'

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
      activeCell: null
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

    // Set the container height
    this.container.style.height = this.totalHeight + 'px'

    const renderedItems = doLayout({
      containerOffset: this.containerOffset,
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

    window.requestAnimationFrame(() => {
      this.setRenderedItems()
      // dismiss any active cell
      if (this.state.activeCell) this.setState({ activeCell: null })
    })
  }

  handleComputeLayout(wrapperWidth) {
    const {
      imageData,
      newTotalHeight
    } = computeLayout({
      wrapperWidth,
      minAspectRatio: this.minAspectRatio,
      imageData: this.state.imageData,
      settings: this.settings,
    })

    this.totalHeight = newTotalHeight
    this.setState({ imageData })
  }

  componentDidMount() {
    this.container = this.containerRef.current
    this.containerOffset = this.container.offsetTop
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
            this.handleComputeLayout(rect.width)
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
            handleClick={activeCell => {
              this.setState({ 
                // if cell is already active, deactivate it
                activeCell: activeCell !== this.state.activeCell ? activeCell : null
               })
            }}
            activeCell={this.state.activeCell}
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
