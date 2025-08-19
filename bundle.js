(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const general_button = require('general_button')

module.exports = action_buttons

async function action_buttons (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const _ = {
    up: null,
    send_general: null,
    receive_general: null,
    wallet_general: null
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="action-buttons-container">
        <div class="wallet-buttons">
            <div id="wallet-button-container"></div>
        </div>
        <div class="send-receive-buttons">
            <div id="send-button-container"></div> 
            <div id="receive-button-container"></div> 
        </div>
    </div>
    <style></style>
    `


  const style = shadow.querySelector('style')

  const subs = await sdb.watch(onbatch)

  if (protocol) {
    protocol({ from: 'action_buttons', notify: on_message })
  }

  const sendButton = await general_button(subs[0], button_protocol('send_general'))
  const receiveButton = await general_button(subs[1], button_protocol('receive_general'))
  const walletButton = await general_button(subs[2], button_protocol('wallet_general'))

  shadow.querySelector('#send-button-container').replaceWith(sendButton)
  shadow.querySelector('#receive-button-container').replaceWith(receiveButton)
  shadow.querySelector('#wallet-button-container').replaceWith(walletButton)

  _.send_general?.({
    type: 'button_name',
    data: {
      name: 'Send',
      action: 'send_message'
    }
  })

  _.receive_general?.({
    type: 'button_name',
    data: {
      name: 'Receive',
      action: 'receive_message'
    }
  })

  _.wallet_general?.({
    type: 'button_name',
    data: {
      name: 'Wallet',
      action: 'wallet_action'
    }
  })

  const action = {
    send_message,
    receive_message,
    wallet_action
  }

  return el

  // ------------------------- Helpers -------------------------

  function fail (data, type) {
    throw new Error('Invalid message type', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const handler = on[type] || fail
      handler(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const buttonData = data[0]?.value || {}
    // handle incoming button data here 
  }

  function button_protocol (key) {
    return send => {
      _[key] = send
      return on
    }
  }

  function on_message (message) {
    const { type, data } = message
    ;(action[type] || fail)(data, type)
  }



  function send_message (data, type) {
    console.log('Send button clicked - handling send action')
    // send logic
  }

  function receive_message (data, type) {
    console.log('Receive button clicked - handling receive action')
    // receive logic 
  }

  function wallet_action (data, type) {
    console.log('Wallet button clicked - handling wallet action')
    //wallet logic 
  }
}

// ============ Fallback Setup for STATE ============

function fallback_module () {
  return {
    _: {
      'general_button': {
        $: ''
      }
    },
    api: fallback_instance
  }

  function fallback_instance (opts = {}) {
    return {
      _: {
        'general_button': {
          0: '',
          1: '',
          2: '',
          mapping: {
            style: 'style',
            data: 'data'
          }
        }
      },
      drive: {
        'style/': {
          'action_buttons.css': {
            '$ref': 'action_buttons.css'
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
}).call(this)}).call(this,"/src/node_modules/action_buttons/action_buttons.js")
},{"STATE":1,"general_button":10}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)


async function get_rate(from = 'btc', to = 'usd') {
  let cached_rate = null
  if (cached_rate) return cached_rate
  
  const rate = Number(await (await fetch(`https://api.price2sheet.com/raw/${from}/${to}`)).text())

  if (!isNaN(rate) && rate > 0) {
    cached_rate = rate
    console.log("api is working")
  } else {
    console.log("api is returning null value")
  }

  return cached_rate
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
      amount = 0.0000,
      usdValue: usd_value = 0,
      balance = 0, 
      show_balance = true
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
        ${show_balance ? `<div class="balance">Balance ${balance} BTC</div>` : ""}
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

    function update_values(newAmountBTC) {
      amount = parseFloat(newAmountBTC) || 0
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      if (amount > balance) {
        showError("Insufficient balance, please add funds to your account")
      } else {
        showError("")
      }
    }

    function update_display(value, curr) {
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

    function on_toggle_btc() {
      currency = 'BTC'
      update_display(amount, currency)
    }

    function on_toggle_usd() {
      currency = 'USD'
      update_display(usd_value, currency)
    }

    function on_half_click() {
      amount = balance / 2
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      update_display(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function on_all_click() {
      amount = balance
      usd_value = (amount * EXCHANGE_RATE).toFixed(2)
      update_display(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function on_close_click() {
      amount = 0
      usd_value = 0
      update_display(currency === 'BTC' ? amount : usd_value, currency)
      showError("")
    }

    function on_amount_input() {
      let val = amount_input.value;

      if (val < 0) val = '';

      if (val === "" || isNaN(val)) {
        val = "0";
      }

      if (val.includes('.')) {
        let [int_part, dec_part] = val.split('.');
        if (currency === 'BTC') {
          int_part = int_part.slice(0, 5); // Limited to 99,999 BTC
          dec_part = dec_part.slice(0, 8);  // Lowest denomination is 0.00000001 BTC
        } else {
          int_part = int_part.slice(0, 10); // Limited to 1 billion USD
          dec_part = dec_part.slice(0, 1); // Lowest denomination is 0.1 USD
        }
        val = int_part + (dec_part ? '.' + dec_part : '');
      }else {
        if (currency === 'BTC') {
          val = val.slice(0, 5);
        } else {
          val = val.slice(0, 10);
        }
      }

      if (currency === 'BTC') {
        amount = parseFloat(val) || 0;
        usd_value = (amount * EXCHANGE_RATE).toFixed(2);
      } else {
        usd_value = parseFloat(val) || 0;
        amount = +(usd_value / EXCHANGE_RATE).toFixed(8); 
      }

      if (amount > balance) {
        showError("Insufficient balance, please add funds to your account");
      } else {
        showError("");
      }

      usd_text.textContent = currency === 'BTC'
        ? `USD ${usd_value}`
        : `${amount.toFixed(8)} BTC`;
    }

    btc_toggle.onclick = on_toggle_btc
    usd_toggle.onclick = on_toggle_usd
    half_btn.onclick = on_half_click
    all_btn.onclick = on_all_click
    close_btn.onclick = on_close_click
    amount_input.oninput = on_amount_input 
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
                gap: 6px;
              }

              .amount-input {
                font-size: 30px;
                font-weight: 500;
                flex: 1;
                text-align: left;
                border: none;
                outline: none;
                background: transparent;
                min-width: 0; 
              }

              .actions {
                display: flex;
                gap: 6px;
                align-items: center;
                flex-shrink: 0;
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
},{"STATE":1}],4:[function(require,module,exports){
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
},{"STATE":1}],5:[function(require,module,exports){
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
},{"STATE":1,"button":4,"chat_view_header":6}],6:[function(require,module,exports){
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
},{"STATE":1}],7:[function(require,module,exports){
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
},{"STATE":1}],8:[function(require,module,exports){
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
    console.log('contact row subs', subs[i])
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
},{"STATE":1,"contact_row":7,"search_bar":17,"square_button":19}],9:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = footer

async function footer (opts = {}) {
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
    <div class="footer-container"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const footer = shadow.querySelector('.footer-container')

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

    footer.innerHTML = `
      <div class="tab-container">
        <div class="icon">${dricons[0]}</div>   
        <div class="label">Home</div>
      </div>
      <div class="tab-container">
        <div class="icon">${dricons[1]}</div>   
        <div class="label">Contacts</div>
      </div>
      <div class="tab-container">
        <div class="icon">${dricons[2]}</div>   
        <div class="label">Details</div>
      </div>
      <div class="tab-container">
        <div class="icon">${dricons[3]}</div>   
        <div class="label">More</div>
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
          'home.svg':{
            '$ref': 'home.svg'
          },
          'contacts.svg': {
            '$ref': 'contacts.svg'
          },
          'details.svg': {
            '$ref': 'details.svg'
          },
          'more.svg': {
            '$ref': 'more.svg'
          },
        },
        'style/': {
          'style.css': {
            raw: `
                .footer-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fff;
                    border: 1px solid #ccc;
                    border-radius: 12px;
                    padding: 10px;
                    width: 100%;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    box-sizing: border-box; 
                }

                .tab-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    flex: 1;
                }

                .tab-container .icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .tab-container .label {
                    font-size: 12px;
                }

                /* Active (Home) */
                .tab-container:first-child .icon,
                .tab-container:first-child .label {
                    color: #000;
                    fill: #000; /* in case icons are SVG */
                    font-weight: 600;
                }

                /* Inactive (others) */
                .tab-container:not(:first-child) .icon,
                .tab-container:not(:first-child) .label {
                    color: #888;
                    fill: #888;
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

}).call(this)}).call(this,"/src/node_modules/footer/footer.js")
},{"STATE":1}],10:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const switch_account = require('switch_account')  // ✅ require here

module.exports = general_button

async function general_button (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="general-button-container">
      <button class="general-button" type="button">
        <span class="button-text">Button</span>
      </button>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const button = shadow.querySelector('.general-button')

  let send_action = null
  if (protocol) {
    send_action = protocol(msg => on_message(msg))
  }

  // Set up click handler
  button.addEventListener('click', handle_click)

  await sdb.watch(onbatch)

  return el

  // ------------------------- Helpers -------------------------

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  function ondata(data) {
    const buttonData = data[0]?.value || {}
    const { name, action } = buttonData
    console.log(`name "${name}"`)
    update_button(buttonData)
  }

  function on_message({ type, data }) {
    if (type === 'button_name') {
      console.log(`Button "${data.name}", action "${data.action}"`)
      update_button({
        name: data.name,
        action: data.action
      })
    }
  }

  function update_button({ name = 'Button', disabled = false, action = null }) {
    const buttonTextEl = shadow.querySelector('.button-text')

    if (buttonTextEl) {
      buttonTextEl.textContent = name
    }

    if (button) {
      button.disabled = disabled
      button._action = action // Store action for use when clicked
    }
  }

  async function handle_click(event) {
    event.preventDefault()

    if (button._action === 'wallet_action') {
      console.log('Wallet button clicked - opening switch_account')

      const subs = await sdb.watch(onbatch)

      // ✅ load switch_account UI (with fallback support)
      const switchEl = await switch_account(subs[0])

      const container = document.createElement('div')
      container.className = 'switch-account-container'
      container.appendChild(switchEl)
      shadow.appendChild(container)
      return
    }

    if (send_action && button._action) {
      send_action({
        type: button._action,
        data: {
          text: shadow.querySelector('.button-text').textContent
        }
      })
    }
  }
}

// ============ Fallback Setup for STATE ============


function fallback_module() {
  return {
    api,
    _: {
      'switch_account': { $: '' },
    }
  }

  function api(opts) {

    const switch_account = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0:{
        value: {
          btc: 0.9862,
          lightning: 0.9000
        },
      },
    }

    return {
      drive: {
        'style/': {
          'general_button.css': {
            '$ref': 'general_button.css'
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      },
      _: {
        switch_account
   
      }
    }
  }
}


}).call(this)}).call(this,"/src/node_modules/general_button/general_button.js")
},{"STATE":1,"switch_account":20}],11:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const transaction_list = require('transaction_list')
const total_wealth = require('total_wealth')
const action_buttons = require('action_buttons')
const footer = require('footer')
const home_page_header = require('home_page_header')

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
    <div class="component-label">Home Page</div>
    <div class="home-page-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')

  const container = shadow.querySelector('.home-page-container')

  const subs = await sdb.watch(onbatch)
  
  const transaction_list_component = await transaction_list(subs[0])
  const total_wealth_component = await total_wealth(subs[1])
  const action_buttons_component = await action_buttons(subs[2])
  const footer_component = await footer(subs[3])
  const home_page_header_component = await home_page_header(subs[4])

  container.appendChild(home_page_header_component)
  container.appendChild(action_buttons_component)
  container.appendChild(transaction_list_component)
  container.appendChild(total_wealth_component)
  container.appendChild(footer_component)

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
      'transaction_list':{ $: '' },
      'total_wealth':{ $: '' },
      'action_buttons':{ $: '' },
      'footer':{ $: '' },
      'home_page_header':{ $: '' }
    } 
  }
  function api(opts){

    const transaction_list = {
      mapping: {
        style: 'style',
        data: 'data',
      },
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
            avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"     
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
      }
    }
    
    const total_wealth = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: {
        value: {
          total: 0.9862,
          usd: 1000,
          lightning: 0.02456,
          bitcoin: 0.96164
        }
      }
    }

    const action_buttons = {
      mapping: { 
        style: 'style',
        data: 'data'
      },
      0: {
        buttons: [
          { label: 'Send', action: 'send' },
          { label: 'Receive', action: 'receive' },
          { label: 'Wallet', action: 'wallet' }
        ]
      }
    }
   
    const footer = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: ""
    }

    const home_page_header = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: {
        amount: "0.9616"
      } 
    }

    return {
      drive: {
        'style/': {
          'home_page.css':{
            '$ref': 'home_page.css'
          }
        },
        'data/': {
          'opts.json':{
            raw: opts
          }
        }
      },
      _:{
        transaction_list,
        total_wealth,
        action_buttons,
        footer,
        home_page_header
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/home_page/home_page.js")
},{"STATE":1,"action_buttons":2,"footer":9,"home_page_header":12,"total_wealth":21,"transaction_list":23}],12:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = home_page_header

async function home_page_header (opts = {}) {
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
        <div class="header-container">
        <div class="heading">Bitcoin Wallet</div>
        <div class="wallet-row">
        </div>
        </div>
        <style></style>
    `

    const style = shadow.querySelector('style')
    const wallet_row = shadow.querySelector('.wallet-row')

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
        const { amount } = data[0]
        wallet_row.innerHTML = `
            <div class="icon-slot">${dricons[0]}</div>
            <div class="wallet-amount">${amount > 0 ? amount : "0.00"}</div>
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
          'btc.svg': {
            '$ref': 'btc.svg'
          },
        },
        'style/': {
          'style.css': {
            raw: `
              .header-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                font-family: Arial, sans-serif;
              }

              .heading {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                text-align: center;
              }

              .wallet-row {
                display: flex;
                align-items: center;
                gap: 10px;
                justify-content: center;
              }

              .icon-slot svg {
                width: 32px;
                height: 32px;
              }

              .wallet-amount {
                font-size: 28px;
                font-weight: bold;
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

}).call(this)}).call(this,"/src/node_modules/home_page_header/home_page_header.js")
},{"STATE":1}],13:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = input_field

async function input_field (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  let dricons = [] // store icons globally for component

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
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

  function iconject(data) {
    dricons = data 
  }

  async function ondata (data) {
    const { header, placeholder, address, icon } = data[0]

    container.innerHTML = `
        <div class="contact-header">${header}</div>
        <div class="input-field">
          <input
            type="text"
            class="search-input"
            placeholder="${placeholder}"
          />
           ${icon 
            ? `<span class="icon">${dricons[0] || ""}</span>` 
            : ''}
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
        'icons/': {
          'copy.svg': { '$ref': 'copy.svg' },
        },
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
                align-items: center;
                gap: 8px;
                border: 1px solid #ccc; 
                border-radius: 6px; 
                background-color: #f7f7f7ff; 
              }

              .input-icon {
                width: 20px;
                height: 20px;
                cursor: pointer;
              }

              .search-input {
                flex: 1;
                padding: 15px 12px;
                font-size: 18px;
                outline: none;
                border: 0;
                background-color: #f7f7f7ff; 
                border-radius: 6px; 
                transition: all 0.3s ease;
              }

              .search-input::placeholder {
                color: #555; 
              }

              .search-input:hover {
                background-color: #eeeeee; 
              }

              .search-input:focus {
                border-color: #666;
                background-color: #ffffff; 
              }
              
              .icon{
                padding: 5px;
                cursor: pointer;
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
},{"STATE":1}],14:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)


module.exports = qr_code

async function qr_code(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb


  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="qr-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const qr_container = shadow.querySelector('.qr-container')

  await sdb.watch(onbatch)

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
    const {address} = data[0]
    console.log('QR-Code address:', address)
    await render_qr_code(address)
  }

  async function render_qr_code(address) {
    
    const { default: vanillaqr } = await import('/node_modules/vanillaqr/VanillaQR.module.js')

    const qr = new vanillaqr({
      url: address,
      size: 280,
      colorLight: '#ffffffff',
      ecclevel: 4,
      noBorder: true,
    })
    
    qr_container.appendChild(qr.toImage('png')) 
  }
}

function fallback_module() {
  return {
    api
  }

  function api(opts) {
    return {
      drive: {
        'style/': {
          'qr_code.css': {
            raw: ``
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

}).call(this)}).call(this,"/src/node_modules/qr_code/qr_code.js")
},{"STATE":1}],15:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = receipt_row

async function receipt_row(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  let dricons = []

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="receipt-row"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.receipt-row')

  await sdb.watch(onbatch)

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

  function iconject(data) {
    dricons = data 
  }

  async function ondata(data) {
    let { label, value, is_link, is_total } = data[0] || {}

    let valueHtml = value || ""

    if (is_link) {
      valueHtml = `<a href="${value}" target="_blank" class="receipt-link">${value}</a>`
    }

    if (is_total && value) {
      valueHtml = `<span class="btc-icon">${dricons[0] || ""}</span> ${value}`
    }
    
    row.className = `receipt-row ${is_total ? "total" : ""}`

    row.innerHTML = `
      <div class="receipt-label">${label}</div>
      <div class="receipt-value">${valueHtml}</div>
      ${is_total ? "" : `<div class="divider"></div>`}
    `
    
  }

}

function fallback_module() {
  return {
    api: fallback_instance
  }
  function fallback_instance(opts) {
    return {
      drive: {
        'icons/': {
          'btc.svg': { '$ref': 'btc.svg' },
        },
        'style/': {
         'style.css': {
            raw: `
              .receipt-row {
                padding: 8px 0;
                display: flex;
                flex-direction: column;
                gap: 5px;
              }

              .receipt-label {
                color: #6D6E6F;
                font-size: 14px;
                margin-bottom: 4px;
              }

              .receipt-value {
                color: #000000;
                font-size: 18px;
              }

              .receipt-row.total .receipt-value {
                font-size: 28px;
                font-weight: 600;
                color: #000000;
              }

              .receipt-link {
                color: #4479FF;
                text-decoration: none;
                cursor: pointer;
              }

              .btc-icon {
          
                display: inline-block;
                vertical-align: middle;
                margin-right: 6px;
              }

              .divider {
                height: 1px;
                background: #ddd;
                margin-top: 6px;
              }
            `
          }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/receipt_row/receipt_row.js")
},{"STATE":1}],16:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const address_input = require('input_field')
const qr_code = require('qr_code') 

module.exports = receive_btc

async function receive_btc(opts = {}) {
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
    <div class="component-label">Receive BTC</div>
    <div class="receive-btc-container">
      <div class="btc-icon"></div> 
      <div class="qr-code"></div> 
      <div class="address-input"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const address_input_component = shadow.querySelector('.address-input')
  const qr_code_component = shadow.querySelector('.qr-code')

  const subs = await sdb.watch(onbatch)
  
  const qr_component = await qr_code(subs[0])
  const address_component = await address_input(subs[1])

  address_input_component.append(address_component)
  qr_code_component.append(qr_component)


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

  function iconject(data) {
    dricons = data
    const btc_icon = shadow.querySelector('.btc-icon')
    btc_icon.innerHTML = dricons[0]
  }

  async function ondata(data) {

  }
}


function fallback_module() {
  return {
    api,
    _: {
      'input_field': { $: '' },
      'qr_code': { $: '' },
    }
  }

  function api(opts) {
    const qr_code = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      0: {
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT', 
      }    
    }

    const input_field = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      1: {
        header: 'Your bitcoin address',
        placeholder: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        icon: 'apple'
      }    
    }

    return {
      drive: {
        'icons/': {
          'btc.svg': {
            '$ref': 'btc.svg'
          },
        },
        'style/': {
          'receive_btc.css': {
            '$ref': 'receive_btc.css'
          }
        },
        'data/': {
          'opts.json': {
            raw: opts
          }
        }
      },
      _: {
        qr_code,
        input_field
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/receive_btc/receive_btc.js")
},{"STATE":1,"input_field":13,"qr_code":14}],17:[function(require,module,exports){
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
},{"STATE":1}],18:[function(require,module,exports){
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
        icons: 'icons'
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
        balance: 0.0024, 
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
},{"STATE":1,"btc_input_card":3,"button":4,"input_field":13}],19:[function(require,module,exports){
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
},{"STATE":1}],20:[function(require,module,exports){
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
    console.log(btc, lightning, "Chitori bacha")
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
},{"STATE":1}],21:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = total_wealth

async function total_wealth (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)
  
  const {drive} = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }
  
  const el = document.createElement('div')
  const shadow =  el.attachShadow({ mode: 'closed' })

  let dricons = []

  shadow.innerHTML = `
    <div class="total-wealth-container">
      <div class="total-wealth-header">Total wealth</div>
      <div class="total-wealth-value">
        <span>₿ 0.0000</span>
        <div class="total-wealth-usd">= $0</div>
      </div>
      <div class="wallet-row">
        <div class="lightning-icon"></div>
        Lightning Wallet <span>0.0000</span>
      </div>
      <div class="wallet-row">
        <div class="btc-icon"></div>
        Bitcoin Wallet <span>0.0000</span>
      </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  
  await sdb.watch(onbatch)

  return el

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  async function onbatch (batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }

  function inject (data) {
    style.replaceChildren((() => {
      return document.createElement('style').textContent = data[0]
    })())
  }

  function ondata(data) {
    renderValues(data[0]?.value || {})
  }
  

  function renderValues({ total = 0, usd = 1000, lightning = 0, bitcoin = 0 }) {
    shadow.querySelector('.total-wealth-value span').textContent = `₿ ${total.toFixed(4)}`
    shadow.querySelector('.total-wealth-usd').textContent = `= $${usd.toLocaleString()}`
    shadow.querySelectorAll('.wallet-row')[0].querySelector('span').textContent = lightning.toFixed(4)
    shadow.querySelectorAll('.wallet-row')[1].querySelector('span').textContent = bitcoin.toFixed(4)
    
    if (dricons.length) {
      shadow.querySelector('.btc-icon').innerHTML = dricons[0]  // btc.svg
      shadow.querySelector('.lightning-icon').innerHTML = dricons[1] // lightning.svg
    }
  }

  function iconject (data) {
    dricons = data
  }
}

// ============ Fallback Setup for STATE ============

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance (opts = {}) {
    return {
      drive: {
        'icons/':{
          'btc.svg':{
            '$ref': 'btc.svg'
          },
          'lightning.svg':{
            '$ref': 'lightning.svg'
          }
        },
        'style/': {
          'total_wealth.css': {
           '$ref':'total_wealth.css'
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
}).call(this)}).call(this,"/src/node_modules/total_wealth/total_wealth.js")
},{"STATE":1}],22:[function(require,module,exports){
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
},{"STATE":1,"transaction_row":25}],23:[function(require,module,exports){
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
    <!-- <div class="component-label">Transaction List</div> -->
    <div class="transaction-list-container">
      <div class="transaction-list-header">  
        <div class="transaction-list-title"> Transactions </div>
        <div class="transaction-list-see-all"> See all</div>
      </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const container_el = shadow.querySelector('.transaction-list-container')

  const subs = await sdb.watch(onbatch)

  subs.slice(0, 4).forEach(async sub => {
      container_el.append(await transaction_row(sub))
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
      console.log("Transaction Row:", transaction)
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
},{"STATE":1,"transaction_row":25}],24:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const receipt_row = require('receipt_row')

module.exports = transaction_receipt

async function transaction_receipt(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  let dricons = []

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Transaction Receipt</div>
    <div class="receipt-card">
      <div class="receipt-header">
        <div class="title-container">
          <div class="receipt-title">Bitcoin Transaction</div>
          <div class="btc-icon-small"></div>
        </div>
        <div class="close-icon"></div>
      </div>
      <div class="receipt-rows"></div>
      <style></style>
    </div>
  `

  const style = shadow.querySelector('style')
  const rows_el = shadow.querySelector('.receipt-rows')

  const subs = await sdb.watch(onbatch)

  for (let i = 0; i < subs.length; i++) {
    const row = await receipt_row(subs[i]) 
    rows_el.append(row)
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

  function iconject(data) {
    dricons = data
    const btcIcons = shadow.querySelectorAll('.btc-icon-small')
    const closeIcon = shadow.querySelector('.close-icon')

    btcIcons.forEach(el => el.innerHTML = dricons[0])
    closeIcon.innerHTML = dricons[1]                  
  }

  async function ondata(data) {
    
  }
}

function fallback_module() {
  return {
    api,
    _: {
      'receipt_row': { 
        $: '' 
      }
    }
  }

  function api(opts) {
    
    const receipt_row = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      }
    }
    opts.value.forEach((row, index) => {
      receipt_row[index] = row
    })

    return {
      drive: {
        'icons/': {
          'btc.svg': { '$ref': 'btc.svg' },
          'x.svg': { '$ref': 'x.svg' }
        },
        'style/': {
          'transaction_receipt.css': { '$ref': 'transaction_receipt.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
      _: { receipt_row }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/transaction_receipt/transaction_receipt.js")
},{"STATE":1,"receipt_row":15}],25:[function(require,module,exports){
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
},{"STATE":1}],26:[function(require,module,exports){
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
},{"./page":27}],27:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const contacts_list = require('../src/node_modules/contacts_list')
const transaction_history = require('../src/node_modules/transaction_history')
const chat_view = require('../src/node_modules/chat_view')
const switch_account = require('../src/node_modules/switch_account')
const send_btc = require('../src/node_modules/send_btc')
const receive_btc = require('../src/node_modules/receive_btc')
const transaction_receipt = require('../src/node_modules/transaction_receipt')
const home_page = require('../src/node_modules/home_page')


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
  console.log("Subscriptions received:", subs)

  const home_page_component = await home_page(subs[0], protocol)
  const transaction_history_component = await transaction_history(subs[2], protocol)
  const contacts_list_component = await contacts_list(subs[4], protocol)
  const chat_view_compoent = await chat_view(subs[6],protocol)
  const switch_account_component = await switch_account(subs[8], protocol)
  const send_btc_component = await send_btc(subs[10], protocol)
  const receive_btc_component = await receive_btc(subs[12], protocol)
  const transaction_receipt_component = await transaction_receipt(subs[14], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div id="home-page-container"></div> 
      <div id="transaction-list-container"></div> 
      <div id="transaction-history-container"></div> 
      <div id="contacts-list-container" ></div>   
      <div id="chat-view-container"></div>
      <div id="switch-account-container"></div>
      <div id="send-btc-container"></div>
      <div id="receive-btc-container"></div>
      <div id="transaction-receipt-container"></div>
    </div>
  `
  page.querySelector('#home-page-container').appendChild(home_page_component)
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#contacts-list-container').appendChild(contacts_list_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#switch-account-container').appendChild(switch_account_component)
  page.querySelector('#send-btc-container').appendChild(send_btc_component)
  page.querySelector('#receive-btc-container').appendChild(receive_btc_component)
  page.querySelector('#transaction-receipt-container').appendChild(transaction_receipt_component)

  document.body.append(page)
  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {},
    _: {
      '../src/node_modules/home_page': {
        $: '',
        0: '',
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
                avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"
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
                avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"
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
                avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"
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
      
        '../src/node_modules/receive_btc': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/transaction_receipt': {
        $: '',
        0: {
        value: [
              { label: "Sent By", value: "Cypher" },
              { label: "Sent To", value: "Luis fedrick - 1FfmbHfn...455p" },
              { label: "Time & Date", value: "30 June 2025, 09:32 AM" },
              { label: "Transaction Fees", value: "BTC 0.0001" },
              { label: "Recipient Receives", value: "BTC 0.0019" },
              { label: "Blockchain Explorer", value: "https://mempool.space/tx/your_txid_here", is_link: true },
              { label: "Total Amount", value: "BTC 0.0020", is_total: true }
            ]
          },
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
},{"../src/node_modules/STATE":1,"../src/node_modules/chat_view":5,"../src/node_modules/contacts_list":8,"../src/node_modules/home_page":11,"../src/node_modules/receive_btc":16,"../src/node_modules/send_btc":18,"../src/node_modules/switch_account":20,"../src/node_modules/transaction_history":22,"../src/node_modules/transaction_receipt":24}]},{},[26]);
