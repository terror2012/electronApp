const { app, BrowserWindow, Menu, Tray, dialog } = require('electron')

const path = require('path')

const prompt = require('electron-prompt')

const fs = require('fs')

const AutoLaunch = require('auto-launch')

const { autoUpdater } = require('electron-updater')

var iconPath = path.join(__dirname, '29264.png')

var configJSON, win, tray, mockupWin;

try {
  configJSON = require('./config.json')
} catch(err)
{
  console.log(err)
  fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify({}))
  configJSON = {}
}

function createMockupWindow() {
  mockupWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mockupWin.setMenu(null)
}

let autoLaunch = new AutoLaunch({
  name: "TestRTC",
  path: app.getPath('exe')
})

autoLaunch.isEnabled().then((isEnabled) => {
  if(!isEnabled) autoLaunch.enable()
})

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadURL(`https://probertc-staging.testrtc.com/?apiKey=${configJSON.apiKey}`)
  win.setMenu(null)

  win.on('minimize', function(event) {

      event.preventDefault();
      win.hide();
  })

}

app.on('before-quit', () => {
  win.close()
})

// app.whenReady().then(createWindow).catch(err=>{console.log(err)})

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(null, {
    type: "info",
    title: "Update available",
    message: `Version ${info.version} is available and your application is currently being updated`
  })
})

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBoxSync(null, {type: "info", title: "Update downloaded", message: "Update downloaded, the application will now restart"})
  autoUpdater.quitAndInstall()
})

app.on('ready', function() {
  autoUpdater.checkForUpdates()
    if(configJSON.apiKey)
    {
      createWindow()
    }
    else
    {
      createMockupWindow()
      mockupWin.hide()
      prompt({
        title: 'API Key Prompt',
        label: "API Key",
        type:"input"
      }).then((r) => {
        console.log(r)
        if(r === null) {
          app.quit()
        }
        else
        {
          configJSON.apiKey = r
          fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(configJSON))
          createWindow()
          mockupWin.close()
        }
      })
    }
    tray = new Tray(iconPath)
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show App', click:  function(){
            win.show();
        } },
        {
          label: "Reload", click: function() {
            win.reload()
          }
        },
        { label: 'Quit', click:  function(){
            app.exit()
        } }
    ]))
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})