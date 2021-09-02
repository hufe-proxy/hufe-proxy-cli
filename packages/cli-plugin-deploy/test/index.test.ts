import * as path from "path"
import { DeployPlugin } from "../src"

describe("/cli/test/index.test.ts", () => {

  it("getProjectName", async () => {
    const deployInstance = new DeployPlugin(null)
    const cwd = path.resolve(__dirname, './fixtures')
    const res = deployInstance.getProjectName(cwd)
    expect(res).toBe('proxy')
  })

})
