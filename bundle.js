(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)


async function get_rate(from = 'btc', to = 'usd') {
  let cachedRate = null
  if (cachedRate) return cachedRate
  
  const rate = Number(await (await fetch(`https://api.price2sheet.com/raw/${from}/${to}`)).text())

  if (!isNaN(rate) && rate > 0) {
    cachedRate = rate
  } else {
    cachedRate = 0 
  }

  return cachedRate
}

module.exports = btc_input_card

async function btc_input_card (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  const on = {
    style: inject,
    data: ondata,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="btc-card"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const container = shadow.querySelector('.btc-card')
  
  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    let {
      currency = "BTC",
      amount = 0,
      usdValue: usd_value = 0,
      balance = 0, 
      showBalance = true
    } = data[0]

    const EXCHANGE_RATE = await get_rate('btc', 'usd')

    container.innerHTML = `
      <div class="header">
        <span class="toggle ${currency === 'BTC' ? 'active' : ''}" data-currency="BTC">BTC</span>
        <span class="toggle ${currency === 'USD' ? 'active' : ''}" data-currency="USD">USD</span>
      </div>

      <div class="main-area"> 
        <div class="amount-row">
          <input type="number" min="0" step="0.0001" value="${currency === 'BTC' ? amount : usd_value}" class="amount-input" />
          <div class="actions">
            <button class="close-btn">✕</button>
            <button class="btn half-btn">Half</button>
            <button class="btn all-btn">All</button>
          </div>
        </div>
        <div class="error"></div>
        ${showBalance ? `<div class="balance">Balance ${balance} BTC</div>` : ""}
        <div class="usd-text">
          You are sending 
          <strong>
            ${currency === 'BTC' ? `USD ${(amount * EXCHANGE_RATE).toFixed(2)}` : `${(usd_value / EXCHANGE_RATE).toFixed(4)} BTC`}
          </strong>
        </div>
      </div>
    `

    const amount_input = container.querySelector('.amount-input')
    const half_btn = container.querySelector('.half-btn')
    const all_btn = container.querySelector('.all-btn')
    const btc_toggle = container.querySelector('[data-currency="BTC"]')
    const usd_toggle = container.querySelector('[data-currency="USD"]')
    const usd_text = container.querySelector('.usd-text strong')
    const close_btn = container.querySelector('.close-btn')
    const error_div = container.querySelector('.error')
    const toggles = container.querySelectorAll('.toggle')
    
    function showError(msg) {
      if (msg) {
        error_div.innerHTML = `<div class="divider"></div>${msg}`
      } else {
        error_div.innerHTML = ""
      }
    }

    function updateValues(newAmountBTC) {
      amount = parseFloat(newAmountBTC) || 0
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      if (amount > balance) {
        showError("Insufficient balance, please add funds to your account")
      } else {
        showError("")
      }
    }

    function updateDisplay(value, curr) {
      amount_input.value = value
      usd_text.textContent = curr === 'BTC'
        ? `USD ${usd_value}`
        : `${amount} BTC`

      toggles.forEach(t => t.classList.remove('active'))
      if (curr === 'BTC') {
        btc_toggle.classList.add('active')
      } else {
        usd_toggle.classList.add('active')
      }
    }

    function onToggleBTC() {
      currency = 'BTC'
      updateDisplay(amount, currency)
    }

    function onToggleUSD() {
      currency = 'USD'
      updateDisplay(usd_value, currency)
    }

    function onHalfClick() {
      amount = balance / 2
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      updateDisplay(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function onAllClick() {
      amount = balance
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      updateDisplay(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function onCloseClick() {
      amount = 0
      usd_value = 0
      updateDisplay(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function onAmountInput() {
      let val = amount_input.value

      if (val < 0) val = ''
      
      if (val > 100000) val = '99999'

      if (val.includes('.')) {
        let [int_part, dec_part] = val.split('.')
        val = int_part.slice(0,1) + '.' + dec_part.slice(0, 8)
      }

      amount_input.value = val

      if (currency === 'BTC') {
        updateValues(val)
      } else {
        usd_value = parseFloat(val) || 0
        amount = usd_value / EXCHANGE_RATE
        
        if (amount > balance) {
          showError("Insufficient balance, please add funds to your account")
        } else {
          showError("")
        }
      }
      usd_text.textContent = currency === 'BTC'
        ? `USD ${usd_value}`
        : `${amount.toFixed(4)} BTC`
    }
    
    btc_toggle.onclick = onToggleBTC
    usd_toggle.onclick = onToggleUSD
    half_btn.onclick = onHalfClick
    all_btn.onclick = onAllClick
    close_btn.onclick = onCloseClick
    amount_input.oninput = onAmountInput 
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
  }
  function fallback_instance (opts) {
    return {
      drive: {
        'style/': {
          'style.css': {
            raw: `
              .btc-card {
                background: #f9f9f9;
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 16px;
                width: 100%;
                box-sizing: border-box;
                margin-top: 15px;
                margin-bottom: 30px;
              }

              .header {
                display: flex;
                gap: 10px;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
              }

              .toggle {
                cursor: pointer;
                color: #888;
                padding-bottom: 2px;
              }

              .toggle.active {
                color: #000;
                border-bottom: 2px solid #000;
              }

              .main-area{
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 110px;              
              }
              
              .amount-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
              }
              .amount-input {
                font-size: 30px;
                font-weight: 500;
                width: 120px;
                text-align: right;
                border: none;
                outline: none;
                background: transparent;
                text-align: right;
           
              }
              .actions {
                display: flex;
                gap: 6px;
                align-items: center;
              }
              .btn {
                border: none;
                background: #000;
                color: #fff;
                padding: 3px 8px;
                font-size: 12px;
                cursor: pointer;
                border-radius: 3px;
              }

              .close-btn {
                background: #000;
                border: none;
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
              }

              .divider {
                width: 100%;
                height: 1px;
                background-color: #000; 
                margin: 2px 0; 
              }

              .error {
                color: #666; /* same as balance text */
                font-size: 13px;
                padding-block: 6px;
              }

              .balance {
                font-size: 12px;
                color: #666;
                padding-bottom:10px;
              }
          
              .usd-text {
                font-size: 14px;
                margin-top: auto;
              }
            `
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          },
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/btc_input_card/btc_input_card.js")
},{"STATE":1}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = button

async function button (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })



  shadow.innerHTML = `
    <button class="btn"></button>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const btn_text = shadow.querySelector('.btn')

  await sdb.watch(onbatch)

  return el

  function fail (data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const {label} = data[0]
    
    btn_text.innerHTML = `
      <div>${label}</div>
    `
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance (opts) {
    return {
      drive: {
      
        'style/': {
          'style.css': {
            raw: `
              .btn {
                width: 100%; /* Fill the container */
                height: 50px;
                background-color: #000;
                color: #fff; /* Make text color white */
                border: none;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.3s;
                margin: 0px;
              }

              .btn:hover {
                background-color: #3f3f3fff;
              }
            `
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/button/button.js")
},{"STATE":1}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const chat_view_header = require('chat_view_header')
const button = require('button') 

module.exports = chat_view

async function chat_view(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Chat View</div>
    <div class="chat-view-container">
      <div class="chat-view-header"></div>
      <div class="request-button"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')

  const header_component = shadow.querySelector('.chat-view-header')
  const request_button_component = shadow.querySelector('.request-button')

  const subs = await sdb.watch(onbatch)

  const header = await chat_view_header(subs[0])
  const request_button = await button(subs[1])

  request_button_component.replaceWith(request_button)  
  header_component.append(header)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
  }
}

function fallback_module() {
  return {
    api,
    _: {
      'chat_view_header': { $: '' },
      'button': { $: '' },
    }
  }

  function api(opts) {

    const chat_view_header = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: opts.value
    }

    const button = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      1: {
        label: 'Request'
      }
    }

    return {
      drive: {
        'style/': {
          'chat_view.css': {
            '$ref': 'chat_view.css'
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      },
      _: {
        chat_view_header,
        button,
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/chat_view/chat_view.js")
},{"STATE":1,"button":3,"chat_view_header":5}],5:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = chat_view_header

async function chat_view_header (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  const on = {
    style: inject,
    data: ondata,
    icons: iconject,

  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="chat_view_header"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.chat_view_header')
  
  
  let dricons = []
  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
  const { avatar, name, code } = data[0]
  row.innerHTML = `
    <div class="container-view-header">
      <div class="container-left">
        <div class="left-icon">
          ${dricons[0] || ''}
        </div>

        <div class="contact-heading">
          <div class="contact-avatar">
            <img src="${avatar}" alt="avatar" />
          </div>
          <div class="contact-info">
            <div class="contact-name">${name}</div>
            <div class="contact-code">${code}</div>
          </div>
        </div>
      </div>
      <div class="right-icon">
        ${dricons[1] || ''}
      </div>
    </div>
  `
}

   function iconject (data) {
    dricons = data
  }
}


function fallback_module () {
  return {
    api: fallback_instance,
  }
  function fallback_instance (opts) {
    return {
        drive: {
          'icons/': {
            'left-arrow.svg': {
              '$ref': 'left-arrow.svg'
            },
            'three-dot.svg':{
              '$ref': 'three-dot.svg'
            }
          },
          'style/':{
            'style.css':{
              raw:  `
              .container-view-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }

              .container-left {
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .left-icon,
              .right-icon {
                cursor: pointer;
              }

              .contact-heading {
                display: flex;
                align-items: center;
                gap: 10px;
              }

              .contact-avatar {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
              }

              .contact-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                border: 1px solid #ccc;
              }

              .contact-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .contact-name {
                font-size: 18px;
                 color: #222;
              }

              .contact-code {
                font-size: 14px;
                color: #666;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 160px;
              }
              `
            }
          },
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/chat_view_header/chat_view_header.js")
},{"STATE":1}],6:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = contact_row

async function contact_row (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  const on = {
    style: inject,
    data: ondata,
    icons: iconject,

  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="contact-row"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.contact-row')
  
  
  let dricons = []
  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const { avatar, name, message, time, unread, online, lightining } = data[0]
    row.innerHTML = `
    <div class="contact-left">
        <div class="contact-avatar">
          <img src="${avatar}" alt="avatar" />
          ${online ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="contact-info">
          <div class="contact-name">${name}</div>
          <div class="contact-message ${unread > 0 ? 'unread-message' : ''}">${message}</div>       
      </div>
      </div>
      <div class="contact-right">
        <div class="contact-time">${time}</div>
        <div class="icon-wrapper  ${!lightining ? 'no-lightning' : ''}">
          ${lightining ? dricons[0]: ' '}
          ${unread > 0 ? `<div class="unread-badge">${unread}</div>` : ''}
        </div>
      </div>` 
  }

   function iconject (data) {
    dricons = data
  }
}


function fallback_module () {
  return {
    api: fallback_instance,
  }
  function fallback_instance (opts) {
    return {
        drive: {
          'icons/': {
            'lightning.svg': {
              '$ref': 'lightning.svg'
            },
          },
          'style/':{
            'style.css':{
              raw:  `
                .contact-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px 0px;
                  font-family: Arial, sans-serif;
                  color: black;
                  width: 100%;
                  box-sizing: border-box;
                  cursor: pointer;
                }

                .contact-left {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }

                .contact-avatar {
                  position: relative;
                  width: 50px;
                  height: 50px;
                  flex-shrink: 0;
                }

                .contact-avatar img {
                  width: 100%;
                  height: 100%;
                  border-radius: 50%;
                  object-fit: cover;
                  border: 1px solid #ccc;

                }

                .online-dot {
                  position: absolute;
                  bottom: 2px;
                  right: 2px;
                  width: 12px;
                  height: 12px;
                  background-color: #00c853; /* green */
                  border: 2px solid white;
                  border-radius: 50%;
                }

                .contact-info {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }

                .contact-name {
                  font-size: 20px;
                  color: #222;
                  line-height: 1.4;
                  
                }

                .contact-message {
                  font-size: 15px;
                  font-weight: normal; /* Default if no unread */
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 180px;
                  display: inline-block;
                }

                .contact-message.unread-message {
                  font-weight: 550;
                }

                .contact-right {
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
                  justify-content: center;
                  gap: 6px;
                }

                .contact-time {
                  font-size: 16px;
                  color: #888;
                }

                .icon-wrapper {
                  position: relative;
                  width: 20px;
                  height: 20px;
                  padding-right: 8px;

                }
                  
                .bolt-icon {
                  width: 100%;
                  height: 100%;
                  display: block;
                }

                .unread-badge {
                  position: absolute;
                  top: -6px;
                  right: -10px;
                  width: 10px;
                  height: 10px;
                  background-color: #FF4343;
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                  border-radius: 50%;
                  padding: 5px 5px;
                  text-align: center;
                  line-height: 1;
                  border: 2px solid white;
                  border-radius: 50%;
                }

                .icon-wrapper.no-lightning .unread-badge {
                  position: static;
                }
            `
            }
          },
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/contact_row/contact_row.js")
},{"STATE":1}],7:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const search_bar = require('search_bar') 
const square_button = require('square_button') 
const contact_row = require('contact_row')


module.exports = contacts_list

async function contacts_list(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Contacts List</div>
    <div class="contact-list-container">
      <div class="contact-list-header">Contacts</div>
      <div class="top-bar"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const contact_list_container = shadow.querySelector('.contact-list-container')
  const top_bar = shadow.querySelector('.top-bar')

  const subs = await sdb.watch(onbatch)
  
  if (subs.length > 0) {
    const search = await search_bar(subs[0])
    const button = await square_button(subs[1])
    top_bar.append(search)
    top_bar.append(button)  
  }

  for (let i = 2; i < subs.length; i++) {
    const contact = await contact_row(subs[i]) 
    contact_list_container.append(contact)
  }

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
  }
}

function fallback_module() {
  return {
    api,
    _: {
      'search_bar': { $: '' },
      'contact_row': { $: '' },
      'square_button': { $: '' }
    }
  }

  function api(opts) {
    const search_bar = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: {
      }
    }

    const square_button = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      1: {
      }
    }

    const contact_row = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'

      }
    }

    opts.value.forEach((contact, index) => {
      contact_row[index + 2] = contact
    })

    return {
      drive: {
        'style/': {
          'contacts_list.css': {
            '$ref': 'contacts_list.css'
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      },
      _: {
        search_bar,
        square_button,
        contact_row
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/contacts_list/contacts_list.js")
},{"STATE":1,"contact_row":6,"search_bar":9,"square_button":11}],8:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = input_field

async function input_field (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  const on = {
    style: inject,
    data: ondata,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="input-field-container"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const container = shadow.querySelector('.input-field-container')
  
  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const { header, placeholder, address } = data[0]
    container.innerHTML = `
        <div class="contact-header">${header}</div>
        <div class="input-field">
          <input
            type="text"
            class="search-input"
            placeholder="${placeholder}"
          />
        </div>
      ` 
      
    const input = container.querySelector('.search-input')

    input.addEventListener('focus', () => {
      if (address) {
        input.value = address
      }
    })
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
  }
  function fallback_instance (opts) {
    return {
      drive: {
        'style/': {
          'style.css': {
            raw: `
              .contact-header {
                font-size: 16px;
                color: #666;
                margin-bottom: 8px;
              }

              .input-field {
                width: 100%;
                display: flex;
              }

              .search-input {
                width: 100%;
                padding: 15px 12px;
                font-size: 18px;
                border: 1px solid #ccc; 
                border-radius: 6px; 
                background-color: #f7f7f7ff; 
                outline: none;
                transition: all 0.3s ease;
              }

              .search-input::placeholder {
                color: #555; 
              }

              .search-input:hover {
                border-color: #999;
                background-color: #eeeeee; 
              }

              .search-input:focus {
                border-color: #666;
                background-color: #ffffff; 
              }
            `
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          },
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/input_field/input_field.js")
},{"STATE":1}],9:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = search_bar

async function search_bar (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  let dricons = []

  shadow.innerHTML = `
  <div class="search-bar">
    <input
      type="text"
      class="search-input"
      placeholder="Search"
      style="border: none; outline: none; font-size: 14px; background: transparent; flex: 1;"
    />
    <div class="search-icon">
      <div class="icon-slot"></div>
    </div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.search-bar')

  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
  }

  function iconject (data) {
    dricons = data
    const icon_slot = shadow.querySelector('.icon-slot')
    if (icon_slot && dricons[0]) {
      icon_slot.innerHTML = dricons[0]
    }
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }
  function fallback_instance (opts) {
    return {
        drive: {
          'icons/':{
            'search.svg':{
              '$ref': 'search.svg'
            }
          },
          'style/':{
            'style.css':{
              raw: `
              .search-bar {
                display: flex;
                align-items: center;  
                justify-content: center; 
                margin-top: 15px;
                width: 330px;
                border: 1px solid gray;
                height: 50px;
                border-radius: 12px;
                margin-bottom: 16px;
              }

              .search-input {
                flex: 1;
                padding: 12px;
                font-size: 16px;
                color: #555;
              }
              .search-icon {
                padding: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }
              `
            }
          },
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/search_bar/search_bar.js")
},{"STATE":1}],10:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const send_button = require('button')
const address_input = require('input_field')
const btc_input_card = require('btc_input_card')

module.exports = send_btc

async function send_btc(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  let dricons = []

  shadow.innerHTML = `
    <div class="component-label">Send BTC</div>
    <div class="send-btc-container">
      <div class="send-btc-header">  
        <div class="title-container"> 
          <div class="send-btc-header">Send BTC</div>
          <div class="btc-icon"></div>
        </div>  
        <div class="x-icon"></div>
      </div>
      <div class="address-input"></div>
      <div class="btc-input-card"></div>
      <div class="send_button"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const send_button_component = shadow.querySelector('.send_button')
  const address_input_component = shadow.querySelector('.address-input')
  const btc_input_card_component = shadow.querySelector('.btc-input-card')

  const subs = await sdb.watch(onbatch)

  const button_component = await send_button(subs[0])
  const address_component = await address_input(subs[1])
  const btc_component = await btc_input_card(subs[2])

  send_button_component.append(button_component)
  address_input_component.append(address_component)
  btc_input_card_component.append(btc_component)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) {
    style.textContent = data[0]
  }

  function iconject (data) {
    dricons = data

    const btc_icon = shadow.querySelector('.btc-icon')
    const x_icon = shadow.querySelector('.x-icon')

    btc_icon.innerHTML = dricons[0]
    x_icon.innerHTML = dricons[1]
  }

  async function ondata(data) {
    
  }
}

function fallback_module() {
  return {
    api,
    _: {
      'button': { $: '' },
      'input_field': { $: '' },
      'btc_input_card': { $: '' },
    }
  }

  function api(opts) {
    
    const button = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      0: {
        label: 'Send'
      }    
    }
    
      
    const input_field = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      1: {
        header: 'Address',
        placeholder: 'Tap to past your address',
        address: 'oiyqwr02816r0175915ijr0912740921u409re2109ru20194',
      }    
    }

    const btc_input_card = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      2: {
        currency: "BTC",
        amount: 0.0002,
        usdValue: "",
        balance: 0.0024, 
        showBalance: true
      }  
    }

    return {
      drive: {
        'icons/': {
          'btc.svg': {
            '$ref': 'btc.svg'
          },
          'x.svg': {
            '$ref': 'x.svg'
          },
        },
        'style/': {
          'send_btc.css': {
            '$ref': 'send_btc.css'
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      },
      _: {
        button,
        input_field,
        btc_input_card
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/send_btc/send_btc.js")
},{"STATE":1,"btc_input_card":2,"button":3,"input_field":8}],11:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = square_button

async function square_button (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  let dricons = []

  shadow.innerHTML = `
    <button class="square-btn">
      <div class="icon-slot"></div>
    </button>
    <style></style>
  `
  const style = shadow.querySelector('style')

  await sdb.watch(onbatch)
  return el

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
  }

  function fail (data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  function iconject (data) {
    dricons = data
    const icon_slot = shadow.querySelector('.icon-slot')
    if (icon_slot && dricons[0]) {
      icon_slot.innerHTML = dricons[0]
    }
  }

}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance (opts) {
    return {
      drive: {
        'icons/': {
          'plus.svg': {
            '$ref': 'plus.svg'
          },
        },
        'style/': {
          'style.css': {
            raw: `
              .square-btn {
                width: 50px;
                height: 50px;
                background-color: #000;
                border: none;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.3s;
                margin: 0px;
              }

              .square-btn:hover {
                background-color: #3f3f3fff;
              }

              .square-btn svg {
                stroke: #fff;
              }
            `
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/square_button/square_button.js")
},{"STATE":1}],12:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = switch_account

async function switch_account (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  let dricons = []

  shadow.innerHTML = `
    <div class="component-label">Switch Account</div>  
    <div class="switch-account-container"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.switch-account-container')

  await sdb.watch(onbatch)
  return el

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const { btc, lightning  } = data[0]
    row.innerHTML = `
      <div class="container-title">
        <div class="title">Switch Account</div>
        <div class="close-icon">${dricons[0]}</div>   
      </div>
      <div class="account-container">
        <div class="btc-icon">${dricons[1]}BTC</div>
        <div class="btc-amount">${parseFloat(btc).toFixed(4)}</div>       
      </div>
      <div class="account-container">
        <div class="lightning-icon">${dricons[2]}Lightning</div>
        <div class="lightning-amount">${parseFloat(lightning).toFixed(4)}</div>       
      </div>
` 
  }

  function fail (data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  function iconject (data) {
    dricons = data
  }

}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance (opts) {
    return {
      drive: {
        'icons/': {
          'x.svg':{
            '$ref': 'x.svg'
          },
          'btc.svg': {
            '$ref': 'btc.svg'
          },
          'lightning.svg': {
            '$ref': 'lightning.svg'
          },
        },
        'style/': {
          'style.css': {
            raw: `
              .component-label{
                font-size: 18px;
                font-weight: bold;
                font-family: Arial, sans-serif;
                margin-block: 10px;
              }

              .switch-account-container {
                border: 1px solid #ccc;
                border-radius: 10px;
                padding: 16px;
                width: 250px;
                background: white;
                font-family: Arial, sans-serif;
                color: black;
              }

              .container-title{
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }

              .container-title svg{
                width: 25px;
                height: 25px;
              }

              .title{
                font-size: 24px;
              }

              .account-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 16px;
                padding-inline: 10px;
                gap: 8px;
                padding-block: 20px;
                border-radius: 8px; /* Optional: for smooth edges */
                transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
              }

              .account-container:hover {
                background-color: #f0f0f0ff;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
                cursor: pointer;
              }

              .btc-icon,
              .lightning-icon {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #2e2e2e;
                font-size: 18px;
                white-space: nowrap;
              }

              .account-container svg {
                width: 25px;
                height: 25px;
                display: inline-block;
                vertical-align: middle;
              }

              .btc-amount,
              .lightning-amount {
                color: #2e2e2e;
                font-size: 18px;
                margin-left: 8px;
                white-space: nowrap;
              }

            `
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/switch_account/switch_account.js")
},{"STATE":1}],13:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const transaction_row = require('transaction_row')

module.exports = transaction_history

async function transaction_history (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Transaction History</div>
    <div class="transaction-history-container">
      <div class="transaction-history-header"> Transactions History </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const containerEl = shadow.querySelector('.transaction-history-container')

  const subs = await sdb.watch(onbatch)
  const grouped = {}
  subs.forEach(sub => {
    const date = (sub.date || 'Unknown').trim() // trim extra spaces
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(sub)
  })
  
  for (const date in grouped) {
    const dateEl = document.createElement('div')
    dateEl.className = 'transaction-date'
    dateEl.innerHTML = `<span>${date}</span>`
    containerEl.appendChild(dateEl)

    for (const sub of grouped[date]) {
      const row = await transaction_row(sub)
      containerEl.appendChild(row)
    }
  }


  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
  }
}


function fallback_module () {
  return {
    api,
    _: {
      'transaction_row':{
        $: ''
      }
    } 
  }
  function api(opts){
    const transaction_row = {
      mapping: {
        style: 'style',
        data: 'data'
      }
    }
    opts.value.forEach((transaction, index) => {
      transaction_row[index] = transaction
    })
    return {
      drive: {
        'style/': {
          'transaction_history.css':{
            '$ref': 'transaction_history.css'
          }
        },
        'data/': {
          'opts.json':{
            raw: opts
          }
        }
      },
      _:{
        transaction_row
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/transaction_history/transaction_history.js")
},{"STATE":1,"transaction_row":15}],14:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const transaction_row = require('transaction_row')

module.exports = transaction_list


async function transaction_list(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Transaction List</div>
    <div class="transaction-list-container">
      <div class="transaction-list-header">  
        <div class="transaction-list-title"> Transactions </div>
        <div class="transaction-list-see-all"> See all</div>
      </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const containerEl = shadow.querySelector('.transaction-list-container')

  const subs = await sdb.watch(onbatch)

  subs.slice(0, 4).forEach(async sub => {
      containerEl.append(await transaction_row(sub))
  })

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) {
    style.textContent =  data[0]
  }

  async function ondata(data) {
  }
}

function fallback_module () {
  return {
    api,
    _: {
      'transaction_row':{
        $: ''
      }
    } 
  }
  function api(opts){
    const transaction_row = {
      mapping: {
        style: 'style',
        data: 'data'
      }
    }
    opts.value.forEach((transaction, index) => {
      transaction_row[index] = transaction
    })
    return {
      drive: {
        'style/': {
          'transaction_list.css':{
            '$ref': 'transaction_list.css'
          }
        },
        'data/': {
          'opts.json':{
            raw: opts
          }
        }
      },
      _:{
        transaction_row
      }
    }
  }
}


}).call(this)}).call(this,"/src/node_modules/transaction_list/transaction_list.js")
},{"STATE":1,"transaction_row":15}],15:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = transaction_row

async function transaction_row (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="transaction-row">
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.transaction-row')
  await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  function getDateLabel(dateString) {
    const today = new Date()
    const target = new Date(dateString)

    const diffInDays = Math.floor(
      (today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'

    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
  }

 async function ondata(data) {
    const { avatar, tid, ttime, tamount, dateString } = data[0] || {}

    const dateLabel = getDateLabel(dateString)

    row.innerHTML = `
      <div class="transaction-detail">
        <div class="transaction-avatar">
          <img src="${avatar}" alt="avatar" />
        </div>
        <div class="transaction-data">
          <div class="transaction-id">${tid}</div>
          <div class="transaction-time">${ttime}</div>
          <div class="transaction-date">${dateLabel}</div> <!-- Auto-calculated -->
        </div>
      </div>  
      <div class="transaction-amount">
        <span>${tamount} ₿</span>
      </div> 
    `
  }

}

function fallback_module () {
  return {
    api
  }
  function api (opts) {
    return {
        drive: {
          'style/':{
            'style.css':{
              raw: `
                .transaction-id {
                  font-size: 20px;
                  margin-top: 2px;
                }
                .transaction-row {
                  display: flex;
                  flex-direction: row;
                  align-items:start;
                  justify-content: space-between;
                  margin-top: 12px;
                  font-size: 14px;
                }
                .transaction-detail{
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 10px;
                }
                .transaction-avatar img {
                  width: 40px;
                  height: 40px;
                  border-radius: 50%; 
                  margin-right: 10px;
                }
                .transaction-data{
                  display: flex;
                  flex-direction: column;
                  text-align: start;
                }
                .transaction-time {
                  color: gray;
                  text-align: start;
                }
                .transaction-amount {
                  font-size: 20px;
                }
              `
            }
          },
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
    }
  }
}


}).call(this)}).call(this,"/src/node_modules/transaction_row/transaction_row.js")
},{"STATE":1}],16:[function(require,module,exports){
const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/main/'
const init_url = prefix + 'src/node_modules/init.js'

fetch(init_url, { cache: 'no-store' }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(arguments, prefix)
  require('./page') // or whatever is otherwise the main entry of our project
})
},{"./page":17}],17:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const contacts_list = require('../src/node_modules/contacts_list')
const transaction_history = require('../src/node_modules/transaction_history')
const transaction_list = require('../src/node_modules/transaction_list')
const chat_view = require('../src/node_modules/chat_view')
const switch_account = require('../src/node_modules/switch_account')
const send_btc = require('../src/node_modules/send_btc')

const state = {}

function protocol(message, notify) {
  const { from } = message
  state[from] = { notify }

  function listen(message) {
    const { type, data } = message
    if (on[type]) on[type](data)
  }

  return listen
}

const on = {
  style: injectStyle,
  value: handleValue
}

function injectStyle (data) {
  console.log('Injecting shared style (if needed)', data)
}

function handleValue (data) {
  console.log(`"${data.id}" value:`, data.value)
}


function onbatch (batch) {
  console.log(' Watch triggered with batch:', batch)
  for (const { type, data } of batch) {
    if (on[type]) {
      on[type](data)
    }
  }
}

console.log(" Before main()")

async function main () {
  console.log(" main() started")

  const subs = await sdb.watch(onbatch)
  const transaction_list_component = await transaction_list(subs[0], protocol)
  const transaction_history_component = await transaction_history(subs[2], protocol)
  const contacts_list_component = await contacts_list(subs[4], protocol)
  const chat_view_compoent = await chat_view(subs[6],protocol)
  const switch_account_component = await switch_account(subs[8], protocol)
  const send_btc_component = await send_btc(subs[10], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;"> 
      <div id="transaction-list-container"></div> 
      <div id="transaction-history-container"></div> 
      <div id="contacts-list-container" ></div>   
      <div id="chat-view-container"></div>
      <div id="switch-account-container"></div>
      <div id="send-btc-container"></div>
    </div>
  `
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#transaction-list-container').appendChild(transaction_list_component)
  page.querySelector('#contacts-list-container').appendChild(contacts_list_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#switch-account-container').appendChild(switch_account_component)
  page.querySelector('#send-btc-container').appendChild(send_btc_component)

  document.body.append(page)
  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {},
    _: {
      '../src/node_modules/transaction_list': {
        $: '',
        0: {
        value: [
                {
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "3TgmbHfn...455p",
                  ttime: "02:15 PM",
                  tamount: "+ 0.03271",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "Mark Kevin",
                  ttime: "03:45 PM",
                  tamount: "- 0.00421",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
                },
                {
                  tid: "7RwmbHfn...455p",
                  ttime: "04:45 PM",
                  tamount: "- 0.03791",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
              ]
            },
            mapping: {
              style: 'style',
              data: 'data'
            }
          },
    '../src/node_modules/transaction_history': {
      $: '',
      0: {
      value: [
              {
                dateString: "2025-08-01",
                tid: "Luis fedrick",
                ttime: "11:30 AM",
                tamount: "+ 0.02456",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-08-01",
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-08-01",
                tid: "Mark Kevin",
                ttime: "03:45 PM",
                tamount: "- 0.00421",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-31",
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-31",
                tid: "Luis fedrick",
                ttime: "11:30 AM",
                tamount: "+ 0.02456",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-31",
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-28",
                tid: "Mark Kevin",
                ttime: "03:45 PM",
                tamount: "- 0.00421",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-08-01",
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-28",
                tid: "Luis fedrick",
                ttime: "11:30 AM",
                tamount: "+ 0.02456",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-29",
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-07-30",
                tid: "Mark Kevin",
                ttime: "03:45 PM",
                tamount: "- 0.00421",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
              },
              {
                dateString: "2025-05-10",
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
              }
            ]
          },
          mapping: {
            style: 'style',
            data: 'data'
          }
        },
  
        '../src/node_modules/contacts_list': {
          $: '',
          0: {
            value: [
              
              {
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3",
                name: 'Mark Kevin',
                message: 'Payment Received successfully',
                time: '3 hr',
                unread: 5,
                online: true,
                lightining: true
              },
              {
                avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
                name: 'David Clark',
                message: 'You have a new message from Mark',
                time: '1 hr',
                unread: 5,
                online: false,
                lightining: false
              },
              {
                avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3",
                name: 'David Clark',
                message: 'Received funds',
                time: '1 hr',
                unread: 0,
                online: true,
                lightining: true
              },
              {
                avatar: "https://tse4.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
                name: 'Sara Ahmed',
                message: 'Invoice sent',
                time: '2 hr',
                unread: 0,
                online: false,
                lightining: false
              }
            ]
          },
          mapping: {
            style: 'style',
            data: 'data'
          }
        },

        '../src/node_modules/chat_view': {
          $: '',
          0: {
            value: {
              avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3",
              name: "David Clark",
              code: "1FfmbHfn...455p"
            }
          },
          mapping: {
            style: 'style',
            data: 'data'
          }
        },
        
        '../src/node_modules/switch_account': {
          $: '',
          0: {
            btc: 0.9862,
            lightning: 0.9000
          },
          mapping: {
            style: 'style',
            data: 'data',
            icons: 'icons'
          }
        },
        '../src/node_modules/send_btc': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
    }
  }
}
}).call(this)}).call(this,"/web/page.js")
},{"../src/node_modules/STATE":1,"../src/node_modules/chat_view":4,"../src/node_modules/contacts_list":7,"../src/node_modules/send_btc":10,"../src/node_modules/switch_account":12,"../src/node_modules/transaction_history":13,"../src/node_modules/transaction_list":14}]},{},[16]);
