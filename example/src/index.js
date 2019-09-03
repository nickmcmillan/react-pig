import React from 'react'
import ReactDOM from 'react-dom'
import Pig from 'react-pig'
import imageData from './imageData.json'

import './base.css'

ReactDOM.render(
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
, document.getElementById('root'))
