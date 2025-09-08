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

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label">Home Page</div>
        <div id="home-page-container"></div> 
      </div>
      <div id="lightning-page-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label">Transaction History</div>  
        <div style="width: 400px; font-weight: 500px;"id="transaction-history-container"></div> 
      </div>
      <div id="contacts-list-container" ></div>   
      <div id="chat-view-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label">Switch Account</div>  
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
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
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
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
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
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"
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
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
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
                tid: "3TgmbHfn...455p",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
                avatar: "https://images.stockcake.com/public/a/1/3/a13b303a-a843-48e3-8c87-c0ac0314a282_large/intense-male-portrait-stockcake.jpg"
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
                tid: "7RwmbHfn...455p",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
                avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
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
      
    }
  }
}