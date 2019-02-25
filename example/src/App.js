import React, { Component } from 'react'
import Pig from 'pig-react'
import imageData from './imageData.json'

class App extends Component {
  render() {
    return (
      <div className="container">
        <Pig
          imageData={imageData}
          gridGap={10}
          bgColor="#f8faff"
          groupGapLg={50}
          groupGapSm={20}
          breakpoint={800}
          sortByDate
          groupByDate
        />
      </div>
    )
  }
}

export default App