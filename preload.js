window.prompt = (promptText) => {
  let input = document.getElementById('dialogAnswer')
  if (input && input.value) {
    let answer = input.value
    input.value = ''
    return answer
  }
  let dialog = document.getElementById('prompt')
  if (!dialog) {
    dialog = document.createElement('dialog')
    dialog.setAttribute('id', 'prompt')
    dialog.innerHTML = `
    <div>${promptText}</div>
    <form method='dialog'>
      <input id='dialogAnswer' type='text' style='width: 100%'></input>
    </form>
    `
    document.body.append(dialog)
    let dialogOK = document.getElementById('dialogOK')
    dialog.addEventListener('close', () => {
      let lock = document.getElementById('show-security-dialog')
      lock.click()
    })
  }
  dialog.showModal()
}

