import React, { Component } from 'react'
import Pig from 'pig-react'
import imageData from './imageData.json'

class App extends Component {
  render() {
    return (
      <Pig
        imageData={imageData}
        gridGap={10}
        urlGenerator={(url, pxHeight) => {
          // Pig calls this function every time it needs to fetch an image,
          // providing its required image height in pixels.
          // This gives you flexibility to define what the url looks like
          // to suit the url scheme of your image hosting provider

          // http://res.cloudinary.com/dzroyrypi/image/upload/h_{{HEIGHT}}/v1549797282/mcfrench/wiiuksdwju4rwrsz63i4.jpg
          return url.replace('{{HEIGHT}}', pxHeight)
        }}
      />
    )
  }
}

export default App