import { program } from 'commander'
import { textSync } from 'figlet'
import { DeployPlugin } from '@winex-proxy-cli/cli-plugin-deploy'
const pkg = require('../package.json')

export class CLI {

  async start() {
    this.handleVersion()
    this.loadPlugin()
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
