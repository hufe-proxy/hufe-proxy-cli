import { CLI } from "../src"

describe("/cli/test/index.test.ts", () => {

  it("checkUpdate", async () => {
    const cliInstance = new CLI()
    const res = await cliInstance.checkUpdate()
    expect(res).toBeUndefined()
  });

  it("handleVersion", () => {
    const cliInstance = new CLI()
    expect(cliInstance.handleVersion()).toBeUndefined()
  })

})
