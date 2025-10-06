(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const general_button = require('general_button')
const switch_account = require('switch_account')
const send_btc = require('send_btc')      
const receive_btc = require('receive_btc') 

module.exports = action_buttons

async function action_buttons (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const _ = {
    send_general: null,
    receive_general: null,
    wallet_general: null
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="action-buttons-container">
        <div class="wallet-buttons wallet-button-container" id="wallet-button-container">
            <div class="dropdown-container hidden"></div>
        </div>
        <div class="send-receive-buttons">
            <div id="send-button-container">
              <div class="send-dropdown hidden"></div>
            </div> 
            <div id="receive-button-container">
              <div class="receive-dropdown hidden"></div>
            </div> 
        </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const wallet_container = shadow.querySelector('#wallet-button-container')

  // Dropdown elements
  const wallet_dropdown = wallet_container.querySelector('.dropdown-container')
  const send_dropdown = shadow.querySelector('.send-dropdown')
  const receive_dropdown = shadow.querySelector('.receive-dropdown')

  const subs = await sdb.watch(onbatch)

  if (protocol) {
    protocol({ from: 'action_buttons', notify: on_message })
  }

  // Create buttons
  const send_button = await general_button(subs[0], button_protocol('send_general'))
  const receive_button = await general_button(subs[1], button_protocol('receive_general'))
  const wallet_button = await general_button(subs[2], button_protocol('wallet_general'))

  // Insert buttons
  shadow.querySelector('#send-button-container').prepend(send_button)
  shadow.querySelector('#receive-button-container').prepend(receive_button)
  wallet_container.insertBefore(wallet_button, wallet_dropdown)

  // Set default actions
  send_button._action = 'send_message'
  receive_button._action = 'receive_message'
  wallet_button._action = 'wallet_action'

  // Dropdown states
  let send_el = null
  let receive_el = null
  let switch_el = null

  // -------------------- Helpers --------------------

  function close_all_dropdowns(except) {
    if (except !== 'send') send_dropdown.classList.add('hidden')
    if (except !== 'receive') receive_dropdown.classList.add('hidden')
    if (except !== 'wallet') wallet_dropdown.classList.add('hidden')
  }

  function handle_outside_click(event) {
    const target = event.target
    console.log("Clicked element:", target)

    const clicked_inside_dropdown =
      send_dropdown.contains(target) ||
      receive_dropdown.contains(target) ||
      wallet_dropdown.contains(target)

    const clicked_button =
      send_button.contains(target) ||
      receive_button.contains(target) ||
      wallet_button.contains(target)

    console.log("Inside dropdown?", clicked_inside_dropdown)
    console.log("On button?", clicked_button)

    if (!clicked_inside_dropdown && !clicked_button) {
      console.log("Closing all dropdowns")
      close_all_dropdowns(null)
    } else {
      console.log("Keeping dropdown open")
    }
  }

  shadow.addEventListener('click', handle_outside_click)

  // -------------------- Dropdown Toggles --------------------

  // Send button
  send_button.onclick = async (event) => {
    event.stopPropagation()
    if (send_button._action !== 'send_message') return

    if (!send_dropdown.classList.contains('hidden')) {
      send_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('send')

    if (!send_el) {
      send_el = await send_btc(subs[4], {
        onClose: () => send_dropdown.classList.add('hidden')
      })
      send_dropdown.appendChild(send_el)
    }

    send_dropdown.classList.remove('hidden')
  }

  // Receive button
  receive_button.onclick = async (event) => {
    event.stopPropagation()
    if (receive_button._action !== 'receive_message') return

    if (!receive_dropdown.classList.contains('hidden')) {
      receive_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('receive')

    if (!receive_el) {
      receive_el = await receive_btc(subs[5], {
        onClose: () => receive_dropdown.classList.add('hidden')
      })
      receive_dropdown.appendChild(receive_el)
    }

    receive_dropdown.classList.remove('hidden')
  }

  // Wallet button
  wallet_button.onclick = async (event) => {
    event.stopPropagation()
    if (wallet_button._action !== 'wallet_action') return

    if (!wallet_dropdown.classList.contains('hidden')) {
      wallet_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('wallet')

    if (!switch_el) {
      switch_el = await switch_account(subs[3], {
        onClose: () => wallet_dropdown.classList.add('hidden')
      })
      wallet_dropdown.appendChild(switch_el)
    }

    wallet_dropdown.classList.remove('hidden')
  }

  // -------------------- Initial Config --------------------

  _.send_general?.({
    type: 'button_name',
    data: { name: 'Send', action: 'send_message' }
  })

  _.receive_general?.({
    type: 'button_name',
    data: { name: 'Receive', action: 'receive_message' }
  })

  _.wallet_general?.({
    type: 'button_name',
    data: { name: 'Wallet', action: 'wallet_action' }
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
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const handler = on[type] || fail
      handler(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const buttonData = data[0]?.value || {}
  }

  function button_protocol (key) {
    return send => {
      _[key] = send
      return send
    }
  }

  function on_message (message) {
    const { type, data } = message
    ;(action[type] || fail)(data, type)
  }

  // Action handlers
  function send_message (data, type) {
    console.log('Send button clicked - handling send action')
  }

  function receive_message (data, type) {
    console.log('Receive button clicked - handling receive action')
  }

  function wallet_action (data, type) {
    console.log('Wallet button clicked - handling wallet action')
  }
}

// ============ Fallback Setup for STATE ============
function fallback_module () {
  return {
    api,
    _: {
      'general_button': { $: '' },
      'switch_account': { $: '' },
      'send_btc': { $: '' },
      'receive_btc': { $: '' }
    }
  }

  function api (opts = {}) {
    const general_button = {
      mapping: {
        style: 'style',
        data: 'data'
      },
      0: {}, // send button
      1: {}, // receive button
      2: {}  // wallet button
    }

    const switch_account = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      3: {
        btc: 0.789,
        lightning: 0.9000
      } 
    }

    const send_btc = {
      mapping: { 
        style: 'style', 
        data: 'data', 
        icons: 'icons' 
      },
      4: ''
    }

    const receive_btc = {
      mapping: { 
        style: 'style', 
        data: 'data', 
        icons: 'icons' 
      },
      5: ''
    }

    return {
      drive: {
        'style/': {
          'action_buttons.css': { '$ref': 'action_buttons.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
      _: { general_button, switch_account, send_btc, receive_btc }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/action_buttons/action_buttons.js")
},{"STATE":1,"general_button":13,"receive_btc":26,"send_btc":28,"switch_account":30}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const btc_usd_rate = require('btc_usd_rate')

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

    const EXCHANGE_RATE = await btc_usd_rate('btc', 'usd')

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
                margin-bottom: 10px;
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
},{"STATE":1,"btc_usd_rate":5}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = btc_nodes

async function btc_nodes (opts = {}) {
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
    <div class="nodes-card"></div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const container = shadow.querySelector('.nodes-card')

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
  container.innerHTML = `
    <div class="header">
      <div class="dropdown">
        <button class="dropdown-btn">Bitcoin Nodes <span class="arrow"></span></button>
      </div>        
      <button class="close-btn">✕</button>
    </div>
    <div class="node-btn-wrap">
      <button class="node-btn">Node</button>
    </div>
    <div class="tab-indicator">
      <span class="dot active"></span>
      <span class="dot"></span>
    </div>
    <div class="logs-wrap">
      <label>Logs</label>
      <textarea class="logs-textarea"></textarea>
    </div>
  `

  // now insert icon if we already have it
  if (dricons.length) {
    const arrow_icons = shadow.querySelector('.arrow')
    if (arrow_icons) {
      arrow_icons.innerHTML = dricons[0]
    }
  }

  const closeBtn = container.querySelector('.close-btn')
  closeBtn.onclick = () => { container.innerHTML = "" }
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
          'arrow-down.svg': { '$ref': 'arrow-down.svg' },
        },
        'style/': {
          'style.css': { '$ref': 'btc_nodes.css' },
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

}).call(this)}).call(this,"/src/node_modules/btc_nodes/btc_nodes.js")
},{"STATE":1}],5:[function(require,module,exports){
let cached_rate = null

async function btc_usd_rate(from = 'btc', to = 'usd') {
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

module.exports = btc_usd_rate
},{}],6:[function(require,module,exports){
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
},{"STATE":1}],7:[function(require,module,exports){
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
},{"STATE":1,"button":6,"chat_view_header":8}],8:[function(require,module,exports){
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
},{"STATE":1}],9:[function(require,module,exports){
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
},{"STATE":1}],10:[function(require,module,exports){
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
},{"STATE":1,"contact_row":9,"search_bar":27,"square_button":29}],11:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const create_button = require('button')
const btc_input_card = require('btc_input_card')
const input_field = require('input_field')
const templates = require('templates')

module.exports = create_invoice

async function create_invoice(opts = {}) {
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
    <div class="create-invoice-container">
      <div class="create-invoice-header">  
        <div class="title-container"> 
          <div class="create-invoice-header">Create Lightning Invoice</div>
          <div class="btc-icon"></div>
        </div>  
        <div class="x-icon"></div>
      </div>
      <div class="scroll-area">
        <div class="btc-input-card"></div>
        <div class="extra-input1"></div>
        <div class="extra-input2"></div>
        <div class="divider"></div>
        <div class="templates-heading">Use Templates</div>
        <div class="template1"></div>
        <div class="template2"></div>
        <div class="template3"></div>
      </div>
      <div class="create_button"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const create_button_component = shadow.querySelector('.create_button')
  const btc_input_card_component = shadow.querySelector('.btc-input-card')
  const input1_component = shadow.querySelector('.extra-input1')
  const input2_component = shadow.querySelector('.extra-input2')
  const template1_container = shadow.querySelector('.template1')
  const template2_container = shadow.querySelector('.template2')
  const template3_container = shadow.querySelector('.template3')

  const subs = await sdb.watch(onbatch)

  const button_component = await create_button(subs[0])
  const btc_component = await btc_input_card(subs[1])
  const input1 = await input_field(subs[2])
  const input2 = await input_field(subs[3])
  const templates_component1 = await templates(subs[4])
  const templates_component2 = await templates(subs[5])
  const templates_component3 = await templates(subs[6])


  create_button_component.append(button_component)
  btc_input_card_component.append(btc_component)
  input1_component.append(input1)
  input2_component.append(input2)
  template1_container.append(templates_component1)
  template2_container.append(templates_component2)
  template3_container.append(templates_component3)

  const closeBtn = shadow.querySelector('.x-icon')
  if (closeBtn) {
    closeBtn.onclick = () => {
      const dropdown = el.parentNode
      if (dropdown) {
        dropdown.classList.add('hidden')   
      }
    }
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
      'btc_input_card': { $: '' },
      'input_field': { $: '' },
      'templates': { $: '' },
    }
  }

  function api(opts) {
    
    const button = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      0: {
        label: 'Create Invoice'
      }    
    }
    
    const btc_input_card = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      1: {
        balance: 0.0024, 
      }  
    } 

    const input_field = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      2: {
        placeholder: 'Enter invoice title',
      },
      3:{
        placeholder: 'Enter invoice note'
      }

    }

    const templates = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      4: {
        date:"2025-05-10",
        btc: 0.012,
        usd: 200
      },
      5: {
        date:"2024-12-25",
        btc: 0.005,
        usd: 80
      },
      6: {
        date:"2024-01-01",
        btc: 0.01,
        usd: 150
      }
    }

    return {
      drive: {
        'icons/': {
          'lightning.svg': {
            '$ref': 'lightning.svg'
          },
          'x.svg': {
            '$ref': 'x.svg'
          },
        },
        'style/': {
          'create_invoice.css': {
            '$ref': 'create_invoice.css'
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
        btc_input_card,
        input_field,
        templates      
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/create_invoice/create_invoice.js")
},{"STATE":1,"btc_input_card":3,"button":6,"input_field":17,"templates":31}],12:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const address_input = require('input_field')
const button = require('button')

module.exports = details_menu

async function details_menu(opts = {}) {
  const { sdb } = await get(opts.sid)
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
    <div class="details-menu-container">
      <div class="container-title">
        <div class="title">Address</div>
        <div class="close-icon"></div>
      </div>
      <div class="address-input"></div>
      <div class="secret-section">
        <div class="secret-title">Secret Recovery Phrase</div>
        <div class="secret-text-block" contenteditable="true"></div>
      </div>
      <div class="reveal-btn"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const address_input_component = shadow.querySelector('.address-input')
  const reveal_btn_component = shadow.querySelector('.reveal-btn')
  const closeBtn = shadow.querySelector('.close-icon')

  const subs = await sdb.watch(onbatch)
  const address_component = await address_input(subs[0])
  const button_component = await button(subs[1])

  address_input_component.append(address_component)
  reveal_btn_component.append(button_component)

  if (closeBtn) {
    closeBtn.onclick = () => {
      const parent = el.parentNode
      if (parent) {
        parent.classList.add('hidden')
      }
    }
  }

  return el

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
    const closeIcon = shadow.querySelector('.close-icon')
    if (closeIcon) closeIcon.innerHTML = dricons[0]
  }

  async function ondata(data) {
  }

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }
}

function fallback_module() {
  return {
    api,
    _: {
      'input_field': { $: '' },
      'button': { $: '' }
    }
  }

  function api(opts) {
    const input_field = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: {
        placeholder: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        icon: 'apple'
      }
    }

    const button = {
      mapping: {
        style: 'style',
        data: 'data'
      },
      1: {
        label: 'Reveal'
      }
    }

    return {
      drive: {
        'icons/': {
          'x.svg': { '$ref': 'x.svg' },
        },
        'style/': {
          'details_menu.css': {'$ref': 'details_menu.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
      _: { input_field, button }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/details_menu/details_menu.js")
},{"STATE":1,"button":6,"input_field":17}],13:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = general_button

async function general_button (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)

  const {drive} = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow =  el.attachShadow({ mode: 'closed' })

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
  if(protocol){
   send_action = protocol(msg=>on_message(msg))
  }

  // Set up click handler
  button.addEventListener('click', handleClick)

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
    const buttonData = data[0]?.value || {}
    const { name, action } = buttonData
    console.log(`name "${name}"`)
    updateButton(buttonData)
  }

  function on_message({type, data}) {
    if (type === 'button_name') {
      console.log(`Button "${data.name}", action "${data.action}"`)
      
      updateButton({
        name: data.name,
        action: data.action
      })
    }
  }


  function updateButton({ name = 'Button', disabled = false, action = null }) {
  const buttonTextEl = shadow.querySelector('.button-text')
  
  
  if (buttonTextEl) {
    buttonTextEl.textContent = name
  }

  if (button) {
    button.disabled = disabled
    button._action = action // Store action for use when clicked
  }
}


  function handleClick(event) {
    event.preventDefault()

    if(send_action && button._action){
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

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance (opts = {}) {
    return {
      drive: {
        'style/': {
          'general_button.css': {
           '$ref':'general_button.css'
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
}).call(this)}).call(this,"/src/node_modules/general_button/general_button.js")
},{"STATE":1}],14:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const home_page_header = require('home_page_header')
const action_buttons = require('action_buttons')
const transaction_list = require('transaction_list')
const total_wealth = require('total_wealth')

module.exports = home_contents

async function home_contents (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = { style: inject, data: ondata }

  const el = document.createElement('div')
  el.id = "home_contents"
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="home-contents-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const container = shadow.querySelector('.home-contents-container')

  const subs = await sdb.watch(onbatch)

  // ✅ load components in order
  const home_page_header_component = await home_page_header(subs[0])
  const action_buttons_component = await action_buttons(subs[1])
  const transaction_list_component = await transaction_list(subs[2])
  const total_wealth_component = await total_wealth(subs[3])

  // ✅ append all four in order
  container.append(
    home_page_header_component,
    action_buttons_component,
    transaction_list_component,
    total_wealth_component
  )

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(p => drive.get(p).then(f => f.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) { style.textContent = data[0] }
  function ondata(data) {}
  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }
}

function fallback_module () {
  return {
    api,
    _: { 
      'home_page_header': { $: '' },
      'action_buttons': { $: '' },
      'transaction_list': { $: '' },
      'total_wealth': { $: '' }
    }
  }

  function api(opts) {
    const home_page_header = {
      mapping: { style: 'style', data: 'data', icons: 'icons' },
      0: { wallet: 'btc', amount: "0.9616" }
    }

    const action_buttons = {
      mapping: { style: 'style', data: 'data' },
      0: { buttons: { wallet: 'lightning' } }
    }

    const transaction_list = {
      mapping: { style: 'style', data: 'data' },
      0: {
        value: [
       {
            tid: "Luis fedrick",
            ttime: "11:30 AM",
            tamount: "+ 0.02456",
            avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
          },
          {
            tid: "skdmf932ksdmf0234lsd",
            ttime: "02:15 PM",
            tamount: "+ 0.03271",
          },
          {
            tid: "Mark Kevin",
            ttime: "03:45 PM",
            tamount: "- 0.00421",
            avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"     
          },
          {
            tid: "QWErty9834asdLKJhf",
            ttime: "04:45 PM",
            tamount: "- 0.03791",
          },
          {
            tid: "Luis fedrick",
            ttime: "11:30 AM",
            tamount: "+ 0.02456",
            avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
          },    ]
      }
    }

    const total_wealth = {
      mapping: { style: 'style', data: 'data', icons: 'icons' },
      0: {
        value: {
          total: 0.9862,
          usd: 1000,
          lightning: 0.02456,
          bitcoin: 0.96164
        }
      }
    }

    return {
      drive: {
        'style/': { 'home_contents.css': { '$ref': 'home_contents.css' } },
        'data/': { 'opts.json': { raw: opts } }
      },
      _: { home_page_header, action_buttons, transaction_list, total_wealth }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/home_contents/home_contents.js")
},{"STATE":1,"action_buttons":2,"home_page_header":16,"total_wealth":32,"transaction_list":34}],15:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const menu = require('menu')

module.exports = home_page

async function home_page(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = { style: inject, data: ondata }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="home-page-container"></div>
    <style></style>
  `
  const container = shadow.querySelector('.home-page-container')
  const style = shadow.querySelector('style')

  const subs = await sdb.watch(onbatch)
  const menu_component = await menu(subs[0])
  container.appendChild(menu_component)

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(p => drive.get(p).then(f => f.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) { style.textContent = data[0] }
  function ondata(data) {}
  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }
}

function fallback_module() {
  return {
    api,
    _: { menu: { $: '' } }
  }

  function api(opts) {
    const menu = {
      mapping: { style: 'style', data: 'data', icons: 'icons' },
      0: ''
    }

    return {
      drive: {
        'style/': {
          'home_page.css': { '$ref': 'home_page.css' }
        },
        'data/': { 'opts.json': { raw: opts } }
      },
      _: { menu }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/home_page/home_page.js")
},{"STATE":1,"menu":21}],16:[function(require,module,exports){
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
   
        </div>
        <style></style>
    `

    const style = shadow.querySelector('style')
    const container = shadow.querySelector('.header-container')

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
      const { wallet, amount } = data[0]
  
      let heading = ""
      let icon = ""
      let display_amount = amount > 0 ? amount : "0.00"

      if (wallet == "btc"){
        heading = "Bitcoin Wallet"
        icon = dricons[0]
      } else if (wallet == "lightning"){
        heading = "Lightning Wallet"
        icon = dricons[1]
      } else{
        console.log("Wrong wallet")
      }

      container.innerHTML = `
          <div class="heading">${heading}</div>
          <div class="wallet-row">
            <div class="icon-slot">${icon}</div>
            <div class="wallet-amount">${display_amount}</div>
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
},{"STATE":1}],17:[function(require,module,exports){
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
       ${header ? `<div class="contact-header">${header}</div>` : ''}
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
  const copy_icon = container.querySelector('.icon')

  if (copy_icon) {
    copy_icon.onclick = async () => {
      try {
        if (!input.value && address) input.value = address;

        const textToCopy = input.value;
        if (!textToCopy) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          console.log("Copied via navigator.clipboard:", textToCopy);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          console.log("Copied via execCommand fallback:", textToCopy);
        }

      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };
  }
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
              .input-field-container{
                box-sizing: border-box;
              }
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
                box-sizing: border-box;

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
},{"STATE":1}],18:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const general_button = require('general_button')
const switch_account = require('switch_account')
const pay_invoice = require('pay_invoice')      
const create_invoice = require('create_invoice')   // changed here ✅

module.exports = lightning_buttons

async function lightning_buttons (opts = {}, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const _ = {
    pay_general: null,
    create_general: null,
    wallet_general: null
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="lightning-buttons-container">
        <div class="wallet-buttons wallet-button-container" id="wallet-button-container">
            <div class="dropdown-container hidden"></div>
        </div>
        <div class="pay-create-buttons">
            <div id="pay-button-container">
              <div class="pay-dropdown hidden"></div>
            </div> 
            <div id="create-button-container">
              <div class="create-dropdown hidden"></div>
            </div> 
        </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const wallet_container = shadow.querySelector('#wallet-button-container')

  // Dropdown elements
  const wallet_dropdown = wallet_container.querySelector('.dropdown-container')
  const pay_dropdown = shadow.querySelector('.pay-dropdown')
  const create_dropdown = shadow.querySelector('.create-dropdown')

  const subs = await sdb.watch(onbatch)

  if (protocol) {
    protocol({ from: 'lightning_buttons', notify: on_message })
  }

  // Create buttons
  const pay_button = await general_button(subs[0], button_protocol('pay_general'))
  const create_button = await general_button(subs[1], button_protocol('create_general'))
  const wallet_button = await general_button(subs[2], button_protocol('wallet_general'))

  // Insert buttons
  shadow.querySelector('#pay-button-container').prepend(pay_button)
  shadow.querySelector('#create-button-container').prepend(create_button)
  wallet_container.insertBefore(wallet_button, wallet_dropdown)

  // Set default actions
  pay_button._action = 'pay_message'
  create_button._action = 'create_message'
  wallet_button._action = 'wallet_action'

  // Dropdown states
  let pay_el = null
  let create_el = null
  let switch_el = null

  // -------------------- Helpers --------------------

  function close_all_dropdowns(except) {
    if (except !== 'pay') pay_dropdown.classList.add('hidden')
    if (except !== 'create') create_dropdown.classList.add('hidden')
    if (except !== 'wallet') wallet_dropdown.classList.add('hidden')
  }

  function handle_outside_click(event) {
    const target = event.target
    const clicked_inside_dropdown =
      pay_dropdown.contains(target) ||
      create_dropdown.contains(target) ||
      wallet_dropdown.contains(target)

    const clicked_button =
      pay_button.contains(target) ||
      create_button.contains(target) ||
      wallet_button.contains(target)

    if (!clicked_inside_dropdown && !clicked_button) {
      close_all_dropdowns(null)
    }
  }

  shadow.addEventListener('click', handle_outside_click)

  // -------------------- Dropdown Toggles --------------------

  // Pay Invoice button
  pay_button.onclick = async (event) => {
    event.stopPropagation()
    if (pay_button._action !== 'pay_message') return

    if (!pay_dropdown.classList.contains('hidden')) {
      pay_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('pay')

    if (!pay_el) {
      pay_el = await pay_invoice(subs[4], {   // still pay_invoice
        onClose: () => pay_dropdown.classList.add('hidden')
      })
      pay_dropdown.appendChild(pay_el)
    }

    pay_dropdown.classList.remove('hidden')
  }

  // Create Invoice button
  create_button.onclick = async (event) => {
    event.stopPropagation()
    if (create_button._action !== 'create_message') return

    if (!create_dropdown.classList.contains('hidden')) {
      create_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('create')

    if (!create_el) {
      create_el = await create_invoice(subs[5], {   // changed here ✅
        onClose: () => create_dropdown.classList.add('hidden')
      })
      create_dropdown.appendChild(create_el)
    }

    create_dropdown.classList.remove('hidden')
  }

  // Wallet button
  wallet_button.onclick = async (event) => {
    event.stopPropagation()
    if (wallet_button._action !== 'wallet_action') return

    if (!wallet_dropdown.classList.contains('hidden')) {
      wallet_dropdown.classList.add('hidden')
      return
    }

    close_all_dropdowns('wallet')

    if (!switch_el) {
      switch_el = await switch_account(subs[3], {
        onClose: () => wallet_dropdown.classList.add('hidden')
      })
      wallet_dropdown.appendChild(switch_el)
    }

    wallet_dropdown.classList.remove('hidden')
  }

  // -------------------- Initial Config --------------------

  _.pay_general?.({
    type: 'button_name',
    data: { name: 'Pay Invoice', action: 'pay_message' }
  })

  _.create_general?.({
    type: 'button_name',
    data: { name: 'Create Invoice', action: 'create_message' }
  })

  _.wallet_general?.({
    type: 'button_name',
    data: { name: 'Wallet', action: 'wallet_action' }
  })

  const action = {
    pay_message,
    create_message,
    wallet_action
  }

  return el

  // ------------------------- Helpers -------------------------

  function fail (data, type) {
    throw new Error('Invalid message type', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const handler = on[type] || fail
      handler(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    const buttonData = data[0]?.value || {}
  }

  function button_protocol (key) {
    return send => {
      _[key] = send
      return send
    }
  }

  function on_message (message) {
    const { type, data } = message
    ;(action[type] || fail)(data, type)
  }

  // Action handlers
  function pay_message (data, type) {
    console.log('Pay Invoice button clicked - handling pay action')
  }

  function create_message (data, type) {
    console.log('Create Invoice button clicked - handling create action')
  }

  function wallet_action (data, type) {
    console.log('Wallet button clicked - handling wallet action')
  }
}

// ============ Fallback Setup for STATE ============
function fallback_module () {
  return {
    api,
    _: {
      'general_button': { $: '' },
      'switch_account': { $: '' },
      'pay_invoice': { $: '' },
      'create_invoice': { $: '' }   // changed here ✅
    }
  }

  function api (opts = {}) {
    const general_button = {
      mapping: {
        style: 'style',
        data: 'data'
      },
      0: {}, // pay button
      1: {}, // create button
      2: {}  // wallet button
    }

    const switch_account = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      3: {
        btc: 0.789,
        lightning: 0.9000
      } 
    }

    const pay_invoice = {
      mapping: { 
        style: 'style', 
        data: 'data', 
        icons: 'icons' 
      },
      4: ''
    }

    const create_invoice = {   // changed here ✅
      mapping: { 
        style: 'style', 
        data: 'data', 
        icons: 'icons' 
      },
      5: ''
    }

    return {
      drive: {
        'style/': {
          'lightning_buttons.css': { '$ref': 'lightning_buttons.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
      _: { general_button, switch_account, pay_invoice, create_invoice }  // updated here ✅
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/lightning_buttons/lightning_buttons.js")
},{"STATE":1,"create_invoice":11,"general_button":13,"pay_invoice":23,"switch_account":30}],19:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)


module.exports = lightning_menu

async function lightning_menu (opts = {}) {
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
    <div class="main-container">
      <div class="menu-container"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const footer = shadow.querySelector('.menu-container')
  const content = shadow.querySelector('.content-container')

  const subs = await sdb.watch(onbatch)

  
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
      <div class="tab-container active" data-tab="home">
        <div class="icon">${dricons[0]}</div>   
        <div class="label">Home</div>
      </div>
      <div class="tab-container" data-tab="contacts">
        <div class="icon">${dricons[1]}</div>   
        <div class="label">Contacts</div>
      </div>
      <div class="tab-container" data-tab="details">
        <div class="icon">${dricons[2]}</div>   
        <div class="label">Details</div>
      </div>
      <div class="tab-container" data-tab="more">
        <div class="icon">${dricons[3]}</div>   
        <div class="label">More</div>
      </div>
    `
  }

  function iconject (data) {
    dricons = data
  }

  function fail (data, type) {
    throw new Error('invalid message', { cause: { data, type } })
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
          'home.svg': { '$ref': 'home.svg' },
          'contacts.svg': { '$ref': 'contacts.svg' },
          'details.svg': { '$ref': 'details.svg' },
          'more.svg': { '$ref': 'more.svg' },
        },
        'style/': {
          'lightning_menu.css': { '$ref': 'lightning_menu.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/lightning_menu/lightning_menu.js")
},{"STATE":1}],20:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const transaction_list = require('transaction_list')
const total_wealth = require('total_wealth')
const lightning_buttons = require('lightning_buttons')
const lightning_menu = require('lightning_menu')
const home_page_header = require('home_page_header')

module.exports = lightning_page

async function lightning_page (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="component-label">Lightning page</div>
    <div class="home-page-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')

  const container = shadow.querySelector('.home-page-container')

  const subs = await sdb.watch(onbatch)
  
  const transaction_list_component = await transaction_list(subs[0])
  const total_wealth_component = await total_wealth(subs[1])
  const lightning_buttons_component = await lightning_buttons(subs[2])
  const footer_component = await lightning_menu(subs[3])
  const home_page_header_component = await home_page_header(subs[4])

  container.appendChild(home_page_header_component)
  container.appendChild(lightning_buttons_component)
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
      'lightning_buttons':{ $: '' },
      'lightning_menu':{ $: '' },
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
            tid: "skdmf932ksdmf0234lsd",
            ttime: "02:15 PM",
            tamount: "+ 0.03271",
          },
          {
            tid: "Mark Kevin",
            ttime: "03:45 PM",
            tamount: "- 0.00421",
            avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"     
          },
          {
            tid: "QWErty9834asdLKJhf",
            ttime: "04:45 PM",
            tamount: "- 0.03791",
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

    const lightning_buttons = {
      mapping: { 
        style: 'style',
        data: 'data'
      },
      0: {
        buttons: {
          wallet: 'lightning',
        }
      }
    }
   
    const lightning_menu = {
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
        wallet: 'lightning',
        amount: "0.0246"
      } 
    }

    return {
      drive: {
        'style/': {
          'lightning_page.css':{
            '$ref': 'lightning_page.css'
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
        lightning_buttons,
        lightning_menu,
        home_page_header
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/lightning_page/lightning_page.js")
},{"STATE":1,"home_page_header":16,"lightning_buttons":18,"lightning_menu":19,"total_wealth":32,"transaction_list":34}],21:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const home_contents = require('home_contents')
const contacts_list = require('contacts_list')
const details_menu = require('details_menu')
const more_menu = require('more_menu')

module.exports = menu

async function menu(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = { style: inject, data: ondata, icons: iconject }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="main-container">
      <div class="content-container"></div>
      <div class="menu-container"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const footer = shadow.querySelector('.menu-container')
  const content = shadow.querySelector('.content-container')

  let dricons = []
  const subs = await sdb.watch(onbatch)

  // ✅ Create all components once
  const home_component = await home_contents(subs[0])
  const contacts_component = await contacts_list(subs[1])
  const details_component = await details_menu(subs[2])
  const more_component = await more_menu(subs[3])

  // ✅ Append all, hide except Home
  content.appendChild(home_component)
  content.appendChild(contacts_component)
  content.appendChild(details_component)
  content.appendChild(more_component)

  contacts_component.style.display = 'none'
  details_component.style.display = 'none'
  more_component.style.display = 'none'

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(p => drive.get(p).then(f => f.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject(data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
    footer.innerHTML = `
      <div class="tab-container active" data-tab="home">
        <div class="icon">${dricons[0]}</div>
        <div class="label">Home</div>
      </div>
      <div class="tab-container" data-tab="contacts">
        <div class="icon">${dricons[1]}</div>
        <div class="label">Contacts</div>
      </div>
      <div class="tab-container" data-tab="details">
        <div class="icon">${dricons[2]}</div>
        <div class="label">Details</div>
      </div>
      <div class="tab-container" data-tab="more">
        <div class="icon">${dricons[3]}</div>
        <div class="label">More</div>
      </div>
    `

    footer.querySelectorAll('.tab-container').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabType = tab.dataset.tab
        footer.querySelectorAll('.tab-container').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')

        // ✅ Hide all first
        home_component.style.display = 'none'
        contacts_component.style.display = 'none'
        details_component.style.display = 'none'
        more_component.style.display = 'none'

        // ✅ Show only the selected one
        if (tabType === 'home') home_component.style.display = ''
        if (tabType === 'contacts') contacts_component.style.display = ''
        if (tabType === 'details') details_component.style.display = ''
        if (tabType === 'more') more_component.style.display = ''
      })
    })
  }

  function iconject(data) {
    dricons = data
  }

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }
}

function fallback_module() {
  return {
    api: fallback_instance,
    _: {
      home_contents: { $: '' },
      contacts_list: { $: '' },
      details_menu: { $: '' },
      more_menu: { $: '' }
    }
  }

  function fallback_instance(opts) {
    const home_contents = {
      mapping: { style: 'style', data: 'data' },
      0: { text: '🏠 Home Content Loaded' }
    }

    const contacts_list = {
      mapping: { style: 'style', data: 'data' },
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
      }
    }

    const details_menu = {
      mapping: { style: 'style', data: 'data', icons: 'icons' },
      0: { text: '📋 Details Menu Content Loaded' }
    }

    const more_menu = {
      mapping: { style: 'style', data: 'data', icons: 'icons' },
      0: { text: '⚙️ More Menu Content Loaded' }
    }

    return {
      drive: {
        'icons/': {
          'home.svg': { '$ref': 'home.svg' },
          'contacts.svg': { '$ref': 'contacts.svg' },
          'details.svg': { '$ref': 'details.svg' },
          'more.svg': { '$ref': 'more.svg' }
        },
        'style/': { 'menu.css': { '$ref': 'menu.css' } },
        'data/': { 'opts.json': { raw: opts } }
      },
      _: { home_contents, contacts_list, details_menu, more_menu }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/menu/menu.js")
},{"STATE":1,"contacts_list":10,"details_menu":12,"home_contents":14,"more_menu":22}],22:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = more_menu

async function more_menu(opts = {}) {
  const { sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata,
    icons: iconject,
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  let icons = []

  shadow.innerHTML = `
    <div class="more-menu-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.more-menu-container')

  await sdb.watch(onbatch)
  return el

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
    style.textContent = data[0]
  }

  async function ondata() {
    row.innerHTML = `
      <div class="container-title">
        <div class="title">More</div>
        <div class="close-icon">${icons[0]}</div>
      </div>
      <div class="option-container">
        <div class="dot-icon">${icons[1]}</div>
        <div class="option-label">Nodes</div>
      </div>
      <div class="option-container">
        <div class="dot-icon">${icons[1]}</div>
        <div class="option-label">Peers</div>
      </div>
    `

    const closeBtn = row.querySelector('.close-icon')
    if (closeBtn) {
      closeBtn.onclick = () => {
        const dropdown = el.parentNode
        if (dropdown) {
          dropdown.classList.add('hidden')
        }
      }
    }
  }

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  function iconject(data) {
    icons = data
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
          'x.svg': { '$ref': 'x.svg' },
          'dot.svg': { '$ref': 'dot.svg' },
        },
        'style/': {
          'style.css': { '$ref': 'more_menu.css' },
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/more_menu/more_menu.js")
},{"STATE":1}],23:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const pay_button = require('button')
const invoice_input = require('input_field')

module.exports = pay_invoice

async function pay_invoice(opts = {}) {
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
    <div class="pay-invoice-container">
      <div class="pay-invoice-header">  
        <div class="title-container"> 
          <div class="header-title">Pay Lightning Invoice</div>
          <div class="lightning-icon"></div>
        </div>  
        <div class="x-icon"></div>
      </div>
      <div class="invoice-input"></div>
      <div class="pay_button"></div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const pay_button_component = shadow.querySelector('.pay_button')
  const invoice_input_component = shadow.querySelector('.invoice-input')

  const subs = await sdb.watch(onbatch)

  const button_component = await pay_button(subs[0])
  const invoice_component = await invoice_input(subs[1])

  pay_button_component.append(button_component)
  invoice_input_component.append(invoice_component)

  const closeBtn = shadow.querySelector('.x-icon')
  if (closeBtn) {
    closeBtn.onclick = () => {
      const dropdown = el.parentNode
      if (dropdown) {
        dropdown.classList.add('hidden')   
      }
    }
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

  function iconject (data) {
    dricons = data

    const lightning_icon = shadow.querySelector('.lightning-icon')
    const x_icon = shadow.querySelector('.x-icon')

    lightning_icon.innerHTML = dricons[0]
    x_icon.innerHTML = dricons[1]
  }

  async function ondata(data) {}
}

function fallback_module() {
  return {
    api,
    _: {
      'button': { $: '' },
      'input_field': { $: '' },
    }
  }

  function api(opts) {
    const button = {
      mapping: {
        style: 'style',
        data: 'data',
      },
      0: {
        label: 'Pay Invoice'
      }    
    }
    
    const input_field = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      1: {
        header: 'Lightning Invoice',
        placeholder: 'Tap to paste your lightning invoice',
        address: 'lnbc1u1p0exampleinvoicehere1234567890'  // demo value
      }    
    }

    return {
      drive: {
        'icons/': {
          'lightning.svg': {
            '$ref': 'lightning.svg'
          },
          'x.svg': {
            '$ref': 'x.svg'
          },
        },
        'style/': {
          'pay_invoice.css': {
            '$ref': 'pay_invoice.css'
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
        input_field
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/pay_invoice/pay_invoice.js")
},{"STATE":1,"button":6,"input_field":17}],24:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const { VanillaQR } = require("vanillaqr")

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
    

    const qr = new VanillaQR({
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
},{"STATE":1,"vanillaqr":37}],25:[function(require,module,exports){
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
    let { label, value, link, icon } = data[0] || {}

    let value_html = value || ""

    if (link) {
      value_html = `<a href="${value}" target="_blank" class="receipt-link">${value}</a>`
      row.className = `receipt-row link`
    }
    
    if (icon) {
      if (icon == "btc.svg"){
          value_html = `<span class="receipt-icon">${dricons[1]}</span> ${value}`
          row.className = `receipt-row total`
      } else {
          value_html = `<span class="receipt-icon">${dricons[0]}</span> ${value}` // which would be our default icon it could be anything
      } 
    }
    row.innerHTML = `
      <div class="receipt-label">${label}</div>
      <div class="receipt-value">${value_html}</div>
      ${icon ? "" : `<div class="divider"></div>`}
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
          'default.svg': { '$ref': 'default.svg'},
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
                color: #000;
                font-size: 18px;
              }

              .receipt-row.total  .receipt-value {
                font-size: 28px;
                font-weight: 600;
              }

              .receipt-row.link .receipt-value {
                color: #4479FF;
                text-decoration: none;
                cursor: pointer;
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
},{"STATE":1}],26:[function(require,module,exports){
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
},{"STATE":1,"input_field":17,"qr_code":24}],27:[function(require,module,exports){
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
},{"STATE":1}],28:[function(require,module,exports){
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

  const closeBtn = shadow.querySelector('.x-icon')
  if (closeBtn) {
    closeBtn.onclick = () => {
      const dropdown = el.parentNode
      if (dropdown) {
        dropdown.classList.add('hidden')   
      }
    }
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
},{"STATE":1,"btc_input_card":3,"button":6,"input_field":17}],29:[function(require,module,exports){
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
},{"STATE":1}],30:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

// require pages early

module.exports = switch_account

async function switch_account (opts = {}, protocol) {
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
    <div class="switch-account-container">
      <div class="account-content"></div>
    </div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  const content = shadow.querySelector('.account-content')

  const subs = await sdb.watch(onbatch)

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
    const { btc, lightning } = data[0]

    content.innerHTML = `
      <div class="container-title">
        <div class="title">Switch Account</div>
        <div class="close-icon">${dricons[0]}</div>   
      </div>
      <div class="account-container btc-container">
        <div class="btc-icon">${dricons[1]}BTC</div>
        <div class="btc-amount">${parseFloat(btc).toFixed(4)}</div>       
      </div>
      <div class="account-container lightning-container">
        <div class="lightning-icon">${dricons[2]}Lightning</div>
        <div class="lightning-amount">${parseFloat(lightning).toFixed(4)}</div>       
      </div>
    ` 

    // Close button
    const close_btn = content.querySelector('.close-icon')
    if (close_btn) {
      close_btn.onclick = () => {
        const dropdown = el.parentNode
        if (dropdown) dropdown.classList.add('hidden')
      }
    }

    // BTC container
    const btc_container = content.querySelector('.btc-container')
    if (btc_container) {
      btc_container.onclick = async () => {
        try {
          const home_page = require('home_page')
          const homeEl = await home_page(subs[0])
          let host = el.getRootNode().host || el
          host.replaceWith(homeEl)
        } catch (error) {
          console.error('Failed to navigate to home_page:', error)
        }
      }
    }

    // Lightning container
    const lightning_container = content.querySelector('.lightning-container')
    if (lightning_container) {
      lightning_container.onclick = async () => {
        try {
          const lightning_page = require('lightning_page')
          const lightningEl = await lightning_page(subs[1])
          let host = el.getRootNode().host || el
          host.replaceWith(lightningEl)
        } catch (error) {
          console.error('Failed to navigate to lightning_page:', error)
        }
      }
    }
  }

  function fail (data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  function iconject (data) {
    dricons = data
  }
}

// ================== fallback ==================
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'home_page': { $: '' },
      'lightning_page': { $: '' }
    }
  }

  function fallback_instance (opts) {
    const home_page = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      0: ''
    }

    const lightning_page = {
      mapping: {
        style: 'style',
        data: 'data',
        icons: 'icons'
      },
      1: ''
    }

    return {
      drive: {
        'icons/': {
          'x.svg': { '$ref': 'x.svg' },
          'btc.svg': { '$ref': 'btc.svg' },
          'lightning.svg': { '$ref': 'lightning.svg' }
        },
        'style/': {
          'style.css': { '$ref': 'switch_account.css' }
        },
        'data/': {
          'opts.json': { raw: opts }
        }
      },
      _: { home_page, lightning_page }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/switch_account/switch_account.js")
},{"STATE":1,"home_page":15,"lightning_page":20}],31:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const btc_usd_rate = require('btc_usd_rate')

module.exports = templates

async function templates(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="template-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const container = shadow.querySelector('.template-container')
  await sdb.watch(onbatch)

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
    style.textContent = data[0]
  }

  function get_date_label(dateString) {
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
    const { date, btc}  = data[0] || {}

    const date_label = get_date_label(date)

    const EXCHANGE_RATE = await btc_usd_rate('btc', 'usd')

    container.innerHTML =
      `
      <div class="template-left">
        <div class="template-title">${date_label}</div>
      </div>
      <div class="template-right">
        <div class="btc-amount">${btc} BTC</div>
        <div class="usd-amount">~$${(btc * EXCHANGE_RATE).toFixed(2)}</div>
      </div>
        
      `
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
          'style.css': {
            raw: `
              .template-container {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
                border: 1px solid #ccc; 
                border-radius: 6px; 
                background-color: #f7f7f7ff; 
                padding-inline: 15px;
                padding-block: 10px;
                box-sizing: border-box
              }
              .template-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid #ddd;
              }
              .template-left {
                display: flex;
                flex-direction: column;
              }
              .template-title {
                font-size: 18px;
              }
              .template-right {
                text-align: right;
              }
              .btc-amount {
                font-size: 16px;
                font-weight: bold;
              }
              .usd-amount {
                font-size: 12px;
                color: gray;
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

}).call(this)}).call(this,"/src/node_modules/templates/templates.js")
},{"STATE":1,"btc_usd_rate":5}],32:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = total_wealth

const btc_usd_rate = require('btc_usd_rate')

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
    style.textContent = data[0]

  }

  function ondata(data) {
    renderValues(data[0]?.value || {})
  }
  

  async function renderValues({ total = 0, lightning = 0, bitcoin = 0 }) {
    const rate = await btc_usd_rate('btc', 'usd')
    const usd = rate * total

    shadow.querySelector('.total-wealth-value span').textContent = `₿ ${total.toFixed(4)}`
    shadow.querySelector('.total-wealth-usd').textContent = `= $${usd.toLocaleString(undefined, {maximumFractionDigits: 2})}`
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
},{"STATE":1,"btc_usd_rate":5}],33:[function(require,module,exports){
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
    <div class="transaction-history-container">
      <div class="transaction-history-header"> Transactions History </div>
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const containerEl = shadow.querySelector('.transaction-history-container')

  
  const subs = await sdb.watch(onbatch)
  

  const grouped = {}
  console.log("test",sdb)

  // const sub_drive = sdb.get(subs[0].sid)
  // console.log('sub_drive', sub_drive.list('style/'))
  // console.log('sub_drive', sub_drive.list('/data'))
  // for (const sub of subs) {

  //   const opts_file = await sdb.get(sub.sid)
  //   console.log("opts_file",opts_file)

  //   const tx = opts_file.raw || {}

  //   const date = (tx.date || sub.date || 'Unknown').trim() 

  //   if (!grouped[date]) grouped[date] = []
  //   grouped[date].push({tx, sub_drive})
  // }
  
  subs.forEach(sub => {
    const date = (sub.date || 'Unknown').trim() 
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
},{"STATE":1,"transaction_row":36}],34:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const transaction_row = require('transaction_row')
const transaction_history = require('transaction_history') 

module.exports = transaction_list


async function transaction_list(opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'open' })

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
  const see_all_btn = shadow.querySelector('.transaction-list-see-all')

  const subs = await sdb.watch(onbatch)

  subs.slice(1, 5).forEach(async sub => {
      container_el.append(await transaction_row(sub))
  })

  see_all_btn.addEventListener('click', async () => {
    const history_component = await transaction_history(subs[0])

    // find the home_page root host element
    let homePageHost = el.getRootNode().host

    if (homePageHost) {
      homePageHost.replaceWith(history_component)
    }
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
      'transaction_history':{ $: ''},
      'transaction_row':{ $: '' },
    } 
  }
  function api(opts){
    const transaction_history = {
      mapping: {
        style: 'style',
        data: 'data'
      },
      0: {
        value:[
          {
            dateString: "2025-08-01",
            tid: "Luis fedrick",
            ttime: "11:30 AM",
            tamount: "+ 0.02456",
            avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
          },
          {
            dateString: "2025-08-01",
            ttime: "02:15 PM",
            tamount: "+ 0.03271",
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
            ttime: "04:45 PM",
            tamount: "- 0.03791",
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
            ttime: "02:15 PM",
            tamount: "+ 0.03271",
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
            ttime: "04:45 PM",
            tamount: "- 0.03791",
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
            ttime: "02:15 PM",
            tamount: "+ 0.03271",
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
            ttime: "04:45 PM",
            tamount: "- 0.03791",
          }
        ]
      }
    }


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
        transaction_history,
        transaction_row
      }
    }
  }
}


}).call(this)}).call(this,"/src/node_modules/transaction_list/transaction_list.js")
},{"STATE":1,"transaction_history":33,"transaction_row":36}],35:[function(require,module,exports){
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
},{"STATE":1,"receipt_row":25}],36:[function(require,module,exports){
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
    <div class="transaction-row"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const row = shadow.querySelector('.transaction-row')
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

  function get_date_label (dateString) {
    const today = new Date()
    const target = new Date(dateString)

    const diffInDays = Math.floor(
      (today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'

    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
  }

  function shorten_tid (tid) {
    if (tid.length > 14) {
      return tid.slice(0, 8) + '...' + tid.slice(-4)
    }
    return tid
  }

  function generate_avatar (seed) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`
  }

  function is_random_string (str) {
    if (!str) return true
    if (/[0-9@#$_-]/.test(str)) return true
    if (str.length > 12 && !/\s/.test(str)) return true

    const upper = (str.match(/[A-Z]/g) || []).length
    const lower = (str.match(/[a-z]/g) || []).length
    if ((upper > 4 && lower > 4) && !/\s/.test(str)) return true

    return false
  }

  async function ondata (data) {
    let { avatar, tid, ttime, tamount, dateString } = data[0] || {}

    if (!tid) tid = "No id found"

    if (!avatar) {
      if (is_random_string(tid)) {
        avatar = generate_avatar(tid)
      } else {
        avatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png'
      }
    }

    const display_tid = shorten_tid(tid)
    const date_label = get_date_label(dateString || new Date().toISOString())

    row.innerHTML = `
      <div class="transaction-detail">
        <div class="transaction-avatar">
          <img src="${avatar}" alt="avatar" />
        </div>
        <div class="transaction-data">
          <div class="transaction-id">${display_tid}</div>
          <div class="transaction-time">${ttime || '—'}</div>
          <div class="transaction-date">${date_label}</div>
        </div>
      </div>  
      <div class="transaction-amount">
        <span>${tamount || '0'} ₿</span>
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
        'style/': {
          'style.css': { '$ref': 'transaction_row.css' }
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
},{"STATE":1}],37:[function(require,module,exports){
//https://github.com/chuckfairy/VanillaQR.js
//VanillaQR Function constructor
//pass an object with customizable options
//url, colorLight, colorDark, width, height
function VanillaQR ( customize ) {

    var scope = this;

    customize = typeof(customize) === "object" ? customize : {};

    /********************PUBLICS********************/

    scope.revision = 3;

    //canvas output types
    scope.imageTypes = {
        "bmp"    : "image/bmp",
        "gif"    : "image/gif",
        "jpeg"   : "image/jpeg",
        "jpg"    : "image/jpg",
        "png"    : "image/png",
        "svg+xml": "image/svg+xml",
        "tiff"   : "image/tiff",
        "webp"   : "image/webp",
        "x-icon" : "image/x-icon"
    };

    //toTable use will default if no canvas support
    scope.toTable = customize.toTable;

    //qr active domElement
    scope.domElement = (scope.toTable) ?
        document.createElement("div"):
        document.createElement("canvas");

    //QR url
    scope.url = customize.url || "";

    //Canvas and qr width and height
    scope.size  = (customize.size  || 280);

    //QR context
    scope.qrc = false;

    //QR colors
    scope.colorLight = customize.colorLight || '#fff';
    scope.colorDark = customize.colorDark || "#000";

    //Correction level
    scope.ecclevel = customize.ecclevel || 1;

    //Border related
    scope.noBorder = customize.noBorder;
    scope.borderSize = customize.borderSize || 4;


    /********************PRIVATES********************/

	// Set data values
	// Working buffers:
	var strinbuf = [];
	var eccbuf   = [];
	var qrframe  = [];
	var framask  = [];
	var rlens    = [];
	var genpoly  = [];

	// Control values - width is based on version, last 4 are from table.
	var ecclevel;
	var version;
	var width;
	var neccblk1;
	var neccblk2;
	var datablkw;
	var eccblkwid;


    /********************QR Creator API********************/

    // set bit to indicate cell in qrframe is immutable
    var setmask = function ( x, y ) {

        var bt;
        if (x > y) {
            bt = x;
            x = y;
            y = bt;
        }
        // y*y = 1+3+5...
        bt = y;
        bt *= y;
        bt += y;
        bt >>= 1;
        bt += x;
        framask[bt] = 1;

    };

    //black to qrframe, white to mask (later black frame merged to mask)
    var putalign = function ( x, y ) {

        var j;

        qrframe[x + width * y] = 1;
        for (j = -2; j < 2; j++) {
            qrframe[(x + j) + width * (y - 2)] = 1;
            qrframe[(x - 2) + width * (y + j + 1)] = 1;
            qrframe[(x + 2) + width * (y + j)] = 1;
            qrframe[(x + j + 1) + width * (y + 2)] = 1;
        }
        for (j = 0; j < 2; j++) {
            setmask(x - 1, y + j);
            setmask(x + 1, y - j);
            setmask(x - j, y - 1);
            setmask(x + j, y + 1);
        }
    }

    //Bit shift modnn
    var modnn = function(x) {

        while (x >= 255) {
            x -= 255;
            x = (x >> 8) + (x & 255);
        }

        return x;

    };

    // Calculate and append ECC data to data block.  Block is in strinbuf, indexes to buffers given.
    var appendrs = function ( data, dlen, ecbuf, eclen ) {

        var i, j, fb;
        var gexp = VanillaQR.gexp;
        var glog = VanillaQR.glog;

        for (i = 0; i < eclen; i++)
            strinbuf[ecbuf + i] = 0;
        for (i = 0; i < dlen; i++) {
            fb = glog[strinbuf[data + i] ^ strinbuf[ecbuf]];
            if (fb != 255)     /* fb term is non-zero */
                for (j = 1; j < eclen; j++)
                    strinbuf[ecbuf + j - 1] = strinbuf[ecbuf + j] ^ gexp[modnn(fb + genpoly[eclen - j])];
            else
                for( j = ecbuf ; j < ecbuf + eclen; j++ )
                    strinbuf[j] = strinbuf[j + 1];
            strinbuf[ ecbuf + eclen - 1] = fb == 255 ? 0 : gexp[modnn(fb + genpoly[0])];
        }

    };

    // check mask - since symmetrical use half.
    var ismasked = function(x, y) {

        var bt;
        if (x > y) {
            bt = x;
            x = y;
            y = bt;
        }
        bt = y;
        bt += y * y;
        bt >>= 1;
        bt += x;
        return framask[bt];

    };

    //  Apply the selected mask out of the 8.
    var applymask = function(m) {

        var x, y, r3x, r3y;

        switch (m) {
        case 0:
            for (y = 0; y < width; y++)
                for (x = 0; x < width; x++)
                    if (!((x + y) & 1) && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
            break;
        case 1:
            for (y = 0; y < width; y++)
                for (x = 0; x < width; x++)
                    if (!(y & 1) && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
            break;
        case 2:
            for (y = 0; y < width; y++)
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                    if (r3x == 3)
                        r3x = 0;
                    if (!r3x && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            break;
        case 3:
            for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y == 3)
                    r3y = 0;
                for (r3x = r3y, x = 0; x < width; x++, r3x++) {
                    if (r3x == 3)
                        r3x = 0;
                    if (!r3x && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            }
            break;
        case 4:
            for (y = 0; y < width; y++)
                for (r3x = 0, r3y = ((y >> 1) & 1), x = 0; x < width; x++, r3x++) {
                    if (r3x == 3) {
                        r3x = 0;
                        r3y = !r3y;
                    }
                    if (!r3y && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            break;
        case 5:
            for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y == 3)
                    r3y = 0;
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                    if (r3x == 3)
                        r3x = 0;
                    if (!((x & y & 1) + !(!r3x | !r3y)) && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            }
            break;
        case 6:
            for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y == 3)
                    r3y = 0;
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                    if (r3x == 3)
                        r3x = 0;
                    if (!(((x & y & 1) + (r3x && (r3x == r3y))) & 1) && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            }
            break;
        case 7:
            for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y == 3)
                    r3y = 0;
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                    if (r3x == 3)
                        r3x = 0;
                    if (!(((r3x && (r3x == r3y)) + ((x + y) & 1)) & 1) && !ismasked(x, y))
                        qrframe[x + y * width] ^= 1;
                }
            }
            break;
        }

    };

    // Using the table of the length of each run, calculate the amount of bad image
    // - long runs or those that look like finders; called twice, once each for X and Y
    var badruns = function(length) {

        var i;
        var runsbad = 0;
        for (i = 0; i <= length; i++)
            if (rlens[i] >= 5)
                runsbad += VanillaQR.N1 + rlens[i] - 5;
        // BwBBBwB as in finder
        for (i = 3; i < length - 1; i += 2)
            if (rlens[i - 2] == rlens[i + 2]
                && rlens[i + 2] == rlens[i - 1]
                && rlens[i - 1] == rlens[i + 1]
                && rlens[i - 1] * 3 == rlens[i]
                // white around the black pattern? Not part of spec
                && (rlens[i - 3] == 0 // beginning
                    || i + 3 > length  // end
                    || rlens[i - 3] * 3 >= rlens[i] * 4 || rlens[i + 3] * 3 >= rlens[i] * 4)
               )
                runsbad += VanillaQR.N3;
        return runsbad;

    };

    // Calculate how bad the masked image is - blocks, imbalance, runs, or finders.
    var badcheck = function() {

        var x, y, h, b, b1;
        var thisbad = 0;
        var bw = 0;

        // blocks of same color.
        for (y = 0; y < width - 1; y++) {
            for (x = 0; x < width - 1; x++) {
                if ((qrframe[x + width * y] && qrframe[(x + 1) + width * y]
                     && qrframe[x + width * (y + 1)] && qrframe[(x + 1) + width * (y + 1)]) // all black
                    || !(qrframe[x + width * y] || qrframe[(x + 1) + width * y]
                         || qrframe[x + width * (y + 1)] || qrframe[(x + 1) + width * (y + 1)])) // all white
                    thisbad += VanillaQR.N2;
            }
        }

        // X runs
        for (y = 0; y < width; y++) {
            rlens[0] = 0;
            for (h = b = x = 0; x < width; x++) {
                if ((b1 = qrframe[x + width * y]) == b)
                    rlens[h]++;
                else
                    rlens[++h] = 1;
                b = b1;
                bw += b ? 1 : -1;
            }

            thisbad += badruns(h);

        }

        // black/white imbalance
        if (bw < 0)
            bw = -bw;

        var big = bw;
        var count = 0;
        big += big << 2;
        big <<= 1;
        while (big > width * width)
            big -= width * width, count++;
        thisbad += count * VanillaQR.N4;

        // Y runs
        for (x = 0; x < width; x++) {
            rlens[0] = 0;
            for (h = b = y = 0; y < width; y++) {
                if ((b1 = qrframe[x + width * y]) == b)
                    rlens[h]++;
                else
                    rlens[++h] = 1;
                b = b1;
            }
            thisbad += badruns(h);
        }

        return thisbad;

    };

    //Generate QR frame array
    scope.genframe = function(instring) {

        var eccblocks = VanillaQR.eccblocks;
        var gexp = VanillaQR.gexp;
        var glog = VanillaQR.glog;

        var x, y, k, t, v, i, j, m;

    // find the smallest version that fits the string
        t = instring.length;
        version = 0;
        do {
            version++;
            k = (ecclevel - 1) * 4 + (version - 1) * 16;
            neccblk1 = eccblocks[k++];
            neccblk2 = eccblocks[k++];
            datablkw = eccblocks[k++];
            eccblkwid = eccblocks[k];
            k = datablkw * (neccblk1 + neccblk2) + neccblk2 - 3 + (version <= 9);
            if (t <= k)
                break;
        } while (version < 40);

    // FIXME - insure that it fits insted of being truncated
        width = 17 + 4 * version;

    // allocate, clear and setup data structures
        v = datablkw + (datablkw + eccblkwid) * (neccblk1 + neccblk2) + neccblk2;
        for( t = 0; t < v; t++ )
            eccbuf[t] = 0;
        strinbuf = instring.slice(0);

        for( t = 0; t < width * width; t++ )
            qrframe[t] = 0;

        for( t = 0 ; t < (width * (width + 1) + 1) / 2; t++)
            framask[t] = 0;

    // insert finders - black to frame, white to mask

        for (t = 0; t < 3; t++) {
            k = 0;
            y = 0;
            if (t == 1)
                k = (width - 7);
            if (t == 2)
                y = (width - 7);
            qrframe[(y + 3) + width * (k + 3)] = 1;
            for (x = 0; x < 6; x++) {
                qrframe[(y + x) + width * k] = 1;
                qrframe[y + width * (k + x + 1)] = 1;
                qrframe[(y + 6) + width * (k + x)] = 1;
                qrframe[(y + x + 1) + width * (k + 6)] = 1;
            }
            for (x = 1; x < 5; x++) {
                setmask(y + x, k + 1);
                setmask(y + 1, k + x + 1);
                setmask(y + 5, k + x);
                setmask(y + x + 1, k + 5);
            }
            for (x = 2; x < 4; x++) {
                qrframe[(y + x) + width * (k + 2)] = 1;
                qrframe[(y + 2) + width * (k + x + 1)] = 1;
                qrframe[(y + 4) + width * (k + x)] = 1;
                qrframe[(y + x + 1) + width * (k + 4)] = 1;
            }
        }

    // alignment blocks
        if (version > 1) {

            t = VanillaQR.adelta[version];
            y = width - 7;
            for (;;) {
                x = width - 7;
                while (x > t - 3) {
                    putalign(x, y);
                    if (x < t)
                        break;
                    x -= t;
                }
                if (y <= t + 9)
                    break;
                y -= t;
                putalign(6, y);
                putalign(y, 6);
            }
        }

    // single black
        qrframe[8 + width * (width - 8)] = 1;

    // timing gap - mask only
        for (y = 0; y < 7; y++) {
            setmask(7, y);
            setmask(width - 8, y);
            setmask(7, y + width - 7);
        }
        for (x = 0; x < 8; x++) {
            setmask(x, 7);
            setmask(x + width - 8, 7);
            setmask(x, width - 8);
        }

    // reserve mask-format area
        for (x = 0; x < 9; x++)
            setmask(x, 8);
        for (x = 0; x < 8; x++) {
            setmask(x + width - 8, 8);
            setmask(8, x);
        }
        for (y = 0; y < 7; y++)
            setmask(8, y + width - 7);

    // timing row/col
        for (x = 0; x < width - 14; x++)
            if (x & 1) {
                setmask(8 + x, 6);
                setmask(6, 8 + x);
            }
            else {
                qrframe[(8 + x) + width * 6] = 1;
                qrframe[6 + width * (8 + x)] = 1;
            }

    // version block
        if (version > 6) {
            t = VanillaQR.vpat[version - 7];
            k = 17;
            for (x = 0; x < 6; x++)
                for (y = 0; y < 3; y++, k--)
                    if (1 & (k > 11 ? version >> (k - 12) : t >> k)) {
                        qrframe[(5 - x) + width * (2 - y + width - 11)] = 1;
                        qrframe[(2 - y + width - 11) + width * (5 - x)] = 1;
                    }
            else {
                setmask(5 - x, 2 - y + width - 11);
                setmask(2 - y + width - 11, 5 - x);
            }
        }

    // sync mask bits - only set above for white spaces, so add in black bits
        for (y = 0; y < width; y++)
            for (x = 0; x <= y; x++)
                if (qrframe[x + width * y])
                    setmask(x, y);

    // convert string to bitstream
    // 8 bit data to QR-coded 8 bit data (numeric or alphanum, or kanji not supported)
        v = strinbuf.length;

    // string to array
        for( i = 0 ; i < v; i++ )
            eccbuf[i] = strinbuf.charCodeAt(i);
        strinbuf = eccbuf.slice(0);

    // calculate max string length
        x = datablkw * (neccblk1 + neccblk2) + neccblk2;
        if (v >= x - 2) {
            v = x - 2;
            if (version > 9)
                v--;
        }

    // shift and repack to insert length prefix
        i = v;
        if (version > 9) {
            strinbuf[i + 2] = 0;
            strinbuf[i + 3] = 0;
            while (i--) {
                t = strinbuf[i];
                strinbuf[i + 3] |= 255 & (t << 4);
                strinbuf[i + 2] = t >> 4;
            }
            strinbuf[2] |= 255 & (v << 4);
            strinbuf[1] = v >> 4;
            strinbuf[0] = 0x40 | (v >> 12);
        }
        else {
            strinbuf[i + 1] = 0;
            strinbuf[i + 2] = 0;
            while (i--) {
                t = strinbuf[i];
                strinbuf[i + 2] |= 255 & (t << 4);
                strinbuf[i + 1] = t >> 4;
            }
            strinbuf[1] |= 255 & (v << 4);
            strinbuf[0] = 0x40 | (v >> 4);
        }
    // fill to end with pad pattern
        i = v + 3 - (version < 10);
        while (i < x) {
            strinbuf[i++] = 0xec;
            // buffer has room    if (i == x)      break;
            strinbuf[i++] = 0x11;
        }

    // calculate and append ECC

    // calculate generator polynomial


        genpoly[0] = 1;
        for (i = 0; i < eccblkwid; i++) {
            genpoly[i + 1] = 1;
            for (j = i; j > 0; j--)
                genpoly[j] = genpoly[j]
                ? genpoly[j - 1] ^ gexp[modnn(glog[genpoly[j]] + i)] : genpoly[j - 1];
            genpoly[0] = gexp[modnn(glog[genpoly[0]] + i)];
        }
        for (i = 0; i <= eccblkwid; i++)
            genpoly[i] = glog[genpoly[i]]; // use logs for genpoly[] to save calc step

    // append ecc to data buffer
        k = x;
        y = 0;
        for (i = 0; i < neccblk1; i++) {
            appendrs(y, datablkw, k, eccblkwid);
            y += datablkw;
            k += eccblkwid;
        }
        for (i = 0; i < neccblk2; i++) {
            appendrs(y, datablkw + 1, k, eccblkwid);
            y += datablkw + 1;
            k += eccblkwid;
        }

    // interleave blocks
        y = 0;
        for (i = 0; i < datablkw; i++) {
            for (j = 0; j < neccblk1; j++)
                eccbuf[y++] = strinbuf[i + j * datablkw];
            for (j = 0; j < neccblk2; j++)
                eccbuf[y++] = strinbuf[(neccblk1 * datablkw) + i + (j * (datablkw + 1))];
        }
        for (j = 0; j < neccblk2; j++)
            eccbuf[y++] = strinbuf[(neccblk1 * datablkw) + i + (j * (datablkw + 1))];
        for (i = 0; i < eccblkwid; i++)
            for (j = 0; j < neccblk1 + neccblk2; j++)
                eccbuf[y++] = strinbuf[x + i + j * eccblkwid];
        strinbuf = eccbuf;

    // pack bits into frame avoiding masked area.
        x = y = width - 1;
        k = v = 1;         // up, minus
        /* inteleaved data and ecc codes */
        m = (datablkw + eccblkwid) * (neccblk1 + neccblk2) + neccblk2;
        for (i = 0; i < m; i++) {
            t = strinbuf[i];
            for (j = 0; j < 8; j++, t <<= 1) {
                if (0x80 & t)
                    qrframe[x + width * y] = 1;
                do {        // find next fill position
                    if (v)
                        x--;
                    else {
                        x++;
                        if (k) {
                            if (y != 0)
                                y--;
                            else {
                                x -= 2;
                                k = !k;
                                if (x == 6) {
                                    x--;
                                    y = 9;
                                }
                            }
                        }
                        else {
                            if (y != width - 1)
                                y++;
                            else {
                                x -= 2;
                                k = !k;
                                if (x == 6) {
                                    x--;
                                    y -= 8;
                                }
                            }
                        }
                    }
                    v = !v;
                } while (ismasked(x, y));
            }
        }

    // save pre-mask copy of frame
        strinbuf = qrframe.slice(0);
        t = 0;           // best
        y = 30000;         // demerit
    // for instead of while since in original arduino code
    // if an early mask was "good enough" it wouldn't try for a better one
    // since they get more complex and take longer.
        for (k = 0; k < 8; k++) {

            // returns black-white imbalance
            applymask(k);
            x = badcheck();

            if (x < y) { // current mask better than previous best?
                y = x;
                t = k;
            }
            if (t == 7)
                break;       // don't increment i to a void redoing mask
            qrframe = strinbuf.slice(0); // reset for next pass
        }
        if (t != k)         // redo best mask - none good enough, last wasn't t
            applymask(t);

    // add in final mask/ecclevel bytes
        y = VanillaQR.fmtword[t + ((ecclevel - 1) << 3)];
        // low byte
        for (k = 0; k < 8; k++, y >>= 1)
            if (y & 1) {
                qrframe[(width - 1 - k) + width * 8] = 1;
                if (k < 6)
                    qrframe[8 + width * k] = 1;
                else
                    qrframe[8 + width * (k + 1)] = 1;
            }
        // high byte
        for (k = 0; k < 7; k++, y >>= 1)
            if (y & 1) {
                qrframe[8 + width * (width - 7 + k)] = 1;
                if (k)
                    qrframe[(6 - k) + width * 8] = 1;
                else
                    qrframe[7 + width * 8] = 1;
            }

    // return image
        return qrframe;
    };

    //Initialize QR Code
    scope.init = function() {

        ecclevel = scope.ecclevel;
        var qf = scope.genframe(scope.url);

        if(scope.toTable) {

            scope.tableWrite(qf, width);

        } else {

            scope.canvasWrite(qf, width);

        }

    };

    //Auto initialize
    scope.init();

}

//Get canvas 2D Context
VanillaQR.prototype = {

    //Canvas create
    canvasWrite: function(qf, width) {

        var scope = this;

        //Get context and proceed if it is allowed
        if(!scope.qrc) {

            scope.qrc = scope.getContext(scope.domElement);

            //No canvas support default to Table
            if(!scope.qrc) {
                scope.toTable = true;
                scope.domElement = document.createElement("div");
                scope.tableWrite(qf, width);
                return;
            }

        }

        //Setup canvas context
        var size = scope.size;
        var qrc = scope.qrc;

        qrc.lineWidth=1;

        var px = size;
        px /= width + 10;
        px=Math.round(px - 0.5);

        var offset = 4;

        if (scope.noBorder) {
            qrc.canvas.width = qrc.canvas.height = px * width;
            offset = 0;
        }
        else {
            qrc.canvas.width = qrc.canvas.height = size;
        }

        //Fill canvas with set colors
        qrc.clearRect( 0, 0, size, size );
        qrc.fillStyle = scope.colorLight;
        qrc.fillRect(0, 0, px*(width+8), px*(width+8));
        qrc.fillStyle = scope.colorDark;

        //Write boxes per row
        for( var i = 0; i < width; i++ ) {

            for( var j = 0; j < width; j++ ) {
                if( qf[j*width+i] ) {
                    qrc.fillRect(px*(offset+i),px*(offset+j),px,px);
                }
             }

         }

    },

    //Table write qr code
    tableWrite: function(qf, width) {

        var scope = this;

        //Table style
        var collapseStyle = "border:0;border-collapse:collapse;";
        var tdWidth = Math.round((this.size / width) - 3.5) + "px";
        var borderWidth = width + ( ( scope.noBorder ) ? 0 : ( scope.borderSize * 2 ) );
        var sideBorderWidth = scope.borderSize;
        var tdStyle = "width:" + tdWidth + ";height:" + tdWidth + ";";

        var colorLight = scope.colorLight;
        var colorDark = scope.colorDark;

        //Table elements
        var table = document.createElement("table");
        table.style.cssText = collapseStyle;

        var tr = document.createElement("tr");
        var td = document.createElement("td");

        //Cloning and creating table Elements
        var cloneTD = function() { return td.cloneNode(); };

        var createTDDark = function() {
            var elem = cloneTD();
            elem.style.cssText = tdStyle + "background:" + colorDark;
            return elem;
        };

        var createTDLight = function() {
            var elem = cloneTD();
            elem.style.cssText = tdStyle + "background:" + colorLight;
            return elem;
        }


        //Regular borders appending
        var appendBorders = function( table ) {

            var insertNode = table.firstChild;

            for( var i = 0; i < scope.borderSize; i ++ ) {

                var row = tr.cloneNode();

                for( var t = 0; t < borderWidth; t++ ) {
                    var lightTD = createTDLight();
                    row.appendChild(lightTD);
                }

                table.appendChild( row );
                table.insertBefore( row.cloneNode( true ), insertNode );

            }

        }


        //Create side border
        var appendSideBorders = function( row ) {

            var insertNode = row.firstChild;

            for( var i = 0; i < sideBorderWidth; i ++ ) {

                row.insertBefore( createTDLight(), insertNode );

                row.appendChild(createTDLight());

            }

        };

        //Write boxes per row
        for( var i = 0; i < width; i++ ) {

            var currentRow = tr.cloneNode();
            table.appendChild(currentRow);

            for( var j = 0; j < width; j++ ) {

                //Is a dark color
                if( qf[ (i*width) + j ] === 1 ) {
                    var darkTd = createTDDark();
                    currentRow.appendChild(darkTd);
                }

                //Light color
                else {
                    var lightTD = createTDLight();
                    currentRow.appendChild(lightTD);
                }

            }

            if( !scope.noBorder ) {

                appendSideBorders(currentRow);

            }

        }

        if( !scope.noBorder ) {

            appendBorders( table );

        }

         scope.domElement.innerHTML = "";
         scope.domElement.appendChild(table);

    },

    //get domElement 2D  Context
    getContext: function(domElement) {

        //try to get 2d context error
        if(!(domElement.getContext && domElement.getContext('2d'))) {

            console.log("Browser does not have 2d Canvas support");
            return false;

        }

        return domElement.getContext('2d');

    },

    //QR frame to image type
    toImage: function(type) {

        if(!this.qrc) {return;}

        //Check image output type
        var dataType = this.imageTypes[type];
        if(!dataType) {
            throw new Error(type + " is not a valid image type ");
        }

        //create image with src of QR code
    	var image = new Image;
    	image.src = this.domElement.toDataURL(dataType);
    	return image;

    }

};


// Private variables
// alignment pattern
VanillaQR.adelta = [
  0, 11, 15, 19, 23, 27, 31, // force 1 pat
  16, 18, 20, 22, 24, 26, 28, 20, 22, 24, 24, 26, 28, 28, 22, 24, 24,
  26, 26, 28, 28, 24, 24, 26, 26, 26, 28, 28, 24, 26, 26, 26, 28, 28
];

// version block
VanillaQR.vpat = [
    0xc94, 0x5bc, 0xa99, 0x4d3, 0xbf6, 0x762, 0x847, 0x60d,
    0x928, 0xb78, 0x45d, 0xa17, 0x532, 0x9a6, 0x683, 0x8c9,
    0x7ec, 0xec4, 0x1e1, 0xfab, 0x08e, 0xc1a, 0x33f, 0xd75,
    0x250, 0x9d5, 0x6f0, 0x8ba, 0x79f, 0xb0b, 0x42e, 0xa64,
    0x541, 0xc69
];

// final format bits with mask: level << 3 | mask
VanillaQR.fmtword = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,    //L
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,    //M
    0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,    //Q
    0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b    //H
];

// 4 per version: number of blocks 1,2; data width; ecc width
VanillaQR.eccblocks = [
    1, 0, 19, 7, 1, 0, 16, 10, 1, 0, 13, 13, 1, 0, 9, 17,
    1, 0, 34, 10, 1, 0, 28, 16, 1, 0, 22, 22, 1, 0, 16, 28,
    1, 0, 55, 15, 1, 0, 44, 26, 2, 0, 17, 18, 2, 0, 13, 22,
    1, 0, 80, 20, 2, 0, 32, 18, 2, 0, 24, 26, 4, 0, 9, 16,
    1, 0, 108, 26, 2, 0, 43, 24, 2, 2, 15, 18, 2, 2, 11, 22,
    2, 0, 68, 18, 4, 0, 27, 16, 4, 0, 19, 24, 4, 0, 15, 28,
    2, 0, 78, 20, 4, 0, 31, 18, 2, 4, 14, 18, 4, 1, 13, 26,
    2, 0, 97, 24, 2, 2, 38, 22, 4, 2, 18, 22, 4, 2, 14, 26,
    2, 0, 116, 30, 3, 2, 36, 22, 4, 4, 16, 20, 4, 4, 12, 24,
    2, 2, 68, 18, 4, 1, 43, 26, 6, 2, 19, 24, 6, 2, 15, 28,
    4, 0, 81, 20, 1, 4, 50, 30, 4, 4, 22, 28, 3, 8, 12, 24,
    2, 2, 92, 24, 6, 2, 36, 22, 4, 6, 20, 26, 7, 4, 14, 28,
    4, 0, 107, 26, 8, 1, 37, 22, 8, 4, 20, 24, 12, 4, 11, 22,
    3, 1, 115, 30, 4, 5, 40, 24, 11, 5, 16, 20, 11, 5, 12, 24,
    5, 1, 87, 22, 5, 5, 41, 24, 5, 7, 24, 30, 11, 7, 12, 24,
    5, 1, 98, 24, 7, 3, 45, 28, 15, 2, 19, 24, 3, 13, 15, 30,
    1, 5, 107, 28, 10, 1, 46, 28, 1, 15, 22, 28, 2, 17, 14, 28,
    5, 1, 120, 30, 9, 4, 43, 26, 17, 1, 22, 28, 2, 19, 14, 28,
    3, 4, 113, 28, 3, 11, 44, 26, 17, 4, 21, 26, 9, 16, 13, 26,
    3, 5, 107, 28, 3, 13, 41, 26, 15, 5, 24, 30, 15, 10, 15, 28,
    4, 4, 116, 28, 17, 0, 42, 26, 17, 6, 22, 28, 19, 6, 16, 30,
    2, 7, 111, 28, 17, 0, 46, 28, 7, 16, 24, 30, 34, 0, 13, 24,
    4, 5, 121, 30, 4, 14, 47, 28, 11, 14, 24, 30, 16, 14, 15, 30,
    6, 4, 117, 30, 6, 14, 45, 28, 11, 16, 24, 30, 30, 2, 16, 30,
    8, 4, 106, 26, 8, 13, 47, 28, 7, 22, 24, 30, 22, 13, 15, 30,
    10, 2, 114, 28, 19, 4, 46, 28, 28, 6, 22, 28, 33, 4, 16, 30,
    8, 4, 122, 30, 22, 3, 45, 28, 8, 26, 23, 30, 12, 28, 15, 30,
    3, 10, 117, 30, 3, 23, 45, 28, 4, 31, 24, 30, 11, 31, 15, 30,
    7, 7, 116, 30, 21, 7, 45, 28, 1, 37, 23, 30, 19, 26, 15, 30,
    5, 10, 115, 30, 19, 10, 47, 28, 15, 25, 24, 30, 23, 25, 15, 30,
    13, 3, 115, 30, 2, 29, 46, 28, 42, 1, 24, 30, 23, 28, 15, 30,
    17, 0, 115, 30, 10, 23, 46, 28, 10, 35, 24, 30, 19, 35, 15, 30,
    17, 1, 115, 30, 14, 21, 46, 28, 29, 19, 24, 30, 11, 46, 15, 30,
    13, 6, 115, 30, 14, 23, 46, 28, 44, 7, 24, 30, 59, 1, 16, 30,
    12, 7, 121, 30, 12, 26, 47, 28, 39, 14, 24, 30, 22, 41, 15, 30,
    6, 14, 121, 30, 6, 34, 47, 28, 46, 10, 24, 30, 2, 64, 15, 30,
    17, 4, 122, 30, 29, 14, 46, 28, 49, 10, 24, 30, 24, 46, 15, 30,
    4, 18, 122, 30, 13, 32, 46, 28, 48, 14, 24, 30, 42, 32, 15, 30,
    20, 4, 117, 30, 40, 7, 47, 28, 43, 22, 24, 30, 10, 67, 15, 30,
    19, 6, 118, 30, 18, 31, 47, 28, 34, 34, 24, 30, 20, 61, 15, 30
];

// Galois field log table
VanillaQR.glog = [
    0xff, 0x00, 0x01, 0x19, 0x02, 0x32, 0x1a, 0xc6, 0x03, 0xdf, 0x33, 0xee, 0x1b, 0x68, 0xc7, 0x4b,
    0x04, 0x64, 0xe0, 0x0e, 0x34, 0x8d, 0xef, 0x81, 0x1c, 0xc1, 0x69, 0xf8, 0xc8, 0x08, 0x4c, 0x71,
    0x05, 0x8a, 0x65, 0x2f, 0xe1, 0x24, 0x0f, 0x21, 0x35, 0x93, 0x8e, 0xda, 0xf0, 0x12, 0x82, 0x45,
    0x1d, 0xb5, 0xc2, 0x7d, 0x6a, 0x27, 0xf9, 0xb9, 0xc9, 0x9a, 0x09, 0x78, 0x4d, 0xe4, 0x72, 0xa6,
    0x06, 0xbf, 0x8b, 0x62, 0x66, 0xdd, 0x30, 0xfd, 0xe2, 0x98, 0x25, 0xb3, 0x10, 0x91, 0x22, 0x88,
    0x36, 0xd0, 0x94, 0xce, 0x8f, 0x96, 0xdb, 0xbd, 0xf1, 0xd2, 0x13, 0x5c, 0x83, 0x38, 0x46, 0x40,
    0x1e, 0x42, 0xb6, 0xa3, 0xc3, 0x48, 0x7e, 0x6e, 0x6b, 0x3a, 0x28, 0x54, 0xfa, 0x85, 0xba, 0x3d,
    0xca, 0x5e, 0x9b, 0x9f, 0x0a, 0x15, 0x79, 0x2b, 0x4e, 0xd4, 0xe5, 0xac, 0x73, 0xf3, 0xa7, 0x57,
    0x07, 0x70, 0xc0, 0xf7, 0x8c, 0x80, 0x63, 0x0d, 0x67, 0x4a, 0xde, 0xed, 0x31, 0xc5, 0xfe, 0x18,
    0xe3, 0xa5, 0x99, 0x77, 0x26, 0xb8, 0xb4, 0x7c, 0x11, 0x44, 0x92, 0xd9, 0x23, 0x20, 0x89, 0x2e,
    0x37, 0x3f, 0xd1, 0x5b, 0x95, 0xbc, 0xcf, 0xcd, 0x90, 0x87, 0x97, 0xb2, 0xdc, 0xfc, 0xbe, 0x61,
    0xf2, 0x56, 0xd3, 0xab, 0x14, 0x2a, 0x5d, 0x9e, 0x84, 0x3c, 0x39, 0x53, 0x47, 0x6d, 0x41, 0xa2,
    0x1f, 0x2d, 0x43, 0xd8, 0xb7, 0x7b, 0xa4, 0x76, 0xc4, 0x17, 0x49, 0xec, 0x7f, 0x0c, 0x6f, 0xf6,
    0x6c, 0xa1, 0x3b, 0x52, 0x29, 0x9d, 0x55, 0xaa, 0xfb, 0x60, 0x86, 0xb1, 0xbb, 0xcc, 0x3e, 0x5a,
    0xcb, 0x59, 0x5f, 0xb0, 0x9c, 0xa9, 0xa0, 0x51, 0x0b, 0xf5, 0x16, 0xeb, 0x7a, 0x75, 0x2c, 0xd7,
    0x4f, 0xae, 0xd5, 0xe9, 0xe6, 0xe7, 0xad, 0xe8, 0x74, 0xd6, 0xf4, 0xea, 0xa8, 0x50, 0x58, 0xaf
];

// Galios field exponent table
VanillaQR.gexp = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1d, 0x3a, 0x74, 0xe8, 0xcd, 0x87, 0x13, 0x26,
    0x4c, 0x98, 0x2d, 0x5a, 0xb4, 0x75, 0xea, 0xc9, 0x8f, 0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0,
    0x9d, 0x27, 0x4e, 0x9c, 0x25, 0x4a, 0x94, 0x35, 0x6a, 0xd4, 0xb5, 0x77, 0xee, 0xc1, 0x9f, 0x23,
    0x46, 0x8c, 0x05, 0x0a, 0x14, 0x28, 0x50, 0xa0, 0x5d, 0xba, 0x69, 0xd2, 0xb9, 0x6f, 0xde, 0xa1,
    0x5f, 0xbe, 0x61, 0xc2, 0x99, 0x2f, 0x5e, 0xbc, 0x65, 0xca, 0x89, 0x0f, 0x1e, 0x3c, 0x78, 0xf0,
    0xfd, 0xe7, 0xd3, 0xbb, 0x6b, 0xd6, 0xb1, 0x7f, 0xfe, 0xe1, 0xdf, 0xa3, 0x5b, 0xb6, 0x71, 0xe2,
    0xd9, 0xaf, 0x43, 0x86, 0x11, 0x22, 0x44, 0x88, 0x0d, 0x1a, 0x34, 0x68, 0xd0, 0xbd, 0x67, 0xce,
    0x81, 0x1f, 0x3e, 0x7c, 0xf8, 0xed, 0xc7, 0x93, 0x3b, 0x76, 0xec, 0xc5, 0x97, 0x33, 0x66, 0xcc,
    0x85, 0x17, 0x2e, 0x5c, 0xb8, 0x6d, 0xda, 0xa9, 0x4f, 0x9e, 0x21, 0x42, 0x84, 0x15, 0x2a, 0x54,
    0xa8, 0x4d, 0x9a, 0x29, 0x52, 0xa4, 0x55, 0xaa, 0x49, 0x92, 0x39, 0x72, 0xe4, 0xd5, 0xb7, 0x73,
    0xe6, 0xd1, 0xbf, 0x63, 0xc6, 0x91, 0x3f, 0x7e, 0xfc, 0xe5, 0xd7, 0xb3, 0x7b, 0xf6, 0xf1, 0xff,
    0xe3, 0xdb, 0xab, 0x4b, 0x96, 0x31, 0x62, 0xc4, 0x95, 0x37, 0x6e, 0xdc, 0xa5, 0x57, 0xae, 0x41,
    0x82, 0x19, 0x32, 0x64, 0xc8, 0x8d, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xdd, 0xa7, 0x53, 0xa6,
    0x51, 0xa2, 0x59, 0xb2, 0x79, 0xf2, 0xf9, 0xef, 0xc3, 0x9b, 0x2b, 0x56, 0xac, 0x45, 0x8a, 0x09,
    0x12, 0x24, 0x48, 0x90, 0x3d, 0x7a, 0xf4, 0xf5, 0xf7, 0xf3, 0xfb, 0xeb, 0xcb, 0x8b, 0x0b, 0x16,
    0x2c, 0x58, 0xb0, 0x7d, 0xfa, 0xe9, 0xcf, 0x83, 0x1b, 0x36, 0x6c, 0xd8, 0xad, 0x47, 0x8e, 0x00
];

// Badness coefficients.
VanillaQR.N1 = 3;
VanillaQR.N2 = 3;
VanillaQR.N3 = 40;
VanillaQR.N4 = 10;

/**
 * Module loading footer
 */

module.exports = { VanillaQR };

},{}],38:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
statedb.admin()
const { sdb, get } = statedb(fallback_module)

const contacts_list = require('../src/node_modules/contacts_list')
const transaction_history = require('../src/node_modules/transaction_history')
const chat_view = require('../src/node_modules/chat_view')
const switch_account = require('../src/node_modules/switch_account')
const send_btc = require('../src/node_modules/send_btc')
const receive_btc = require('../src/node_modules/receive_btc')
const transaction_receipt = require('../src/node_modules/transaction_receipt')
const home_page = require('../src/node_modules/home_page')
const lightning_page = require('../src/node_modules/lightning_page')
const btc_nodes = require('../src/node_modules/btc_nodes')
const more_menu = require('../src/node_modules/more_menu')
const details_menu = require('../src/node_modules/details_menu')

document.title = 'flamingo wallet'
document.head.querySelector('link').setAttribute('href', 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦩</text></svg>')

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
  const lightning_page_component = await lightning_page(subs[2], protocol)
  const transaction_history_component = await transaction_history(subs[4], protocol)
  const contacts_list_component = await contacts_list(subs[6], protocol)
  const chat_view_compoent = await chat_view(subs[8],protocol)
  const switch_account_component = await switch_account(subs[10], protocol)
  const send_btc_component = await send_btc(subs[12], protocol)
  const receive_btc_component = await receive_btc(subs[14], protocol)
  const transaction_receipt_component = await transaction_receipt(subs[16], protocol)
  const btc_nodes_component = await btc_nodes(subs[18], protocol)
  const more_menu_component = await more_menu(subs[20], protocol)
  const details_menu_component = await details_menu(subs[22], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Home Page</div>
        <div id="home-page-container"></div> 
      </div>
      <div id="lightning-page-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Transaction History</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="transaction-history-container"></div> 
      </div>
      <div id="contacts-list-container" ></div>   
      <div id="chat-view-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Switch Account</div>  
        <div id="switch-account-container"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Send btc</div>  
        <div id="send-btc-container"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Receive btc</div>  
        <div id="receive-btc-container"></div>
      </div>
      <div id="transaction-receipt-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">btc nodes</div>  
        <div id="btc-nodes-container"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">More Menu</div>  
        <div id="more-menu-container"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Details Menu</div>  
        <div id="details-menu-container"></div>
      </div>
    </div>
  `
  page.querySelector('#home-page-container').appendChild(home_page_component)
  page.querySelector('#lightning-page-container').appendChild(lightning_page_component)
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#contacts-list-container').appendChild(contacts_list_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#switch-account-container').appendChild(switch_account_component)
  page.querySelector('#send-btc-container').appendChild(send_btc_component)
  page.querySelector('#receive-btc-container').appendChild(receive_btc_component)
  page.querySelector('#transaction-receipt-container').appendChild(transaction_receipt_component)
  page.querySelector('#btc-nodes-container').appendChild(btc_nodes_component)
  page.querySelector('#more-menu-container').appendChild(more_menu_component)
  page.querySelector('#details-menu-container').appendChild(details_menu_component)

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
             '../src/node_modules/lightning_page': {
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
                tid: "ajd83hs9fk3l02msdkf",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                tid: "XyzA1b2C3d4E5f6G7",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
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
                tid: "92hd82hsja7sd8h3jsd2",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                ttime: "04:45 PM",
                tamount: "- 0.03791",
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
                tid: "jK83hf02sd93ls0dn4fj",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                tid: "r8t7y6u5i4o3p2a1s0d9f8g7",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
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
              { label: "Blockchain Explorer", value: "https://mempool.space/tx/your_txid_here",  link: true },
              { label: "Total Amount", value: "BTC 0.0020",  icon: "btc.svg" }
            ]
          },
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/btc_nodes': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/more_menu': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
       '../src/node_modules/details_menu': {
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
},{"../src/node_modules/STATE":1,"../src/node_modules/btc_nodes":4,"../src/node_modules/chat_view":7,"../src/node_modules/contacts_list":10,"../src/node_modules/details_menu":12,"../src/node_modules/home_page":15,"../src/node_modules/lightning_page":20,"../src/node_modules/more_menu":22,"../src/node_modules/receive_btc":26,"../src/node_modules/send_btc":28,"../src/node_modules/switch_account":30,"../src/node_modules/transaction_history":33,"../src/node_modules/transaction_receipt":35}]},{},[38]);
