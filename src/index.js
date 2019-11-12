import GithubCLI from './lib/github/GithubCLI'
import path from 'path'
import fs from 'fs-extra'
import util from 'util'
import readlineSync from 'readline-sync'

const fsAccess = util.promisify(fs.access)
const fsReadFile = util.promisify(fs.readFile)

run().then(function() {
  console.log('Execution has completed.')
})
.catch(function(error) {
  console.error(error)
})

async function run() {
  const githubCli = new GithubCLI()
  try {
    await githubCli.init()

    const branch = await getInput('Please enter a name for the new Pull Request branch.\n')
    const commit = await getInput('Please enter a commit message.\n')

    const updatesFilePath = path.resolve(__dirname, '..', 'updates.json')
    try {
      await fsAccess(updatesFilePath)
    } catch(error) {
      throw 'Updates file does not exist. Please create an updates.json file in the main project directory.'
    }

    const updatesContent = await fsReadFile(updatesFilePath)
    const updatesObject = JSON.parse(updatesContent)

    // Update plugins
    const pluginsFilePath = path.resolve(__dirname, '..', 'plugins.json')
    try {
      await fsAccess(pluginsFilePath)
    } catch(error) {
      throw 'Plugins file does not exist. Please create an plugins.json file in the main project directory.'
    }

    const pluginsContent = await fsReadFile(pluginsFilePath)
    const pluginsObject = JSON.parse(pluginsContent)

    for (let plugin of pluginsObject.plugins) {
      await githubCli.updatePluginPackage(plugin, updatesObject, branch, commit)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    githubCli.cleanup()
  }
}

async function getInput(prompt) {
  var input = readlineSync.question(prompt);
  return input
}