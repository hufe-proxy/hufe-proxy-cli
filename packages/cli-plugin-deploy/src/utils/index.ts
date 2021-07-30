import { IZipFiles } from '../interface/zipFiles'

import fs = require('fs')
import path = require('path')
import archiver = require('archiver')

export function getZipFiles(dir: string): IZipFiles[] {
  const formatDir = path.normalize(`${dir}/`)
  const files: IZipFiles[] = []
  function readFile(src: string) {
    fs.readdirSync(src)
      .forEach((name: string) => {
        const url = path.join(src, name)
        const stats = fs.statSync(url)
        if (stats.isFile()) {
          files.push({
            url,
            name,
            dir: src.replace(formatDir, ''),
          })
        } else if (stats.isDirectory()) {
          readFile(url)
        }
      })
  }
  readFile(formatDir)
  return files
}

export function getZipStream(src: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: {
        level: 9
      }
    })
    getZipFiles(src).forEach(file => {
      archive.append(fs.createReadStream(file.url), {
        name: 'dist/' + file.dir + '/' + file.name
      })
    })
    const chunks: Buffer[] = []
    let size = 0

    archive.on('data', (data: Buffer) => {
      chunks.push(data)
      size += chunks.length
    })

    archive.on('end', () => {
      resolve(Buffer.concat(chunks, size))
    })

    archive.on('error', (error) => {
      reject(error)
    })

    archive.finalize()
  })
}
