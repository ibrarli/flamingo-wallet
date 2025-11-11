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
const send_invoice_modal = require('../src/node_modules/send_invoice_modal')
const btc_nodes = require('../src/node_modules/btc_nodes')
const more_menu = require('../src/node_modules/more_menu')
const details_menu = require('../src/node_modules/details_menu')
const btc_req_msg = require('../src/node_modules/btc_req_msg')
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
  const more_menu_component = await more_menu(subs[20], protocol)
  const details_menu_component = await details_menu(subs[22], protocol)
  const btc_req_msg_component = await btc_req_msg(subs[24], protocol)
  const send_invoice_modal_component = await send_invoice_modal(subs[26], protocol)
  const create_invoice_confirmation_component = await create_invoice_confirmation(subs[28], protocol)
  const pay_invoice_confirmation_component = await pay_invoice_confirmation(subs[30], protocol)
  const light_transaction_receipt_component = await light_transaction_receipt(subs[32], protocol)
  
  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;">
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Home Page</div>
        <div id="home-page-container"></div> 
      </div>
      <div id="lightning-page-container"></div>
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
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Contact list</div>  
        <div id="contacts-list-container" ></div>  
      </div>
      <div id="chat-view-container"></div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">BTC Req Msg</div>  
        <div id="btc-req-msg-container" style="background: white; padding:20px; border-radius:10px;"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Switch Account</div>  
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
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">More Menu</div>  
        <div id="more-menu-container"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; margin-block: 10px;"> 
        <div class="component-label" style="padding-bottom:10px;">Details Menu</div>  
        <div id="details-menu-container"></div>
      </div>
    </div>
  `
  page.querySelector('#home-page-container').appendChild(home_page_component)
  page.querySelector('#lightning-page-container').appendChild(lightning_page_component)
  page.querySelector('#send-to-container').appendChild(send_invoice_modal_component)
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#contacts-list-container').appendChild(contacts_list_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#switch-account-container').appendChild(switch_account_component)
  page.querySelector('#send-btc-container').appendChild(send_btc_component)
  page.querySelector('#receive-btc-container').appendChild(receive_btc_component)
  page.querySelector('#transaction-receipt-container').appendChild(transaction_receipt_component)
  page.querySelector('#btc-nodes-container').appendChild(btc_nodes_component)
  page.querySelector('#more-menu-container').appendChild(more_menu_component)
  page.querySelector('#details-menu-container').appendChild(details_menu_component)
  page.querySelector('#btc-req-msg-container').appendChild(btc_req_msg_component)
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
      '../src/node_modules/btc_nodes': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/more_menu': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
       '../src/node_modules/details_menu': {
        $: '',
        0: '',
        mapping: {
          style: 'style',
          data: 'data',
          icons: 'icons'
        }
      },
      '../src/node_modules/btc_req_msg': {
        $: '',
        0: {
          "avatar": "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3",
          "name": "Mark Kevin",
          "amount": 0.0019,
          "date": "25 June 2025",
          "status": "expired", // or "paid", "expired"
          "is_me": false
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
    }
  }
}