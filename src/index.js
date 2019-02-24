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
    // const sortedByDate = props.imageData.sort((a, b) => new Date(b.birthTime) - new Date(a.birthTime))
    this.imageData = props.imageData

    this.state = {
      renderedItems: [],
      activeCell: null
    }

    this.windowHeight = window.innerHeight,
      this.containerOffsetTop = null
    this.titleHeight = 0
    // this.containerHeight = 0
    this.totalHeight = 0

    this.containerRef = React.createRef()
    this.titleRef = React.createRef()
    this.minAspectRatio = null
    this.latestYOffset = 0
    this.scrollDirection = 'down'

    // These are the default settings, which may be overridden.
    this.settings = {
      groupTitleHeight: props.groupTitleHeight || 50,
      gridGap: Number.isInteger(props.gridGap) ? props.gridGap : 8,
      primaryImageBufferHeight: props.primaryImageBufferHeight || 4000,
      secondaryImageBufferHeight: props.secondaryImageBufferHeight || 100,
    }

    this.throttledScroll = throttle(this.onScroll, 200)
    this.debouncedResize = debounce(this.onResize, 500)
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
    this.container.style.height = this.totalHeight + 'px' // set the container height again based on new layout
    this.containerWidth = this.container.offsetWidth
  }

  getUpdatedImageLayout() {
    const wrapperWidth = this.container.offsetWidth
    console.log(this.container)
    

    const {
      imageData,
      newTotalHeight
    } = computeLayout({
      wrapperWidth,
      groupTitleHeight: this.settings.groupTitleHeight,
      minAspectRatio: this.minAspectRatio,
      imageData: this.imageData,
      settings: this.settings,
      group: true,
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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.throttledScroll)
    window.removeEventListener('resize', this.debouncedResize)
  }

  render() {
    return (
      <div
        className={styles.output}
        ref={this.containerRef}
        style={{ margin: `${this.settings.gridGap}px` }}
      >
        {this.state.renderedItems.map(group => {

          return (
            <React.Fragment key={group.date}>

              {!!group.items.length &&
                <div
                  className={styles.titlePositioner}
                  style={{
                    top: `${group.groupTranslateY - this.settings.groupTitleHeight}px`,
                    height: `${group.height + this.settings.groupTitleHeight}px`,
                  }}
                >
                  <div className={styles.titleInner} style={{height: `${this.settings.groupTitleHeight}px`}}>
                    <span className={styles.description}>
                      {group.firstLocationInGroup}
                    </span>
                    <span className={styles.date}>
                      {group.date}
                    </span>
                  </div>
                </div>
              }

              {group.items.map(item => (
                <Cell
                  windowHeight={this.windowHeight}
                  containerWidth={this.containerWidth}
                  key={item.url}
                  item={item}
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
            </React.Fragment>
          )
          
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
}
