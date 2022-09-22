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
- To implement voluntary interaction with the contract, **API** calls to the contract must be set up.
- To notify every user connected to the contract, **Events** must be used.
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

Now that we've decided what data types to use, we need to determine how the program will obtain this information. We need to outline the participant interact interface for the only participant in the program—the Deployer.  

- What participant interact interface will Deployer use?
- Taking into account that the Deployer can either deploy the main contract or make a proposal upon a contract creation, how do we notify the backend what we want to do through the interact interface?

Revisit the problem analysis section when completing this section.  

You should write down your answers in your Reach file (`index.rsh`) as the participant interact interface for the Deployer.

### Write down the data definitions for this program as definitions

Let's now compare your answers with ours:

- The `id` will be represented with a `UInt`.
- The `title` will be represented with `Bytes(25)` (Bytes with a maximum of 25 characters).
- The `link` will be represented with `Bytes(150)` (Bytes with a maximum of 150 characters), considering the length of most URLs.
- The `description` will be represented with `Bytes(180)` (Bytes with a maximum of 180 characters), for a really short description.
- The `owner` will be represented with `Address`. In order to maintain anonymity, using only the wallet address of the proposer as a means of identification is sufficient (at least for now).
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
> At this point, you can modify your JavaScript file (`index.mjs`) to mirror your backend, although you may want to use placeholders for the actual values, except when you actually create a proposal. Its good practice to have these two files open side-by-side in the early stages of development, for simultaneous updates as you're deciding the participant interact interface.

The Deployer's interact interface is set, and we can already imagine how the flow of our DApp would be:

```javascript
// The origin Deployer deploys the contract
// An individual attaches, and so do others
// A user creates a proposal, and everyone gets to see this new addition
// Users express their interest in proposals by either up voting or down voting, and everyone else see the total number of votes a proposal has
```

Continuing any further would only lead to unanswered questions:

- How do other users know of the state of affairs within the contract network if we only declared one participant?
- How do they vote?
- How do they contribute?

Earlier in the Problem Analysis section, we mentioned using API calls and Events to achieve this. But what are these concepts?

Events are **values** or **data** that a contract sends to all attached to the contract at any point in the contract's life-cycle.

APIs are **defined functionality** that can be voluntarily called upon from the frontend by any one attached to a contract. In this workshop we would define these API calls in a **Parallel Reduce**.

> **What is a Parallel Reduce?**  
> Like while loops, it is another way to mutate values in the contract, but unlike the while loop, not with repetitive action but through user interaction with the contract, while a condition remains true, and only if a value—usually the contract's balance—remains invariable for the duration of the parallel reduce no matter what kind of operation the user takes.  

And just like the Deployer's interact interface, they too need to be defined first before their actual use in the business logic of the contract.  

Before we do that, with our knowledge of what Events and APIs are, lets deliberate on what kind of data we would send to the frontend on each user interaction.

- User creates a proposal: At this point, the information of that proposal needs to be fed to the main contract in order to notify all others connected that a proposal has been created and their views updated to reflect that change.
- User votes on a proposal: When this takes place, the contract whose proposal got voted upon, needs to be notified of that action to update its internal state with regards to the evaluation after the deadline set for interactivity. Afterwards, the main contract get notified of the action taken in order for other users to be notified too.
- User contributes to a proposal: This calls for the user to pay to the contract and the total amount of contributions updated in the frontend. All other users are entitled to know of this change too.

What other stages in a proposal's contract would require an event to be fired?

- When a proposal reaches it deadline: At this point, an evaluation is made, then the main contract must be notified that a proposal just timed out and if it either passed on time out or failed.
- Failed proposal's refundable balance reaches zero: For failed proposals with funds already contributed to, must refund all contributed funds before being taken down from the platform, hence users must be able to voluntarily claim a refund. If successful, the user gets notified, if not he sees this outcome too. But immediately a failed proposal's contract's balance hits zero, the main contract must be notified to take that proposal down for everyone, as it is no longer relevant.

Keeping in mind that Events are just data sent to the frontend for evaluation, how do we represent the actions we want using just data? First we must know what to send.

Let's review each instance an event would need to be fired and discern what kind of data would be appropriate to send out for evaluation.

- User creates a proposal: This calls for a complete representation of the proposal along with the contract information and the time of creation, to be sent to the main contract for other users to get their views updated that piece of information. Hence we would be sending the following details of a proposal:
  - ID
  - Title
  - Link
  - Description
  - Owner
  - Contract information
  - Block created
- User votes on a proposal: Regardless of the kind of vote passed by the user the proposal's contract must inform the main contract of the following details of the proposal:
  - ID
  - Total number of votes (up votes/down votes)  
- User contributes to a proposal: The main contract must be informed of the following details when such an action takes place:
  - ID
  - Total amount contributed
- When a proposal reaches it deadline: In order for the main contract to enact an evaluation it would be needing details of the proposal:
  - ID
  - Outcome of evaluation (passed/failed)
- Failed proposal's refundable balance reaches zero: The main contract would need only the id of proposal:
  - ID

### Now try to figure out the right declarations for both API calls and Events, write your assumptions in a comment

You may noticed that as opposed to our understanding of Events sending data to the frontend, we speak of the proposal contract sending information to the main contract instead of the frontend. This is because of the the nature of Events and how they are handled in the frontend.  

Events declared in the backend are bound to functions in the frontend that gets called every time the event bound to it gets fired in the contract. Thus, like arguments, the data sent to the frontend through an event, act as parameters for the function's execution. This gives us room to be flexible, so although we could declare several different events for different actions, for a group of related actions, we could use just one Event declaration and in the frontend switch between the several possible returned data. An example of this would be shown shortly.  

Were you able to come up with the declarations for the Events and API calls? Here are ours:

```javascript
const objectRep = Struct([
    ['id', UInt],
    ['title', Bytes(25)],
    ['link', Bytes(150)],
    ['description', Bytes(180)],
    ['owner', Address],
    ['contractInfo', Contract],
    ['blockCreated', UInt],
 ])

 const claimResponse = Struct([
    ['didRefund', Bool],
    ['balance', UInt],
 ])

 const Voters = API('Voters', {
    upvote: Fun([], UInt),
    downvote: Fun([], UInt),
    contribute: Fun([UInt], UInt),
    claimRefund: Fun([], claimResponse),
    created: Fun([objectRep], Null),
    upvoted: Fun([UInt, UInt], Null),
    downvoted: Fun([UInt, UInt], Null),
    contributed: Fun([UInt, UInt], Null),
    timedOut: Fun([UInt, UInt], Null),
    projectDown: Fun([UInt], Null),
    checkTime: Fun([], UInt),
 })

 const Proposals = Events({
    create: [UInt, Bytes(25), Bytes(150), Bytes(180), Address, Contract, UInt],
    that: [state, UInt, UInt],
    log: [state, UInt],
    created: [UInt, Bytes(25), Bytes(150), Bytes(180), Address, Contract, UInt],
 })
```
