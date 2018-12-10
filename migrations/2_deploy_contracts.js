var ConvertLib = artifacts.require('./ConvertLib.sol')
var MetaCoin = artifacts.require('./MetaCoin.sol')
var RelayHub = artifacts.require('RelayHub')

module.exports = function (deployer) {
  var meta
  deployer.deploy(ConvertLib)
  deployer.link(ConvertLib, MetaCoin)
  deployer.deploy(MetaCoin).then(dep => {
    meta = dep
    return RelayHub.at('0x254dffcd3277c0b1660f6d42efbb754edababc2b')
  }).then(rhub => {
    console.log('added deposit for META ' + meta.address)
    return rhub.depositFor(meta.address, { value: 1e17 })
  }).then(ret => {
    console.log('depositFor completed ')
    return meta.getDeposit.call()
  }).then((value) => {
    console.log('getDeposit(', meta.address, ') = ', value.toNumber())
  }).catch(e => {
    console.log('error:', e)
  })
}
