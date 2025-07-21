(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = transaction_list

const createTransactionRow = require('transaction_row')

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
    <div class="transaction-list-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
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
    style.textContent =  data[0]
  }

  async function ondata(data) {
    await renderValues(data[0]?.value || {})
  }

  async function renderValues(dataList) {
    const container = document.createElement('div')
    

    if (!Array.isArray(dataList)) dataList = [dataList]

    const first4 = dataList.slice(0, 4)

    for (const tx of first4) {
      const { tid, ttime, tamount, avatar } = tx
      const row = await createTransactionRow({ tid, ttime, tamount, avatar})
      container.appendChild(row)
    }

    const containerEl = shadow.querySelector('.transaction-list-container')
    containerEl.innerHTML = `
      <div class="transaction-list-header">
        <div class="transaction-list-title">Transactions</div>
        <div class="transaction-list-see-all">See all</div>
      </div>
    `
    containerEl.appendChild(container)
  }
}

function fallback_module() {
  return {
    api(opts = {}) {
      return {
        drive: {
          'style/': {
            'transaction_list.css': {
              '$ref': 'transaction_list.css'
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
}

}).call(this)}).call(this,"/src/node_modules/transaction_list/transaction_list.js")
},{"STATE":1,"transaction_row":3}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = transaction_row

async function transaction_row (opts = {}, protocol) {
  const {drive} = sdb

  const avatar = opts.avatar || ''
  const tid = opts.tid || ''
  const ttime = opts.ttime || ''
  const tamount = opts.tamount || 0

  const on = {
    style: inject,
    data: ondata
  }

  
  const el = document.createElement('div')
  const shadow =  el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="transaction-row">
      <div class="transaction-detail">
        <div class="transaction-avatar">
          <img src="${avatar}" alt="avatar" />
        </div>
        <div class="transaction-data">
          <div class="transaction-id">${tid}</div>
          <div class="transaction-time">${ttime}</div>
        </div>
      </div>  
      <div class="transaction-amount">
        <span>${tamount} ₿</span>
      </div> 
    </div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  style.textContent = `
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
      display: flex;
      flex-direction: column;
      color: gray;
      text-align: start;
    }
    .transaction-amount {
      font-size: 20px;
    }

  `
  //await sdb.watch(onbatch)

  return el

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

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
    await renderValues(data[0]?.value || {})
  }

}

// ============ Fallback Setup for STATE ============

function fallback_module () {
  return {
    api (opts = {}) {
      return {
        drive: {
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
      }
    }
  }
}


}).call(this)}).call(this,"/src/node_modules/transaction_row/transaction_row.js")
},{"STATE":1}],4:[function(require,module,exports){
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

// const transactionHistory = require('../src/node_modules/transaction_history')
const transactionList = require('../src/node_modules/transaction_list')

const state = {}

function protocol (message, notify) {
  const { from } = message
  state[from] = { notify }
  return listen
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


 // const tHistoryComponent = await transactionHistory(subs[0], protocol)
  console.log('subss[1]',subs[2])
 const tListComponent = await transactionList(subs[0], protocol)
 
  const page = document.createElement('div')
  page.innerHTML = `
    <div >
      <div id="history-container"></div>
      <div id="list-container"></div>
    </div>
  `
 
  // page.querySelector('#history-container').appendChild(tHistoryComponent)
  page.querySelector('#list-container').appendChild(tListComponent)
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
                  date: "Today",
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"

                },
                {
                  date: "Today",
                  tid: "3TgmbHfn...455p",
                  ttime: "02:15 PM",
                  tamount: "+ 0.03271",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Today",
                  tid: "Mark Kevin",
                  ttime: "03:45 PM",
                  tamount: "- 0.00421",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
                },
                {
                  date: "Today",
                  tid: "7RwmbHfn...455p",
                  ttime: "04:45 PM",
                  tamount: "- 0.03791",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Yesterday",
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Yesterday",
                  tid: "3TgmbHfn...455p",
                  ttime: "02:15 PM",
                  tamount: "+ 0.03271",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
                },
                {
                  date: "Yesterday",
                  tid: "Mark Kevin",
                  ttime: "03:45 PM",
                  tamount: "- 0.00421",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Yesterday",
                  tid: "7RwmbHfn...455p",
                  ttime: "04:45 PM",
                  tamount: "- 0.03791",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Dec 09",
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Dec 09",
                  tid: "3TgmbHfn...455p",
                  ttime: "02:15 PM",
                  tamount: "+ 0.03271",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Dec 09",
                  tid: "Mark Kevin",
                  ttime: "03:45 PM",
                  tamount: "- 0.00421",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  date: "Dec 09",
                  tid: "7RwmbHfn...455p",
                  ttime: "04:45 PM",
                  tamount: "- 0.03791",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
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
},{"../src/node_modules/STATE":1,"../src/node_modules/transaction_list":2}]},{},[4]);
