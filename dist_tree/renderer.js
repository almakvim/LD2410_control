const MY_BLUETOOTH_NAME = 'HLK-LD2410_EA9C'
const SEND_SERVICE = 0xfff0
const SEND_SERVICE_2 = 0x1800
const RW_CHARACTERISTIC = 0x2a00
const READ_SERVICE_CHARACTERISTIC = 0xfff1
const SEND_SERVICE_CHARACTERISTIC = 0xfff2

let writeCharacteristic = undefined
let readCharacteristic = undefined
let myDeviceName = undefined
let myDevice = undefined
let bluetoothConnect = false
//===============================================

//const bleDeviceList = document.getElementById('deviceList')

async function testIt() {
  if (flagComConn) {
    console.log('COM port connection!')
    typeAreaText('Bluetooth connection canceled!')
    return
  }
  if (!bluetoothConnect) {
    //------------------------------------
    if (myDevice) {
      setDisconnect()
    }
    //----------------------------------------
    $('#clickme')
      .prop('innerHTML', 'Connect Bluetooth device')
      .css({ color: '#0231ff' })
    //------------------------------------
    const options = {
      filters: [{ namePrefix: 'HLK-LD2410' }, { services: [SEND_SERVICE] }],
    }
    //console.log('Bluetooth', options.filters[0])
    await navigator.bluetooth
      .requestDevice(options)
      .then((device) => {
        myDevice = device
        myDeviceName = device.name
        document.getElementById('device-name').innerHTML = device.name
        console.log('Connect device:', device.name)
        return device.gatt.connect()
      })
      .then((server) => server.getPrimaryService(SEND_SERVICE))
      .then((service) => service.getCharacteristics())
      .then((characteristics) => {
        //let queue = Promise.resolve()
        characteristics.forEach((characteristic) => {
          switch (characteristic.uuid) {
            case BluetoothUUID.getCharacteristic(READ_SERVICE_CHARACTERISTIC):
              characteristic.startNotifications()
              readCharacteristic = characteristic
              characteristic.addEventListener(
                'characteristicvaluechanged',
                handleNotificationEvents
              )
              console.log('Notifications been started.')
              break
            case BluetoothUUID.getCharacteristic(SEND_SERVICE_CHARACTERISTIC):
              writeCharacteristic = characteristic
              console.log('writeCharacteristic') //, writeCharacteristic)
              setPassword()
              bluetoothConnect = true
              currentCmd = 0
              RxTail = 0
              //-----------------------------------------------------------
              typeAreaText('Connect device ' + myDeviceName + ': Ok!')
              $('#startRefresh')
                .prop('innerHTML', 'Connect')
                .css({ color: '#cac8c8' })
              $('#clickme')
                .prop('innerHTML', 'Disconnect Bluetooth device')
                .css({ color: '#d60000' })
              //-----------------------------------------------------------
              setTimeout(() => {
                cmdPattern.curr = 0
                cmdPattern.cmd = [0x0061, 0x00a0, 0x00ab, 0x00fe]
                cmdPattern.data = [[], [], [], []]
                //console.log('cmdPattern BLE: ', cmdPattern)
                sendCmdToDevice(0x00ff, [1, 0])
              }, 300)
              //----------------------------------------------------------
              break
            default:
              log('> Unknown Characteristic: ' + characteristic.uuid)
          }
        })
      })
      .catch((error) => {
        console.error(error)
        setDisconnect()
      })
  } else {
    if (myDevice) {
      setDisconnect()
    }
    //typeAreaText('Disconnect device ' + myDeviceName + '!')
    $('#clickme')
      .prop('innerHTML', 'Connect Bluetooth device')
      .css({ color: '#00a51b' })
  }

  // if (device.name) {
  //   listItem = document.createElement('li')
  //   listItem.innerHTML = device.name
  //   bleDeviceList.appendChild(listItem)
  // }
}

document.getElementById('clickme').addEventListener('click', testIt)

// document
//   .getElementById('click_startConf')
//   .addEventListener('click', setStartConfCommand)
// document
//   .getElementById('click_stopConf')
//   .addEventListener('click', setStopConfCommand)
// document
//   .getElementById('click_stopNotification')
//   .addEventListener('click', setStopNotification)

//==========================================================================
function handleNotificationEvents(event) {
  //const eventData = event.target.value.getUint8(14)
  //let eventData = []
  //let len = event.target.value.byteLength

  // for (i = 0; i < len; i++) {
  //   eventData[i] = decToHex(event.target.value.getUint8(i))
  // }
  // console.log(eventData)
  let value = event.target.value
  let a = []
  for (let i = 0; i < value.byteLength; i++) {
    a.push(value.getUint8(i))
  }
  //console.log('> ', a)
  myFuncPostCOM(a)
}
//===================================================
function setDisconnect() {
  if (myDevice) {
    writeCharacteristic = undefined
    readCharacteristic = undefined
    bluetoothConnect = false
    console.log('Disconnect:', myDeviceName)
    typeAreaText('Disconnect device: ' + myDeviceName)
    $('#startRefresh').prop('innerHTML', 'Connect').css({ color: '#008f18' })
    myDeviceName = undefined

    myDevice.gatt.disconnect()
    myDevice = undefined
  }
}
//===================================================
function setPassword() {
  const data = Uint8Array.of(
    0xfd,
    0xfc,
    0xfb,
    0xfa,
    0x08,
    0x00,
    0xa8,
    0x00,
    0x48,
    0x69,
    0x4c,
    0x69,
    0x6e,
    0x6b,
    0x04,
    0x03,
    0x02,
    0x01
  ) //Password: HiLink
  //console.log('Data password: HiLink', data)
  return writeCharacteristic.writeValue(data)
}
//===================================================
function setStartConfCommand() {
  const data = Uint8Array.of(
    0xfd,
    0xfc,
    0xfb,
    0xfa,
    0x04,
    0x00,
    0xff,
    0x00,
    0x01,
    0x00,
    0x04,
    0x03,
    0x02,
    0x01
  ) // Enabling configuration commands
  console.log('Enabling configuration')
  return writeCharacteristic.writeValue(data)
}
//===================================================
function setStopConfCommand() {
  const data = Uint8Array.of(
    0xfd,
    0xfc,
    0xfb,
    0xfa,
    0x02,
    0x00,
    0xfe,
    0x00,
    0x04,
    0x03,
    0x02,
    0x01
  ) // End configuration commands
  console.log('End configuration commands')
  return writeCharacteristic.writeValue(data)
}
//===================================================
function setNotification() {
  navigator.bluetooth // Notifications
    .requestDevice({
      filters: [{ name: MY_BLUETOOTH_NAME }, { services: [SEND_SERVICE] }],
    })
    .then((device) => {
      myDevice = device
      console.log('myDevice', device.name)
      return device.gatt.connect()
    })
    .then((server) => server.getPrimaryService(SEND_SERVICE))
    .then((service) => service.getCharacteristic(READ_SERVICE_CHARACTERISTIC))
    .then((characteristic) => characteristic.startNotifications())
    .then((characteristic) => {
      readCharacteristic = characteristic
      characteristic.addEventListener(
        'characteristicvaluechanged',
        handleNotificationEvents
      )
      console.log('Notifications been started.')
      //return characteristic.readValue()
    })
}
//===================================================
function setStopNotification() {
  readCharacteristic.stopNotifications()
  readCharacteristic.removeEventListener(
    'characteristicvaluechanged',
    handleNotificationEvents
  )
  console.log('Stop notification events.')
}
//===================================================
