// web/page.js
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb } = statedb(fallback_module)

const transaction_row = require('..')

function onbatch (batch) {
  console.log('📦 watch', batch)   
}

async function main () {
  const subs = await sdb.watch(onbatch)
  const row = await transaction_row(subs[0]) 

  const page = document.createElement('div')
  page.innerHTML = `
    <h2>Single Transaction</h2>
    <x></x>
  `
  page.querySelector('x').replaceWith(row)
  document.body.append(page)
}

main()

function fallback_module () {
  return {
    drive: {},
    _: {
      '..': {
        $: '',
        0: '',
        mapping: {
          style: 'style',  
          data: 'data'     
        }
      }
    }
  }
}

