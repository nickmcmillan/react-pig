/* eslint camelcase: 0 */

require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2))
const cloudinary = require('cloudinary')
const fs = require('fs')
const _cliProgress = require('cli-progress')
const recursive = require("recursive-readdir");

// node upload.js --in=./imgs/ --out=./imageData.json --cloudinaryFolder=whatever
const localImgFolder = argv.in
const outputJSONFileName = argv.out || './imageData.json'
const cloudinaryFolder = argv.cloudinaryFolder || ''
// const author = argv.a || ''

if (!localImgFolder) throw new Error('Missing --in arg')

const cloud_name = process.env.cloud_name
const api_key = process.env.api_key
const api_secret = process.env.api_secret
const cloudinaryUploadFileSizeLimit = 10485760 // Cloudinary's free plan rejects images larger than this

cloudinary.config({ cloud_name, api_key, api_secret })

const uploadToCloudinary = (fileName, { location, date, birthTime }) => new Promise(async (resolve, reject) => {
  // Cloudinary only allows strings in its context
  location = location ? location.toString() : ''
  date = date ? date.toString() : ''
  birthTime = birthTime ? birthTime.toString() : ''

  try {
    await cloudinary.v2.uploader.upload(fileName, {
      colors: true,
      exif: true,
      image_metadata: true,
      overwrite: true,
      folder: cloudinaryFolder,
      // context is cloudinary's way of storing meta data about an image
      context: {
        // author,
        location,
        date,
        birthTime,
      },
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' },
      ],
      eager: [
        { width: 1920, height: 1920, crop: 'limit' },
      ]
    }, function (err, result) {
      if (err) {
        reject(err)
      }
      resolve(result)
    })
  } catch (err) {
    reject(err)
  }
})

const getFileData = fileName => new Promise(async resolve => {
  await fs.stat(fileName, (err, stats) => {
    if (err) throw new Error(err)
    resolve(stats)
  })
})

// read the localImgFolder
recursive(localImgFolder, async (err, files) => {
  if (err) throw new Error(err)

  // we are only interested in the following file formats
  const filteredFiles = files.filter(file => {
    const fileToLowerCase = file.toLowerCase()
    if (fileToLowerCase.includes('.png')) return true
    if (fileToLowerCase.includes('.jpg')) return true
    if (fileToLowerCase.includes('.jpeg')) return true
    if (fileToLowerCase.includes('.gif')) return true
    return false
  })

  console.log(`🐕  ${filteredFiles.length} images found in ${localImgFolder} and its subfolders`)
  
  const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic)
  let progressBarVal = 0
  progressBar.start(filteredFiles.length, progressBarVal)

  const output = []
  const failedImgs = []

  // loop through each image found
  for (const file of filteredFiles) {

    progressBarVal += 1
    progressBar.update(progressBarVal)
    // cloudinary doesnt store birthTime data, but we need this. Its useful to know when an image was created.
    const { size, birthtime: birthTime } = await getFileData(file)

    if (size > cloudinaryUploadFileSizeLimit) {
      console.warn(`❌  ${file} exceeds Cloudinary's upload limit:`, cloudinaryUploadFileSizeLimit, 'Skipping file')
      failedImgs.push({
        file,
        reason: 'Exceeded filesize limit'
      })
      continue
    }

    try {
      // Possible folder name formats;
      // ./ (image in root folder)
      // 25 March 2016
      // Amsterdam - Oud-West - Jacob van Lennepstraat, 18 February 2019
      // Beirut, Beirut - Younas Gebayli Street, 13 October 2017
      // We always know the portion after the last comma is the date
      // And everything before that is the address
      const folderName = file.split('/')[1]
      const breakChar = folderName.lastIndexOf(',')
      
      // if the file is in the root on the source folder, set location and date to empty strings.
      const isRoot = file.split('/').length === 2
      const location = !isRoot ? folderName.substring(0, breakChar) : null
      const date = !isRoot ? folderName.substring(breakChar + 1).trim() : null
      
      // this uploads the file and returns all of its juicy metadata
      const uploadedFileData = await uploadToCloudinary(file, { location, date, birthTime })

      if (uploadedFileData.err) {
        console.warn('❌  Error from Cloudinary. Skipping file:', err)
        continue
      }

      const {
        width,
        height,
        version,
        public_id,
        format,
        image_metadata,
      } = uploadedFileData

      const {
        ExposureTime,
        ApertureValue,
        ISO,
      } = image_metadata

      // we need to construct a URL that looks like this example;
      // http://res.cloudinary.com/dzroyrypi/image/upload/h_{{HEIGHT}}/v1549624762/europe/DSCF0310.jpg'
      // the {{HEIGHT}} is replaced by pig when dyanmically loading different image resolutions
      const url = `https://res.cloudinary.com/${cloud_name}/image/upload/h_{{HEIGHT}}/v${version}/${public_id}.${format}`

      const fileData = {
        id: public_id.split('/')[1],
        // author,
        dominantColor: uploadedFileData.colors[0][0],
        url,
        location,
        date,
        birthTime,
        aspectRatio: parseFloat((width / height).toFixed(3), 10), // limit to 3 decimal places
        // add exif if you need it
        // exif: {
        //   ExposureTime,
        //   ApertureValue,
        //   ISO,
        // },
      }

      output.push(fileData)

    } catch (err) {
      console.warn('❌  Oh dear:', err)
      failedImgs.push({
        file,
        reason: err
      })
    }
  }

  progressBar.stop()

  fs.writeFile(outputJSONFileName, JSON.stringify(output), 'utf8', () => {
    console.log('🎉  Done! Generated JSON file', outputJSONFileName)
  })

  if (failedImgs.length) {
    fs.writeFile(`${outputJSONFileName}-failed.json`, JSON.stringify(failedImgs), 'utf8', () => {
      console.log('Generated JSON file of failed uploads', `${outputJSONFileName}-failed.json`)
    })
  }
})
