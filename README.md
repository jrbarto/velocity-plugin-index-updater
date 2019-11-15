# velocity-plugin-package-updater
This command-line utility can be used to make mass updates to the `package.json` file of multiple plugins at once. It makes the updates to all plugin projects listed in the `plugins.json` file based on the `updates.json` file. Both files are located in the root directory of the project.

## prerequisites
1. You'll need to install the `hub` command-line tool. You can follow the documentation at https://hub.github.com/ for help.
2. After `hub` is installed you'll need to configure the GitHub Enterprise server so that hub will recognize it as a remote repository. By default, hub will only work with repositories that have remotes which point to github.com. GitHub Enterprise hosts (such as our HCL PNP server) need to be whitelisted by running the following command: `git config --global --add hub.host github01.hclpnp.com`.
2. You will also need to create a personal access token and set it as the `GITHUB_TOKEN` environment variable. Check out the following documentation for help doing that: https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line

## plugins.json
You may update the plugins.json file to add or remove plugins to update. The entries are based on the repository name. For instance:
```
{
  "plugins": [
    "ucv-ext-azure",
    "ucv-ext-rally",
    "ucv-ext-junit",
    "ucv-ext-coverage-core",
    "ucv-ext-twistlock",
    "ucv-ext-testng",
    "ucv-ext-onetest",
    "ucv-ext-vs-quality",
    "ucv-ext-jmeter",
    "ucv-ext-bamboo",
    "ucv-ext-appscan",
    "ucv-ext-sonarqube",
    "ucv-ext-bitbucket-server",
    "ucv-ext-github",
    "ucv-ext-jira",
    "ucv-ext-servicenow",
    "ucv-ext-gitlab",
    "ucv-ext-rtc",
    "ucv-ext-asoc"
  ]
}
```

## updates.json
Modify the `updates.json` file in the root directory of the project to specify which fields to edit in each of the plugin's `package.json` files. Here is an example of the updates.json file:
```
{
  "version": "1.*.*",
  "devDependencies": {
    "nyc": "^14.1.1"
  }
}
```

The field referenced will be updated with the provided value. For nested objects, such as the `devDependencies` or `dependencies` you only need to specify which of the entries you want to update. In the above example, only the `nyc` dependency will be updated, the rest of the entries in the `devDependencies` object will be left alone.

You may also specify wildcards in the value. This will allow you keep the character set at that position, while updating the rest. For example, using the above `version` value, if a plugin was set as version `0.2.3`, the above specification would update the plugin version to `1.2.3` (leaving all of the `*` fields intact).

Also note that if there are any remaining characters not specified in your value, they will be left alone in the updated value. For example, using the above `version` value, if a plugin was set as version `0.2.222` the final value would become `1.2.222` (note that not all characters were specified, but everything after 1.2.2... is simply appended to the final value)