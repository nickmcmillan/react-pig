const argv = require('minimist')(process.argv.slice(2))
const jsonfile = require('jsonfile')
const fs = require('fs')

const groupByDate = require('./src/utils/groupByDate')
const sortByDate = require('./src/utils/sortByDate')

const inputJSON = argv.in
const outputJSON = argv.out

if (!inputJSON) throw new Error('Missing --in arg')
if (!outputJSON) throw new Error('Missing --out arg')

jsonfile.readFile(inputJSON, function (err, obj) {
  if (err) throw new Error(err)
  
  obj = sortByDate(obj)
  obj = groupByDate(obj)

  fs.writeFile(outputJSON, JSON.stringify(obj), 'utf8', () => {
    console.log(`🎉  Done! Generated JSON file ${outputJSON}`)
  })
  
})