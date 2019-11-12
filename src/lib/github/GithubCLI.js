import { exec } from 'child_process'
import fs from 'fs-extra'
import util from 'util'
import os from 'os'
import path from 'path'
import commandExists from 'command-exists'
import PropsEditor from '../properties/propsEditor'

const fsAccess = util.promisify(fs.access)
const fsMkdTemp = util.promisify(fs.mkdtemp)
const fsRemove = util.promisify(fs.remove)

const GITHUB_ORG = 'urbancode'
const GITHUB_DOMAIN = 'github01.hclpnp.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export default class GithubCLI {
  async init() {
    await this.checkPrerequisites()
    this.workDir = await fsMkdTemp(path.join(os.tmpdir(), 'plugin-updater-'))
    console.log('Working directory: ' + this.workDir)
  }

  async cleanup() {
    if (this.workDir) {
      console.log(`Removing temporary working directory: ${this.workDir}`)
      await fsRemove(this.workDir)
    }
  }

  async checkPrerequisites() {
    if (!GITHUB_TOKEN) {
      throw 'You must set the GITHUB_TOKEN environment variable with a GitHub personal access token.'
    }
    try {
      await commandExists('git')
    } catch(error) {
      throw 'Git is not installed on the system, please install it before continuing.'
    }
    try {
      await commandExists('hub')
    } catch(error) {
      throw 'Hub is not installed on the system, please install it before continuing.'
    }
  }

  async updatePluginPackage(repoName, updatesObject, branchName, commitMessage) {
    const repoUrl = `https://${GITHUB_TOKEN}@${GITHUB_DOMAIN}/${GITHUB_ORG}/${repoName}.git`
    await this.execute(`git clone ${repoUrl}`)
    const repoDir = path.join(this.workDir, repoName)

    const packageFilePath = path.resolve(repoDir, 'package.json')
    let packageExists = true
    try {
      await fsAccess(packageFilePath)
    } catch(error) {
      packageExists = false
      console.log(`[Warning] package.json file does not exist for ${repoName} so it will not be updated.`)
    }

    if (packageExists) {
      console.log(`Updating package.json fields for ${repoName}.`)
      await PropsEditor.replacePackageContent(packageFilePath, updatesObject)

      if ((updatesObject.dependencies && Object.keys(updatesObject.dependencies).length > 0)
        || (updatesObject.devDependencies && Object.keys(updatesObject.devDependencies).length > 0))
      {
        console.log('Dependencies have been modified, running npm install to update lock file.')
        await this.execute('npm install', { cwd: repoDir })
      }

      await this.execute(`git checkout -b ${branchName}`, { cwd: repoDir })
      await this.execute('git add .', { cwd: repoDir })
      await this.execute(`git commit -m '${commitMessage}'`, { cwd: repoDir })
      await this.execute(`git push --set-upstream origin ${branchName}`, { cwd: repoDir })
      await this.execute(`hub pull-request -m '${commitMessage}'`, { cwd: repoDir })
    }

    console.log('\n')
  }

  async execute(command, options = { cwd: this.workDir }) {
    console.log(`Running command '${command}' in directory '${options.cwd}'.`)
    return new Promise((resolve, reject) => {
      let proc = exec(command,
        options,
        (error, stdout, stderr) => {
        if (error) {
          reject(stderr)
        } else {
          resolve(stdout)
        }
      })
      proc.stdout.on('data', (data) => {
        console.log(data)
      })
      proc.stderr.on('data', (data) => {
        console.error(data)
      })
    })
  }
}