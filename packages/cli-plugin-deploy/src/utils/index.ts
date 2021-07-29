import { IZipFiles } from '../interface/zipFiles'

const fs = require('fs')
const path = require('path')

export function getZipFiles(dir: string): IZipFiles[] {
  const formatDir = path.normalize(`${dir}/`)
  const files: IZipFiles[] = []
  function readFile(src: string) {
    fs.readdirSync(src)
      .forEach((item: string) => {
        const itemPath = path.join(src, item)
        const stats = fs.statSync(itemPath)
        if (stats.isFile()) {
          files.push({
            dir: src.replace(formatDir, ''),
            url: itemPath
          })
        } else if (stats.isDirectory()) {
          readFile(itemPath)
        }
      })
  }
  readFile(formatDir)
  return files
}
