import React, { Component } from "react";
import Pig from "pig-react";
import imageData from "./imageData.json";

export default class SelectablePig extends Component {
  constructor(props) {
    super(props)
    this.imageData = imageData
    this.state = {
      selectedItems: []
    }
  }

  handleSelection = item => {
    let newSelectedItems = this.state.selectedItems;
    if (newSelectedItems.find(selectedItem => selectedItem.id === item.id)) {
      newSelectedItems = newSelectedItems.filter(value => value.id !== item.id)
    } else {
      newSelectedItems = newSelectedItems.concat(item)
    }
    this.setState({ selectedItems: newSelectedItems })
  };

  handleSelections = items => {
    let newSelectedItems = this.state.selectedItems;
    items.forEach(item => {
      if (newSelectedItems.find(selectedItem => selectedItem.id === item.id)) {
        newSelectedItems = newSelectedItems.filter(value => value.id !== item.id)
      } else {
        newSelectedItems = newSelectedItems.concat(item)
      }
    });
    this.setState({ selectedItems: newSelectedItems })
  };

  handleClick = (event, item) => {
    //if an image is selectabel, then handle shift click
    if (event.shiftKey) {
      let lastSelectedElement = this.state.selectedItems.slice(-1)[0]
      if (lastSelectedElement === undefined) {
        this.handleSelection(item)
        return;
      }
      let indexOfCurrentlySelectedItem = this.imageData.findIndex(image => image.id === item.id)
      let indexOfLastSelectedItem = this.imageData.findIndex(image =>  image.id === lastSelectedElement.id)
      if (indexOfCurrentlySelectedItem > indexOfLastSelectedItem) {
        this.handleSelections(
          this.imageData.slice(
            indexOfLastSelectedItem + 1,
            indexOfCurrentlySelectedItem + 1
          )
        );
        return;
      } else {
        this.handleSelections(
          this.imageData.slice(
            indexOfCurrentlySelectedItem,
            indexOfLastSelectedItem
          )
        )
        return
      }
    }
    // if an image is already selected, then we are in selection mode
    if (this.state.selectedItems.length > 0) {
      this.handleSelection(item)
      return
    }

    // if an image is already the width of the container, don't expand it on click
    if (item.style.width >= this.containerWidth) {
      this.setState({ activeTileUrl: null })
      return
    }

    this.setState({
      // if Tile is already active, deactivate it
      activeTileUrl: item.url !== this.state.activeTileUrl ? item.url : null
    })
  }

  render() {
    return (
      <Pig
        imageData={imageData}
        gridGap={8}
        bgColor="hsla(211, 50%, 98%)"
        groupGapLg={50}
        groupGapSm={20}
        breakpoint={800}
        handleClick={this.handleClick}
        selectable={true}
        selectedItems={this.state.selectedItems}
        handleSelection={this.handleSelection}
      />
    )
  }
}
