import { loadStdlib } from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'
const reach = loadStdlib()

console.clear()

console.log(`Reach DAO by Team 18`)
console.log(`[.] Creating the Deployer's test account..`)
const user = await reach.newTestAccount(reach.parseCurrency(1000))
console.log(
	`[+] Account created and initialized with ${reach.formatCurrency(
		await reach.balanceOf(user),
		4
	)} ${reach.standardUnit}`
)
console.log(`[.] Starting Backend`)
const ctc = user.contract(backend)

const interact = {
	// The deployer's interact interface
}

console.log('[.] Deploying')
ctc.p.Deployer(interact)
console.log(
	`[+] Deployed with info: ${JSON.stringify(await ctc.getInfo(), null)}`
)

console.log('[.] Exiting Reach DAO')

process.exit(0)
