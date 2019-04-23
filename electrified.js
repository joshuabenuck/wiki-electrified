const {getCurrentWindow, BrowserView} = require('electron').remote

class WikiBar {
  constructor(win) {
    this.win = win
    this.wikis = []
    this.active = null
  }

  add(wiki) {
    if(this.active == null) this.active = wiki
    this.wikis.push(wiki)
    let iconTab = $("<div>").attr({id: wiki.id}).addClass('wikiIcon')
      .append(
        $("<img>").attr({src: wiki.favicon})
          .css({width: '10px', height: '10px'})
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
    this.wikis[i].activate(this.win)
  }
}

class Wiki {
  constructor(url) {
    this.site = '' // parse site from url
    this.view = null
    this.url = url // need to listen to event to keep up to date
    this.favicon = null // need to listen to event to get
    this.queuedListeners = []
    this.id = this._itemId()
    this.listeners = {}
    this.localEvents = ['activate', 'icon-changed']
    this.localEvents.forEach((e) => {
      this.listeners[e] = []
    })
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
        nodeIntegration: false
      }
    })
    this.view.webContents.on('page-favicon-updated', (e, urls) => {
      this.favicon = urls[0]
      this.listeners['icon-changed'].forEach((l) => {
        l(this.favicon)
      })
    })
    for (let listener of this.queuedListeners) {
      this.on.apply(this, listener)
    }
    this.queuedListeners = []
    let [width, height] = win.getContentSize()
    win.setBrowserView(this.view)
    this.view.setBounds({ x: 20, y: 0, width: width-20, height: height })
    this.view.setAutoResize({ width: true, height: true })
    this.view.webContents.loadURL(this.url)
    return this.view
  }

  activate(win) {
    this._display(win)
    this.listeners['activate'].forEach((l) => { l() })
  }

  _display(win) {
    if (!this.view) { this._createView(win) }
    win.webContents.focus()
    win.setBrowserView(this.view)
    this.view.webContents.focus()
    //this.view.webContents.openDevTools()
  }

  toggleVisibility(win) {
    if (!this.view) { this._display(win); return }
    let view = win.getBrowserView() ? null : this.view
    win.setBrowserView(view)
  }

  destroy(win) {
    this.queuedListeners = []
    if (!this.view) return
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
{ // reduce scope of initialization logic
  let wikiUrls = [
    'http://localhost:31371',
    'https://wiki.randombits.xyz'
  ]
  wikiUrls.forEach((u) => wikiBar.add(new Wiki(u)))
  wikiBar.activateByIndex(0)
}

//events.forEach((e) => local.on(e, (...args) => console.log('view', e, args)))

