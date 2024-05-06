var $ = (jQuery = require('jquery'))
require('jstree')
require('jstreegrid')
//const { privateDecrypt } = require('crypto')
const fs = require('fs')
const path = require('path')
const ipcRend = require('electron').ipcRenderer
//==========================================================================
const Chart = require('chart.js')
//==========================================================================
//const os = require('os')
const storage = require('electron-json-storage')
//==========================================================================
let flagComConn = false
let flagComSet = false
let comPorts_len_old = 0
var comPorts = []
var { SerialPort } = require('serialport')
var comPort = 0

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (err) {
      console.log(err.message)
      return
    } else {
      //console.log('no err')
    }
    if (ports.length === 0) {
      console.log('No ports discovered')
    }

    comPorts = []
    //console.log('selComPort', selComPort)
    for (const i in ports) {
      comPorts[i] = ports[i].path
    }
  })
}
//==========================================================================
var fileFavor = ''
let filePath = ''
var addFavor = false
var currFavor
var nodeTable1
var sensTable
let timeOutRxConnect = 0
let timeOutRxtail = 0
let timeOutPktCalcSecond = 0
let timeOutCmdError = 0
let timeOutComPort = 0
let timeOutBoudRateSelect = 0
let pktRxCount = 0
let pktRxSec = 0
let numComPort = ''
let numBoudRate = 0
let flagEnginMode = false
let clearShowSF = false
//-----------------------
var cmdPattern = {
  curr: 0,
  cmd: [],
  data: [],
}
//-----------------------
var currentDataChart1 = {
  labels: [],
  datasets: [],
}
var currentDataChart2 = {
  labels: [],
  datasets: [],
}
var currentDataChart3 = {
  labels: [],
  datasets: [],
}
//=========================================== Инициализация графика 1
let ctx = document.getElementById('myChart1').getContext('2d')
var myChart1 = new Chart(ctx, {
  type: 'line',
  data: currentDataChart1,
  options: {
    responsive: true,
    animation: false,
    scaleOverride: false,
    scaleSteps: 1,
    scaleStepWidth: 1,
    //maintainAspectRatio: true,
    // scaleStartValue: 0,
    // layout: {
    //   autoPadding: false,
    // },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Moving taget',
      },
    },
    // interaction: {
    //   intersect: true,
    // },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
          //text: 'Gate',
        },
      },
      y: {
        display: true,
        title: {
          display: false,
          //text: 'Level',
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  },
})
//=========================================== Инициализация графика 2
ctx = document.getElementById('myChart2').getContext('2d')
var myChart2 = new Chart(ctx, {
  type: 'line',
  data: currentDataChart2,
  options: {
    responsive: true,
    animation: false,
    scaleOverride: false,
    scaleSteps: 1,
    scaleStepWidth: 1,
    // scaleStartValue: 0,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Stationary taget',
      },
    },
    // interaction: {
    //   intersect: true,
    // },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
          //text: 'Gate',
        },
      },
      y: {
        display: true,
        title: {
          display: false,
          //text: 'Level',
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  },
})
//=========================================== Инициализация графика 3
var chartOptions = {
  indexAxis: 'y',
  scaleOverride: true,
  scales: {
    xAxes: {
      // id: 'x_dist',
      // id: 'x_energ',
      //barPercentage: 0.5,
      //categoryPercentage: 0.6,
      //suggestedMin: 0,
      //suggestedMax: 700,
      min: 0,
      max: 700,
      ticks: {
        beginAtZero: true,
        stepSize: 100,
      },
    },
  },
  elements: {
    rectangle: {
      borderSkipped: 'left',
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
      text: 'Detect distance (cm)',
    },
  },
}

ctx = document.getElementById('myChart3').getContext('2d')
var myChart3 = new Chart(ctx, {
  type: 'bar',
  data: currentDataChart3,
  options: chartOptions,
  // options: {
  //   indexAxis: 'y',
  //   responsive: true,
  //   animation: false,
  //   scaleOverride: false,
  //   scaleSteps: 1,
  //   scaleStepWidth: 1,
  //   // scaleStartValue: 0,
  //   plugins: {
  //     legend: {
  //       display: false,
  //     },
  //     title: {
  //       display: false,
  //       text: 'Detect distance (cm)',
  //     },
  //   },
  //   interaction: {
  //     intersect: true,
  //   },
  //   scales: {
  x: {
    display: true,
    title: {
      display: false,
      //text: 'Gate',
    },
  },
  //     y: {
  //       display: true,
  //       title: {
  //         display: false,
  //         //text: 'Level',
  //       },
  suggestedMin: 0,
  suggestedMax: 100,
  //     },
  //   },
  // },
})
//===================================================
//listSerialPorts()
loadConfigInit()
//===================================================
$('a#enginMode').click(function () {
  //console.log('selectCheck: ', numCheck, flagComConn)
  if (!flagComConn && !bluetoothConnect) {
    console.log('[selectCheck] COM(BLE) port: ', flagComConn)
    typeAreaText('COM(BLE) port not connected!')
    return
  }
  let cmd
  if (!flagEnginMode) {
    cmd = 0x0062
  } else {
    cmd = 0x0063
  }
  cmdPattern.curr = 0
  cmdPattern.cmd = [cmd, 0x00fe]
  cmdPattern.data = [[], []]
  sendCmdToDevice(0x00ff, [1, 0])
  const strCmd = `${decToHex(cmdPattern.cmd[0])}`.replace('0x', '0x00')
  typeAreaText('Command ' + strCmd + ' sent: Ok!')
  timeOutCmdError = setTimeout(() => {
    const strCmd = `${decToHex(cmdPattern.cmd[0])}`.replace('0x', '0x00')
    typeAreaText('Command ' + strCmd + ' sent: Error!')
    RxTail = 0
    RxBuf = []
    sendCmdToDevice(0x00fe, [])
  }, 2000)

  //console.log('cmdPattern 1: ', cmdPattern)
})
//===================================================
function selectComPort(selectObject) {
  if (flagComConn) {
    console.log('selectComPort 2: ', numComPort, numBoudRate)
    selectElement('selComPort', numComPort)
    return
  }

  var value = selectObject.value
  numComPort = value
  console.log('selectComPort 1: ', numComPort, numBoudRate)
  comPorts_len_old = 0
  //--------------------------------------
  storage.get('config', function (error, data) {
    if (error) throw error
    storage.set(
      'config',
      {
        com: value,
        boud: data.boud,
      },
      function (error) {
        if (error) throw error
      }
    )
  })
}
//------------------------------------------ Connect COM ports
$('a#startRefresh').click(function () {
  if (!flagComSet) {
    console.log('COM port no setting!')
    return
  }
  if (flagComConn) {
    comPort.close()
    flagComConn = false
    setTimeout(() => {
      currentCmd = 0
      RxTail = 0
      RxBuf = []
    }, 500)
    $('#startRefresh').prop('innerHTML', 'Connect').css({ color: '#008f18' })
    console.log('Connect COM port stopped!')
    $('#clickme')
      .prop('innerHTML', 'Connect Bluetooth device')
      .css({ color: '#00a51b' })
    typeAreaText('Connect COM port stopped!')
  } else {
    if (bluetoothConnect) {
      console.log('Bluetooth connection!')
      typeAreaText('COM port connection canceled!')
      return
    }
    clientConnect()
    setTimeout(() => {
      if (flagComConn) {
        console.log('Connect OK!')
        typeAreaText('Connect port ' + numComPort + ': Ok!')
        $('#startRefresh')
          .prop('innerHTML', 'Disconnect')
          .css({ color: '#d60000' })
        $('#clickme')
          .prop('innerHTML', 'Connect Bluetooth device')
          .css({ color: '#cac8c8' })
        document.getElementById('device-name').innerHTML = ''
        //-----------------------------------------------
        cmdPattern.curr = 0
        cmdPattern.cmd = [0x0061, 0x00a0, 0x00ab, 0x00fe]
        cmdPattern.data = [[], [], [], []]
        //console.log('cmdPattern 2: ', cmdPattern)
        sendCmdToDevice(0x00ff, [1, 0])
      }
    }, 300)
  }
  return false
})
//------------------------------------------
function selectBoudRate(selectObject) {
  var value = selectObject.value
  numBoudRate = value
  //currFavor.device.boud = numBoudRate
  //--------------------------------------
  storage.get('config', function (error, data) {
    if (error) throw error
    storage.set(
      'config',
      {
        com: data.com,
        boud: value,
      },
      function (error) {
        if (error) throw error
      }
    )
  })
}
//===================================================
function clientConnect() {
  const boud = numBoudRate
  comPort = new SerialPort(
    {
      path: numComPort,
      baudRate: +boud,
      databits: 8,
      parity: 'none',
    },
    function (err) {
      if (err) {
        console.log('Port Error: ', err.message)
        comPort.close()
        flagComConn = false
        setTimeout(() => {
          currentCmd = 0
          RxTail = 0
          RxBuf = []
        }, 100)
        $('#startRefresh')
          .prop('innerHTML', 'Connect')
          .css({ color: '#008f18' })
        console.log('Connect COM port stopped!')
        typeAreaText('Connect COM port stopped!')
      }
    }
  )
  comPort.on('data', function (data) {
    try {
      flagComConn = true
      myFuncPostCOM(data)
    } catch (err) {
      console.log('Oops! COM port')
    }
  })
}
//=======================================================================
function setStorageData() {
  console.log('setStorageData:')
  storage.set(
    'config',
    {
      com: numComPort,
      boud: numBoudRate,
    },
    function (error) {
      if (error) throw error
    }
  )
}
//--------------------------------------------------------------------
function selectElement(id, valueToSelect) {
  let element = document.getElementById(id)
  element.value = valueToSelect
}
//==================================================
function startTimersSecond() {
  timeOutPktCalcSecond = setInterval(() => {
    //console.log('startTimersSecond')
    pktRxSec = pktRxCount
    pktRxCount = 0
    //    document.getElementById('loadInfo4').innerHTML = `${pktRxSec}`
    $('#loadInfo4').prop('innerHTML', pktRxSec).css({ color: '#e00000' })

    if (!flagComConn) {
      SerialPortsSet()
    }
  }, 1000)
}
//===================================================
function SerialPortsSet() {
  listSerialPorts()
  if (comPorts_len_old != comPorts.length) {
    setTimeout(() => {
      //-------------------------------------------------
      var selComPort = document.getElementById('selComPort')
      const len = selComPort.options.length
      for (let i = 0; i < len; i++) {
        selComPort.remove(0)
      }
      for (const i in comPorts) {
        let newOption = new Option(comPorts[i], comPorts[i])
        selComPort.add(newOption, undefined)
      }
      //-------------------------------------------------
      let i = 0
      let com = 'COM1'
      for (i; i < comPorts.length; i++) {
        if (numComPort == comPorts[i]) {
          com = numComPort
          flagComSet = true
          break
        }
      }
      if (i == comPorts.length) {
        com = 'COM1'
        flagComSet = false
      }
      selectElement('selComPort', com)
      console.log('flagComSet:', flagComSet, numComPort)
      RxTail = 0
      RxBuf = []
    }, 200)
    comPorts_len_old = comPorts.length
  }
}
//========================================================
function typeBuadRateDigit() {
  let couBr = 1
  switch (numBoudRate) {
    case '460800':
      couBr++
    case '256000':
      couBr++
    case '230400':
      couBr++
    case '115200':
      couBr++
    case '57600':
      couBr++
    case '38400':
      couBr++
    case '19200':
      couBr++
    case '9600':
      break
    default:
  }
  return couBr
}
//=================================================== Загрузка и сохранение установок
function loadConfigInit() {
  let filePath = path.join(__dirname, 'init')
  if (filePath.includes('\\app.asar\\'))
    filePath = filePath.replace('\\app.asar\\', '\\')
  //console.log('FilePath:', filePath)

  storage.setDataPath(filePath)
  //console.log('filePath:', filePath)

  storage.has('config', function (error, hasKey) {
    if (error) throw error
    //console.log('hasKey:', hasKey)
    if (!hasKey) {
      fileFavor = ''
      setStorageData()
      return
    }
  })
  storage.get('config', function (error, data) {
    if (error) throw error
    //selectElement('selComPort', 'COM1')
    numComPort = data.com
    numBoudRate = data.boud
    flagEnginMode = false
    selectElement('selBoudRate', data.boud)
    console.log('typeBuadRateDigit:', typeBuadRateDigit())
    $('#dataWindBoudRate')
      .prop('value', typeBuadRateDigit())
      .css({ color: '#008f18' })

    //typeBuadRateDigit()

    //comPorts = []
    SerialPortsSet()
  })
  //-------------------------------------------------------------------
  nodeTable1 = []
  const codeTab = [
    '0x0060',
    '0x0061',
    '0x0064',
    '0x00A0',
    '0x00A1',
    '0x00A2',
    '0x00A3',
    '0x00AA',
    '0x00AB',
  ]
  const nameTab = [
    'Configuration max distance gate & delay',
    'Read: max & sensitivity gate & delay',
    'Configuration sensitivity gate:',
    'Firmware version: ',
    'Set serial port baud rate: ',
    'Restore factory setting',
    'Reboot module',
    'Distance resolution setting: disabled',
    'Query distance resolution: ',
  ]

  for (let i = 0; i < 9; i++) {
    const strSet = {
      code: codeTab[i],
      name: nameTab[i],
    }
    nodeTable1[i] = strSet
  }
  for (let i = 0; i < 9; i++) {
    addRowTab1(nodeTable1[i], i)
  }
  //------------------------------------------
  sensTable = {
    maxDistM: '',
    maxDistS: '',
    delay: '',
    mSens: [],
    sSens: [],
    change: [],
  }
  for (let i = 0; i < 9; i++) {
    sensTable.mSens[i] = ''
    sensTable.sSens[i] = ''
    sensTable.change[i] = false
  }
  for (let i = 0; i < 9; i++) {
    addRowTab2()
  }
  //------------------------------------------
  nodeTableRD = []
  const nameTabRD = [
    'Taget state values:',
    'Moving distance (cm):',
    'Moving energy (max 100):',
    'Stationary distance (cm):',
    'Stationary energy (max 100):',
    'Detect distance (cm):',
  ]

  for (let i = 0; i < 6; i++) {
    nodeTableRD[i] = nameTabRD[i]
  }
  for (let i = 0; i < 6; i++) {
    addRowTab3(nodeTableRD[i], i)
  }
  // console.log('nodeTable1: ', nodeTable1)
  // console.log('sensTable: ', sensTable)
  // console.log('nodeTableRD: ', nodeTableRD)
  //-------------------------------------------chart 1 & 2
  const dataSet1 = {
    data: [],
    borderColor: ['#ff0000'],
    backgroundColor: ['#ff0000'],
    cubicInterpolationMode: 'monotone',
  }
  const dataSet11 = {
    data: [],
    borderColor: ['#ff0000'],
    backgroundColor: ['#ff0000'],
    cubicInterpolationMode: 'monotone',
  }
  const dataSet2 = {
    data: [],
    borderColor: ['#008006'],
    backgroundColor: ['#008006'],
    cubicInterpolationMode: 'monotone',
  }
  const dataSet3 = {
    data: [],
    borderColor: ['#0000ff'],
    backgroundColor: ['#0000ff'],
    cubicInterpolationMode: 'monotone',
  }
  currentDataChart1.datasets = [dataSet1, dataSet2]
  currentDataChart2.datasets = [dataSet11, dataSet3]
  currentDataChart1.labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8']
  currentDataChart2.labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8']

  //----------------------------------------------chart 3
  const dataSet4 = {
    data: [0, 0, 0],
    backgroundColor: [
      'rgba(190, 0, 0, 1)',
      'rgba(190, 0, 0, 0.2)',
      'rgba(0, 160, 0, 1)',
      'rgba(0, 160, 0, 0.4)',
      'rgba(0, 0, 255, 1)',
    ],
  }
  currentDataChart3.datasets = [dataSet4]

  currentDataChart3.labels = ['', '', '', '', '']

  myChart1.data = currentDataChart1
  myChart1.update()
  myChart2.data = currentDataChart2
  myChart2.update()
  myChart3.data = currentDataChart3
  myChart3.update()
  startTimersSecond()
}
//=================================================== Max motion gate
let flagChangeMax = false
let flagChangeSens = false
let flagChangeBoud = false
let indSensTable = 0
//------------------------------------
function paramMax1() {
  const parMax = document.getElementById('paramMax1')
  parMax.blur()
  const tmp = +parMax.value
  if (tmp > 8) {
    parMax.value = sensTable.maxDistM
  } else {
    sensTable.maxDistM = tmp
    parMax.style.color = '#ff0000'
    flagChangeMax = true
    $('#cmdConf_0060').css({ color: '#db0000' })
  }
  //console.log('sensTable1:', sensTable)
}
//=================================================== Max rest gate
function paramMax2() {
  const parMax = document.getElementById('paramMax2')
  parMax.blur()
  const tmp = +parMax.value
  if (tmp > 8) {
    parMax.value = sensTable.maxDistS
  } else {
    sensTable.maxDistS = tmp
    parMax.style.color = '#ff0000'
    flagChangeMax = true
    $('#cmdConf_0060').css({ color: '#db0000' })
  }
  //console.log('sensTable2:', sensTable)
}
//=================================================== Report delay
function paramMax3() {
  const parMax = document.getElementById('paramMax3')
  parMax.blur()
  sensTable.delay = +parMax.value
  parMax.style.color = '#ff0000'
  flagChangeMax = true
  $('#cmdConf_0060').css({ color: '#db0000' })
  //console.log('sensTable3:', sensTable)
}
//=================================================== Moving sens array
function sensWindChange1(id, val) {
  //console.log('sensWindChange1:', id, val)
  const sensChange = document.getElementById(id)
  sensChange.blur()
  const ind = id.replace('sensWind1', '')
  const tmp = +sensChange.value
  if (tmp > 100) {
    sensChange.value = sensTable.mSens[ind]
  } else {
    sensTable.mSens[ind] = tmp
    sensChange.style.color = '#ff0000'
    flagChangeSens = true
    $('#cmdConf_0064').css({ color: '#db0000' })
    if (!sensTable.change[ind]) {
      countConfSens++
      sensTable.change[ind] = true
      $('#countConfSens')
        .prop('innerHTML', countConfSens)
        .css({ color: '#00188f' })
    }
  }
  //console.log('sensTable4:', sensTable)
}
//--------------------------------------------------- Rest sens array
let countConfSens = 0
//------------------------
function sensWindChange2(id, val) {
  //console.log('sensWindChange2:', id, val)
  const sensChange = document.getElementById(id)
  sensChange.blur()
  const ind = id.replace('sensWind2', '')
  const tmp = +sensChange.value
  if (tmp > 100) {
    sensChange.value = sensTable.sSens[ind]
  } else {
    sensTable.sSens[ind] = tmp
    sensChange.style.color = '#ff0000'
    flagChangeSens = true
    $('#cmdConf_0064').css({ color: '#db0000' })
    if (!sensTable.change[ind]) {
      countConfSens++
      sensTable.change[ind] = true
      $('#countConfSens')
        .prop('innerHTML', countConfSens)
        .css({ color: '#00188f' })
    }
  }
  //console.log('sensTable4:', sensTable)
}
//=========================================================
function clickWriteValue(e) {
  const cell = e.target.closest('td')
  if (!cell) return
  const row = cell.parentElement

  row.cells[1].innerHTML = '<img src="img/settings.ico">'

  console.log('clickWriteValue:', row)
}
//===================================================
function configArray(dt1, dt2, dt3) {
  const array = [0, 0, dt1, 0, 0, 0, 1, 0, dt2, 0, 0, 0, 2, 0, dt3, 0, 0, 0]
  return array
}
//===================================================
function configArrayFull(dt2, dt3) {
  const array = [0, 0, 0xff, 0xff, 0, 0, 1, 0, dt2, 0, 0, 0, 2, 0, dt3, 0, 0, 0]
  return array
}
//===================================================
function startCommand(e) {
  const cell = e.target.closest('td')
  if (!cell) {
    return
  }
  const row = cell.parentElement
  const cmd = row.cells[0].innerHTML
  console.log('startCommand:', cmd)

  cmdInt = parseInt(cmd, 16)
  cmdPattern.curr = 0
  cmdPattern.cmd = [cmdInt, 0x00fe]
  cmdPattern.data = [[], []]

  let flagSend = false
  switch (cmd) {
    case '0x0060':
      if (flagChangeMax) {
        const dataCurrent = configArray(
          sensTable.maxDistM,
          sensTable.maxDistS,
          sensTable.delay
        )
        cmdPattern.data = [dataCurrent, []]
        flagSend = true
      } else {
        typeAreaText('Parameter not changed!')
      }
      break
    case '0x0061':
    case '0x00A0':
    case '0x00A3':
    case '0x00AB':
      flagSend = true
      break
    case '0x00A2':
      cmdPattern.curr = 0
      cmdPattern.cmd = [0x00a2, 0x0061, 0x00fe]
      cmdPattern.data = [[], [], []]
      flagSend = true
      break
    case '0x0064':
      if (flagChangeSens) {
        let i = 0
        let k = 0
        let flag = 0
        if (countConfSens) {
          cmdPattern.cmd = []
          cmdPattern.data = []
          for (i = 0; i < 9; i++) {
            if (sensTable.change[i]) {
              if (!flag) {
                indSensTable = i
                flag = 1
              }
              cmdPattern.cmd[k] = 0x0064
              cmdPattern.data[k++] = configArray(
                i,
                sensTable.mSens[i],
                sensTable.sSens[i]
              )
            }
          }
          cmdPattern.cmd[k] = 0x0061
          cmdPattern.data[k++] = []
          cmdPattern.data[k] = []
          cmdPattern.cmd[k] = 0x00fe
        }
        flagSend = true
      } else {
        typeAreaText('Parameter not changed!')
      }
      break
    case '0x00A1':
      if (flagChangeBoud && oldBrDigit != currBrDigit) {
        oldBrDigit = currBrDigit
        cmdPattern.data = [[currBrDigit, 0], []]
        flagSend = true
        clearInterval(timeOutBoudRateSelect)
        console.log(
          'Send cmd 0x00A1 boud rate:',
          currBrDigit,
          convDigitToBoudRate(currBrDigit)
        )
      }
      break
    default:
  }
  if (flagSend) {
    //console.log('startCommand: ', cmdPattern)
    const strCmd = `${decToHex(cmdPattern.cmd[0])}`.replace('0x', '0x00')
    typeAreaText('Command ' + strCmd + ' sent: Ok!')
    sendCmdToDevice(0x00ff, [1, 0])

    timeOutCmdError = setTimeout(() => {
      const strCmd = `${decToHex(cmdPattern.cmd[0])}`.replace('0x', '0x00')
      typeAreaText('Command ' + strCmd + ' ansver: Error!')
      currentCmd = 0
      RxTail = 0
      RxBuf = []
      //sendCmdToDevice(0x00fe, [])
      console.log('timeOutCmdError: ', decToHex(cmdPattern.cmd[0]))
    }, 2000)
  }
}
//===================================================
function convDigitToBoudRate(dig) {
  let strBr = ''
  switch (dig) {
    case 8:
      strBr = '460800'
      break
    case 7:
      strBr = '256000'
      break
    case 6:
      strBr = '230400'
      break
    case 5:
      strBr = '115200'
      break
    case 4:
      strBr = '57600'
      break
    case 3:
      strBr = '38400'
      break
    case 2:
      strBr = '19200'
      break
    case 1:
      strBr = '9600'
      break
    default:
  }
  return strBr
}
//---------------------------------------------------
let currBrDigit = 0
let oldBrDigit = 0
//---------------------------------------------------
function dataWindBoudRate() {
  currBrDigit = typeBuadRateDigit()
  const dataWind = document.getElementById('dataWindBoudRate')
  dataWind.blur()
  const brDig = +dataWind.value
  if (brDig == currBrDigit) {
    $('#dataWindBoudRate').css({ color: '#008f18' })
    $('#cmdConf_00A1').css({ color: '#c7b3b3' })
    flagChangeBoud = false
  } else if (brDig < 9 && brDig) {
    $('#dataWindBoudRate').css({ color: '#dd0000' })
    $('#cmdConf_00A1').css({ color: '#0000bd' })
    currBrDigit = brDig
    flagChangeBoud = true
    typeAreaText(
      'Boud rate ' + convDigitToBoudRate(currBrDigit) + ' select: OK!'
    )
    timeOutBoudRateSelect = setTimeout(() => {
      console.log('timeOutBoudRateSelect!')
      flagChangeBoud = false
      currBrDigit = typeBuadRateDigit()
      $('#dataWindBoudRate')
        .prop('value', currBrDigit)
        .css({ color: '#008f18' })
      $('#cmdConf_00A1').css({ color: '#c7b3b3' })
      typeAreaText(
        'Boud rate ' + convDigitToBoudRate(currBrDigit) + ' select: stopped!'
      )
    }, 30000)
  }

  console.log('dataWindBoudRate:', typeBuadRateDigit(), currBrDigit)
}
//================================================= Добавить строку в таблицу 1
function addRowTab1(node, num) {
  var tableRef = document.getElementById('TableTT')
  let length = tableRef.rows.length
  //------------------------------
  var newRow = tableRef.insertRow(length)
  var newText = document.createTextNode('')
  for (let i = 0; i < 2; i++) {
    var newCell = newRow.insertCell(i)
    switch (i) {
      case 0:
        newText = document.createTextNode(node.code)
        newCell.appendChild(newText)
        break
      case 1:
        if (num == 7) {
          newText = document.createTextNode(node.name)
          newCell.appendChild(newText)
        } else {
          if (num == 3) {
            newCell.innerHTML =
              '<a href="#" class="perCommand1" >' +
              node.name +
              '</a>' +
              '<label class="histWind33"  id ="dataWind1">Vx.xx.xxxxxxxx</label>'
          } else if (num == 4) {
            newCell.innerHTML =
              '<a href="#" class="perCommand4"  id ="cmdConf_00A1">' +
              node.name +
              '</a>' +
              '<input class="histWind2" type="text" id ="dataWindBoudRate" onchange="dataWindBoudRate()" value="x" />'
          } else if (num == 8) {
            newCell.innerHTML =
              '<a href="#" class="perCommand1" >' +
              node.name +
              '</a>' +
              '<label class="histWind33"  id ="dataWind3">x.xx</label>'
          } else if (num == 1) {
            newCell.innerHTML =
              '<a href="#" class="perCommand2" >' + node.name + '</a>'
          } else if (num == 0) {
            newCell.innerHTML =
              '<a href="#" class="perCommand3" id ="cmdConf_0060">' +
              node.name +
              '</a>'
          } else if (num == 2) {
            newCell.innerHTML =
              '<a href="#" class="perCommand3"  id ="cmdConf_0064">' +
              node.name +
              '</a>' +
              '<label class="histWind33"  id ="countConfSens">0</label>'
          } else {
            newCell.innerHTML =
              '<a href="#" class="perCommand1" >' + node.name + '</a>'
          }
          newCell.addEventListener('dblclick', function (e) {
            startCommand(e)
          })
        }
        break
      default:
    }
  }
  length = tableRef.rows.length
  for (let i = 1; i < length; i++) {
    tableRef.rows[i].cells[0].style.color = '#007377'
    tableRef.rows[i].cells[1].style.color = '#0010e9'
  }
}
//================================================= Добавить строку в таблицу 2
function addRowTab2() {
  var tableRef = document.getElementById('TableT')
  let length = tableRef.rows.length
  //------------------------------
  let num = length - 1
  let dist = num * 0.75
  //------------------------------
  var newRow = tableRef.insertRow(length)
  var newText = document.createTextNode('')
  for (let i = 0; i < 4; i++) {
    var newCell = newRow.insertCell(i)
    switch (i) {
      case 0:
        newText = document.createTextNode(num)
        newCell.appendChild(newText)
        break
      case 1:
        newText = document.createTextNode(dist)
        newCell.appendChild(newText)
        break
      case 2:
        newCell.innerHTML =
          '<input class="sensWind" type="text" id ="sensWind1' +
          num +
          '" onchange="sensWindChange1(id, value)" value="" />'
        break
      case 3:
        newCell.innerHTML =
          '<input class="sensWind" type="text" id ="sensWind2' +
          num +
          '" onchange="sensWindChange2(id, value)" value="" />'
        break
      default:
    }
  }
  length = tableRef.rows.length
  for (let i = 1; i < length; i++) {
    tableRef.rows[i].cells[0].style.color = '#1100ff'
    tableRef.rows[i].cells[1].style.color = '#b100a8'
    tableRef.rows[i].cells[2].style.color = '#008f00'
    tableRef.rows[i].cells[3].style.color = '#008f00'
  }
}
//================================================= Добавить строку в таблицу 3
function addRowTab3(node, num) {
  var tableRef = document.getElementById('TableRD')
  let length = tableRef.rows.length
  //------------------------------
  var newRow = tableRef.insertRow(length)
  var newText = document.createTextNode('')
  for (let i = 0; i < 2; i++) {
    var newCell = newRow.insertCell(i)
    switch (i) {
      case 0:
        newText = document.createTextNode(node)
        newCell.appendChild(newText)
        break
      case 1:
        newCell.innerHTML = '<label id="tagLabel' + num + '">0</label>'
        break
      default:
    }
  }
  length = tableRef.rows.length
  for (let i = 0; i < length; i++) {
    tableRef.rows[i].cells[0].style.color = setStyleColor(i)
  }
}
//-------------------------------------------
function setStyleColor(num) {
  let color = '#00'
  switch (num) {
    case 0:
      break
    case 1:
      color = 'rgba(190, 0, 0, 1)'
      break
    case 2:
      color = 'rgba(190, 0, 0, 0.5)'
      break
    case 3:
      color = 'rgba(0, 160, 0, 1)'
      break
    case 4:
      color = 'rgba(0, 160, 0, 0.5)'
      break
    case 5:
      color = 'rgba(0, 0, 255, 1)'
      break
    default:
  }
  return color
}
//==========================================================================
function floatToNumber(flt) {
  var sign = flt < 0 ? 1 : 0
  flt = Math.abs(flt)
  var exponent = Math.floor(Math.log(flt) / Math.LN2)
  var mantissa = flt / Math.pow(2, exponent)
  return (
    (sign << 31) |
    ((exponent + 127) << 23) |
    ((mantissa * Math.pow(2, 23)) & 0x7fffff)
  )
}
//-------------------------------------------------------
function updateTypeFloat(data) {
  let lat = floatToNumber(data)
  return lat
}
//==================================================
function text2Binary(text) {
  var length = text.length,
    output = []
  for (var i = length - 1; i >= 0; i--) {
    var bin = text[i].charCodeAt().toString(16)
    output.push(Array(8 - bin.length + 1).join('') + bin)
  }
  return output.join('')
}
//=========================================================
function typeLabelInfo5(info, color) {
  $('#loadInfo5').prop('innerHTML', info).css({ color: color })
}
//==========================================================================
