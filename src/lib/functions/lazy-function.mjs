import NetlifyFunction from './netlify-function.mjs'

export default class LazyNetlifyFunction extends NetlifyFunction {
  constructor({
    config,
    directory,
    displayName,
    mainFile,
    name,
    onBuild,
    onPrebuild,
    projectRoot,
    runtime,
    settings,
    timeoutBackground,
    timeoutSynchronous,
  }) {
    super({
      config,
      directory,
      displayName,
      mainFile,
      name,
      projectRoot,
      runtime,
      settings,
      timeoutBackground,
      timeoutSynchronous,
    })

    this.markedForBuild = false
    this.onPrebuild = onPrebuild
    this.onBuild = onBuild
    this.firstLoad = true
  }

  async build({ cache }) {
    this.markedForBuild = false
    const { firstLoad } = this
    this.firstLoad = false
    this.onPrebuild({ func: this, firstLoad })
    const { error, includedFiles, srcFilesDiff } = await super.build({ cache })
    await this.onBuild({ func: this, firstLoad, error, includedFiles, srcFilesDiff })
    return { error, includedFiles, srcFilesDiff }
  }

  markForBuild({ cache }) {
    this.markedForBuild = true
    this.cache = cache
  }

  async getBuildData() {
    await this.build({ cache: this.cache })

    return await super.getBuildData()
  }

  async invoke(event, context) {
    if (this.markedForBuild) {
      await this.build({ cache: this.cache })
    }

    return await super.invoke(event, context)
  }

  async matchURLPath(rawPath, method) {
    if (this.markedForBuild) {
      await this.build({ cache: this.cache })
    }

    return await super.matchURLPath(rawPath, method)
  }
}
