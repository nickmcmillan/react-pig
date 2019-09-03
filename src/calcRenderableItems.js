export default function ({
  containerOffsetTop,
  scrollDirection,
  settings,
  latestYOffset,
  imageData,
  windowHeight,
}) {
  // Get the top and bottom buffers heights  
  const bufferTop = (scrollDirection === 'up') ? settings.primaryImageBufferHeight : settings.secondaryImageBufferHeight
  const bufferBottom = (scrollDirection === 'down') ? settings.primaryImageBufferHeight : settings.secondaryImageBufferHeight

  // Now we compute the location of the top and bottom buffers
  // that is the top of the top buffer. If the bottom of an image is above that line, it will be removed.
  const minTranslateYPlusHeight = latestYOffset - containerOffsetTop - bufferTop

  // that is the bottom of the bottom buffer.  If the top of an image is
  // below that line, it will be removed.
  const maxTranslateY = latestYOffset + windowHeight + bufferBottom

  if (settings.groupByDate) {
    // Here, we loop over every image, determine if it is inside our buffers
    const arrOfGroups = []
    imageData.forEach(g => {
      const filteredInGroup = g.items.filter(img => {

        if (img.style.translateY + img.style.height < minTranslateYPlusHeight || img.style.translateY > maxTranslateY) {
          return false
        } else {
          return true
        }
      })

      // if the group has no items within it, don't render the group at all
      if (!filteredInGroup.length) return

      arrOfGroups.push({
        items: filteredInGroup,
        date: g.date,
        location: g.location,
        groupTranslateY: g.groupTranslateY,
        height: g.height,
      })
    })

    return arrOfGroups
  } else {
    return imageData.filter(img => {
      if (img.style.translateY + img.style.height < minTranslateYPlusHeight || img.style.translateY > maxTranslateY) {
        return false
      } else {
        return true
      }
    })
  }

}
