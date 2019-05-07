const debug = require('debug')
//debug.enable('*')
//debug.enable('express:*')
const {
  app, Menu, BrowserWindow, BrowserView, ipcMain, getCurrentWindow, shell
} = require('electron')
const optimist = require('optimist')
const cc = require('config-chain')
const server = require('wiki-server')
const path = require('path')
//require("electron-reload")(__dirname)

// begin: taken from wiki/cli.coffee
getUserHome = () => {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
}

argv = optimist
  .usage('Usage: $0')
  .options('port', {
    alias     : 'p',
    describe  : 'Port'
  })
  .options('data', {
    alias     : 'd',
    describe  : 'location of flat file data'
  })
  .options('root', {
    alias     : 'r',
    describe  : 'Application root folder'
  })
  .options('security_type', {
    describe  : 'The security plugin to use, see documentation for additional parameters'
  })
  .options('secure_cookie', {
    describe  : 'When true, session cookie will only be sent over SSL.',
    boolean   : false
  })
  .options('session_duration', {
    describe  : 'The wiki logon, session, duration in days'
  })
  .options('id', {
    describe  : 'Set the location of the owner identity file'
  })
  .options('uploadLimit', {
    describe  : 'Set the upload size limit, limits the size page content items, and pages that can be forked'
  })
  .options('help', {
    alias     : 'h',
    boolean   : true,
    describe  : 'Show this help info and exit'
  })
  .options('config', {
    alias     : 'conf',
    describe  : 'Optional config file.'
  })
  .options('wikis', {
    describe  : 'List of wikis to open.'
  })
  .options('version', {
    alias     : 'v',
    describe  : 'Show version number and exit'
  })
  .argv

if (argv.wikis) {
  argv.wikis = argv.wikis.split(",")
  argv.wikis.map((w) => w.replace(/^\s+|\s+$/g, ''))
}

config = cc(argv,
  argv.config,
  'config.json',
  path.join(__dirname, '..', 'config.json'),
  path.join(getUserHome(), '.wiki', 'config.json'),
  cc.env('wiki_'), {
    port: 31371,
    root: path.dirname(require.resolve('wiki-server')),
    home: 'welcome-visitors',
    security_type: './security',
    data: path.join(getUserHome(), '.wiki'), // see also defaultargs
    packageDir: path.resolve(path.join(__dirname, 'node_modules')),
    cookieSecret: require('crypto').randomBytes(64).toString('hex'),
    wikis: ["http://localhost:31371"]
  }).store

// If h/help is set print the generated help message and exit.
if (argv.help) {
  optimist.showHelp()
  return
}

// If v/version is set print the version of the wiki components and exit.
if (argv.version) {
  console.log('wiki: ' + require('./package').version)
  console.log('wiki-server: ' + require('wiki-server/package').version)
  console.log('wiki-client: ' + require('wiki-client/package').version)
  glob('wiki-security-*', {cwd: config.packageDir}, (e, plugins) => {
    plugins.map((plugin) => {
      console.log(plugin + ": " + require(plugin + "/package").version)
    })
  })
  glob('wiki-plugin-*', {cwd: config.packageDir}, (e, plugins) => {
    plugins.map((plugin) => {
      console.log(plugin + ': ' + require(plugin + '/package').version)
    })
  return
  })
}
// end: taken from wiki/cli.coffee

const cleanup = (e) => {
  win.setBrowserView(null)
  BrowserView.getAllViews().forEach((v) => {
    v.removeAllListeners()
    v.destroy()
  })
  win.removeAllListeners()
  //events.forEach((e) => win.webContents.on(e, (...args) => console.log('win', e, args)))
}

const template = [
  {
    label: 'Electrified',
    submenu: [
      {
        label: 'Open Wiki',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          win.webContents.executeJavaScript(`openSite()`)
        }
      },
      {
        label: 'Close Wiki',
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          win.webContents.executeJavaScript(`wikiBar.remove(wikiBar.active)`)
        }
      }
    ].concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
      return {
        label: `Show Wiki ${i}`,
        accelerator: `CmdOrCtrl+${i}`,
        click: () => {
          console.log(`Activating wiki: ${i}`)
          win.webContents.executeJavaScript(`wikiBar.activateByIndex(${i-1})`)
        }
      }
    }))
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'History Back',
        accelerator: 'Alt+Left',
        click: () => win.getBrowserView().webContents.goBack()
      },
      {
        label: 'History Forward',
        accelerator: 'Alt+Right',
        click: () => win.getBrowserView().webContents.goForward()
      },
      {
        label: 'Reload Wiki',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          let webContents = win.getBrowserView().webContents
          webContents.loadURL(webContents.getURL())
        }
      },
      {
        label: 'Reload Electrified',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          cleanup()
          win.reload()
          //win.on('close', cleanup)
        }
      },
      {
        label: 'Toggle Electrified DevTools',
        accelerator: 'Shift+CmdOrCtrl+I',
        click: () => {
          win.webContents.isDevToolsOpened() ? 
            win.webContents.closeDevTools() :
            win.webContents.openDevTools({mode: 'undocked'})
        }
      },
      {
        label: 'Toggle Wiki DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: () => {
          win.getBrowserView().webContents.isDevToolsOpened() ? 
            win.getBrowserView().webContents.closeDevTools() :
            win.getBrowserView().webContents.openDevTools({mode: 'right'})
        }
      },
      {
        label: 'Toggle Wiki Visibility',
        accelerator: 'CmdOrCtrl+H',
        click: () => win.webContents.executeJavaScript(
          "wikiBar.toggleWikiVisibility()"
        )
      },
      { type: 'separator' },
      {
        // NOTE: While the recommendation is to use a role for these zoom commands,
        // we need to customize the click handler so we are stuck reimplmenting
        // some of this which others get for free.
        label: 'Actual Size',
        accelerator: 'CmdOrCtrl+0',
        click: () => resetZoom()
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => zoomIn()
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => zoomOut()
      },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+Q',
        role: 'close'
      }
    ]
  }
]
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

const followLink = (url) => {
  if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
    shell.openExternal(url)
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

  _createView() {
    // This must not be called until ready to display.
    // Site will fail to initialize otherwise as scrollLeft always returns 0.
    this.view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        preload: `${__dirname}/preload.js`,
        nativeWindowOpen: false,
        zoomFactor: this.zoomFactor
      }
    })
    win.setBrowserView(this.view)
    this.view.webContents.on('page-favicon-updated', (e, urls) => {
      this.favicon = urls[0]
      /*this.listeners['icon-changed'].forEach((l) => {
        l(this.favicon)
      })*/
      win.webContents.send('wiki-icon-changed', this.id, this.favicon)
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
      e.preventDefault()
      if(disposition == 'foreground-tab') {
        followLink(url)
        return
      }
      let origin = new URL(url).origin
      if (origin == this.url.origin) {
        this.view.webContents.loadURL(url)
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

  updateBounds() {
    if (this.view) {
      let [width, height] = win.getContentSize()
      // setBounds doesn't like floating point params
      this.view.setBounds({
        x: Math.floor(xoffset*zoomFactor), y: yoffset,
        width: Math.floor(width-(xoffset*zoomFactor)), height: height
      })
    }
  }

  activate() {
    this._display()
    //this.listeners['activate'].forEach((l) => { l() })
    win.webContents.send('wiki-activated', this.id)
  }

  _display() {
    if (!this.view) { this._createView() }
    win.webContents.focus()
    win.setBrowserView(this.view)
    this.updateBounds()
    this.view.webContents.focus()
    //this.view.webContents.openDevTools()
  }

  toggleVisibility() {
    if (!this.view) { this._display(); return }
    let view = win.getBrowserView() ? null : this.view
    win.setBrowserView(view)
  }

  hide() {
    win.setBrowserView(null)
  }

  destroy() {
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
        //this.listeners[eventName].push(listener)
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

winEvents = [
  'page-title-updated',
  'close',
  'closed',
  'unresponsive',
  'responsive',
  'blur',
  'focus',
  'show',
  'hide',
  'read-to-show',
  'maximize',
  'unmaximize',
  'minimize',
  'restore',
  'resize',
  'move',
  'enter-full-screen'
]

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let wikis = {}
let zoomFactor = 1.0
let xoffset = 0
let yoffset = 0

// TODO: Is this call needed?
ipcMain.on('toggle-wiki-visibility', (evt, id) => {
  wikis[id].toggleVisibility()
})

ipcMain.on('set-display-offsets', (evt, _xoffset, _yoffset) => {
  xoffset = _xoffset
  yoffset = _yoffset
  Object.keys(wikis).forEach((id) => wikis[id].updateBounds())
})

ipcMain.on('activate-wiki', (evt, id) => {
  wikis[id].activate()
})

ipcMain.on('hide-wiki', (evt, id) => {
  wikis[id].hide()
})

ipcMain.on('add-wiki', (evt, site) => {
  addWiki(site)
})

ipcMain.on('add-and-activate-wiki', (evt, site) => {
  let id = addWiki(site)
  wikis[id].activate()
})

ipcMain.on('remove-wiki', (evt, id) => {
  wikis[id].destroy()
  delete wikis[id]
})

const _zoom = (opts) => {
  if (opts.target) {
    zoomFactor = opts.target
  }
  if (opts.delta) {
    zoomFactor = zoomFactor + opts.delta
  }
  win.webContents.setZoomFactor(zoomFactor)
  Object.keys(wikis).forEach((id) => wikis[id].updateBounds())
}

const zoomIn = () => {
  _zoom({delta: +0.1})
}

const zoomOut = () => {
  _zoom({delta: -0.1})
}

const resetZoom = () => {
  _zoom({target: 1.0})
}

const addWiki = (site) => {
  let wiki = new Wiki(site)
  wikis[wiki.id] = wiki
  //events.forEach((e) => wiki.on(e, (...args) => console.log('view', e, args)))
  win.webContents.send('add-wiki', wiki.id, wiki.favicon)
  return wiki.id
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    useContentSize: true
  })
  win.webContents.getZoomFactor((zf) => {
    zoomFactor = zf
    //winEvents.forEach((e) => win.on(e, (...args) => console.log('win event', e, args)))
    win.loadURL(`file://${__dirname}/electrified.html`)
  })

  win.on('focus', () => {
    //win.webContents.executeJavaScript(`wikiBar.activate(wikiBar.active)`)
  })

  win.webContents.on('did-finish-load', () => {
    let wikiUrls = config.wikis
    let first = true
    wikiUrls.forEach((u) => addWiki(u))
  })

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

let wikiApp, wikiServer
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  wikiApp = server(config)
  wikiApp.on('owner-set', (e) => {
    wikiServer = wikiApp.listen(wikiApp.startOpts.port, wikiApp.startOpts.host)
    console.log("Federated Wiki server listening on", wikiApp.startOpts.port,
      "in mode:", wikiApp.settings.env)
    if(argv.security_type == './security') {
      console.log('INFORMATION : Using default security - Wiki will be read-only\n')
    }
    wikiApp.emit('running-serv', wikiServer)
    createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  wikiServer.close()
  app.quit()
})

app.on('activate', () => {
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

