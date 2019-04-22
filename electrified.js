const {getCurrentWindow, BrowserView} = require('electron').remote

class WikiBar {
  constructor() {
  }

  add(wiki) {
    let iconTab = $("<div>").attr({id: wiki.id}).append(
      $("<img>").attr({src: wiki.favicon})
        .css({width: '20px', height: '20px'})
    ).appendTo("#wikiBar")
    /*wiki.on('icon-changed', (url) => {
      iconTab.find("img").attr({src: url})
    })*/
  }
}
let wikiBar = new WikiBar()

class Wiki {
  constructor(url) {
    this.site = '' // parse site from url
    this.view = null
    this.url = url // need to listen to event to keep up to date
    this.favicon = null // need to listen to event to get
    this.queuedListeners = []
    this.id = this._itemId()
    this.iconListeners = []
    Wiki.add(this)
  }

  // next three methods lifted from random.coffee
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

  _createView(win) {
    // This must not be called until ready to display.
    // Site will fail to initialize otherwise as scrollLeft always returns 0.
    this.view = new BrowserView({
      webPreferences: {
        nodeIntegration: false
      }
    })
    /*this.view.webContents.on('page-favicon-updated', (e, urls) => {
      this.favicon = urls[0]
      console.log('!! favicon: ', this.favicon)
      this.iconListeners.forEach((l) => {
        l(this.favicon)
      })
    })*/
    for (var listener of this.queuedListeners) {
      this.on.apply(this, listener)
    }
    this.queuedListeners = []
    let [width, height] = win.getContentSize()
    this.view.setBounds({ x: 20, y: 0, width: width-20, height: height })
    this.view.setAutoResize({ width: true, height: true })
    win.setBrowserView(this.view)
    /*
    initialFocus = () => {
      displayWiki(initialWikiView)
      initialWikiView.webContents.off('dom-ready', initialFocus)
    }
    initialWikiView.webContents.on('dom-ready', initialFocus)
    */
    this.view.webContents.loadURL(this.url)
    return this.view
  }

  display(win) {
    if (!this.view) { this._createView(win) }
    win.webContents.focus()
    win.setBrowserView(this.view)
    this.view.webContents.focus()
    //this.view.webContents.openDevTools()
    Wiki.active = this
  }

  toggleVisibility(win) {
    if (!this.view) { this.display(win); return }
    let view = win.getBrowserView() ? null : this.view
    win.setBrowserView(view)
  }

  destroy(win) {
    this.queuedListeners = []
    win.setBrowserView(null)
    if (!this.view) return
    this.view.destroy()
  }

  on(...args) {
    if(this.view) {
      /*let eventName = args[0]
      if (eventName == 'icon-changed') {
        let listener = args[1]
        this.iconListeners.push(listener)
        return
      }*/
      this.view.webContents.on.apply(this, args)
    }
    else this.queuedListeners.push(args)
  }

  off(...args) {
    this.view.webContents.off.apply(args)
  }
}

Wiki.wikis = []

Wiki.add = (wiki) => {
  if (!Wiki.active) Wiki.active = wiki
  Wiki.wikis.push(wiki)
  //wikiBar.add(wiki)
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

let local = new Wiki('http://localhost:31371')
//new Wiki('https://wiki.randombits.xyz')
//new Wiki('https://server.wiki.randombits.xyz')
//events.forEach((e) => local.on(e, (...args) => console.log('view', e, args)))
local.display(getCurrentWindow())
/*
window.addEventListener('beforeunload', (e) => {
  console.log('unloading')
  win.removeAllListeners()
  Wiki.destroyAll(win)
  e.returnValue = false
})
*/
