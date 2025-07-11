// src/send_receive_button.js
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = send_receive_button

async function send_receive_button (opts) {
  const { id, sdb } = await get(opts.sid)

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  const btn = document.createElement('button')
  btn.textContent = 'Send'
  btn.className = 'toggle-btn'

  btn.onclick = () => {
    btn.textContent = btn.textContent === 'Send' ? 'Receive' : 'Send'
  }

  shadow.appendChild(btn)

  const css = await sdb.drive.get('style/button.css')
  inject(css)

  await sdb.watch(onbatch)

  return el

  function onbatch (batch) {
    for (const { type, data } of batch) {
      if (type === 'style') inject(data)
    }
  }

  function inject (data) {
    if (!data?.raw) return
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data.raw)
    shadow.adoptedStyleSheets = [sheet]
  }
}

function fallback_module () {
  return {
    drive: {
      'style/': {
        'button.css': {
          raw: `
            .toggle-btn {
              padding: 10px 20px;
              background: #f7931a;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            .toggle-btn:hover {
              background: #e67e00;
            }
          `
        }
      }
    },
    api: fallback_instance // ✅ MUST be a function
  }

  function fallback_instance (opts) {
    return {
      drive: {
        'style/': {
          'button.css': {
            raw: `
              .toggle-btn {
                padding: 10px 20px;
                background: red;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              }
              .toggle-btn:hover {
                background: #e67e00;
              }
            `
          }
        }
      }
    }
  }
}


