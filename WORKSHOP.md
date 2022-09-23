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

**Write down the problem analysis of this program as a comment.**

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

**You can at this point take some time to figure this out and write it down as a comment in your `index.rsh` file.**

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

**Write down the data definitions for this program as definitions.**

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

The Deployer's interact interface is set, and we can already imagine how the flow of our DApp would be, and the pattern of communication among those using the DApp. In order to implement this flow, we must find the answer these questions:

- How do other users know of the state of affairs within the contract network if we only declared one participant?
- How do they vote?
- How do they contribute?
- How are they informed of the outcome of a timed out proposal?
- How do they claim refunds?

Earlier in the Problem Analysis section, we mentioned using API calls and Events to achieve this. But what are these concepts?

Events are **values** or **data** that a contract sends to all attached to the contract at any point in the contract's life-cycle.

APIs are **defined functionality** that can be voluntarily called upon from the frontend by any one attached to a contract. In this workshop we would define these API calls in a **Parallel Reduce**.

> **What is a Parallel Reduce?**  
> Like while loops, it is another way to mutate values in the contract, but unlike the while loop, not with repetitive action but through user interaction with the contract, while a condition remains true, and only if a value—usually the contract's balance—remains invariable for the duration of the parallel reduce no matter what kind of operation the user takes.  

**Therefore, users interact with the contracts of proposals using API calls then the outcome of these interactions, and the internal state of proposals are made known to other users using Events.**

Like the Deployer's interact interface, API calls and Events need to be declared first before their actual use in the business logic of the contract.  

And so, to do that, we need to map out what scenarios would require their use, this will guide us in deciding what kind of data we would send to the frontend on each scenario. These are outlined below:

- **User creates a proposal**: At this point, the information of that proposal needs to be fed to the main contract in order to notify all others connected to the main contract that a proposal has been created and their views updated to reflect that change.
- **User votes on a proposal**: When this takes place, the contract whose proposal got voted upon, needs to be notified of that action to update its internal state with regards to the evaluation after the deadline set for interactivity. Afterwards, the main contract get notified of the action taken in order for other users to be notified too.
- **User contributes to a proposal**: This calls for the user to pay to the contract and the total amount of contributions updated in the frontend. All other users are entitled to know of this change too.

What other  in a proposal's contract would require an event to be fired?

- **When a proposal reaches it deadline**: At this point, an evaluation is made, then the main contract must be notified that a proposal just timed out and if it either passed on time out or failed.
- **A failed proposal's refundable balance reaches zero**: For failed proposals with funds already contributed to, must refund all contributed funds before being taken down from the platform, hence users must be able to voluntarily claim a refund. If successful, the user gets notified, if not he sees this outcome too. But immediately a failed proposal's contract's balance hits zero, the main contract must be notified to take that proposal down for everyone, as it is no longer relevant.

Keeping in mind that Events are just data sent to the frontend for evaluation, how do we represent the actions we want to take to reflect these updated states using just data? First we must know what to send.

Let's review each instance an Event would need to be fired and discern what kind of data would be appropriate to send out for evaluation.

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
- A failed proposal's refundable balance reaches zero: The main contract would need only the id of proposal:
  - ID

> You may have noticed that as opposed to our understanding of Events sending data to the frontend, we speak of the proposal contract sending information to the main contract instead of the frontend. This is because of the the nature of Events and how they are handled in the frontend.  
> Events declared in the backend are bound to functions in the frontend that get called every time the Event bound to it gets fired in the contract. Combining this with API calls, we can make a proposal contract fire up an Event that makes the user's frontend interact with the main contract to fire up an Event too, this time to everyone.  
> Another fine thing about Events, is that, since they are bound to functions in the frontend, the data sent to the frontend through an Event, act as arguments for the function's execution. This gives us room to be flexible, so although we could declare several different Events for different actions, for a group of related actions, we could use just one Event declaration and in the frontend switch between the several possible returned data.  

**Now try to figure out the right declarations for both API calls and Events, write your findings in a comment.**

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

- First, we have the entire information of a proposal to be communicated between the frontend and backend represented by a `Struct` and not an `Object`. This is because the `Object` type is internal to Reach and can only be automatically consumed by other Reach programs. For a detailed explanation see error code [RW0005](https://docs.reach.sh/rsh/errors/#RW0005) in the Reach Docs.  
- Next, we have the response returned on a user's attempt to claim a refund represented by a Struct too.
- Then we have our API declarations. Those handled by the proposal contract are `upvote`, `downvote`, `contribute`, and `claimRefund`, the rest are handled by the main contract to reflect the action taken on a proposal contract, with the exception of `checkTime`. This API call is a last resort to carry out frontend reevaluation of a proposal that may have failed to be updated with the outcome of its evaluation.
- Lastly, we have the Events declarations. The `that` and `log` Events, are Events that can invoke different actions on different scenarios.

You've probably noticed that the variable `state` is undefined. We'll handle that in the a section to come.

> In the frontend, Events are bound to handler functions in this manner after deployment:
>
> ```javascript
> ctc.events.create.monitor(createProposal)
> ctc.events.that.monitor(acknowledge)
> ```
>
> Where `create` and `that` are Events declared in the backend, whereas `createProposal` and `acknowledge` are functions defined in the frontend to carry out actions based on data sent from these Events.  

## Communication Construction

A fundamental aspect of a decentralized application is the pattern or structure of communication between all those connected to the contract. We should write down this pattern as comments in our program to act as a guide as start work on implementation. For example, for the [tutorial](https://docs.reach.sh/tut/rps/#tut) version of _Rock, Paper, Scissors!_, we could write the following pattern:

```javascript
// Alice publishes the wager and pays it
// Bob accepts the wager, and pays it
// While there's a draw
//  Alice publishes her hand secretly
//  Bob publishes his hand publicly
//  Alice reveals her hand
//  The consensus ensures it's the same hand as before
// The consensus pays out the wager
```

Now do the same in your Reach program(`index.rsh`)

**Write down the communication pattern for this program as comments.**

Now here is our outline:

```javascript
// 1. The origin Deployer publishes information needed to define the purpose of deployment
// 2. The contract checks the purpose of deployment and assumes the appropriate role
// 3. Depending on the purpose of deployment:
//    I. In the case of a proposal contract, the Deployer publishes the complete details of the proposal and the contract notifies the creation of a new proposal
//       a. The deadline for the proposal is set
//       b. Users are allowed to express their interest in proposals by either up voting or down voting and occasionally contributing to these proposals, then everyone else sees the total number of votes a proposal has and the amount it has raised
//       c. For each proposal, after it deadline is reached, depending on the votes:
//          - It either becomes a bounty and the balance of the contract sent to the proposer or 
//          - If its contract balance wasn't empty at the time of the deadline, then its open to process refunds, then when its balance hits zero it closes and the proposal taken down, else
//          - It is taken down immediately
//    II. For the main contract, it waits indefinitely for any data sent from the frontend from an Event fired by a proposal contract to notify all connected of the change
```

Its time to convert this outline to a real program.

**Write down the communication pattern for this program as code.**

The body should be similar to this:

```javascript
// 1. The origin Deployer publishes information needed to define the purpose of deployment
Deployer.publish(description, isProposal)

// 2. The contract checks the purpose of deployment and assumes the appropriate role
if (isProposal) {
      commit()
      // 3. Depending on the purpose of deployment:
      //    I. In the case of a proposal contract, the Deployer publishes the complete details of the proposal and the contract notifies the creation of a new proposal
      Deployer.publish(title, link, owner, id, deadline)
      Proposals.created(
      id,
      title,
      link,
      description,
      owner,
      getContract(),
      thisConsensusTime()
      )
      // 3. I. a. The deadline for the proposal is set
      const [timeRemaining, keepGoing] = makeDeadline(deadline)
      const contributors = new Map(Address, Address)
      const amtContributed = new Map(Address, UInt)
      const contributorsSet = new Set()

      // 3. I. b. Users are allowed to express their interest in proposals by either up voting or down voting and occasionally contributing to these proposals, then everyone else sees the total number of votes a proposal has and the amount it has raised
      const [upvote, downvote, amtTotal] = parallelReduce([0, 0, balance()])
          .invariant(balance() == amtTotal)
          .while(keepGoing())
          .api(Voters.upvote, (notify) => {
              notify(upvote + 1)
              return [upvote + 1, downvote, amtTotal]
          })
          .api(Voters.downvote, (notify) => {
              notify(downvote + 1)
              return [upvote, downvote + 1, amtTotal]
          })
          .api_(Voters.contribute, (amt) => {
              check(amt > 0, 'Contribution too small')
              const payment = amt
              return [
              payment,
              (notify) => {
                  notify(balance())
                  if (contributorsSet.member(this)) {
                      const fromMapAmt = (m) =>
                        fromMaybe(
                        m,
                        () => 0,
                        (x) => x
                        )
                      amtContributed[this] = fromMapAmt(amtContributed[this]) + amt
                  } else {
                      contributors[this] = this
                      amtContributed[this] = amt
                      contributorsSet.insert(this)
                  }
                  return [upvote, downvote, amtTotal + amt]
              },
              ]
          })
          .timeout(timeRemaining(), () => {
              Deployer.publish()
              // 3. 1. c. For each proposal, after it deadline is reached, depending on the votes:              
              if (checkStatus(upvote, downvote) == PASSED) {
                  // - It either becomes a bounty and the balance of the contract sent to the proposer or 
                  Proposals.log(state.pad('passed'), id)
                  transfer(balance()).to(owner)
              } else {
                  if (balance() > 0) {
                    // - If its contract balance wasn't empty at the time of the deadline, then its open to process refunds, then when its balance hits zero it closes and the proposal taken down, else
                      const fromMapAdd = (m) =>
                          fromMaybe(
                            m,
                            () => Deployer,
                            (x) => x
                          )
                      const fromMapAmt = (m) =>
                          fromMaybe(
                            m,
                            () => 0,
                            (x) => x
                          )
                      Proposals.log(state.pad('failed'), id)
                      const currentBalance = parallelReduce(balance())
                          .invariant(balance() == currentBalance)
                          .while(currentBalance > 0)
                          .api(Voters.claimRefund, (notify) => {
                              const amountTransferable = fromMapAmt(amtContributed[this])
                              if (
                              balance() >= amountTransferable &&
                              contributorsSet.member(this)
                              ) {
                                  transfer(amountTransferable).to(
                                    fromMapAdd(contributors[this])
                                  )
                                  contributorsSet.remove(this)
                                  Proposals.log(state.pad('refundPassed'), id)
                                  const currentBal = currentBalance - amountTransferable
                                  const response = claimResponse.fromObject({
                                    didRefund: true,
                                    balance: currentBal,
                                  })
                                  notify(response)
                                  return currentBal
                              } else {
                                  Proposals.log(state.pad('refundFailed'), id)
                                  const response = claimResponse.fromObject({
                                    didRefund: false,
                                    balance: currentBalance,
                                  })
                                  notify(response)
                                  return currentBalance
                              }
                          })
                  }
                  // - It is taken down immediately
                  Proposals.log(state.pad('down'), id)
              }
              return [upvote, downvote, balance()]
          })
      transfer(balance()).to(Deployer)
 } else {
    // 3. Depending on the purpose of deployment:
    //    II. For the main contract, it waits indefinitely for any data sent from the frontend from an Event fired by a proposal contract to notify all connected of the change
    const keepGoing = parallelReduce(true)
        .invariant(balance() == 0)
        .while(keepGoing)
        .api(Voters.created, (obj, notify) => {
            notify(null)
            const proposalStruct = objectRep.fromObject(obj)
            const proposalObject = objectRep.toObject(proposalStruct)
            Proposals.create(
              proposalObject.id,
              proposalObject.title,
              proposalObject.link,
              proposalObject.description,
              proposalObject.owner,
              proposalObject.contractInfo,
              proposalObject.blockCreated
            )
            return keepGoing
        })
        .api(Voters.upvoted, (fNum, sNum, notify) => {
            notify(null)
            const num1 = fNum
            const num2 = sNum
            Proposals.that(state.pad('upvoted'), num1, num2)
            return keepGoing
        })
        .api(Voters.downvoted, (fNum, sNum, notify) => {
            notify(null)
            const num1 = fNum
            const num2 = sNum
            Proposals.that(state.pad('downvoted'), num1, num2)
            return keepGoing
        })
        .api(Voters.contributed, (fNum, sNum, notify) => {
            notify(null)
            const num1 = fNum
            const num2 = sNum
            Proposals.that(state.pad('contributed'), num1, num2)
            return keepGoing
        })
        .api(Voters.timedOut, (fNum, sNum, notify) => {
            notify(null)
            const num1 = fNum
            const num2 = sNum
            Proposals.that(state.pad('timedOut'), num1, num2)
            return keepGoing
        })
        .api(Voters.projectDown, (fNum, notify) => {
            notify(null)
            const num1 = fNum
            Proposals.that(state.pad('projectDown'), num1, 0)
            return keepGoing
        })
        .api(Voters.checkTime, (notify) => {
            notify(thisConsensusTime())
            return keepGoing
        })
 }
 commit()
```

We use multiple `parallelReduce` cases to allow users interact with the contracts and update their internal states. We maintained the invariant that for the proposal contract, while it is open to interactions, its balance remains equal to the total amount to funds contributed to contract, and after its timeout if it fails with funds that its balance is equal to amount of funds as at its timing out, which get decremented by each successful processed refund. For the main contract, however, we maintained the invariant that the balance is always zero. You've probably noticed that the variables `PASSED` is undefined. We'll handle that next.

## Assertion Insertion

When we are programming, it is necessary we add assertions to our programs to ensure the theory of our program's behavior remains discernable. As we develop further on our application the depth of complexity increases and eventually could engulf the theory we hold in our minds as regards the behavior of the program from previous events and things that hold true at any point of the program. In addition, when another programmer such as our future self read through our code, it is very difficult to understand this theory for ourselves. Assertions are ways of encoding this theory directly into the text of the program in a way that will checked by Reach and available to all future readers and editors of the code.  

Look at your application. What are the assumptions you have about the values in the program? 

**Write down the properties you know are true about the various values in the program.**

Now after all that, we can tell you that not much is required to assert in our program except for the fact that no matter the amount of up votes or down votes a proposal has that an outcome must always be discernable.

Now that we know what the properties are, we need to encode them into our program via calls to Reach functions like `assert`, and `forall` and another concept called Enumerations. Lets do that now.

**Insert assertions into the program corresponding to the facts that should be true.**

Here's what we did:

```javascript
const [isOutcome, NOT_PASSED, PASSED] = makeEnum(2)

const state = Bytes(20)

const checkStatus = (upVotes, downVotes) => {
    if (downVotes > upVotes) {
        return NOT_PASSED
    } else if (upVotes == downVotes) {
        return NOT_PASSED
    } else {
        return PASSED
    }
}

assert(checkStatus(100, 100) == NOT_PASSED)
assert(checkStatus(50, 100) == NOT_PASSED)
assert(checkStatus(100, 50) == PASSED)

forall(UInt, (upVotes) =>
    forall(UInt, (downVotes) =>
        assert(isOutcome(checkStatus(upVotes, downVotes)))
    )
)
```

- First, we created two enums `NOT_PASSED` and `PASSED` which are distinct numbers, and then a validator that checks if its argument is indeed a member of the enum set. 
- Next, we have the declaration of our `state` variable used in our Events declaration a couple sections back.
- Then, we have a utility function that handles evaluation of the outcome of votes.
- Afterwards, we make three assertions that given a set amount of votes for up votes and down votes, that the expected outcome is derived.
- Lastly, we validate that given any value for up votes and down votes a valid outcome must be met.
