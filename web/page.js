const STATE = require('STATE')
const statedb = STATE(__filename)
statedb.admin()
const { sdb, get } = statedb(fallback_module)

const home_page = require('../src/node_modules/home_page')


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


async function main () {
  console.log(" main() started")

  const subs = await sdb.watch(onbatch)

  const home_page_component = await home_page(subs[0], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Home Page</div>
        <div id="home-page-container"></div> 
      </div>
    </div>
  `
  page.querySelector('#home-page-container').appendChild(home_page_component)


  document.body.append(page)
  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {
      style: {},
      data: {},
      icons: {}
    },
    _: {
      
      '../src/node_modules/home_page': {
        $: '',
        0: '',
          mapping: {
            style: 'style',
            data: 'data'
          }
        },
    }
  }
}