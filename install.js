'use strict'

var fs = require("fs");
var ProgressBar = require("progress");
var get = require("simple-get");
var pkg = require("./package");
var binaries = require('./common');
var path = require('path');

var ffmpegPath = './bin';
const exitOnError = (err) => {
  console.error(err)
  process.exit(1)
}
const exitOnErrorOrWarnWith = (msg) => (err) => {
  if (err.statusCode === 404) console.warn(msg)
  else exitOnError(err)
}

if (!ffmpegPath) {
  exitOnError('ffmpeg-static install failed: No binary found for architecture')
}

const noop = () => {}
function downloadFile(url, destinationPath, progressCallback = noop) {
  let fulfill, reject;
  let totalBytes = 0;

  const promise = new Promise((x, y) => {
    fulfill = x;
    reject = y;
  });

  get(url, function(err, response) {
    if (err || response.statusCode !== 200) {
      err = err || new Error('Download failed.')
      if (response) {
        err.url = url
        err.statusCode = response.statusCode
      }
      reject(err)
      return;
    }

    const file = fs.createWriteStream(destinationPath);
    file.on("finish", () => fulfill());
    file.on("error", error => reject(error));
    response.pipe(file);

    totalBytes = parseInt(response.headers["content-length"], 10);

    if (progressCallback) {
      response.on("data", function(chunk) {
        progressCallback(chunk.length, totalBytes);
      });
    }
  });

  return promise;
}

let progressBar = null;
function onProgress(deltaBytes, totalBytes) {
  if (!progressBar) {
    progressBar = new ProgressBar(`Downloading ffmpeg [:bar] :percent :etas `, {
      complete: "|",
      incomplete: " ",
      width: 20,
      total: totalBytes
    });
  }

  progressBar.tick(deltaBytes);
}

const release = (
  process.env.FFMPEG_BINARY_RELEASE ||
  pkg['ffmpeg-static'].binary_release
)

for(var platform in binaries) {
  if(binaries.hasOwnProperty(platform)){
    for(var osArchIndex in binaries[platform]){
      const osArch = binaries[platform][osArchIndex];
      const ffmpegArchPath = path.join(ffmpegPath, `${platform}/${osArch}`)
      fs.mkdirSync(ffmpegArchPath, {recursive: true});
      let downloadUrl = `https://github.com/hivestreaming/ffmpeg-static/releases/download/${release}/${platform}-${osArch}`
      let ffmpegFilePath = `${ffmpegArchPath}/ffmpeg`;
      if(platform === 'win32') {
        downloadUrl+='.exe';
        ffmpegFilePath+='.exe'
      }
      downloadFile(downloadUrl, ffmpegFilePath, onProgress)
      .then(() => {
        fs.chmodSync(ffmpegFilePath, 0o755) // make executable
      })
      .catch(exitOnError)
    }

  }
}

// const readmeUrl = `${downloadUrl}.README`
// const licenseUrl = `${downloadUrl}.LICENSE`
// downloadFile(readmeUrl, `${ffmpegPath}.README`)
// .catch(exitOnErrorOrWarnWith('Failed to download the ffmpeg README.'))

// downloadFile(licenseUrl, `${ffmpegPath}.LICENSE`)
// .catch(exitOnErrorOrWarnWith('Failed to download the ffmpeg LICENSE.'))
