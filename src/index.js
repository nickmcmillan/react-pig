import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'

import Tile from './components/Tile/Tile'
import GroupHeader from './components/GroupHeader/GroupHeader'
import calcRenderableItems from './calcRenderableItems'
import computeLayout from './computeLayout'
import computeLayoutGroups from './computeLayoutGroups'
import getUrl from './utils/getUrl'
import sortByDate from './utils/sortByDate'
import groupByDate from './utils/groupByDate'
import getScrollSpeed from './utils/getScrollSpeed'

import styles from './styles.css'



export default class Pig extends React.Component {
  constructor(props) {
    super(props)

    if (!props.imageData) throw new Error('imageData is missing')

    // if getUrl has been provided as a prop, use it. otherwise use the default getUrl from /utils
    this.getUrl = props.getUrl || getUrl

    this.imageData = props.imageData

    // if sortFunc has been provided as a prop, use it
    if (props.sortFunc) this.imageData.sort(props.sortFunc)
    else if (props.sortByDate) this.imageData = sortByDate(this.imageData)

    // do grouping
    if (props.groupByDate) {
      if (this.imageData[0].items) {
        console.warn('Data appears to be grouped already')
      } else {
        this.imageData = groupByDate(this.imageData)
      }
    }

    this.state = {
      renderedItems: [],
      scrollSpeed: 0,
      activeTileUrl: null
    }

    this.scrollThrottleMs = 200
    this.windowHeight = window.innerHeight,
    this.containerOffsetTop = null
    this.totalHeight = 0

    this.containerRef = React.createRef()
    this.titleRef = React.createRef()
    this.minAspectRatio = null
    this.latestYOffset = 0
    this.previousYOffset = 0
    this.scrollDirection = 'down'

    this.settings = {
      gridGap: props.gridGap || 8,
      bgColor: props.bgColor || '#fff',
      primaryImageBufferHeight: props.primaryImageBufferHeight || 2500,
      secondaryImageBufferHeight: props.secondaryImageBufferHeight || 100,
      expandedSize: props.expandedSize || 1000,
      thumbnailSize: props.thumbnailSize || 10, // Height in px. Keeping it low seeing as it gets blurred anyway with a css filter

      // settings specific to groups
      groupByDate: props.groupByDate || false,
      breakpoint: props.breakpoint || 800,
      groupGapSm: props.groupGapSm || 50,
      groupGapLg: props.groupGapLg || 50,
    }

    this.throttledScroll = throttle(this.onScroll, this.scrollThrottleMs)
    this.debouncedResize = debounce(this.onResize, 500)
  }

  setRenderedItems(imageData) {
    // Set the container height, only need to do this once.
    if (!this.container.style.height) this.container.style.height = this.totalHeight + 'px'

    const renderedItems = calcRenderableItems({
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
      const scrollSpeed = getScrollSpeed(this.latestYOffset, this.scrollThrottleMs)
      if (scrollSpeed < 800) {
        this.setState({ scrollSpeed: 0 })
      } else if (scrollSpeed < 2000) {
        this.setState({ scrollSpeed: 1 })
      } else {
        this.setState({ scrollSpeed: 2 })
      }
      console.log(this.state.scrollSpeed)
      
    
      // slow < 800
      // too fast > 1500
      
      // dismiss any active Tile
      if (this.state.activeTileUrl) this.setState({ activeTileUrl: null })
    })
  }

  onResize = () => {
    this.imageData = this.getUpdatedImageLayout()
    this.setRenderedItems(this.imageData)
    this.container.style.height = this.totalHeight + 'px' // set the container height again based on new layout
    this.containerWidth = this.container.offsetWidth
    this.containerOffsetTop = this.container.offsetTop
    this.windowHeight = window.innerHeight
  }

  getUpdatedImageLayout() {
    const wrapperWidth = this.container.offsetWidth

    if (this.settings.groupByDate) {

      const {
        imageData,
        newTotalHeight
      } = computeLayoutGroups({
        wrapperWidth,
        minAspectRatio: this.minAspectRatio,
        imageData: this.imageData,
        settings: this.settings,
      })

      this.totalHeight = newTotalHeight
      return imageData
    } else {
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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.throttledScroll)
    window.removeEventListener('resize', this.debouncedResize)
  }

  renderTile = item => (
    <Tile
      key={item.url}
      windowHeight={this.windowHeight}
      containerWidth={this.containerWidth}
      containerOffsetTop={this.containerOffsetTop}
      item={item}
      gridGap={this.settings.gridGap}
      getUrl={this.getUrl}
      handleClick={item => {
        // if an image is already the width of the container, don't expand it on click
        if (item.style.width >= this.containerWidth) {
          this.setState({ activeTileUrl: null })
          return
        }

        this.setState({
          // if Tile is already active, deactivate it
          activeTileUrl: item.url !== this.state.activeTileUrl ? item.url : null
        })
      }}
      activeTileUrl={this.state.activeTileUrl}
      settings={this.settings}
      thumbnailSize={this.props.thumbnailSize}
      scrollSpeed={this.state.scrollSpeed}
    />
  )

  renderGroup = group => (
    <React.Fragment key={group.date}>
      <GroupHeader settings={this.settings} group={group} activeTileUrl={this.state.activeTileUrl} />
      {group.items.map(item => this.renderTile(item))}
    </React.Fragment>
  )

  renderFlat = item => this.renderTile(item)

  render() {
    return (
      <div className={styles.output} ref={this.containerRef}>
        {this.state.renderedItems.map(item => {
          if (this.settings.groupByDate) {
            return this.renderGroup(item)
          } else {
            return this.renderFlat(item)
          }
        })}
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
  sortByDate: PropTypes.bool,
  groupByDate: PropTypes.bool,
  groupGapSm: PropTypes.number,
  groupGapLg: PropTypes.number,
  breakpoint: PropTypes.number,
  sortFunc: PropTypes.func,
  expandedSize: PropTypes.number,
  thumbnailSize: PropTypes.number,
}
