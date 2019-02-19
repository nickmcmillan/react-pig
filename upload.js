/* eslint camelcase: 0 */

require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2))
const cloudinary = require('cloudinary')
const fs = require('fs')

const localImgFolder = argv.in
const outputJSONFileName = argv.out
const cloudinaryFolder = argv.cloudfolder || ''
// const author = argv.a || ''

if (!localImgFolder) throw new Error('Missing -in arg')
if (!outputJSONFileName) throw new Error('Missing -out arg')

const cloud_name = process.env.cloud_name
const api_key = process.env.api_key
const api_secret = process.env.api_secret
const cloudinaryUploadFileSizeLimit = 10485760 // Cloudinary's free plan rejects images larger than this

cloudinary.config({ cloud_name, api_key, api_secret })

const uploadToCloudinary = (fileName, birthTime) => new Promise(async (resolve, reject) => {
  const imgPath = `${localImgFolder}${fileName}`
  console.log('📷  Uploading', imgPath)

  try {
    await cloudinary.v2.uploader.upload(imgPath, {
      colors: true,
      exif: true,
      image_metadata: true,
      overwrite: true,
      folder: cloudinaryFolder,
      // context is cloudinary's way of storing meta data about an image
      context: {
        // author,
        birthTime: birthTime.toString()
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
fs.readdir(localImgFolder, async (err, files) => {
  if (err) throw new Error(err)

  // we are only interested in the following file formats
  const filteredFiles = files.filter(file => {
    const fileToLowerCase = file.toLowerCase()
    if (fileToLowerCase.includes('.png')) return true
    if (fileToLowerCase.includes('.jpg')) return true
    if (fileToLowerCase.includes('.gif')) return true
    return false
  })

  console.log('🐕 ', filteredFiles.length, 'images found')

  const output = []
  const failedImgs = []

  // loop through each image found
  for (const file of filteredFiles) {
    // cloudinary doesnt store birthTime data, but we need this. Its useful to know when an image was created.
    const { size, birthtime: birthTime } = await getFileData(localImgFolder + file)

    if (size > cloudinaryUploadFileSizeLimit) {
      console.warn(`❌  ${file} exceeds Cloudinary's upload limit:`, cloudinaryUploadFileSizeLimit, 'Skipping file')
      failedImgs.push({
        file,
        reason: 'Exceeded filesize limit'
      })
      continue
    }

    try {
      // this uploads the file and returns all of its juicy metadata
      const uploadedFileData = await uploadToCloudinary(file, birthTime)

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
      const url = `http://res.cloudinary.com/${cloud_name}/image/upload/h_{{HEIGHT}}/v${version}/${public_id}.${format}`

      const fileData = {
        id: public_id,
        birthTime,
        author,
        dominantColor: uploadedFileData.colors[0][0],
        url,
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
      continue
    }
  }

  fs.writeFile(outputJSONFileName, JSON.stringify(output), 'utf8', () => {
    console.log('🎉  Done! Generated JSON file', outputJSONFileName)
  })

  if (failedImgs.length) {
    fs.writeFile(`${outputJSONFileName}-failed.json`, JSON.stringify(failedImgs), 'utf8', () => {
      console.log('Generated JSON file of failed uploads', `${outputJSONFileName}-failed.json`)
    })
  }
})
