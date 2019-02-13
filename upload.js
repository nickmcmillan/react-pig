require('dotenv').config()

const localImgFolder = './imgs/'
const outputJSONPath = './src/imageData.json'

const cloudinary = require('cloudinary')
const fs = require('fs')

const cloud_name = process.env.cloud_name
const api_key = process.env.api_key
const api_secret = process.env.api_secret
const cloudinaryFolder = process.env.cloudinaryFolder // the Cloudinary folder to upload to
const cloudinaryUploadFileSizeLimit = 10485760 // Cloudinary's free plan rejects images larger than this value. 

cloudinary.config({ cloud_name, api_key, api_secret })

const uploadToCloudinary = (fileName, birthTime) => new Promise(async resolve => {

  const imgPath = `${localImgFolder}${fileName}`
  console.log('📷  Uploading', imgPath)

  await cloudinary.v2.uploader.upload(imgPath, {
    colors: true,
    exif: true,
    image_metadata: true,
   // overwrite: true,
    folder: cloudinaryFolder,
    context: { birthTime: birthTime.toString() },
    transformation: [
      { width: 1920, height: 1920, crop: "limit" },
    ],
    eager: [
      { width: 1920, height: 1920, crop: "limit" },
    ]
  }, function (err, result) {
    if (err) {
      // not going to throw, because we don't want to stop the upload loop.
      // should probably wrap this in a try/catch
      resolve({err})
    }
    resolve(result)
  })
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
  console.log('🐕 ', files.length, 'files found')
  const output = []

  // loop through each file found
  for (const file of files) {

    if (file.includes('.DS_Store')) continue

    // cloudinary doesnt store birthTime data, but we need this. Its useful to know when an image was created.
    const { size, birthtime: birthTime } = await getFileData(localImgFolder + file)

    if (size > cloudinaryUploadFileSizeLimit) {
      console.warn(`❌  ${file} exceeds Cloudinary's upload limit:`, cloudinaryUploadFileSizeLimit, 'Skipping file')
      continue
    }

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
      birthTime,
      dominantColor: uploadedFileData.colors[0][0],
      url,
      width: file.width,
      height: file.height,
      aspectRatio: parseFloat((width / height).toFixed(3), 10), // limit to 3 decimal places
      // add exif if you need it
      // exif: {
      //   ExposureTime,
      //   ApertureValue,
      //   ISO,
      // },
    }
    output.push(fileData)
  }

  fs.writeFile(outputJSONPath, JSON.stringify(output), 'utf8', () => {
    console.log('🎉  Done! Generated JSON file', outputJSONPath)
  })
})
