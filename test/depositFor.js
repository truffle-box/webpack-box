MetaCoin = artifacts.require("MetaCoin")
RelayHub = artifacts.require( "RelayHub")

describe("deposit", async () => {
	it( "deposit the MetaCoin on relay hub", async() => {
		meta = await MetaCoin.at("0x9b1f7f645351af3631a656421ed2e40f2802e6c0" )
		console.log( "meta adddr=",meta.address)

		try {
		hubaddr = await meta.get_relay_hub();
		} catch (e) {
			assert.ok( 0, "RelayHub not deployed. must restart it from tabookey-gasless project itself" )
		}
		console.log( "hub addr=", hubaddr)
		hub = RelayHub.at(hubaddr)

		b1 = await hub.balanceOf(meta.address)
		console.log( "pre deposit balance", b1.toNumber() )
		hub.depositFor( meta.address	, {value:1e12 })

		b2 = await hub.balanceOf(meta.address)
		console.log( "post deposit balance", b2.toNumber() )
	})
})
