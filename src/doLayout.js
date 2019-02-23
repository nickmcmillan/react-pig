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

  // Here, we loop over every image, determine if it is inside our buffers or
  // no, and either insert it or remove it appropriately.
  return imageData.filter(img => {
    if (img.style.translateY + img.style.height < minTranslateYPlusHeight || img.style.translateY > maxTranslateY) {
      return false
    } else {
      return true
    }
  })
}
