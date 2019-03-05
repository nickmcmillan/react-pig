import React from 'react'
import Pig from 'pig-react'
import imageData from './imageData.json'

const App = () => (
  <main className="main">
    <Pig
      imageData={imageData}
      gridGap={8}
      bgColor="hsla(211, 50%, 98%)"

      groupGapLg={50}
      groupGapSm={20}
      breakpoint={800}
      // sortByDate
      groupByDate
    />
  </main>
)

export default App
