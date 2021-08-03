import { program } from 'commander'
import { textSync } from 'figlet'
import execa = require('execa')
import semver = require('semver')
import ora = require('ora')
import chalk = require('chalk')
import path = require('path')
import fs = require('fs')
import os = require('os')
import { DeployPlugin } from '@winex-proxy-cli/cli-plugin-deploy'
import config from './config/index'
const pkg = require('../package.json')

export class CLI {

  async start() {
    await this.checkUpdate()
    this.handleVersion()
    this.loadPlugin()
  }

  async checkUpdate() {
    const now = Date.now()
    const updateLog = path.join(os.tmpdir(), 'winex-proxy-cli-update.log')
    if (fs.existsSync(updateLog)) {
      const logTime = +fs.readFileSync(updateLog).toString()
      // 24小时内仅执行一次
      if (now - logTime < 24 * 3600000) return
    }
    fs.writeFileSync(updateLog, `${now}`)
    const spinner = ora('check lastest version').start()
    try {
      const { stdout } = await execa('npm',
        [`--registry=${config.registry}`, 'view', '@winex-proxy-cli/cli', 'dist-tags', '--json']
      )
      const latestVersion = JSON.parse(stdout)['latest']
      const curVersion = pkg.version
      if (semver.gt(latestVersion, curVersion)) {
        spinner.succeed('find lastest version')
        console.log()
        console.log('--------------------------------------------------------------------')
        console.log(chalk.yellow(`                     lastest version：${latestVersion}`))
        console.log(chalk.yellow('                   npm i @winex-proxy-cli/cli -g'))
        console.log('--------------------------------------------------------------------')
        console.log()
      } else {
        spinner.succeed('current version is already lastest')
      }
    } catch (error) {
      spinner.fail('check lastest version fail')
      console.error('check lastest version fail', error)
    }
  }

  handleVersion() {
    const str = `${textSync('WINEX', {
      font: 'Univers'
    })}\n-------------------------------V${pkg.version}-------------------------------`
    program.version(str, '-v, --version')
  }

  loadPlugin() {
    new DeployPlugin(program)
      .init()
    program.parse(process.argv)
  }

}
