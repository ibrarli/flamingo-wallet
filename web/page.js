<<<<<<< HEAD
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const totalWealth = require('../src/node_modules/transaction_history')
=======
const STATE = require('../lib/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

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
      '../src/node_modules/transaction_history': {
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
