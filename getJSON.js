/* eslint camelcase: 0 */

require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2))
const cloudinary = require('cloudinary')
const fs = require('fs')

// const localImgFolder = argv.in
// const outputJSONFileName = argv.out
// const cloudinaryFolder = argv.cloudfolder || ''
// const author = argv.a || ''

// if (!localImgFolder) throw new Error('Missing -in arg')
// if (!outputJSONFileName) throw new Error('Missing -out arg')

const cloud_name = process.env.cloud_name
const api_key = process.env.api_key
const api_secret = process.env.api_secret

cloudinary.config({ cloud_name, api_key, api_secret })

const results = []

function listResources(next_cursor) {

  console.log('n', next_cursor)
  
  cloudinary.v2.api.resources({
    type: 'upload',
    prefix: 'mcfrench/',
    context: true,
    colors: true,
    image_metadata: true,
    next_cursor,
    max_results: 500,
  }, function (err, res) {
    if (err) throw new Error(err)

    results.push(...res.resources)

    if (res.next_cursor) {
      listResources(res.next_cursor)
    } else {
      console.log(results)

      const reshaped = results.map(item => {
        // const fileData = {
        //   id: item.public_id.split('/')[1],
        //   birthTime: item.context.custom.birthTime,
        //   author: item.context.custom.author,
        //   dominantColor: uploadedFileData.colors[0][0],
        //   url,
        //   aspectRatio: parseFloat((width / height).toFixed(3), 10), // limit to 3 decimal places
        //   // add exif if you need it
        //   // exif: {
        //   //   ExposureTime,
        //   //   ApertureValue,
        //   //   ISO,
        //   // },
        // }
      })
      fs.writeFile('outy.json', JSON.stringify(results), 'utf8', () => {
        console.log('🎉  Done! Generated JSON file')
      })
    }
  });

}

listResources()
