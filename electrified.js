const {getCurrentWindow} = require('electron').remote
const {ipcRenderer} = require('electron')

const showDialog = (msg, cb) => {
  let input = $('<input>')
    .attr({id:'dialogAnswer', type:'text'})
    .css({width: '100%'})
  let dialog = $('<dialog>')
    .on('close', () => {
      let answer = document.getElementById('dialogAnswer').value
      cb(answer)
      dialog.remove()
    })
    .append($('<div>').text(msg))
    .append($('<form>').attr({method:'dialog'}).append(input))
    .appendTo($('body'))
  dialog[0].showModal()
  getCurrentWindow().webContents.focus()
  input.focus()
}

ipcRenderer.on('wiki-icon-changed', (evt, id, url) => {
  $(`#${id} > img`).attr({src: url})
})

ipcRenderer.on('wiki-activated', (evt, id) => {
  wikiBar.active = id
  $('.selected').removeClass('selected')
  $(`#${id} > img`).addClass('selected')
})

ipcRenderer.on('add-wiki', (evt, id, favicon) => {
  wikiBar.add(id, favicon)
})

class WikiBar {
  constructor(win) {
    this.win = win
    this.wikis = []
    this.active = null
    this.yoffset = 0
    this._changeSize({margin: 10, width: 32})
  }

  toggleWikiVisibility() {
    ipcRenderer.send('toggle-wiki-visibility', this.active)
    //this.active.toggleVisibility(this.win)
  }

  _changeSize(sizes) {
    if (sizes.margin) {
      this.margin = sizes.margin
    }
    if (sizes.width) {
      this.width = sizes.width
    }
    this.xoffset = (this.width + (this.margin*2))
    $('#wikiBar').css({width: `${this.xoffset}px`})
      .find(".wikiIcon").css({margin: this.margin})
      .find("img").css({
        width: `${this.width}px`,
        height: `${this.width}px`
      })
    ipcRenderer.send('set-display-offsets', this.xoffset, this.yoffset)
  }

  add(id, favicon) {
    this.wikis.push(id)
    let $iconTab = $("<div>").attr({id: id}).addClass('wikiIcon')
      .css({margin: this.margin})
      .click(() => this.activate(id))
      .append(
        $("<img>").attr({src: favicon})
          .css({width: `${this.width}px`, height: `${this.width}px`})
      ).appendTo("#wikiBar")
    $iconTab
      .on('dragover', (evt) => {
        if (!$iconTab.hasClass('selected')) {
          $iconTab.click()
        }
        evt.preventDefault()
      })
    if(this.active == null) this.activate(id)
  }

  activateByIndex(i) {
    if (i >= 0 && i < this.wikis.length) {
      this.activate(this.wikis[i])
      return
    }
    console.log(`Unable to active wiki index ${i}. Out of range.`)
  }

  activate(id) {
    this.active = id
    ipcRenderer.send('activate-wiki', id)
  }

  hide(id) {
    ipcRenderer.send('hide-wiki', id)
  }

  removeById(i) {
    this.remove(this.wikis[i])
  }

  remove(id) {
    if (this.wikis.length == 1) {
      console.log('refusing to close the last wiki')
      return
    }
    this.wikis.splice(this.wikis.indexOf(id), 1)
    $(`#${id}`).remove()
    ipcRenderer.send('remove-wiki', id)
    this.activateByIndex(0)
  }
}

// TODO: Remove global references.
let wikiBar = new WikiBar()

const openSite = () => {
  wikiBar.hide(wikiBar.active)
  showDialog("Enter the URL for the site:", (site) => {
    if (site.indexOf('http://') == -1 &&
      site.indexOf('https://') == -1) {
      site = 'http://' + site
    }
    console.log('loading wiki: ', site)
    ipcRenderer.send('add-and-activate-wiki', site)
  })
}

