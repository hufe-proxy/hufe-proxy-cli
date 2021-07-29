import { Option, Command } from 'commander'
import ora = require('ora')
import execa = require('execa')
import AdmZip = require('adm-zip')
import fs = require('fs')
import os = require('os')
import FormData = require('form-data');
import { BUILD } from './constant'
import { IOptions } from './interface/option'
import { getZipFiles } from './utils'
import axios from 'axios'
import config from './config/index'
export class DeployPlugin {

  program: Command
  options: IOptions

  constructor(program: Command) {
    this.program = program
  }

  init() {
    try {
      // 注册命令
      this.program.command('deploy')
        .addOption(
          new Option('-s, --skip [features...]', 'skip some features')
            .choices(['build'])
            .default([], 'no choice')
        )
        .requiredOption('-m, --mark <mark>', 'write mark')
        .description('deploy project, example: wp deploy -s build -m test')
        .action(this.action.bind(this))
    } catch (error) {
      console.error('winex-proxy-cli: ', error)
    }
  }

  async action(options: IOptions) {
    this.options = options
    try {
      // 执行打包
      if (!options.skip.includes(BUILD)) {
        await this.buildProject()
      }
      // 压缩包
      const zipBuffer = await this.zipProject()
      // 获取项目名称
      const projectName = this.getProjectName()
      // 上传压缩包
      const rules = await this.uploadZipProject(zipBuffer, projectName)
      // 验证代理工具
      await this.verifyProxyTool()
      // 注入脚本
      await this.injectProxyScript(rules)
    } catch (error) {
      console.error('winex-proxy-cli: ', error)
    }
  }

  async buildProject() {
    const spinner = ora('build project').start()
    try {
      await execa('npm', ['run', 'build'])
      spinner.succeed('build project success')
    } catch (error) {
      spinner.fail('build project fail')
      throw error
    }
  }

  async zipProject(): Promise<Buffer> {
    const spinner = ora('starting zip project').start()
    try {
      // 检测有无dist包
      const cwd = process.cwd()
      const isExist = fs.existsSync(`${cwd}/dist`)
      if (!isExist) {
        throw new Error('not found dist folder')
      }
      const zipFiles = getZipFiles(`${cwd}/dist`)
      const zip = new AdmZip()
      zipFiles.forEach(file => {
        zip.addLocalFile(file.url, `dist/${file.dir}`)
      })
      spinner.succeed('zip project success')
      return zip.toBuffer()
    } catch (error) {
      spinner.fail('zip project fail')
      throw error
    }
  }

  getProjectName(): string {
    const spinner = ora('get project name').start()
    try {
      const cwd = process.cwd()
      // vue.config.js publicPath
      const configUrl = `${cwd}/vue.config.js`
      if (fs.existsSync(configUrl)) {
        const data = fs.readFileSync(configUrl, 'utf-8')
        if (data) {
          let name = ''
          const reg = /publicPath.*:.*['"](.*)['"]/
          const execResult = reg.exec(data)
          if (execResult) {
            name = execResult[1].replace(/^\/|\/$/g, '')
          }
          if (name) {
            spinner.succeed(`get project name success (${name})`)
            return name
          }
        }
      }
      // package.json name
      const packageUrl = `${cwd}/package.json`
      if (fs.existsSync(packageUrl)) {
        const data = fs.readFileSync(packageUrl, 'utf-8')
        if (data) {
          const pkg = JSON.parse(data)
          if (pkg && pkg.name) {
            spinner.succeed(`get project name success (${pkg.name})`)
            return pkg.name
          }
        }
      }
      throw new Error('not found project name')
    } catch (error) {
      spinner.fail('not found project name')
      throw error
    }
  }

  async uploadZipProject(zipBuffer: Buffer, projectName: string) {
    const spinner = ora('upload zip project').start()
    try {
      const projectNameFormat = projectName.replace(/winning-|webui-/g, '')
      const form = new FormData()
      form.append('hostName', os.hostname())
      form.append('hostVersion', os.version())
      form.append('name', this.options.mark)
      form.append('projectName', projectNameFormat)
      form.append('attach', zipBuffer, 'dist.zip')
      const { data } = await axios.post(config.UPLOAD_URL, form, {
        headers: {
          ...form.getHeaders(),
          'X-TOKEN': config.TOKEN
        }
      })
      if (data.success) {
        spinner.succeed('upload zip project success')
        return data.data
      }
      throw data.errorDetail
    } catch (error) {
      spinner.fail('upload zip project fail')
      throw error
    }
  }

  async verifyProxyTool() {
    const spinner = ora('verify proxy tool').start()
    try {
      const { stdout } = await execa('w2', ['status'])
      if (stdout.includes('No Running')) {
        await execa('w2', ['start', '-p', config.WHISTLE_PORT])
      }
      spinner.succeed('verify proxy tool success')
    } catch (error) {
      spinner.fail('verify proxy tool fail')
      throw error
    }
  }

  async injectProxyScript(rules: string) {
    const spinner = ora('inject proxy script').start()
    try {
      const ruleText = `exports.name = 'winex-proxy-cli';exports.rules = \`${rules || 'NULL'
        }\`;`
      const rulePath = `${process.cwd()}/index.whistle.js`
      fs.writeFileSync(rulePath, ruleText, 'utf8')
      await execa('w2', ['add', '--force', rulePath])
      fs.unlinkSync(rulePath)
      spinner.succeed('inject proxy script success')
    } catch (error) {
      spinner.fail('inject proxy script fail')
      throw error
    }
  }

}
