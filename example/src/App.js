import React, { Component } from 'react'
import Pig from 'pig-react'
import imageData from './grouped.json'

class App extends Component {
  render() {
    return (
      <div className="container">
        <Pig
          imageData={imageData}
          gridGap={10}
        />

      </div>
    )
  }
}

export default App