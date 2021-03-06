const { app, BrowserWindow, Menu, Tray, dialog, nativeImage } = require('electron')

const electronLocalshortcut = require('electron-localshortcut');

const path = require('path')

const prompt = require('electron-prompt')

const AutoLaunch = require('auto-launch')

const { autoUpdater } = require('electron-updater')

const storage = require('electron-json-storage')

var iconPath = path.join(__dirname, 'resources', 'icon.png')

var configJSON, win, tray, mockupWin;

function changeAPIKey(key)
{
  if(key.split('=').length == 2)
  {
    configJSON.apiKey = key.split('=')[1]
  }
  else {
    configJSON.apiKey = key;
  }
  configJSON.apiKey = configJSON.apiKey.charAt(0).toUpperCase() + configJSON.apiKey.substring(1)
  storage.set('configJSON', configJSON, (err) => {if(err) throw err;})
}

let gotLock = app.requestSingleInstanceLock();

if(!gotLock)
{
  app.exit()
}

function createMockupWindow() {
  mockupWin = new BrowserWindow({
    width: 800,
    icon: nativeImage.createFromPath(iconPath),
    height: 600,
    title: "probeRTC",
    webPreferences: {
      nodeIntegration: true
    }
  })

  mockupWin.setMenu(null)
  mockupWin.webContents.setAudioMuted(true);
}

let autoLaunch = new AutoLaunch({
  name: "ProbeRTC",
  path: app.getPath('exe')
})

autoLaunch.isEnabled().then((isEnabled) => {
  if(!isEnabled) autoLaunch.enable()
})

function registerShortcuts() {
  electronLocalshortcut.register(win, 'F12', () => {win.webContents.openDevTools()})

  electronLocalshortcut.register(win, 'F5', () => {win.reload()})
}

function unregisterShortcuts() {
  electronLocalshortcut.unregister(win, 'F12')
  electronLocalshortcut.unregister(win, 'F5')
}

function createWindow () {
  if(configJSON.apiKey == null) return;
  win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "probeRTC",
    icon: nativeImage.createFromPath(iconPath)
  })

  win.loadURL(`https://probertc-staging.testrtc.com/?apiKey=${configJSON.apiKey}&autoStart=true`)
  win.setMenu(null)

  win.webContents.setAudioMuted(true);

  win.on('minimize', function(event) {

      event.preventDefault();
      win.hide();
  })

  win.on('close', () => {
    win.hide();
  })
}

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
  storage.get('configJSON', (err, data) => {
    if(err) throw err;
  
    configJSON = data;

    if(configJSON.apiKey)
    {
      createWindow()
      registerShortcuts()
    }
    else
    {
      createMockupWindow()
      prompt({
        title: 'API Key | probeRTC',
        label: "API Key",
        type:"input",
        alwaysOnTop: true,
        icon: iconPath
      }).then((r) => {
        if(r === null) {
          app.quit()
        }
        else
        {
          changeAPIKey(r)
          createWindow()
          registerShortcuts()
          mockupWin.close()
        }
      })
    }
    tray = new Tray(nativeImage.createFromPath(iconPath))
    tray.on('click', function(e) {win.show()})
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show probeRTC', click:  function(){
            win.show();
        } },
        {
          label: "Change API Key", click: function() {
            prompt({
              title: 'Change API Key | probeRTC',
              label: "API Key",
              type:"input",
              alwaysOnTop: true,
              icon: iconPath
            }).then((r) => {
              if(r !== null) {
                changeAPIKey(r)
                createMockupWindow();
                unregisterShortcuts()
                win.destroy();
                win = null;
                createWindow();
                registerShortcuts()
                mockupWin.close();
              }
            })
          }
        },
        { label: 'Stop', click:  function(){
            app.exit()
        } }
    ]))

  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})