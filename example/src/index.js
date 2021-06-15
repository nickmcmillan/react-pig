import React from 'react'
import ReactDOM from 'react-dom'
import Pig from 'pig-react'
import SelectablePig from './SelectablePig'
import imageData from './imageData.json'

import './base.css'

ReactDOM.render(
  <main className="main">
    {
      // <SelectablePig/>
    }
    <Pig
      imageData={imageData}
      gridGap={8}
      bgColor="hsla(211, 50%, 98%)"
      groupGapLg={50}
      groupGapSm={20}
      selectable={true}
      breakpoint={800}
      // sortByDate
      // groupByDate
    />
  </main>
, document.getElementById('root'))
