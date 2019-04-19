const debug = require('debug')
//debug.enable('*')
//debug.enable('express:*')
const {app, Menu, BrowserWindow} = require('electron')
const server = require('wiki-server')
const path = require('path')

//require("electron-reload")(__dirname)

const template = [
  {
    label: 'Electrified',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => win.reload()
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: () => win.toggleDevTools()
      }
    ]
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
      //{ role: 'reload' },
      //{ role: 'toggledevtools' },
      //{ type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
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
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('http://electron.atom.io') }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, wikiServer

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    width: 800,
    height: 600
  })
  //win.setMenu(null);

  // and load the index.html of the app.
  //win.loadURL(`file://${__dirname}/index.html`)
  win.loadURL('http://localhost:31371/view/welcome-visitors')

  // Open the DevTools.
  win.webContents.openDevTools()

  win.webContents.on('did-finish-load', () => {
      win.webContents.focus()
  })

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

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
