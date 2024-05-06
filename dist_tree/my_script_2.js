//=============================================================
function sendCmdToDevice(cmd, dt) {
  //const cmdInt = parseInt(cmd, 16)
  //console.log('cmdInt: ', decToHex(cmd), dt)
  let len = 0
  var TxBuf = []
  currentCmd = cmd
  TxBuf[len++] = 0xfd
  TxBuf[len++] = 0xfc
  TxBuf[len++] = 0xfb
  TxBuf[len++] = 0xfa
  TxBuf[len++] = dt.length + 2
  TxBuf[len++] = 0
  TxBuf[len++] = cmd
  TxBuf[len++] = 0
  for (i = 0; i < dt.length; i++) {
    TxBuf[len++] = dt[i]
  }
  TxBuf[len++] = 0x04
  TxBuf[len++] = 0x03
  TxBuf[len++] = 0x02
  TxBuf[len++] = 0x01

  // let dat = []
  // for (i = 0; i < len; i++) {
  //   dat[i] = decToHex(TxBuf[i])
  // }
  //console.log('TxBuf:', decToHex(currentCmd))
  if (flagComConn) {
    setTimeout(() => {
      comPort.write(TxBuf, function (err) {
        if (err) {
          console.log('Error COM sending message : ' + err)
          // comPort.close()
          // flagComConn = false
        }
        RxTail = 0
        RxBuf = []
      })
    }, 10)
  } else if (bluetoothConnect) {
    setTimeout(() => {
      var dt = new Uint8Array(len)
      for (let i = 0; i < len; i++) dt[i] = TxBuf[i]
      writeCharacteristic.writeValue(dt)
      //      console.log('BLE TxBuf:', len, dt)
      RxTail = 0
      RxBuf = []
    }, 10)
  }
}
//===================================================
function ReadWord_16(data, i) {
  const tmp = (data[i] & 0xff) + ((data[i + 1] & 0xff) << 8)
  return tmp
}
//===================================================
function ReadWord_32(data, i) {
  const tmp =
    (data[i] & 0xff) +
    ((data[i + 1] & 0xff) << 8) +
    ((data[i + 2] & 0xff) << 16) +
    ((data[i + 3] & 0xff) << 24)
  return tmp
}
//===================================================
function convByteArrToStr(data, k, len) {
  var buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    buf[i] = data[i + k]
  }
  let td = new TextDecoder('cp1251')
  let str = td.decode(buf)
  return str
}
//================================================
function hexToFloat(str, precision) {
  var number = 0,
    sign,
    order,
    mantiss,
    exp,
    i
  if(str.length <= 6){
    exp = parseInt(str, 16)
    sign = exp >> 16 ? -1 : 1
    mantiss = ((exp >> 12) & 255) - 127
    order = ((exp & 2047) + 2048).toString(2)
    for (i = 0; i < order.length; i += 1) {
      number += parseInt(order[i], 10) ? Math.pow(2, mantiss) : 0
      mantiss--
    }
  } else if (str.length <= 10) {
    exp = parseInt(str, 16)
    sign = exp >> 31 ? -1 : 1
    mantiss = ((exp >> 23) & 255) - 127
    order = ((exp & 8388607) + 8388608).toString(2)
    for (i = 0; i < order.length; i += 1) {
      number += parseInt(order[i], 10) ? Math.pow(2, mantiss) : 0
      mantiss--
    }
  }
  //console.log('number: ', number)
  if (precision === 0 || precision) {
    return (number * sign).toFixed(precision).toString(10)
  }
  return (number * sign).toString(5)
}

//===================================================
function decToHex(dec) {
  if (dec < 0) dec = 0xffffffff + dec + 1
  return '0x' + dec.toString(16).toUpperCase()
}
//===================================================
function typeTagetData(basic) {
  let color = '#fdfcf1'

  switch (basic[0]) {
    case 0:
      break
    case 1:
      color = 'rgba(190, 0, 0, 0.4)'
      break
    case 2:
      color = 'rgba(0, 190, 0, 0.4)'
      break
    case 3:
      color = 'rgba(0, 0, 160, 0.4)'
      break
    default:
  }

  $('#tagLabel0')
    .prop('innerHTML', basic[0])
    .css({ color: '#00', background: color })
  $('#tagLabel1').prop('innerHTML', basic[1]).css({ color: '#d60000' })
  $('#tagLabel2').prop('innerHTML', basic[2]).css({ color: '#ff5959' })
  $('#tagLabel3').prop('innerHTML', basic[3]).css({ color: '#008f18' })
  $('#tagLabel4').prop('innerHTML', basic[4]).css({ color: '#00b600a1' })
  $('#tagLabel5').prop('innerHTML', basic[5]).css({ color: '#0400d6' })

  //console.log('Energy:', RxBuf[11], RxBuf[14])
  //startStopOpros()

  currentDataChart3.datasets[0].data[0] = basic[1]
  currentDataChart3.datasets[0].data[1] = basic[2]
  currentDataChart3.datasets[0].data[2] = basic[3]
  currentDataChart3.datasets[0].data[3] = basic[4]
  currentDataChart3.datasets[0].data[4] = basic[5]

  //console.log('basic:', basic)

  myChart3.data = currentDataChart3
  myChart3.update()
}
//===================================================
function typeEngineeringData(basic) {
  // $('#tagLabel1').prop('innerHTML', basic[7]).css({ color: '#d60000' })
  // $('#tagLabel1').prop('innerHTML', basic[8]).css({ color: '#d60000' })

  for (let i = 0; i < 9; i++)
    currentDataChart1.datasets[1].data[i] = basic[i + 9]
  for (let i = 0; i < 9; i++)
    currentDataChart2.datasets[1].data[i] = basic[i + 18]
  myChart1.data = currentDataChart1
  myChart2.data = currentDataChart2
  myChart1.update()
  myChart2.update()
}
//===========================================================
function convertPacket(dt, point) {
  let mode = dt[6 - point]
  if (mode == 0 || mode > 2) return
  let basic = []
  basic[0] = dt[8 - point]
  basic[1] = ReadWord_16(dt, 9 - point)
  basic[2] = dt[11 - point]
  basic[3] = ReadWord_16(dt, 12 - point)
  basic[4] = dt[14 - point]
  basic[5] = ReadWord_16(dt, 15 - point)

  typeTagetData(basic)
  if (mode == 1) {
    for (let i = 0; i < 21; i++) {
      basic[i + 6] = dt[i + 16 - point]
    }
    typeEngineeringData(basic)
    if (!flagEnginMode) {
      flagEnginMode = true
      $('#enginMode')
        .prop('innerHTML', 'Basic mode (code: 0x0063)')
        .css({ color: '#008f18' })
    }
  } else if (mode == 2) {
    if (flagEnginMode) {
      flagEnginMode = false
      $('#enginMode')
        .prop('innerHTML', 'Engineering mode (code: 0x0062)')
        .css({ color: '#0400d6' })
      setTimeout(() => {
        for (let i = 0; i < 9; i++) {
          currentDataChart1.datasets[1].data[i] = NaN
          currentDataChart2.datasets[1].data[i] = NaN
        }
        myChart1.data = currentDataChart1
        myChart2.data = currentDataChart2
        myChart1.update()
        myChart2.update()
      }, 500)
    }
  }
  // else {
  //   console.log('mode:', mode, decToHex(len))
  // }
}
//===================================================
function typeDataCmd_0060() {
  console.log('typeDataCmd_0060 OK')
  flagChangeMax = false
  $('#cmdConf_0060').css({ color: '#c7b3b3' })
  $('#paramMax1').css({ color: '#008f18' })
  $('#paramMax2').css({ color: '#008f18' })
  $('#paramMax3').css({ color: '#008f18' })
  typeAreaText('Command 0x0060: parameter configuration done!')
}
//===================================================
function typeDataCmd_0064() {
  //console.log('typeDataCmd_0064 OK')
  const id1 = 'sensWind1' + indSensTable
  const id2 = 'sensWind2' + indSensTable
  document.getElementById(id1).style.color = '#008b18'
  document.getElementById(id2).style.color = '#008b18'
  if (countConfSens) countConfSens--
  if (countConfSens) {
    sensTable.change[indSensTable] = false
    for (i = 0; i < 9; i++) {
      if (sensTable.change[i]) break
    }
    if (i > 9) return
    indSensTable = i
    //console.log('typeDataCmd_0064:', countConfSens, indSensTable)
  } else {
    flagChangeSens = false
    $('#cmdConf_0064').css({ color: '#c7b3b3' })
    console.log('typeDataCmd_0064 OK:', countConfSens, indSensTable)
    typeAreaText('Command 0x0064: parameter configuration done!')
    clearInterval(timeOutCmdError)
  }
  $('#countConfSens').prop('innerHTML', countConfSens).css({ color: '#00188f' })
}
//===================================================
function typeDataCmd_00a0(k) {
  let dt = []
  for (let i = k + 5; i < RxBuf.length - 4; i++)
    dt[i - (k + 5)] = decToHex(RxBuf[i])
  //console.log('dt 0x00A0:', k, dt)
  let str = 'V'
  let strCmd = `${dt[1]}`.replace('0x', '')
  str += strCmd + '.'
  //-----------------------------------------------------
  strCmd = `${dt[0]}`.replace('0x', '')
  if (dt[0] < 10) strCmd = `${dt[0]}`.replace('0x', '0')
  str += strCmd + '.'
  //-----------------------------------------------------
  strCmd = `${dt[5]}`.replace('0x', '')
  if (dt[5] < 10) strCmd = `${dt[5]}`.replace('0x', '0')
  str += strCmd
  //-----------------------------------------------------
  strCmd = `${dt[4]}`.replace('0x', '')
  if (dt[4] < 10) strCmd = `${dt[4]}`.replace('0x', '0')
  str += strCmd
  //-----------------------------------------------------
  strCmd = `${dt[3]}`.replace('0x', '')
  if (dt[3] < 10) strCmd = `${dt[3]}`.replace('0x', '0')
  str += strCmd
  //-----------------------------------------------------
  strCmd = `${dt[2]}`.replace('0x', '')
  if (dt[2] < 10) strCmd = `${dt[2]}`.replace('0x', '0')
  str += strCmd
  //-----------------------------------------------------
  $('#dataWind1').prop('innerHTML', str).css({ color: '#000000' })
  typeAreaText('Command 0x00A0 done!')
}
//===================================================
function typeDataCmd_00a1() {
  console.log('typeDataCmd_00A1 OK')
  $('#dataWindBoudRate').css({ color: '#008f18' })
  $('#cmdConf_00A1').css({ color: '#c7b3b3' })
  flagChangeBoud = false
  typeAreaText('Configuration on command 0x00A1: Ok after reset!')
}
//===================================================
function typeDataCmd_0061(k) {
  $('#paramMax1')
    .prop('value', RxBuf[k + 5])
    .css({ color: '#008f18' })
  $('#paramMax2')
    .prop('value', RxBuf[k + 6])
    .css({ color: '#008f18' })
  $('#paramMax3')
    .prop('value', RxBuf[k + 25])
    .css({ color: '#008f18' })
  sensTable.maxDistM = RxBuf[k + 5]
  sensTable.maxDistS = RxBuf[k + 6]
  sensTable.delay = RxBuf[k + 25]

  for (let i = 0; i < 9; i++) {
    const id = '#sensWind1' + `${i}`
    const tmp = RxBuf[i + k + 7]
    sensTable.mSens[i] = tmp
    currentDataChart1.datasets[0].data[i] = tmp
    $(id).prop('value', tmp)
  }
  for (let i = 0; i < 9; i++) {
    const id = '#sensWind2' + `${i}`
    const tmp = RxBuf[i + k + 16]
    sensTable.sSens[i] = tmp
    currentDataChart2.datasets[0].data[i] = tmp
    $(id).prop('value', tmp)
  }
  myChart1.data = currentDataChart1
  myChart2.data = currentDataChart2
  myChart1.update()
  myChart2.update()
  //---------------------------
  //  if (countConfSens) {
  countConfSens = 0
  for (let i = 0; i < 9; i++) {
    sensTable.change[i] = false
    const id = '#sensWind1' + `${i}`
    $(id).css({ color: '#008f18' })
  }
  for (let i = 0; i < 9; i++) {
    const id = '#sensWind2' + `${i}`
    $(id).css({ color: '#008f18' })
  }
  $('#countConfSens').prop('innerHTML', countConfSens).css({ color: '#00188f' })
  //}
  flagChangeMax = false
  flagChangeSens = false
  $('#cmdConf_0060').css({ color: '#c7b3b3' })
  $('#cmdConf_0064').css({ color: '#c7b3b3' })
  typeAreaText('Command 0x0061 done!')
}
//===================================================
function setCommandProc(cmd, k) {
  switch (cmd) {
    case 0xff:
      sendCmdToDevice(
        cmdPattern.cmd[cmdPattern.curr],
        cmdPattern.data[cmdPattern.curr]
      )
      cmdPattern.curr++
      break
    case 0xfe:
      currentCmd = 0
      break
    case 0x62:
      typeAreaText('Command 0x0062 done!')
      break
    case 0x63:
      typeAreaText('Command 0x0063 done!')
      break
    case 0x60:
      typeDataCmd_0060()
      break
    case 0x61:
      typeDataCmd_0061(k)
      break
    case 0x64:
      typeDataCmd_0064()
      // sendCmdToDevice(
      //   cmdPattern.cmd[cmdPattern.curr],
      //   cmdPattern.data[cmdPattern.curr]
      // )
      // cmdPattern.curr++
      break
    case 0xa0:
      typeDataCmd_00a0(k)
      break
    case 0xa1:
      typeDataCmd_00a1()
      break
    case 0xa2:
      typeAreaText('Command 0x00A2 done!')
      break
    case 0xa3:
      typeAreaText('Command 0x00A3 done!')
      break
    case 0xaa:
      sendCmdToDevice(
        cmdPattern.cmd[cmdPattern.curr],
        cmdPattern.data[cmdPattern.curr]
      )
      break
    case 0xab:
      // let dt = []
      // for (let i = 0; i < RxBuf.length; i++) dt[i] = decToHex(RxBuf[i])
      // console.log('RxBuf cmd:', k, dt)
      if (RxBuf[k + 3]) {
        $('#dataWind3').prop('innerHTML', '0.20').css({ color: '#007592' })
      } else {
        $('#dataWind3').prop('innerHTML', '0.75').css({ color: '#007592' })
      }
      typeAreaText('Command 0x00AB done!')
      break
    default:
      if (cmdPattern.curr == cmdPattern.cmd.length) return
      sendCmdToDevice(
        cmdPattern.cmd[cmdPattern.curr],
        cmdPattern.data[cmdPattern.curr]
      )
      console.log(
        'Default cmd:',
        decToHex(cmd) + ',',
        'next cmd:',
        decToHex(cmdPattern.cmd[cmdPattern.curr])
      )
  }
  switch (cmd) {
    case 0x60:
    case 0x61:
    case 0x62:
    case 0x63:
    case 0x64:
    case 0xa0:
    case 0xa1:
    case 0xa2:
    case 0xa3:
    case 0xab:
      // console.log(
      //   'done cmd:',
      //   decToHex(cmd) + ',',
      //   'next cmd:',
      //   decToHex(cmdPattern.cmd[cmdPattern.curr])
      // )
      if (cmdPattern.curr == cmdPattern.cmd.length) return
      sendCmdToDevice(
        cmdPattern.cmd[cmdPattern.curr],
        cmdPattern.data[cmdPattern.curr]
      )
      if (decToHex(cmdPattern.cmd[cmdPattern.curr]) != 0xfe) cmdPattern.curr++
      clearInterval(timeOutCmdError)
      break
    default:
  }
}
//=================================================== Пакет от устройства
let RxBuf = []
let RxTail = 0
let currentCmd = 0
//------------------------------------------------------------
function myFuncPostCOM(msgData) {
  let start = 0
  let end = 0
  let i = 0

  for (let i = 0; i < msgData.length; i++) {
    RxBuf[RxTail++] = msgData[i]
    //RxTail = RxTail + 1
  }
  const size = RxBuf.length
  // if (currentCmd) {
  //   let dt = []
  //   for (let i = 0; i < size; i++) dt[i] = decToHex(RxBuf[i])
  //   console.log(
  //     'msgData:',
  //     decToHex(currentCmd),
  //     msgData.length,
  //     RxBuf.length,
  //     dt
  //   )
  // }
  for (let i = 0; i < size; i++) {
    start = decToHex(ReadWord_32(RxBuf, i))
    end = decToHex(ReadWord_32(RxBuf, i))
    //-----------------------------------------------start cmd
    if (start == 0xfafbfcfd) {
      //console.log('start cmd:')
    }
    //-----------------------------------------------start pkt
    if (start == 0xf1f2f3f4 && currentCmd) {
      //currentCmd = 0
      //RxBuf = []
      //console.log('start pkt:')
    }
    //-----------------------------------------------end cmd
    if (end == 0x01020304 && currentCmd) {
      let cmd = 0
      let dt = []
      let i = 0
      let k = 0
      const tmpCmd = currentCmd | 0x100
      for (i = size - 1; i >= 0; i--) {
        let curr = ReadWord_16(RxBuf, i)
        if (curr == tmpCmd) break
        k++
      }
      if (i == 0) {
        console.log('err i=0:', decToHex(currentCmd), size)
        if (currentCmd != 0x61 && currentCmd != 0xa0 && currentCmd != 0xab) {
          cmd = tmpCmd
        } else {
          RxTail = 0
          RxBuf = []
          break
        }
      } else {
        cmd = decToHex(ReadWord_16(RxBuf, size - k - 1))
        //console.log('received cmd:', decToHex(cmd & 0xff), size - k - 1)
      }
      //------------------------------------------------------
      for (let i = 0; i < size; i++) dt[i] = decToHex(RxBuf[i])
      //console.log(dt)
      //------------------------------------------------------
      setCommandProc(cmd & 0xff, size - k)
      RxTail = 0
      RxBuf = []
      break
    }
    //-----------------------------------------------end pkt
    if (end == 0xf5f6f7f8 && !currentCmd) {
      let dt = []
      // for (let i = 0; i < size; i++) dt[i] = decToHex(RxBuf[i])
      // console.log('RxBuf pkt:', dt)

      let len = 0
      let point = 0
      if (size > 38) {
        len = ReadWord_16(RxBuf, size - 41)
        point = size - 39
      } else if (size > 17) {
        len = ReadWord_16(RxBuf, size - 19)
        point = size - 17
      } else {
        console.log('len err pkt:', size, decToHex(len))
        RxTail = 0
        RxBuf = []
        break
      }
      len = decToHex(len)
      if (len == 0x0d || len == 0x23) {
        for (let i = 0; i < size - point - 4; i++) dt[i] = RxBuf[i + point]
        convertPacket(dt, point)
        pktRxCount++
      } else {
        console.log('err pkt:', size, len)
        for (let i = 0; i < size; i++) dt[i] = decToHex(RxBuf[i])
        console.log(dt)
      }
      RxTail = 0
      RxBuf = []
      break
    }
  }
  //-------------------------------------------------------
  clearInterval(timeOutRxtail)
  timeOutRxtail = setTimeout(() => {
    currentCmd = 0
    RxTail = 0
    RxBuf = []
    if (bluetoothConnect && myDevice) {
      console.log('Bluetooth reconnect!')
      myDevice.gatt.connect()
    } else console.log('Reset timeout!')
    if (flagComConn) sendCmdToDevice(0x00fe, [])
  }, 1000)
  // //-------------------------------
  clearInterval(timeOutRxConnect)
  timeOutRxConnect = setTimeout(() => {
    if (flagComConn) {
      if (comPort) comPort.close()
      flagComConn = false
      $('#startRefresh').prop('innerHTML', 'Connect').css({ color: '#008f18' })
      typeAreaText('COM port not connected!')
      console.log('COM port not connected!')
      //document.getElementById('select').disabled = true
    }
  }, 2000)
}
//==========================================================================
function clearAreaText() {
  $('#myTextArea').html('')
}
//==========================================================================
let countStr = 1
//--------------------------
function typeAreaText(str) {
  var AreaText = document.getElementById('myTextArea')
  var old = AreaText.innerHTML
  const Tegs = [
    '0x0060',
    '0x0061',
    '0x0062',
    '0x0063',
    '0x0064',
    '0x00A0',
    '0x00A1',
    '0x00A2',
    '0x00A3',
    '0x00AA',
    '0x00AB',
  ]
  //-----------------------------------------------------------------
  // var num = parseInt(str.match(/\d+/))
  let k = 0
  //  let num = ''
  let spanStr = ''
  const txtCou =
    '<span class=inText_Err>' + '[' + `${countStr}` + '] ' + '</span>'
  countStr++
  //-----------------------------------------------------------------
  for (const i in Tegs) {
    if (str.includes(Tegs[i])) {
      spanStr = '<span class=inText_Word>' + Tegs[i] + '</span>'
      str = str.replace(Tegs[i], spanStr)
    }
  }
  //-----------------------------------------------------------------
  if (str.includes('Ok')) {
    str = str.replace('Ok', '<span class=inText_Ok>' + ' Ok' + '</span>')
  }
  if (str.includes('done')) {
    str = str.replace('done', '<span class=inText_Ok>' + ' done' + '</span>')
  }
  if (str.includes('Error')) {
    str = str.replace('Error', '<span class=inText_Err>' + ' Error' + '</span>')
  }
  if (str.includes('successful')) {
    str = str.replace(
      'successful',
      '<span class=inText_Suc>' + ' successful' + '</span>'
    )
  }
  if (str.includes('stopped')) {
    str = str.replace(
      'stopped',
      '<span class=inText_Err>' + ' stopped' + '</span>'
    )
  }
  if (str.includes('Completed')) {
    str = str.replace(
      'Completed',
      '<span class=inText_Ok>' + ' Completed' + '</span>'
    )
  }
  if (str.includes('canceled')) {
    str = str.replace(
      'canceled',
      '<span class=inText_Cancel>' + ' canceled' + '</span>'
    )
  }
  //-----------------------------------------------------------------
  const newText = '<div class=customArea>' + txtCou + str + '</div>'
  $('#myTextArea').html(newText + old)
}
//==========================================================================
