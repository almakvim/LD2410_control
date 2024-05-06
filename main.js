const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipcMain = require('electron').ipcMain
const dialog = require('electron').dialog
//const fs = require('fs')
let win
let BLEDevicesWindow
let BLEDevicesList = []
let callbackForBluetoothEvent = null

// open a window
openWindow = (type) => {
  win = new BrowserWindow({
    width: 1150, //1300, // 760
    height: 1000,
    //show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      //preload: './local-storage-sync.js',
    },
  })
  //============================================
  win.webContents.openDevTools() // Отладка
  //============================================
  win.webContents.on(
    'select-bluetooth-device',
    (event, deviceList, callback) => {
      event.preventDefault() // do not choose the first one
      console.log('deviceList', deviceList)
      if (deviceList && deviceList.length > 0) {
        // find devices?
        deviceList.forEach((element) => {
          if (
            !element.deviceName.includes(
              // reduce noise by filter Devices without name
              'Unbekanntes oder nicht unterstütztes Gerät' // better use filter options in renderer.js
            ) &&
            !element.deviceName.includes('Unknown or Unsupported Device') // better use filter options in renderer.js
          ) {
            if (BLEDevicesList.length > 0) {
              // BLEDevicesList not empty?
              if (
                BLEDevicesList.findIndex(
                  // element is not already in BLEDevicesList
                  (object) => object.deviceId === element.deviceId
                ) === -1
              ) {
                BLEDevicesList.push(element)
                console.log('BLEDevicesList 1', BLEDevicesList)
              }
            } else {
              BLEDevicesList.push(element)
              console.log('BLEDevicesList 2', BLEDevicesList)
              console.log('BLEDevicesWindow', BLEDevicesWindow)
              if (!BLEDevicesWindow) {
                console.log('createBLEDevicesWindow')
                createBLEDevicesWindow() // open new window to show devices
              }
            }
          }
        })
      }

      callbackForBluetoothEvent = callback
    }
  )
  //-------------------------------------------------------------
  function createBLEDevicesWindow() {
    BLEDevicesWindow = new BrowserWindow({
      width: 400,
      height: 400,
      parent: win,
      title: 'Bluetooth Devices near by',
      modal: true,
      webPreferences: {
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote
        preload: path.join(__dirname, 'BLEDevicesPreload.js'), // use a preload script
      },
    })

    //============================================
    //BLEDevicesWindow.webContents.openDevTools() // Отладка
    //============================================

    BLEDevicesWindow.loadFile('BLEDevicesWindow.html')

    BLEDevicesWindow.on('close', function () {
      BLEDevicesWindow = null
      callbackForBluetoothEvent('')
      BLEDevicesList = []
    })
  }

  //-------------------------------------------------------------
  if (type === 'tree') {
    //win.loadFile('./preload.js')
    win.loadFile('./tree.html') // image window
  } else {
    win.loadFile('./tree.html') // default window
  }
}

// when app is ready, create a window
app.on('ready', () => {
  openWindow() // open default window
})

// when all windows are closed, quit the application
app.on('window-all-closed', (event) => {
  if (process.platform !== 'darwin') {
    console.log('Quit main window')
    app.quit() // exit
  }
})

// when application is activated, open default window
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openWindow() // open default window
  }
})
//=========================================
ipcMain.on('send:load-tree', () => {
  console.log('[message received]', 'send:rewrite-file')
  app.quit() // exit
  openWindow('tree') // open tree window
})
//=========================================
ipcMain.on('toMain', (event, args) => {
  console.log('toMain', args)
})

ipcMain.on('BLEScannFinished', (event, args) => {
  console.log('BLEScannFinished', args)
  console.log(
    'BLEDevicesList.find',
    BLEDevicesList.find((item) => item.deviceId === args)
  )
  let BLEDevicesChoosen = BLEDevicesList.find((item) => item.deviceId === args)
  if (BLEDevicesChoosen) callbackForBluetoothEvent(BLEDevicesChoosen.deviceId)
  else callbackForBluetoothEvent('')
  BLEDevicesList = []
})

ipcMain.on('getBLEDeviceList', (event, args) => {
  if (BLEDevicesWindow) {
    BLEDevicesWindow.webContents.send('BLEDeviceList', BLEDevicesList)
  }
})

//=========================================
