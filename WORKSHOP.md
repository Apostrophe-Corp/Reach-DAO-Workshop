# Reach DAO

In this workshop, we'll design a platform where users can create proposals and have other users in the platform decide the outcome of the proposal created by either up voting or down voting the proposal, and optionally sponsoring the proposal by contributing to it with the condition that the proposer only gets the total funds if the amount of up votes surpasses that of the down votes. In this scenario encountering proposals that fail to pass this condition are inevitable, so we would give users the means to claim back the portions they contributed to a failed proposal until all funds have been retrieved. On the other hand, for passed proposals, we would have them become bounties, open to be claimed by anyone willing to fulfill the proposed task.  

> This workshop assumes that you have recently completed the Rock, Papers, Scissors tutorial and have a good understanding of interactive test deployment  

We assume that you'll go through this workshop in a directory named `~/reach/rsh_dao-ws`:

```shell
> mkdir -p ~/reach/rsh_dao-ws && cd ~/reach/rsh_dao-ws
```

And that you have a copy of Reach installed in `~/reach/rsh_dao-ws`, so that you can write

```shell
> ./reach version
```

And it will run Reach. You should by initializing your Reach program with two files, the contract `index.rsh` file, and the test suite `index.mjs`  file:

```shell
> touch index.rsh
> touch index.mjs
```

Then insert the following boilerplate in the respective files to kick off development on the program.

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v0/index.rsh)

---

```javascript
'reach 0.1';
export const main = Reach.App(() => {

    const Deployer = Participant('Deployer', {
        // The deployer's interact
    });
    init();

    Deployer.only(() => {
        // A local step
    });
    Deployer.publish();
    
    commit();
    exit();
});
```

[`~/reach/rsh_dao-ws/index.mjs`](./rsh_dao-v0/index.mjs)

---

```javascript
import { loadStdlib } from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'
const reach = loadStdlib()

console.clear()

console.log(`Reach DAO`)
console.log(`[.] Creating the Deployer's test account..`)
const user = await reach.newTestAccount(reach.parseCurrency(1000))
console.log(`[+] Account created and initialized with ${reach.formatCurrency(await reach.balanceOf(user),4)} ${reach.standardUnit}`)
console.log(`[.] Starting Backend`)
const ctc = user.contract(backend)

const interact = {
 // The deployer's interact interface
}

console.log('[.] Deploying')
ctc.p.Deployer(interact)
console.log(`[+] Deployed with info: ${JSON.stringify(await ctc.getInfo(), null)}`)

console.log('[.] Exiting Reach DAO')

process.exit(0)

```

Ensure the following commands run perfectly, and we are good to go

```shell
> ./reach compile
```

```shell
> ./reach run
```

## Problem Analysis

First, we should think over the details of the program and answer some questions to help reason about the implementation of the program. Let's provide some constraints and problem analysis.  

The overall purpose of this program is so that:

- A user should be able to create a proposal.
- This proposal must be visible to other users, allowing them to vote on, and contribute to.
- After a predefined deadline is reached, the outcome of the proposal is determined from its votes.
- The funds raised by a passed proposal are sent to the proposer and the proposal made a bounty, while for a failed proposal, it is made available for users to claim a refund.

With this in mind, lets's answer the questions:

- How many participants does this program require, and who are they?
- How do we implement voluntary interaction?
- How do we ensure every user is aware of the current state of things?
- How do we ensure that when a contract gets created for a new proposal, that it can be attached to by anyone to interact with?  
- How do we enforce that when a proposal's window for interactions closes that it gets evaluated and either is taken down or moved to the next stage of its life cycle?

### Write down the problem analysis of this program as a comment

Let's see if we arrived at the same conclusions:

- This program requires just one participant declaration, that is the Deployer. This participant would be responsible for deploying the contract, and when a proposal is being created by a user, that user assumes the role of the Deployer for that proposal, which in itself would be a contract.  
- To implement voluntary interaction with the contract, API calls to the contract must be set up.
- To notify every user connected to the contract, Events must be used.
- The information of the contract for a proposal must be provided along with the details for the proposal, that way it is accessible upon a request to interact with one.
- Using deadlines, proposals can be timed to determine when in the consensus its window for interactions gets closed.

It's totally fine if we came to different solutions! Such is the art of programming.

## Data Definition

Now after we've successfully, outlined—for the most part—how the program would handle things, lets now how information will be represented in the it.  

First, we need to consider what kind of information is needed to represent a proposal in our backend.  

### You can at this point take some time to figure this out and write it down as a comment in your `index.rsh` file

Lets see if our answers match:

- **ID**: A proposal would need a means of quick identification in a pool of other proposals.
- **Title**: A proposal must have a definite name. This will be referred to as its title.
- **Link**: Surely all the information regarding the proposal cannot just be stored in our contract as bytes, no, we would run out of storage supported for a contract. Therefore, we would have a link to an external source where a more detailed explanation would be found.
- **Description**: Okay we can't store overly large amounts of bytes in our contract, but we can have a brief one or two sentence description of the proposal.
- **Owner**: Books have authors and every invention has an inventor, nothings comes by chance, the same applies to proposals.
- **Deadline**: This is a predefined period set by the origin Deployer for all proposals to handle interaction.  

With these properties in mind, more questions seem to arise:

- What data type will represent the ID of the proposal?
- What data type will represent the title of the proposal?
- What data type will represent the link to the proposal's complete details?
- What data type will represent the description of the proposal?
- What data type will represent the owner of a proposal?
- What data type will represent the deadline set by the origin Deployer?

> Refer to [Types](https://docs.reach.sh/rsh/compute/#ref-program-types) for a reminder of what data types are available in Reach.

Now that we've decided what data types to use, we need to determine how the program will obtain this information. We need to outline the participant interact interact for the only participant in the program—the Deployer.  

- What participant interact interface will Deployer use?
- Taking into account that the Deployer can either deploy the main contract or make a proposal upon a contract creation, how do we notify the backend what we want to do through the interact interface?

Revisit the problem analysis section when completing this section. Whenever a participant starts off with some knowledge, that will be a field in the `interact` object. If they learn something, then it will be a function. If they provide something later, then it will be a result of a function.  

You should write down your answers in your Reach file (`index.rsh`) as the participant interact interface for the Deployer.

### Write down the data definitions for this program as definitions

Let's now compare your answers with ours:

- The `id` will be represented with a `UInt`, as it is a relative time delta signifying a change in block numbers.
- The `title` will be represented with bytes, with a maximum of 25 characters, `Bytes(25)`
- The `link` will be represented with bytes, with a maximum of 150 characters, considering the length of most URLS, `Bytes(25)`
- The `description` will be represented with bytes, with a maximum of 180 characters, for a really short description.
- The `owner` will be represented with `Address`. In order to maintain anonymity, only the wallet address of the proposer is sufficient (at least for now).
- The `deadline` will be represented with `UInt`, as it is a relative time delta signifying a change in block number.  

Now the Admin would like to deploy the main contract, and a user could create proposal. How do we pass this to the backend?

We'll now introduce another proposal property to the Deployer interface:

- **isProposal**: This value would be what the contract considers before deploying as a the main contract or as a proposal contract.

Were you able to guess that type `isProposal` will be?

- It will be represented with a `Bool`.

Our participant interact interface, looks like this so far:

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v1/index.rsh)

---

```javascript
const Deployer = Participant('Deployer', {
        getProposal: Object({
            id: UInt,
            title: Bytes(25),
            link: Bytes(150),
            description: Bytes(180),
            owner: Address,
            deadline: UInt,
            isProposal: Bool,
        }),
})
```

We've set the Deployer's interact object to have only one property `getProposal`, which holds all the values needed for a proposal and the boolean `isProposal` that dictates if the main contract gets deployed of a proposal contract.  
At this point, you can modify your JavaScript file (`index.mjs`) to mirror your backend, although you may want to use placeholders for the actual values, except when you actually create a proposal. Its good practice to have these two files open side-by-side in the early stages of development, for simultaneous updates as you're deciding the participant interact interface.

