const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const contacts_list = require('../src/node_modules/contacts_list')
const transaction_history = require('../src/node_modules/transaction_history')
const transaction_list = require('../src/node_modules/transaction_list')
const chat_view = require('../src/node_modules/chat_view')
const switch_account = require('../src/node_modules/switch_account')


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
  const transaction_list_component = await transaction_list(subs[0], protocol)
  const transaction_history_component = await transaction_history(subs[2], protocol)
  const contacts_list_component = await contacts_list(subs[4], protocol)
  const chat_view_compoent = await chat_view(subs[6],protocol)
  const switch_account_component = await switch_account(subs[8], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div style="display:flex; flex-direction:row; gap: 20px; margin: 20px;"> 
      <div id="transaction-list-container"></div> 
      <div id="transaction-history-container"></div> 
      <div id="contacts-list-container" ></div>   
      <div id="chat-view-container"></div>
      <div id="switch-account-container"></div>
    </div>
  `
  page.querySelector('#transaction-history-container').appendChild(transaction_history_component)
  page.querySelector('#transaction-list-container').appendChild(transaction_list_component)
  page.querySelector('#contacts-list-container').appendChild(contacts_list_component)
  page.querySelector('#chat-view-container').appendChild(chat_view_compoent)
  page.querySelector('#switch-account-container').appendChild(switch_account_component)

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
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "3TgmbHfn...455p",
                  ttime: "02:15 PM",
                  tamount: "+ 0.03271",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "Mark Kevin",
                  ttime: "03:45 PM",
                  tamount: "- 0.00421",
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
                },
                {
                  tid: "7RwmbHfn...455p",
                  ttime: "04:45 PM",
                  tamount: "- 0.03791",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
                {
                  tid: "Luis fedrick",
                  ttime: "11:30 AM",
                  tamount: "+ 0.02456",
                  avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                },
              ]
            },
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
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
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
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
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
                  avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
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
          
       }
    }
}