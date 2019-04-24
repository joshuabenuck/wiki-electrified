const debug = require('debug')
//debug.enable('*')
//debug.enable('express:*')
const {app, Menu, BrowserWindow, BrowserView} = require('electron')
const server = require('wiki-server')
const path = require('path')
const optimist = require('optimist')
const cc = require('config-chain')

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
  .options('version', {
    alias     : 'v',
    describe  : 'Show version number and exit'
  })
  .argv

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
    cookieSecret: require('crypto').randomBytes(64).toString('hex')
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

let toggleDevTools = `
wikiBar.active.view.webContents.isDevToolsOpened() ? 
  wikiBar.active.view.webContents.closeDevTools() :
  wikiBar.active.view.webContents.openDevTools({mode: 'right'})
`
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
        label: 'Reload Wiki',
        accelerator: 'CmdOrCtrl+R',
        click: () => win.webContents.executeJavaScript(
          "let webContents = wikiBar.active.view.webContents;" + 
          "webContents.loadURL(webContents.getURL())"
        )
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
        click: () => win.webContents.executeJavaScript( toggleDevTools )
      },
      {
        label: 'Toggle Wiki Visibility',
        accelerator: 'CmdOrCtrl+H',
        click: () => win.webContents.executeJavaScript(
          "wikiBar.active.toggleVisibility(win)"
        )
      },
      { type: 'separator' },
      {
        // NOTE: While the recommendation is to use a role for these zoom commands,
        // we need to customize the click handler so we are stuck reimplmenting
        // some of this which others get for free.
        label: 'Actual Size',
        accelerator: 'CmdOrCtrl+0',
        click: () => {
          win.webContents.executeJavaScript(`
            webContents = wikiBar.active.view.webContents
            webContents.getZoomFactor((zf) => {
              webContents.setZoomFactor(1.0)
            })
          `)
        }
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => {
          win.webContents.executeJavaScript(`
            webContents = wikiBar.active.view.webContents
            webContents.getZoomFactor((zf) => {
              webContents.setZoomFactor(zf+0.1)
            })
          `)
        }
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          win.webContents.executeJavaScript(`
            webContents = wikiBar.active.view.webContents
            webContents.getZoomFactor((zf) => {
              webContents.setZoomFactor(zf-0.1)
            })
          `)
        }
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
  'read-to-shaow',
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
  //winEvents.forEach((e) => win.on(e, (...args) => console.log('win event', e, args)))
  win.loadURL(`file://${__dirname}/electrified.html`)

  win.webContents.on('did-finish-load', () => {
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

