import React, { Component } from 'react'
import Pig from 'pig-react'
import imageData from './grouped.json'
// import imageData from './2017.json'

class App extends Component {
  render() {
    return (
      <div className="container">
        <Pig
          imageData={imageData}
          gridGap={10}
          groupGapLg={50}
          groupGapSm={20}
          breakpoint={800}
        />

      </div>
    )
  }
}

export default App