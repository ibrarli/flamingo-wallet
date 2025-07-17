(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

<<<<<<< HEAD
module.exports = transaction_history

async function transaction_history (opts = {},  ) {
=======
module.exports = total_wealth

async function total_wealth (opts = {}, protocol) {
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
  const { id, sdb } = await get(opts.sid)
  
  const {drive} = sdb

  const on = {
    style: inject,
    data: ondata
  }
  
  const el = document.createElement('div')
  const shadow =  el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
<<<<<<< HEAD
    <div class="transaction-history-container">
      <div class="transaction-history-header">Transaction history</div>
      <div class="transaction-date">
        <span>Date</span>
      </div>
      <div class="transaction-row">
        <div class="transaction-detail">
          <div class="transaction-avatar">
            <img src="https://tse3.mm.bing.net/th/id/OIP.ut50yZEBEJYocBBFj3t30gHaFv?rs=1&pid=ImgDetMain&o=7&rm=3" alt="avatar" />
          </div>
          <div class="transaction-data">
            <div class="transaction-id">0 ₿</div>
            <div class="transaction-time">00:00 AM</div>
          </div>
        </div>  
        <div class="transaction-amount">
          <span>0.0000</span>
        </div>   
=======
    <div class="total-wealth-container">
      <div class="total-wealth-header">Total wealth</div>
      <div class="total-wealth-value">
        <span>₿ 0.0000</span>
        <div class="total-wealth-usd">= $0</div>
      </div>
      <div class="wallet-row">
        Lightning Wallet <span>0.0000</span>
      </div>
      <div class="wallet-row">
        Bitcoin Wallet <span>0.0000</span>
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
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
  

<<<<<<< HEAD
  function renderValues({ date = " ", tid = 0, ttime = "00:00", tamount = "↑ 0.00000" }) {
  shadow.querySelector('.transaction-date span').textContent = date.toString()
  shadow.querySelector('.transaction-id').textContent = `${tid.toString()} ₿`
  shadow.querySelector('.transaction-time').textContent = ttime.toString()
  shadow.querySelector('.transaction-amount').textContent = tamount.toString()
  }

=======
  function renderValues({ total = 0, usd = 1000, lightning = 0, bitcoin = 0 }) {
    shadow.querySelector('.total-wealth-value span').textContent = `₿ ${total.toFixed(4)}`
    shadow.querySelector('.total-wealth-usd').textContent = `= $${usd.toLocaleString()}`
    shadow.querySelectorAll('.wallet-row')[0].querySelector('span').textContent = lightning.toFixed(4)
    shadow.querySelectorAll('.wallet-row')[1].querySelector('span').textContent = bitcoin.toFixed(4)
  }
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
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
<<<<<<< HEAD
          'transaction_history.css': {
           '$ref':'transaction_history.css'
=======
          'total_wealth.css': {
           '$ref':'total_wealth.css'
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
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

<<<<<<< HEAD
}).call(this)}).call(this,"/lib/node_modules/transaction_history/transaction_history.js")
=======
}).call(this)}).call(this,"/lib/node_modules/total_wealth/total_wealth.js")
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
},{"STATE":1}],3:[function(require,module,exports){
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
},{"./page":4}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../lib/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

<<<<<<< HEAD
const totalWealth = require('../lib/node_modules/transaction_history')
=======
const totalWealth = require('../lib/node_modules/total_wealth') // Imports src/index.js

>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
const state = {}

function protocol (message, notify) {
  const { from } = message
  state[from] = { notify }
  return listen
}

function listen (message) {
  console.log('Protocol message received:', message)
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


  const component = await totalWealth(subs[0], protocol)
<<<<<<< HEAD
=======
  console.log("🔧 totalWealth returned component:", component)
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383

 

  const page = document.createElement('div')
  page.innerHTML = `
<<<<<<< HEAD
    <div>
=======
    <div style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
      <container></container>
    </div>
  `

  page.querySelector('container').replaceWith(component)
  document.body.append(page)

  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {},
    _: {
<<<<<<< HEAD
      '../lib/node_modules/transaction_history': {
        $: '',
        0: {
          value: {
            date: "Jun 12",
            tid: "1FfmbHfn...455p",
            ttime: "11:30 AM",
            tamount: "↑ 0.02456"
=======
      '../lib/node_modules/total_wealth': {
        $: '',
        0: {
          value: {
            total: 1.999,
            usd: 105952,
            lightning: 0.9,
            bitcoin: 0.9862
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
          }
        },
        mapping: {
          style: 'style',
          data: 'data'
        }
      }
    }
  }
}

}).call(this)}).call(this,"/web/page.js")
<<<<<<< HEAD
},{"../lib/node_modules/STATE":1,"../lib/node_modules/transaction_history":2}]},{},[3]);
=======
},{"../lib/node_modules/STATE":1,"../lib/node_modules/total_wealth":2}]},{},[3]);
>>>>>>> a0bd15cdaa6c3f81c056877e3c9671aa4f486383
