(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = contact_row

async function contact_row (opts = {}, protocol) {
  // const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const avatar = opts.avatar || ''
  const name = opts.name || ''
  const message = opts.message || ''
  const time = opts.time || ''
  const unread = opts.unread || 0
  const online = opts.online || false
  const lightining = opts.lightining || false


  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="contact-row">
      <div class="contact-left">
        <div class="contact-avatar">
          <img src="${avatar}" alt="avatar" />
          ${online ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="contact-info">
          <div class="contact-name">${name}</div>
          <div class="contact-message ${unread > 0 ? 'unread-message' : ''}">${message}</div>       
      </div>
      </div>
      <div class="contact-right">
        <div class="contact-time">${time}</div>
        <div class="icon-wrapper  ${!lightining ? 'no-lightning' : ''}">
          ${lightining ? `<svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" id="IconChangeColor"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.3006 1.04621C11.7169 1.17743 12 1.56348 12 1.99995V6.99995L16 6.99995C16.3729 6.99995 16.7148 7.20741 16.887 7.53814C17.0592 7.86887 17.0331 8.26794 16.8192 8.57341L9.81924 18.5734C9.56894 18.931 9.11564 19.0849 8.69936 18.9537C8.28309 18.8225 8 18.4364 8 18L8 13H4C3.62713 13 3.28522 12.7925 3.11302 12.4618C2.94083 12.131 2.96694 11.732 3.18077 11.4265L10.1808 1.42649C10.4311 1.06892 10.8844 0.914992 11.3006 1.04621Z" fill="orange" id="mainIconPathAttribute" stroke="#f7931a" stroke-width="0"></path> </svg>`: ' '}
          ${unread > 0 ? `<div class="unread-badge">${unread}</div>` : ''}
        </div>
      </div>
    </div>
    <style></style>
  `
  const style = shadow.querySelector('style')
  style.textContent = `
      .contact-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0px;
        font-family: Arial, sans-serif;
        color: black;
        width: 100%;
        box-sizing: border-box;
        cursor: pointer;
      }

      .contact-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .contact-avatar {
        position: relative;
        width: 50px;
        height: 50px;
        flex-shrink: 0;
      }

      .contact-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #ccc;

      }

      .online-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background-color: #00c853; /* green */
        border: 2px solid white;
        border-radius: 50%;
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .contact-name {
        font-size: 20px;
        color: #222;
        line-height: 1.4;
        
      }

      .contact-message {
        font-size: 15px;
        font-weight: normal; /* Default if no unread */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
        display: inline-block;
      }

      .contact-message.unread-message {
        font-weight: 550;
      }

      .contact-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        gap: 6px;
      }

      .contact-time {
        font-size: 16px;
        color: #888;
      }

      .icon-wrapper {
        position: relative;
        width: 20px;
        height: 20px;
        padding-right: 8px;

      }

   

      .bolt-icon {
        width: 100%;
        height: 100%;
        display: block;
      }

      .unread-badge {
        position: absolute;
        top: -6px;
        right: -10px;
        width: 10px;
        height: 10px;
        background-color: #FF4343;
        color: white;
        font-size: 12px;
        font-weight: bold;
        border-radius: 50%;
        padding: 5px 5px;
        text-align: center;
        line-height: 1;
        border: 2px solid white;
        border-radius: 50%;
      }


      .icon-wrapper.no-lightning .unread-badge {
        position: static;
      }

  `
  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(
        paths.map(path => drive.get(path).then(file => file.raw))
      )
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata (data) {
    await renderValues(data[0]?.value || {})
  }
}


function fallback_module () {
  return {
    api (opts = {}) {
      return {
        drive: {
          'data/': {
            'opts.json': {
              raw: {
                avatar: 'https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain',
                tid: 'Sample Transaction',
                ttime: '12:00 PM',
                tamount: '+ 0.02345'
              }
            }
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/contact_row/contact_row.js")
},{"STATE":1}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = contacts_list

const createContactRow = require('contact_row')

async function contacts_list (opts = {}) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb

  const on = {
    style: inject,
    data: ondata
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
    <div class="contact-list-container"></div>
    <style></style>
  `

  const style = shadow.querySelector('style')
  const containerEl = shadow.querySelector('.contact-list-container')

  const subs = await sdb.watch(onbatch)

  return el

  function fail(data, type) {
    throw new Error('invalid message', { cause: { data, type } })
  }

  async function onbatch (batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      await func(data, type)
    }
  }

  function inject (data) {
    style.textContent = data[0]
  }

  async function ondata(data) {
    const contacts = data[0]?.value || []
    await renderContacts(contacts)
  }

  async function renderContacts(contactList) {
    containerEl.innerHTML = `<div class="contact-list-header">Contacts</div>`

    for (const contact of contactList) {
      const row = await createContactRow(contact)
      containerEl.appendChild(row)
    }
  }
}

function fallback_module () {
  return {
    api (opts = {}) {
      return {
        drive: {
          'style/': {
            'contacts_list.css': {
              '$ref': 'contacts_list.css'
            }
          },
          'data/': {
            'opts.json': {
              raw: opts
            }
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/contacts_list/contacts_list.js")
},{"STATE":1,"contact_row":2}],4:[function(require,module,exports){
const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/main/'
const init_url = prefix + 'src/node_modules/init.js'

fetch(init_url, { cache: 'no-store' }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(arguments, prefix)
  require('./page') // or whatever is otherwise the main entry of our project
})
},{"./page":5}],5:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

// const transactionHistory = require('../src/node_modules/transaction_history')
// const transactionList = require('../src/node_modules/transaction_list')
// const contactRow = require('../src/node_modules/contact_row')
const contactsList = require('../src/node_modules/contacts_list')



const state = {}

function protocol (message, notify) {
  const { from } = message
  state[from] = { notify }
  return listen
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


//  const tHistoryComponent = await transactionHistory(subs[0], protocol)
//  const tListComponent = await transactionList(subs[0], protocol)
  // const contactRowComponent = await contactRow(subs[0], protocol)
  const contactListComponent = await contactsList(subs[0], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div >
      <div id="history-container"></div>
      <div id="list-container"></div>
      <div id="contacts-list-container" ></div>   
    </div>
  `
 
  // page.querySelector('#history-container').appendChild(tHistoryComponent)
  // page.querySelector('#list-container').appendChild(tListComponent)
  // page.querySelector('#contact-row-container').appendChild(contactRowComponent)
  page.querySelector('#contacts-list-container').appendChild(contactListComponent)
  document.body.append(page)
  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {},
 
    _: {
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
          }



      // '../src/node_modules/transaction_history': {
      //   $: '',
      //   0: {
      //   value: [
      //           {
      //             date: "Today",
      //             tid: "Luis fedrick",
      //             ttime: "11:30 AM",
      //             tamount: "+ 0.02456",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"

      //           },
      //           {
      //             date: "Today",
      //             tid: "3TgmbHfn...455p",
      //             ttime: "02:15 PM",
      //             tamount: "+ 0.03271",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Today",
      //             tid: "Mark Kevin",
      //             ttime: "03:45 PM",
      //             tamount: "- 0.00421",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
      //           },
      //           {
      //             date: "Today",
      //             tid: "7RwmbHfn...455p",
      //             ttime: "04:45 PM",
      //             tamount: "- 0.03791",
      //             avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Yesterday",
      //             tid: "Luis fedrick",
      //             ttime: "11:30 AM",
      //             tamount: "+ 0.02456",
      //             avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Yesterday",
      //             tid: "3TgmbHfn...455p",
      //             ttime: "02:15 PM",
      //             tamount: "+ 0.03271",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
      //           },
      //           {
      //             date: "Yesterday",
      //             tid: "Mark Kevin",
      //             ttime: "03:45 PM",
      //             tamount: "- 0.00421",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Yesterday",
      //             tid: "7RwmbHfn...455p",
      //             ttime: "04:45 PM",
      //             tamount: "- 0.03791",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Dec 09",
      //             tid: "Luis fedrick",
      //             ttime: "11:30 AM",
      //             tamount: "+ 0.02456",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Dec 09",
      //             tid: "3TgmbHfn...455p",
      //             ttime: "02:15 PM",
      //             tamount: "+ 0.03271",
      //             avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Dec 09",
      //             tid: "Mark Kevin",
      //             ttime: "03:45 PM",
      //             tamount: "- 0.00421",
      //             avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //           {
      //             date: "Dec 09",
      //             tid: "7RwmbHfn...455p",
      //             ttime: "04:45 PM",
      //             tamount: "- 0.03791",
      //             avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      //           },
      //         ]
      //       },
      //       mapping: {
      //         style: 'style',
      //         data: 'data'
      //       }
          
      //     },
          // '../src/node_modules/contact_row': {
          // $: '',
          // 0: {
          // value: [
          //         {
          //           avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3",
          //           name: 'Mark kevin',
          //           message: 'Payment Re...',
          //           time: '3 hr',
          //           unread: 5,
          //           online: false,
          //           lightining: true
          //         }
          //       ]
          //     },
          //     mapping: {
          //       style: 'style',
          //       data: 'data'
          //     }
            
          //   },
       }
    }
}
}).call(this)}).call(this,"/web/page.js")
},{"../src/node_modules/STATE":1,"../src/node_modules/contacts_list":3}]},{},[4]);
