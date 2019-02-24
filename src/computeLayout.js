// Need to minimise runs of this function. The goal is to run once on init, and only ever run again on window.resize
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

import getMinAspectRatio from './utils/getMinAspectRatio'



export default function ({
  imageData,
  settings,
  totalHeight,
  groupTitleHeight,
  wrapperWidth,
  group,
}) {

  // Compute the minimum aspect ratio that should be applied to the rows.
  const minAspectRatio = getMinAspectRatio(wrapperWidth)

  const tempGroupData = []
  let translateY = groupTitleHeight // The current translateY value that we are at

  imageData.forEach(g => {
    let groupHeight = 0
    let groupTranslateY = 0
    let row = []           // The list of images in the current row.
    let translateX = 0     // The current translateX value that we are at
    let rowAspectRatio = 0 // The aspect ratio of the row we are building

    // Loop through all our images, building them up into rows and computing
    // the working rowAspectRatio.
    const tempImgData = []

    g.items.forEach((image, index) => {
      if (index === 0) {
        groupTranslateY = translateY
      }
      row.push(image)

      // When the rowAspectRatio exceeeds the minimum acceptable aspect ratio,
      // or when we're out of images, we say that we have all the images we
      // need for that row, and compute the style values for each of these
      // images.
      rowAspectRatio += parseFloat(image.aspectRatio)
      if (rowAspectRatio >= minAspectRatio || index + 1 === g.items.length) {

        // Compute that row's height.
        let totalDesiredWidthOfImages = wrapperWidth - settings.gridGap * (row.length - 1)
        let rowHeight = totalDesiredWidthOfImages / rowAspectRatio

        // Handles cases where we don't have enough images to fill a row
        if (rowAspectRatio < minAspectRatio) {
          rowHeight = totalDesiredWidthOfImages / minAspectRatio
        }

        // For each image in the row, compute the width, height, translateX,
        // and translateY values, and set them (and the transition value we
        // found above) on each image.
        //
        // NOTE: that does not manipulate the DOM, rather it just sets the
        //       style values on the ProgressiveImage instance. The DOM nodes
        //       will be updated in doLayout.       

        row.forEach((img) => {
          const imageWidth = rowHeight * img.aspectRatio

          tempImgData.push({
            ...img,
            style: {
              width: parseFloat((imageWidth).toFixed(3), 10),
              height: parseFloat((rowHeight).toFixed(3), 10),
              translateX,
              translateY,
            }
          })

          // The next image is settings.gridGap pixels to the right of that image
          translateX += Math.round(imageWidth + settings.gridGap)
        })
        
        // Reset our state variables for next row.
        row = []
        rowAspectRatio = 0
        translateX = 0

        translateY += parseInt(rowHeight, 10) + settings.gridGap
        groupHeight += parseInt(rowHeight, 10) + settings.gridGap
      }
    })

    translateY += groupTitleHeight // create space between groups to insert the title

    tempGroupData.push({
      date: g.date,
      firstLocationInGroup: g.firstLocationInGroup,
      groupTranslateY,
      items: tempImgData,
      height: groupHeight,
    })
    
  })

  
  // No space below the last image
  totalHeight = translateY - settings.gridGap

  return {
    imageData: tempGroupData,
    newTotalHeight: totalHeight,
  }
}
