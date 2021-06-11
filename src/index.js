import React, { Component } from "react";
import PropTypes from "prop-types";
import debounce from "lodash.debounce";
import throttle from "lodash.throttle";

import Tile from "./components/Tile/Tile";
import GroupHeader from "./components/GroupHeader/GroupHeader";
import calcRenderableItems from "./calcRenderableItems";
import computeLayout from "./computeLayout";
import computeLayoutGroups from "./computeLayoutGroups";
import getUrl from "./utils/getUrl";
import sortByDate from "./utils/sortByDate";
import getScrollSpeed from "./utils/getScrollSpeed";

import styles from "./styles.css";


export default class Pig extends Component {
  constructor(props) {
    super(props);

    if (!props.imageData) throw new Error("imageData is missing");

    // if getUrl has been provided as a prop, use it. otherwise use the default getUrl from /utils
    this.getUrl = props.getUrl || getUrl;

    // if handleClick has been provided as a prop, use it. otherwise use the defaultHandleClick
    this.handleClick = props.handleClick || this.defaultHandleClick;

    this.selectable = props.selectable || false;
    this.handleSelection = props.handleSelection || this.defaultHandleSelection;
    this.imageData = props.imageData;

    // if sortFunc has been provided as a prop, use it
    if (props.sortFunc) this.imageData.sort(props.sortFunc);
    else if (props.sortByDate) this.imageData = sortByDate(this.imageData);

    // check grouping ability
    if (props.groupByDate) {
      if (!this.imageData[0].items) {
        console.error(
          `Data provided is not grouped yet. Please check the docs, you'll need to use groupify.js`
        );
      }
    } else {
      if (this.imageData[0].items) {
        console.error(
          `Data provided is grouped, please include the groupByDate prop`
        );
      }
    }

    this.state = {
      renderedItems: [],
      selectedItems: [],
      scrollSpeed: "slow",
      activeTileUrl: null
    };

    
    this.scrollThrottleMs = 300;
    (this.windowHeight =
      typeof window !== "undefined" ? window.innerHeight : 1000), // arbitrary height
      (this.containerOffsetTop = null);
    this.totalHeight = 0;

    this.containerRef = React.createRef();
    this.titleRef = React.createRef();
    this.minAspectRatio = null;
    this.latestYOffset = 0;
    this.previousYOffset = 0;
    this.scrollDirection = "down";

    this.settings = {
      gridGap: props.gridGap,
      bgColor: props.bgColor,
      primaryImageBufferHeight: props.primaryImageBufferHeight,
      secondaryImageBufferHeight: props.secondaryImageBufferHeight,
      expandedSize: props.expandedSize,
      thumbnailSize: props.thumbnailSize,
      groupByDate: props.groupByDate,
      breakpoint: props.breakpoint,
      groupGapSm: props.groupGapSm,
      groupGapLg: props.groupGapLg
    };

    if (typeof window === "undefined") return;

    this.throttledScroll = throttle(this.onScroll, this.scrollThrottleMs);
    this.debouncedResize = debounce(this.onResize, 500);
  }

  setRenderedItems(imageData) {
    // Set the container height, only need to do this once.
    if (!this.container.style.height)
      this.container.style.height = this.totalHeight + "px";

    const renderedItems = calcRenderableItems({
      containerOffsetTop: this.containerOffsetTop,
      scrollDirection: this.scrollDirection,
      settings: this.settings,
      latestYOffset: this.latestYOffset,
      imageData: imageData,
      windowHeight: this.windowHeight
    });

    this.setState({ renderedItems });
  }

  onScroll = () => {
    this.previousYOffset = this.latestYOffset || window.pageYOffset;
    this.latestYOffset = window.pageYOffset;
    this.scrollDirection =
      this.latestYOffset > this.previousYOffset ? "down" : "up";

    window.requestAnimationFrame(() => {
      this.setRenderedItems(this.imageData);

      // measure users scrolling speed and set it to state, used for conditional tile rendering
      const scrollSpeed = getScrollSpeed(
        this.latestYOffset,
        this.scrollThrottleMs,
        scrollSpeed => {
          this.setState({ scrollSpeed }); // scroll idle callback
        }
      );
      this.setState({ scrollSpeed });

      // dismiss any active Tile
      if (this.state.activeTileUrl) this.setState({ activeTileUrl: null });
    });
  };

  onResize = () => {
    this.imageData = this.getUpdatedImageLayout();
    this.setRenderedItems(this.imageData);
    this.container.style.height = this.totalHeight + "px"; // set the container height again based on new layout
    this.containerWidth = this.container.offsetWidth;
    this.containerOffsetTop = this.container.offsetTop;
    this.windowHeight = window.innerHeight;
  };

  defaultHandleSelection = (item) => {
    console.log(item)
    var newSelectedItems = this.state.selectedItems;
    if (newSelectedItems.includes(item)) {
      newSelectedItems = newSelectedItems.filter(value => value !== item);
    } else {
      newSelectedItems = newSelectedItems.concat(item);
    }
    this.setState({selectedItems : newSelectedItems});
  };

  defaultHandleClick = (event, item) => {
    // if an image is already the width of the container, don't expand it on click
    if (item.style.width >= this.containerWidth) {
      this.setState({ activeTileUrl: null });
      return;
    }

    this.setState({
      // if Tile is already active, deactivate it
      activeTileUrl: item.url !== this.state.activeTileUrl ? item.url : null
    });
  };

  getUpdatedImageLayout() {
    const wrapperWidth = this.container.offsetWidth;

    if (this.settings.groupByDate) {
      const { imageData, newTotalHeight } = computeLayoutGroups({
        wrapperWidth,
        minAspectRatio: this.minAspectRatio,
        imageData: this.imageData,
        settings: this.settings
      });

      this.totalHeight = newTotalHeight;
      return imageData;
    } else {
      const { imageData, newTotalHeight } = computeLayout({
        wrapperWidth,
        minAspectRatio: this.minAspectRatio,
        imageData: this.imageData,
        settings: this.settings
      });

      this.totalHeight = newTotalHeight;
      return imageData;
    }
  }

  componentDidMount() {
    this.container = this.containerRef.current;
    this.containerOffsetTop = this.container.offsetTop;
    this.containerWidth = this.container.offsetWidth;

    this.imageData = this.getUpdatedImageLayout();
    this.setRenderedItems(this.imageData);

    if (typeof window === "undefined") return;
    window.addEventListener("scroll", this.throttledScroll);
    window.addEventListener("resize", this.debouncedResize);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.throttledScroll);
    window.removeEventListener("resize", this.debouncedResize);
  }

  renderTile = item => (
    <Tile
      key={item.url}
      useLqip={this.props.useLqip}
      windowHeight={this.windowHeight}
      containerWidth={this.containerWidth}
      containerOffsetTop={this.containerOffsetTop}
      item={item}
      gridGap={this.settings.gridGap}
      getUrl={this.getUrl}
      handleClick={this.handleClick}
      handleSelection={this.handleSelection}
      selectable={this.selectable}
      selected={this.props.selectedItems ? this.props.selectedItems.find(selectedItem => selectedItem.id === item.id) : this.state.selectedItems.includes(item)}
      activeTileUrl={this.state.activeTileUrl}
      settings={this.settings}
      thumbnailSize={this.props.thumbnailSize}
      scrollSpeed={this.state.scrollSpeed}
    />
  );

  renderGroup = group => (
    <React.Fragment key={group.date}>
      <GroupHeader
        settings={this.settings}
        group={group}
        activeTileUrl={this.state.activeTileUrl}
      />
      {group.items.map(item => this.renderTile(item))}
    </React.Fragment>
  );

  renderFlat = item => this.renderTile(item);

  render() {
    return (
      <div className={styles.output} ref={this.containerRef}>
        {this.state.renderedItems.map(item => {
          if (this.settings.groupByDate) {
            return this.renderGroup(item);
          } else {
            return this.renderFlat(item);
          }
        })}
      </div>
    );
  }
}

Pig.defaultProps = {
  useLqip: true,
  primaryImageBufferHeight: 2500,
  secondaryImageBufferHeight: 100,
  expandedSize: 1000,
  thumbnailSize: 20, // Height in px. Keeping it low seeing as it gets blurred anyway with a css filter
  // settings specific to groups
  groupByDate: false,
  breakpoint: 800,
  groupGapSm: 50,
  groupGapLg: 50,
  gridGap: 8,
  bgColor: "#fff"
};

Pig.propTypes = {
  imageData: PropTypes.array.isRequired,
  useLqip: PropTypes.bool,
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
  thumbnailSize: PropTypes.number
};
