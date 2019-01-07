// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import { default as RelayClient } from 'tabookey-gasless'

// Import our contract artifacts and turn them into usable abstractions.
import metaCoinArtifact from '../../build/contracts/MetaCoin.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
const MetaCoin = contract(metaCoinArtifact)

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

const App = {
  restart: function () {
    setCookie("use_metamask", document.getElementById('checkbox_use_metamask').checked)
    location.reload()
  },

  start: function () {
    const self = this
    document.getElementById('checkbox_use_metamask').checked = getCookie("use_metamask")
    var relayclient = new RelayClient(web3, {
      verbose: true,
      txfee: 12,
      force_gasLimit: 1000000
    })

    this.MetaCoin = MetaCoin
    // Unset network (may change when toggling MetaMask on/off)
    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider)
    relayclient.hook(MetaCoin)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (document.getElementById('checkbox_use_metamask').checked !== true) {
        alert("Using ephemeral keypair.")
        var ephemeralKeypair = self.getCookieEphemeralKeypair()
        if (ephemeralKeypair === null) {
          ephemeralKeypair = relayclient.newEphemeralKeypair()
          self.setCookieEphemeralKeypair(ephemeralKeypair)
        }
        relayclient.useKeypairForSigning(ephemeralKeypair)
        account = ephemeralKeypair.address
        accounts = [account]
      }
      else {
        alert("Using metamask provider")
        relayclient.useKeypairForSigning(null)
        accounts = accs
        account = accounts[0]
      }

      self.refreshBalance()
    })
  },

  setStatus: function (message) {
    const status = document.getElementById('status')
    status.innerHTML = message
  },

  refreshBalance: function () {
    const self = this

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.getBalance.call(account, { from: account })
    }).then(function (value) {
      const balanceElement = document.getElementById('balance')
      balanceElement.innerHTML = value.valueOf()
      const addressElement = document.getElementById('address')
      addressElement.innerHTML = account.valueOf()
    }).catch(function (e) {
      console.log(e)
      if (e.message.includes("MetaCoin has not been deployed to detected network")) {
        alert("No MetaCoin on selected network")
      }
      self.setStatus('Error getting balance; see log.')
    })
  },

  sendCoin: function () {
    const self = this

    const amount = parseInt(document.getElementById('amount').value)
    const receiver = document.getElementById('receiver').value

    this.setStatus('Initiating transaction... (please wait)')

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.sendCoin(receiver, amount, { from: account })
    }).then(function () {
      self.setStatus('Transaction complete!')
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  },

  setCookieEphemeralKeypair: function (keypair) {
    setCookie("address", keypair.address)
    let pkeyStr = JSON.stringify(keypair.privateKey)
    setCookie("privateKey", pkeyStr)
  },

  getCookieEphemeralKeypair: function () {
    let address = getCookie("address")
    let pkeyStr = getCookie("privateKey")
    let privateKey = JSON.parse(pkeyStr)
    if (address === null || address === "") {
      return null
    }
    return {
      address: address,
      privateKey: privateKey
    }
  }
}

window.App = App

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined' && getCookie("use_metamask") === "true") {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    // window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  }

  App.start()
})
