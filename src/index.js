import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'

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

    this.imageData = sortedByDate.map(x => {
      x.style = {
        translateX: null,
        translateY: null,
        width: null,
        height: null,
      }
      return x
    })

    this.state = {
      renderedItems: [],
      activeCell: null
    }
    
    this.windowHeight = window.innerHeight,
    this.containerOffsetTop = null
    this.containerHeight = 0
    this.totalHeight = 0

    this.containerRef = React.createRef()
    this.minAspectRatio = null
    this.latestYOffset = 0
    this.scrollDirection = 'down'

    // These are the default settings, which may be overridden.
    this.settings = {
      gridGap: Number.isInteger(props.gridGap) ? props.gridGap : 8,
      primaryImageBufferHeight: props.primaryImageBufferHeight || 4000,
      secondaryImageBufferHeight: props.secondaryImageBufferHeight || 100,
    }

    this.throttledScroll = throttle(this.onScroll, 400)
    this.debouncedResize = debounce(this.onResize, 800)
  }

  setRenderedItems(imageData) {
    // Set the container height, only need to do this once.
    if (!this.container.style.height) this.container.style.height = this.totalHeight + 'px'


    const renderedItems = doLayout({
      containerOffsetTop: this.containerOffsetTop,
      scrollDirection: this.scrollDirection,
      settings: this.settings,
      latestYOffset: this.latestYOffset,
      imageData: imageData,
      windowHeight: this.windowHeight,
    })

    this.setState({ renderedItems })
  }

  onScroll = () => {
    // Compute the scroll direction using the latestYOffset and the previousYOffset
    this.previousYOffset = this.latestYOffset || window.pageYOffset
    this.latestYOffset = window.pageYOffset
    this.scrollDirection = (this.latestYOffset > this.previousYOffset) ? 'down' : 'up'

    window.requestAnimationFrame(() => {
      this.setRenderedItems(this.imageData)
      // dismiss any active cell
      if (this.state.activeCell) this.setState({ activeCell: null })
    })
  }

  onResize = () => {
    this.imageData = this.getUpdatedImageLayout()
    this.setRenderedItems(this.imageData)
  }

  getUpdatedImageLayout() {
    const wrapperWidth = this.container.offsetWidth
    
    const {
      imageData,
      newTotalHeight
    } = computeLayout({
      wrapperWidth,
      minAspectRatio: this.minAspectRatio,
      imageData: this.imageData,
      settings: this.settings,
    })

    this.totalHeight = newTotalHeight
    return imageData
  }

  componentDidMount() {
    this.container = this.containerRef.current
    this.containerOffsetTop = this.container.offsetTop
    this.containerWidth = this.container.offsetWidth
    window.addEventListener('scroll', this.throttledScroll)
    window.addEventListener('resize', this.debouncedResize)

    this.imageData = this.getUpdatedImageLayout()
    this.setRenderedItems(this.imageData)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.throttledScroll)
    window.removeEventListener('resize', this.debouncedResize)
  }

  render() {
    return (
      <div
        className={styles.output}
        ref={this.containerRef}
        style={{ margin: `${this.settings.gridGap}px`}}
      >
        {this.state.renderedItems.map(item => (
          <Cell
            windowHeight={this.windowHeight}
            key={item.url}
            item={item}
            containerWidth={this.containerWidth}
            gridGap={this.settings.gridGap}
            getUrl={this.getUrl}
            handleClick={activeCell => {
              this.setState({ 
                // if cell is already active, deactivate it
                activeCell: activeCell !== this.state.activeCell ? activeCell : null
               })
            }}
            scrollY={window.scrollY}
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
