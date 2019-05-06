const {getCurrentWindow, BrowserView, shell} = require('electron').remote

window.followLink = (url) => {
  if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
    shell.openExternal(url)
  }
}


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

class WikiBar {
  constructor(win) {
    this.win = win
    this.wikis = []
    this.active = null
    this.zoomFactor = 1.0
    this._changeSize({margin: 5, width: 32})
    this.yoffset = 0
    this._zoom({delta: 0})
  }

  toggleWikiVisibility() {
    this.active.toggleVisibility(this.win)
  }

  _zoom(opts) {
    // race condition - not sure if it will be an issue
    this.win.webContents.getZoomFactor((zf) => {
      if (opts.target) {
        this.zoomFactor = opts.target
      }
      if (opts.delta) {
        this.zoomFactor = zf + opts.delta
      }
      this.win.webContents.setZoomFactor(this.zoomFactor)
      this.wikis.forEach((w) => w.setZoomFactor(this.zoomFactor))
      this._changeSize({})
    })
  }

  zoomIn() {
    this._zoom({delta: +0.1})
  }

  zoomOut() {
    this._zoom({delta: -0.1})
  }

  resetZoom() {
    this._zoom({target: 1.0})
  }

  _changeSize(sizes) {
    if (sizes.margin) {
      this.margin = sizes.margin
    }
    if (sizes.width) {
      this.width = sizes.width
    }
    this.xoffset = (this.width + (this.margin*2)) * this.zoomFactor
    $('#wikiBar').css({width: `${this.xoffset}px`})
      .find(".wikiIcon").css({margin: this.margin})
      .find("img").css({
        width: `${this.width}px`,
        height: `${this.width}px`
      })
    // just update the active?
    // the others can be updated once displayed
    this.wikis.forEach((w) =>
      w.setBounds(this.win, {x:this.xoffset, y:this.yoffset}))
  }

  add(wiki) {
    if(this.active == null) this.active = wiki
    wiki.setBounds(this.win, {x:this.xoffset, y:this.yoffset})
    wiki.setZoomFactor(this.zoomFactor)
    this.wikis.push(wiki)
    let iconTab = $("<div>").attr({id: wiki.id}).addClass('wikiIcon')
      .css({margin: this.margin})
      .click(() => wiki.activate(this.win))
      .append(
        $("<img>").attr({src: wiki.favicon})
          .css({width: `${this.width}px`, height: `${this.width}px`})
      ).appendTo("#wikiBar")
    wiki.on('icon-changed', (url) => {
      iconTab.find("img").attr({src: url})
    })
    wiki.on('activate', () => {
      this.active = wiki
      $('.selected').removeClass('selected')
      $(`#${wiki.id} > img`).addClass('selected')
    })
  }

  activateByIndex(i) {
    if (i >= 0 && i < this.wikis.length) {
      this.wikis[i].activate(this.win)
      return
    }
    console.log(`Unable to active wiki index ${i}. Out of range.`)
  }

  activate(wiki) {
    wiki.activate(this.win)
  }

  hide(wiki) {
    wiki.hide(this.win)
  }

  removeById(i) {
    this.remove(this.wikis[i])
  }

  remove(wiki) {
    if (this.wikis.length == 1) {
      console.log('refusing to close the last wiki')
      return
    }
    this.wikis.splice(this.wikis.indexOf(wiki), 1)
    $(`#${wiki.id}`).remove()
    wiki.destroy(this.win)
    this.activateByIndex(0)
  }
}

class Wiki {
  constructor(url) {
    this.view = null
    this.url = new URL(url)
    this.favicon = new URL('favicon.png', this.url.origin).toString()
    this.queuedListeners = []
    this.id = this._itemId()
    this.listeners = {}
    this.localEvents = ['activate', 'icon-changed']
    this.localEvents.forEach((e) => { this.listeners[e] = [] })
    this.bounds = {}
    this.zoomFactor = 1.0
  }

  // begin: from random.coffee
  _randomByte() {
    return (((1+Math.random())*0x100)|0).toString(16).substring(1)
  }

  _randomBytes(n) {
    let results = [];
    for (let i=1; i <= n; i++) {
      results.push(this._randomByte());
    }
    return results.join('');
  }

  _itemId() {
    return this._randomBytes(8)
  }
  // end: from random.coffee

  _createView(win) {
    // This must not be called until ready to display.
    // Site will fail to initialize otherwise as scrollLeft always returns 0.
    this.view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        preload: `${__dirname}/preload.js`,
        zoomFactor: this.zoomFactor
      }
    })
    win.setBrowserView(this.view)
    this.view.webContents.on('page-favicon-updated', (e, urls) => {
      this.favicon = urls[0]
      this.listeners['icon-changed'].forEach((l) => {
        l(this.favicon)
      })
    })
    this.view.webContents.on('did-navigate', (e, url) => {
      this.url = new URL(url)
      win.setTitle(this.url.origin)
    })
    this.view.webContents.on('did-navigate-in-page', (e, url) => {
      this.url = new URL(url)
      win.setTitle(this.url.origin)
    })
    this.view.webContents.on('new-window', (
      e, url, frameName, disposition, options, additionalFeatures, referrer
    ) => {
      if(disposition == 'foreground-tab') {
        followLink(url)
      }
    })
    for (let listener of this.queuedListeners) {
      this.on.apply(this, listener)
    }
    this.queuedListeners = []
    this.view.setAutoResize({ width: true, height: true })
    this.view.webContents.loadURL(this.url.toString())
    return this.view
  }

  setBounds(win, bounds) {
    Object.assign(this.bounds, bounds)
    if (this.view) {
      let [width, height] = win.getContentSize()
      // setBounds doesn't like floating point params
      this.view.setBounds({
        x: Math.floor(this.bounds.x), y: this.bounds.y,
        width: Math.floor(width-this.bounds.x), height: height
      })
    }
  }

  setZoomFactor(zf) {
    this.zoomFactor = zf
    if (this.view) {
      this.view.webContents.setZoomFactor(this.zoomFactor)
    }
  }

  activate(win) {
    this._display(win)
    this.listeners['activate'].forEach((l) => { l() })
  }

  _display(win) {
    if (!this.view) { this._createView(win) }
    win.webContents.focus()
    win.setBrowserView(this.view)
    this.view.webContents.setZoomFactor(this.zoomFactor)
    this.setBounds(win, {})
    this.view.webContents.focus()
    //this.view.webContents.openDevTools()
  }

  toggleVisibility(win) {
    if (!this.view) { this._display(win); return }
    let view = win.getBrowserView() ? null : this.view
    win.setBrowserView(view)
  }

  hide(win) {
    win.setBrowserView(null)
  }

  destroy(win) {
    this.queuedListeners = []
    if (!this.view) return
    win.setBrowserView(null)
    this.view.destroy()
  }

  on(...args) {
    if(this.view) {
      let eventName = args[0]
      if (this.localEvents.includes(eventName)) {
        let listener = args[1]
        this.listeners[eventName].push(listener)
        return
      }
      this.view.webContents.on.apply(this, args)
    }
    else this.queuedListeners.push(args)
  }

  off(...args) {
    this.view.webContents.off.apply(args)
  }
}

events = [
  'did-finish-frame-load',
  'did-fail-load',
  'did-frame-finish-load',
  'did-start-loading',
  'did-stop-loading',
  'dom-ready',
  'page-favicon-updated',
  'new-window',
  'will-navigate',
  'did-start-navigation',
  'will-redirect',
  'did-redirect-navigation',
  'did-navigate',
  'did-frame-navigate',
  'did-navigate-in-page',
  'will-prevent-upload',
  'crashed',
  'unresponsive',
  'responsive',
  'plugin-crashed',
  'destroyed',
  //'before-input-event',
  'devtools-opened',
  'devtools-closed',
  'devtools-focused',
  'certificate-error',
  'select-client-certificate',
  'login',
  'found-in-page',
  'media-started-playing',
  'media-paused',
  'did-change-theme-color',
  'update-target-url',
  //'cursor-changed',
  'context-menu',
  'select-bluetooth-device',
  'paint',
  'devtools-reload-page',
  'will-attach-webview',
  'did-attach-webview',
  //'console-message',
  'remote-require',
  'remote-get-global',
  'remote-get-builtin',
  'remote-get-current-window',
  'remote-get-current-web-contents',
  'remote-get-guest-web-contents'
]

// TODO: Remove global references.
let wikiBar = new WikiBar(getCurrentWindow())

const openSite = () => {
  wikiBar.hide(wikiBar.active)
  showDialog("Enter the URL for the site:", (site) => {
    if (site.indexOf('http://') == -1 &&
      site.indexOf('https://') == -1) {
      site = 'http://' + site
    }
    console.log('loading wiki: ', site)
    let wiki = new Wiki(site)
    wikiBar.add(wiki)
    wikiBar.activate(wiki)
  })
}

{ // reduce scope of initialization logic
  // wikis are passed in as last arg and are JSON encoded array
  let wikiUrls = JSON.parse(process.argv[process.argv.length-1])
  wikiUrls.forEach((u) => {
    let wiki = new Wiki(u)
    //events.forEach((e) => wiki.on(e, (...args) => console.log('view', e, args)))
    wikiBar.add(wiki)
  })
  wikiBar.activateByIndex(0)
}


