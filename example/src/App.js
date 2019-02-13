import React, { Component } from 'react'
import Pig from 'pig-react'
import imageData from './imageData.json'

class App extends Component {
  render() {
    return (
      <Pig
        imageData={imageData}
        gridGap={10}
      />
    )
  }
}

export default App