const os = require('os')
const path = require('path')
const binaries = require('./common');

const platform = os.platform()
const arch = os.arch()

let ffmpegPath = null

if (binaries[platform] || binaries[platform].indexOf(arch) > -1) {
  ffmpegPath = path.join(
    __dirname,
    'bin/'+ platform + '/' + binaries[platform][binaries[platform].indexOf(arch)]+ '/',
    platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  )
}

module.exports = ffmpegPath
