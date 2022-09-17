import { loadStdlib, ask } from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'
const reach = loadStdlib()

const sleep = (mSecs) => new Promise((resolve) => setTimeout(resolve, mSecs))

let [user, contract, proposals] = [{}, {}, []]

const connectAccount = async () => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(``)
	console.info(``)
	console.log('Connect Account')

	const createAcc = await ask.ask(
		`Would you like to create an account? (Only available on DevNet) [y/n]`,
		ask.yesno
	)

	if (createAcc) {
		const account = await reach.newTestAccount(reach.parseCurrency(1000))
		user = {
			account,
			balance: async () => {
				const balAtomic = await reach.balanceOf(account)
				const balance = reach.formatCurrency(balAtomic, 4)
				return balance
			},
		}
	} else {
		const secret = await ask.ask(`What is your account secret?`, (x) => x)
		const account = await reach.newAccountFromSecret(secret)
		user = {
			account,
			balance: async () => {
				const balAtomic = await reach.balanceOf(account)
				const balance = reach.formatCurrency(balAtomic, 4)
				return balance
			},
		}
	}
	await setRole()
}

const setRole = async () => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.log(``)
	console.log('Select Role')
	contract = {}

	const isDeployer = await ask.ask('Are you the Admin? [y/n]', ask.yesno)

	if (isDeployer) {
		console.clear()

		console.log(`Reach DAO by Team 18`)
		console.log(`Wallet Balance: ${await user.balance()}`)
		console.info(``)
		console.log('Welcome Admin!')
		const shouldDeploy = await ask.ask(
			`Proceed to deployment? [y/n]`,
			ask.yesno
		)

		if (shouldDeploy) {
			await deploy()
		} else {
			await setRole()
		}
	} else {
		console.clear()

		console.log(`Reach DAO by Team 18`)
		console.log(`Wallet Balance: ${await user.balance()}`)
		console.info(``)
		console.log('Hello Attacher!')
		const info = await ask.ask(
			'Please enter the contract information',
			async (x) => {
				await attach(x)
			}
		)
	}
}

const attach = async (ctcInfoStr) => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.info(
		contract.ctcInfoStr
			? `${JSON.stringify(JSON.parse(contract.ctcInfoStr))}`
			: ''
	)
	console.log('[..] Attaching')
	try {
		const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
		contract = { ctcInfoStr }
		await showInfoCenter()
	} catch (error) {
		console.log({ error })
	}
}

const connectAndUpvote = async (id, ctcInfoStr) => {
	try {
		const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
		const upvotes = await ctc.apis.Voters.upvote()
		proposals = proposals.map((el) => {
			if (el.id == id) {
				el['upvotes'] = parseInt(upvotes)
			}
			return el
		})
	} catch (error) {
		console.log('[‼] This proposal is currently not open to transactions')
	}
}

const connectAndDownvote = async (id, ctcInfoStr) => {
	try {
		const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
		const downvotes = await ctc.apis.Voters.downvote()
		proposals = proposals.map((el) => {
			if (el.id == id) {
				el['downvotes'] = parseInt(downvotes)
			}
			return el
		})
	} catch (error) {
		console.log('[‼] This proposal is currently not open to transactions')
	}
}

const deploy = async () => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.info(``)
	console.log('[..] Deploying')
	const ctc = user.account.contract(backend)
	const interact = {
		getProposal: {
			id: 1,
			title: 'Reach DAO',
			link: 'https://github.com/Apostrophe-Corp/Reach-DAO/blob/main/README.md',
			description: `A hub for Web3 Developers`,
			owner: user.account.networkAccount.addr,
			deadline: 0,
			isProposal: false,
		},
	}

	ctc.p.Deployer(interact)
	const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2)
	contract = { ctcInfoStr }
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.info(``)
	console.log(`[+] Deployed`)
	console.group(`Here is the contract information`)
	console.log(`${JSON.stringify(JSON.parse(contract.ctcInfoStr))}`)
	console.groupEnd(`Here is the contract information`)
	await sleep(5000)
	await showInfoCenter()
}

const makeProposal = async (proposal) => {
	const ctc = user.account.contract(backend)
	const proposalSetup = async () => {
		const deadline = { ETH: 1.5, ALGO: 15, CFX: 1500 }[reach.connector]
		ctc.p.Deployer({
			getProposal: {
				...proposal,
				deadline: deadline,
				isProposal: true,
			},
		})
	}
	await proposalSetup()

	proposals.push({
		...proposals,
		owner: user.account.networkAccount.addr,
		contract: JSON.stringify(await ctc.getInfo()),
		upvotes: 0,
		downvotes: 0,
		contribs: 0,
	})
}

const showInfoCenter = async () => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.info(
		contract.ctcInfoStr
			? `${JSON.stringify(JSON.parse(contract.ctcInfoStr))}`
			: ''
	)
	console.group(`Info Center`)
	console.log(`Welcome! To the new Hub!`)
	console.groupEnd(`Info Center`)

	const respondTo = async (request) => {
		switch (request) {
			case 1:
				await showProposals()
				break
			case 2:
				await setRole()
				break
			case 0:
				const confirmed = await ask.ask(
					`[‼] Confirm exit [y/n]`,
					ask.yesno
				)
				if (confirmed) process.exit(0)
				else await showInfoCenter()
				break
			default:
				await showInfoCenter()
				break
		}
	}

	const userInput = await ask.ask(
		`[+] Console Menu
  1. View Proposals
  2. Back to Select Roles
  0. Exit Reach DAO`,
		(input) => {
			if (Number(input) == NaN) {
				throw Error('[‼] Please enter a valid input')
			} else {
				return Number(input)
			}
		}
	)

	await respondTo(userInput)
}

const showProposals = async () => {
	console.clear()

	console.log(`Reach DAO by Team 18`)
	console.log(`Wallet Balance: ${await user.balance()}`)
	console.info(
		contract.ctcInfoStr
			? `${JSON.stringify(JSON.parse(contract.ctcInfoStr))}`
			: ''
	)
	console.group(`Proposals`)
	console.log(`Get the chance to bring your ideas to life!`)
	console.groupEnd(`Proposals`)

	const getProposalInfo = async () => {
		let [title, link, description] = ['', '', '']

		title = await ask.ask(
			`[+] Enter the Proposal's Title Max (25)`,
			(value) => String(value).slice(0, 25)
		)

		link = await ask.ask(
			`[+] Enter the Link to the Proposal's details (Max 150)`,
			(value) => String(value).slice(0, 150)
		)

		description = await ask.ask(
			`[+] Enter a brief description of the Proposal (Max 180)`,
			(value) => String(value).slice(0, 180)
		)

		const satisfied = await ask.ask(
			`Are you satisfied with these details? [y/n]
  Title: ${title}
  Link: ${link}
  Description: ${description}`,
			ask.yesno
		)

		if (satisfied) {
			let proposal = {
				id:
					proposals.length > 0
						? proposals.length === 1
							? proposals[0].id + 1
							: Number(
									proposals.reduce((a, b) =>
										a.id > b.id ? a.id : b.id
									)
							  ) + 1
						: 1,
				title,
				link,
				description,
				owner: user.account.networkAccount.addr,
			}
			console.log('[..] Creating proposal')
			await makeProposal(proposal).then(async () => {
				await showProposals()
			})
		} else {
			await getProposalInfo()
		}
	}

	const selectActiveProposal = async (page = 1) => {
		let [section, activeProposals, proposalsOnDisplay] = [
			page,
			proposals.filter((el) => !el.timedOut),
			[],
		]

		proposalsOnDisplay = activeProposals.filter(
			(el, i) => i + 1 > (section - 1) * 3 && i + 1 <= section * 3
		)
		const lenOfProposals = proposalsOnDisplay.length
		console.group('Active Proposals')
		if (lenOfProposals) {
			proposalsOnDisplay.forEach((p, i) => {
				console.log(`ID: ${i + 1},
Title: ${p.title ?? 'Title'}
Description: ${p.description ?? 'Description'}
Owner: ${p.owner ?? user.account.networkAccount.addr}
Link: ${p.link ?? 'Link'}
Up_Votes: ${p.upvotes}
Down_Votes: ${p.downvotes}\n
`)
			})
		} else {
			console.log('[+] None at the moment.')
		}
		console.groupEnd('Active Proposals')

		await ask.ask(
			lenOfProposals
				? `[+] Enter the Proposal's ID of interest
  ${
		section < Math.ceil(activeProposals.length / 3)
			? 'Enter 99 to view the next list'
			: ''
  }
  ${section > 1 ? 'Enter 88 to view the previous list' : ''}
  Or enter 0 to exit`
				: '[+] Enter any key to exit',
			lenOfProposals
				? async (input) => {
						if (input == 0) {
							await showProposals()
						} else if (
							Number(input) <= proposalsOnDisplay.length &&
							Number(input) >= 1
						) {
							const selectedProposal =
								proposalsOnDisplay[input - 1]
							const action = await ask.ask(
								`What would you like to do?
  1. Up vote
  2. Down vote
  0. Cancel`,
								(x) => {
									if (Number(x) == NaN) {
										throw Error(
											'[‼] Please enter a valid input'
										)
									} else {
										return Number(x)
									}
								}
							)

							switch (action) {
								case 1:
									console.log('[..] Processing up vote')
									await connectAndUpvote(
										selectedProposal.id,
										selectedProposal.contract
									).then(async () => {
										await showProposals()
									})
									break
								case 2:
									console.log('[..] Processing down vote')
									await connectAndDownvote(
										selectedProposal.id,
										selectedProposal.contract
									).then(async () => {
										await showProposals()
									})
									break
								case 0:
									await selectActiveProposal(section)
									break
								default:
									await selectActiveProposal(section)
									break
							}
						} else if (input == 88 && section > 1) {
							await selectActiveProposal(section - 1)
						} else if (
							input == 99 &&
							section < Math.ceil(activeProposals.length / 3)
						) {
							await selectActiveProposal(section + 1)
						} else {
							console.log('[‼] ID not found')
							await sleep(2000)
							await selectActiveProposal(section)
						}
						return
				  }
				: async (input) => {
						await showProposals()
				  }
		)
	}

	const respondTo = async (request) => {
		switch (request) {
			case 1:
				await getProposalInfo()
				break
			case 2:
				await selectActiveProposal()
				break
			case 3:
				await showInfoCenter()
				break
			case 4:
				await setRole()
				break
			case 0:
				const confirmed = await ask.ask(
					`[‼] Confirm exit [y/n]`,
					ask.yesno
				)
				if (confirmed) process.exit(0)
				else await showProposals()
				break
			default:
				await showProposals()
				break
		}
	}

	const userInput = await ask.ask(
		`[+] Console Menu
  1. Make a Proposal
  2. Select an Active Proposal
  3. View Info Center
  4. Back to Select Roles
  0. Exit Reach DAO`,
		(input) => {
			if (Number(input) == NaN) {
				throw Error('[‼] Please enter a valid input')
			} else {
				return Number(input)
			}
		}
	)

	await respondTo(userInput)
}

await connectAccount()

process.exit(0)
