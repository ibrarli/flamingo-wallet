// src/index.js
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = transaction_row

async function transaction_row (opts) {
  const { sdb } = await get(opts)

  // Shadow root
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  // Load style + data
  const css  = await sdb.drive.get('style/row.css')
  const data = await sdb.drive.get('data/tx.json')

  inject(css)
  shadow.innerHTML = render(data)

  return el

  // — helpers —
  function inject (file) {
    if (!file?.raw) return
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(file.raw)
    shadow.adoptedStyleSheets = [sheet]
  }

  function render ({ address, time, amount }) {
    return `
      <div class="transaction">
        <div class="left">
          <img class="btc-icon" src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="btc" />
          <div class="info">
            <div class="address">${address}</div>
            <div class="time">${time}</div>
          </div>
        </div>
        <div class="right">
          <span class="arrow">←</span>
          <span class="amount">${amount.replace('-', '')}</span>
        </div>
      </div>
    `
  }
}


function fallback_module () {
  return {
    drive: {
      'style/': {
        'row.css': {
          raw: `
            .transaction  { display:flex;justify-content:space-between;
                             align-items:center;background:#f5f5f5;padding:12px 16px;
                             border-radius:8px;font-family:sans-serif;margin:8px 0; }
            .left         { display:flex;align-items:center; }
            .btc-icon     { width:24px;height:24px;margin-right:10px; }
            .info         { display:flex;flex-direction:column; }
            .address      { font-weight:bold; }
            .time         { font-size:12px;color:#777; }
            .right        { display:flex;align-items:center;font-weight:bold; }
            .arrow        { margin-right:6px;color:#888; }
            .amount       { color:#111; }
          `
        }
      },
      'data/': {
        'tx.json': {
          raw: {
            address: '1Ffmb...',
            time: '09:00 AM',
            amount: '+0.02456'  
          }
        }
      }
    },
    api: () => ({ drive: {} })
  }
}
