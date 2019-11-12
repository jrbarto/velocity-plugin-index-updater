import editJsonFile from 'edit-json-file'

export default class PropsEditor {
  static async replacePackageContent(packageFilePath, updatesObject) {
    const packageFile = editJsonFile(packageFilePath)
    console.log('Updated fields:')
    for (let updateKey in updatesObject) {
      const updateValue = updatesObject[updateKey]
      let oldValue = packageFile.get(updateKey)

      if (typeof updateValue == 'object') {
        for (let nestedUpdateKey in updateValue) {
          const nestedUpdateValue = updateValue[nestedUpdateKey]
          const oldNestedValue = oldValue[nestedUpdateKey]
          let newNestedValue = await this.getNewValue(oldNestedValue, nestedUpdateValue)
          oldValue[nestedUpdateKey] = newNestedValue
        }
        console.log('\t' + updateKey + ':' + JSON.stringify(oldValue))
      } else {
        oldValue = await this.getNewValue(oldValue, updateValue)
        console.log('\t' + updateKey + ':' + oldValue)
      }

      packageFile.set(updateKey, oldValue)
      packageFile.save()
    }

    console.log('Successfully updated package file.')
  }

  static async getNewValue(oldValue, updateValue) {
    let newValue = updateValue
    if (updateValue.includes('*')) {
      for (let i = 0; i < oldValue.length; i++) {
        const newChar = updateValue.charAt(i)
        if (oldValue.charAt(i) != newChar) {
          if (newChar && newChar != '*') {
            newValue = updateValue.substr(0, i) + newChar + oldValue.substr(i + 1)
          }
        }
      }
    } else {
      newValue = updateValue
    }

    return newValue
  }
}