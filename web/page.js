const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const contacts_list = require('../src/node_modules/contacts_list')

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

  const contact_list = await contacts_list(subs[0], protocol)

  const page = document.createElement('div')
  page.innerHTML = `
    <div >
      <div id="contacts-list-container" ></div>   
    </div>
  `

  page.querySelector('#contacts-list-container').appendChild(contact_list)
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
       }
    }
}