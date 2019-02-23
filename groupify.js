const argv = require('minimist')(process.argv.slice(2))
const jsonfile = require('jsonfile')
const fs = require('fs')

const inputJSON = argv.in
const outputJSON = argv.out

if (!inputJSON) throw new Error('Missing --in arg')
if (!outputJSON) throw new Error('Missing --out arg')

  // {
  //   "id": "mu4csaiouofwjzby0tdx",
  //   "dominantColor": "#3C3634",
  //   "url": "...",
  //   "location": "Zürich - Lindenhof - Zürich",
  //   "date": "29 December 2018",
  //   "birthTime": "2019-02-22T08:23:03.853Z",
  //   "aspectRatio": 1.774
  // },

jsonfile.readFile(inputJSON, function (err, obj) {
  if (err) console.error(err)
  
  // sort
  const sortedByDate = obj.sort((a, b) => {
    if (!a.date) return 1 // if the data doesnt have a date, put it last
    return new Date(b.date) - new Date(a.date)
  })
  
  // group into month--year
  // this gives an object with dates as keys
  const groups = sortedByDate.reduce((groups, item) => {
    let formattedDate = ''

    const date = new Date(item.date)
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.toLocaleDateString('en-US', { year: 'numeric' })

    formattedDate = `${month} ${year}`

    if (!item.date) formattedDate = 'No date'

    // const groupName = item.location

    if (!groups[formattedDate]) {
      groups[formattedDate] = [];
    }
    groups[formattedDate].push(item)
    return groups;
  }, {});

  fs.writeFile(outputJSON, JSON.stringify(groups), 'utf8', () => {
    console.log(`🎉  Done! Generated JSON file ${outputJSON}`)
  })
  
})
