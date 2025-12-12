const STATE = require('STATE')
const statedb = STATE(__filename)
statedb.admin()
const { sdb, get } = statedb(fallback_module)

const transaction_history = require('../src/node_modules/transaction_history')
const chat_view = require('../src/node_modules/chat_view')
const transaction_receipt = require('../src/node_modules/transaction_receipt')
const home_page = require('../src/node_modules/home_page')
const send_invoice_modal = require('../src/node_modules/send_invoice_modal')
const btc_nodes = require('../src/node_modules/btc_nodes')
const create_invoice_confirmation = require('../src/node_modules/create_invoice_confirmation')
const pay_invoice_confirmation = require('../src/node_modules/pay_invoice_confirmation')
const light_transaction_receipt = require('../src/node_modules/light_tx_receipt')


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
  const btc_nodes_component = await btc_nodes(subs[2], protocol)
  const transaction_history_component = await transaction_history(subs[4], protocol)
  const light_transaction_receipt_component = await light_transaction_receipt(subs[6], protocol)
  const chat_view_compoent = await chat_view(subs[8],protocol)
  const create_invoice_confirmation_component = await create_invoice_confirmation(subs[10], protocol)
  const pay_invoice_confirmation_component = await pay_invoice_confirmation(subs[12], protocol)
  const send_invoice_modal_component = await send_invoice_modal(subs[14], protocol)
  const transaction_receipt_component = await transaction_receipt(subs[16], protocol)

 

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Home Page</div>
        <div id="home-page-container"></div> 
      </div>
      <div id="chat-view-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">send_invoice_modal</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="send-to-container"></div> 
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Transaction History</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="transaction-history-container"></div> 
      </div> 
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Create Invoice Confirmation</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="create-invoice-confirmation-container"></div> 
      </div> 
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Pay Invoice Confirmation</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="pay-invoice-confirmation-container"></div> 
      </div> 
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">lightning transaction Receipt</div>  
        <div style="width: 400px; font-weight: 500px; margin-right: 50px;"id="light-transaction-receipt-container"></div> 
      </div> 
      <div id="transaction-receipt-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">btc nodes</div>  
        <div id="btc-nodes-container"></div>
      </div>
    </div>
  `
  page.querySelector('#home-page-container').appendChild(home_page_component)
  page.querySelector('#send-to-container').appendChild(send_invoice_modal_component)
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#transaction-receipt-container').appendChild(transaction_receipt_component)
  page.querySelector('#btc-nodes-container').appendChild(btc_nodes_component)
  page.querySelector('#create-invoice-confirmation-container').appendChild(create_invoice_confirmation_component)
  page.querySelector('#pay-invoice-confirmation-container').appendChild(pay_invoice_confirmation_component)
  page.querySelector('#light-transaction-receipt-container').appendChild(light_transaction_receipt_component)


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
     '../src/node_modules/btc_nodes': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
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
                tid: "ajd83hs9fk3l02msdkf",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                tid: "XyzA1b2C3d4E5f6G7",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
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
                tid: "92hd82hsja7sd8h3jsd2",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                ttime: "04:45 PM",
                tamount: "- 0.03791",
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
                tid: "jK83hf02sd93ls0dn4fj",
                ttime: "02:15 PM",
                tamount: "+ 0.03271",
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
                tid: "r8t7y6u5i4o3p2a1s0d9f8g7",
                ttime: "04:45 PM",
                tamount: "- 0.03791",
              }
            ]
          },
          mapping: {
            style: 'style',
            data: 'data'
          }
        },
        '../src/node_modules/light_tx_receipt': {
          $: '',
          0: {
          value: [
                { label: "Paid By", value: "Cypher" },
                { label: "Recipient", value: "Luis fedrick - 1FfmbHfn...455p" },
                { label: "Label", value: "Work Payment" },
                { label: "Note", value: "This is the month of may invoice and i also updated everything too" },
                { label: "Time & Date", value: "30 June 2025, 09:32 AM" },
                { label: "Transaction Fees", value: "0.0001 BTC", convert: true },
                { label: "Recipient Receives", value: "0.0019 BTC", convert: true },
                { label: "Lightning Invoice", value: "lnbc625u1p5x5nc6pp5v93dv3x7d4e8wg6ud0gp5h93cmysznsrsxv9zz2va0td83pp95lsdqqcqzysxqrrsssp53qtuxu9mh9daajju22l9ka6qvq0x430d5fdm0c5q3j0lvmwhn23s9qxpqysgq2r88trs6ksy88605ff87668sgcrj6ze37h99vmpky6z3j5l0j2msgukypgnk8uqfecq8rv8a3tst6ela7d4j5spj280nl4pan6nvj9qpk57fp9" },
                { label: "Total Amount", value: "0.0020 BTC",  icon: "lightning.svg", convert: true }
              ]
            },
          mapping: {
            style: 'style',
            data: 'data',
            icons: 'icons'
          }
        },
        '../src/node_modules/chat_view': {
          $: '',
          0: {
            value: {
              avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3",
              name: "David Clark",
              code: "1FfmbHfn...455p",
              amount: 0.0054,
              date: "25 June 2025",
              status: "expired", 
              is_me: false
            }
          },
          mapping: {
            style: 'style',
            data: 'data'
          }
        },
          '../src/node_modules/create_invoice_confirmation': {
        $: '',
        0: {
        value: [
              { label: "Label", value: "Work Payment" },
              { label: "Note", value: "This is the month of may invoice and i also updated everything too" },
              { label: "Amount", value: "0.0020 BTC",  icon: "lightning.svg", convert: true }
            ]
          },
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/pay_invoice_confirmation': {
        $: '',
        0: {
        value: [
              { label: "Amount", value: "0.0030 BTC", convert: true },
              { label: "Fee", value: "0.0001 BTC", convert: true },
              { label: "Recipient Address", value: "7RwmbHfn...455p" },
              { label: "Processing time", value: "< 5 minutes" },
              { label: "Total (inc. fee)", value: "0.0031 BTC ",  icon: "lightning.svg", convert: true }
            ]
          },
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },   
      '../src/node_modules/send_invoice_modal': {
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
    
    
   
      '../src/node_modules/transaction_receipt': {
        $: '',
        0: {
        value: [
              { label: "Sent By", value: "Cypher" },
              { label: "Sent To", value: "Luis fedrick - 1FfmbHfn...455p" },
              { label: "Time & Date", value: "30 June 2025, 09:32 AM" },
              { label: "Transaction Fees", value: "0.0001 BTC" , convert: true},
              { label: "Recipient Receives", value: "0.0019 BTC", convert: true },
              { label: "Blockchain Explorer", value: "https://mempool.space/tx/your_txid_here",  link: true },
              { label: "Total Amount", value: "0.0020 BTC",  icon: "btc.svg", convert: true }
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