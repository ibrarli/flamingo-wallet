// web/page.js
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb } = statedb(fallback_module)

const send_receive_button = require('../src/send_receive_button')

async function main () {
  const subs = await sdb.watch(onbatch)
  const [{ sid }] = subs

  const button = await send_receive_button({ sid })

  const page = document.createElement('div')
  page.innerHTML = `<h2>Flamingo Wallet — Button Test</h2><x></x>`
  page.querySelector('x').replaceWith(button)
  document.body.appendChild(page)
}

main()

function onbatch (batch) {
  for (const { type, data } of batch) {
    console.log(`[batch] ${type}:`, data)
  }
}

function fallback_module () {
  return {
    drive: {}, // No files at the top-level for this module
    _: {
      '../src/send_receive_button': {
        $: '', // one default instance of the button
        0: {}, // required if you're expecting a default instance
        mapping: {
          style: 'style' // mapping ensures submodule knows where to read/write style
        }
      }
    }
  }
}
