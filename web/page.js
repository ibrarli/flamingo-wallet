const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const totalWealth = require('../src/node_modules/transaction_history')
const state = {}

function protocol (message, notify) {
  const { from } = message
  state[from] = { notify }
  return listen
}

function listen (message) {
  console.log('Protocol message received:', message)
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


  const component = await totalWealth(subs[0], protocol)

 

  const page = document.createElement('div')
  page.innerHTML = `
    <div>
      <container></container>
    </div>
  `

  page.querySelector('container').replaceWith(component)
  document.body.append(page)

  console.log("Page mounted")
}

main()

// ============ Fallback Setup ============
function fallback_module () {
  return {
    drive: {},
    _: {
      '../src/node_modules/transaction_history': {
        $: '',
        0: {
    value: [
      {
        date: "Today",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"

      },
      {
        date: "Today",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Today",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
       },
      {
        date: "Today",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791",
         avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Yesterday",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456",
        avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Yesterday",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"     
      },
      {
        date: "Yesterday",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.bdn3Kne-OZLwGM8Uoq5-7gHaHa?w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Yesterday",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Dec 09",
        tid: "Luis fedrick",
        ttime: "11:30 AM",
        tamount: "+ 0.02456",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.VIRWK2jj8b2cHBaymZC5AgHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Dec 09",
        tid: "3TgmbHfn...455p",
        ttime: "02:15 PM",
        tamount: "+ 0.03271",
        avatar: "https://tse4.mm.bing.net/th/id/OIP.x-5S96eQh14_yvkqjsIOfwHaHa?w=800&h=800&rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Dec 09",
        tid: "Mark Kevin",
        ttime: "03:45 PM",
        tamount: "- 0.00421",
        avatar: "https://tse2.mm.bing.net/th/id/OIP.255ajP8y6dHwTTO8QbBzqwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      },
      {
        date: "Dec 09",
        tid: "7RwmbHfn...455p",
        ttime: "04:45 PM",
        tamount: "- 0.03791",
        avatar: "https://tse2.mm.bing.net/th/id/OIP.7XLV6q-D_hA-GQh_eJu52AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
      },

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