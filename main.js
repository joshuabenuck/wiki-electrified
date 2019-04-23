const debug = require('debug')
//debug.enable('*')
//debug.enable('express:*')
const {app, Menu, BrowserWindow, BrowserView} = require('electron')
const server = require('wiki-server')
const path = require('path')

//require("electron-reload")(__dirname)

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
        label: 'Reload',
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
        label: 'Toggle Main DevTools',
        accelerator: 'Shift+CmdOrCtrl+I',
        click: () => {
          win.webContents.isDevToolsOpened() ? 
            win.webContents.closeDevTools() :
            win.webContents.openDevTools({mode: 'undocked'})
        }
      },
      {
        label: 'Toggle DevTools',
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
      {
        label: 'Show Wiki 1',
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          console.log('Activating 1st wiki')
          win.webContents.executeJavaScript("wikiBar.activateByIndex(0)")
        }
      },
      {
        label: 'Show Wiki 2',
        accelerator: 'CmdOrCtrl+2',
        click: () => {
          console.log('Activating 2nd wiki')
          win.webContents.executeJavaScript("wikiBar.activateByIndex(1)")
        }
      },
      {
        label: 'Show Wiki 3',
        accelerator: 'CmdOrCtrl+3',
        click: () => {
          console.log('Activating 3rd wiki')
          win.webContents.executeJavaScript("wikiBar.activateByIndex(2)")
        }
      }
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
  //win.on('close', cleanup)
  //winEvents.forEach((e) => win.on(e, (...args) => console.log('win event', e, args)))
  win.loadURL(`file://${__dirname}/electrified.html`)
  //win.webContents.openDevTools()

  win.webContents.on('did-finish-load', () => {
    //win.webContents.focus()
  })

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

let wikiServer
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  getUserHome = () => {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
  }

  config = {
    port: 31371,
    root: path.dirname(require.resolve('wiki-server')),
    home: 'welcome-visitors',
    security_type: './security',
    data: path.join(getUserHome(), '.wiki'), // see also defaultargs
    packageDir: path.resolve(path.join(__dirname, 'node_modules')),
    cookieSecret: require('crypto').randomBytes(64).toString('hex')
  }

  wikiServer = server(config)
  wikiServer.on('owner-set', (e) => {
    serv = wikiServer.listen(wikiServer.startOpts.port, wikiServer.startOpts.host)
    console.log("Federated Wiki server listening on", wikiServer.startOpts.port,
      "in mode:", wikiServer.settings.env)
    /*if(argv.security_type == './security') {
      console.log('INFORMATION : Using default security - Wiki will be read-only\n')
    }*/
    wikiServer.emit('running-serv', serv)
    createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

