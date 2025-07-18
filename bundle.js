(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = transaction_history

const createTransactionRow = require('transaction_row')

async function transaction_history (opts = {},  ) {
  const { id, sdb } = await get(opts.sid)
  
  const {drive} = sdb

  const on = {
    style: inject,
    data: ondata
  }
  
  const el = document.createElement('div')
  const shadow =  el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="transaction-history-container">
      
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
  

  function renderValues(dataList) {
    const container = document.createElement('div')

    if (!Array.isArray(dataList)) dataList = [dataList]

    // Group by date
    const grouped = {}
    for (const item of dataList) {
      const { date = "Unknown" } = item
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(item)
    }

    // Render
    for (const date in grouped) {
      const dateEl = document.createElement('div')
      dateEl.className = 'transaction-date'
      dateEl.innerHTML = `<span>${date}</span>`
      container.appendChild(dateEl)

      for (const tx of grouped[date]) {
        const { tid, ttime, tamount } = tx
        const row = createTransactionRow({ tid, ttime, tamount })
        container.appendChild(row)
      }
    }

    // Clear previous entries
    const containerEl = shadow.querySelector('.transaction-history-container')
    containerEl.innerHTML = `
      <div class="transaction-history-header">Transaction history</div>
    `
    containerEl.appendChild(container)
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
          'transaction_history.css': {
           '$ref':'transaction_history.css'
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
}).call(this)}).call(this,"/src/node_modules/transaction_history/transaction_history.js")
},{"STATE":1,"transaction_row":3}],3:[function(require,module,exports){
module.exports = function createTransactionRow({ tid = "", ttime = "", tamount = "" }) {
  const row = document.createElement('div')
  row.className = 'transaction-row'
  row.innerHTML = `
    <div class="transaction-detail">
      <div class="transaction-avatar">
        <img src="https://tse3.mm.bing.net/th/id/OIP.ut50yZEBEJYocBBFj3t30gHaFv?rs=1&pid=ImgDetMain&o=7&rm=3" alt="avatar" />
      </div>
      <div class="transaction-data">
        <div class="transaction-id">${tid}</div>
        <div class="transaction-time">${ttime}</div>
      </div>
    </div>  
    <div class="transaction-amount">
      <span>${tamount} ₿</span>
    </div>   
  `
  return row
}

},{}],4:[function(require,module,exports){
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
},{"./page":5}],5:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const totalWealth = require('../src/node_modules/transaction_history')
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

 

  const page = document.createElement('div')
  page.innerHTML = `
    <div>
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
      '../src/node_modules/transaction_history': {
        $: '',
        0: {
    value: [
      {
        date: "Today",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456"
      },
      {
        date: "Today",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271"
      },
      {
        date: "Today",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421"
      },
      {
        date: "Today",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791"
      },
      {
        date: "Yesterday",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456"
      },
      {
        date: "Yesterday",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271"
      },
      {
        date: "Yesterday",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421"
      },
      {
        date: "Yesterday",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791"
      },
      {
        date: "Dec 09",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456"
      },
      {
        date: "Dec 09",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271"
      },
      {
        date: "Dec 09",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421"
      },
      {
        date: "Dec 09",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791"
      },

    ]
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
},{"../src/node_modules/STATE":1,"../src/node_modules/transaction_history":2}]},{},[4]);
