# Reach DAO

In this workshop, we'll create a DApp where users can create proposals and have other users decide the outcome of the proposal created, by either up-voting or down-voting the proposal, and optionally sponsoring the proposal by contributing to it with the condition that the proposer only gets the total funds if the amount of up-votes surpasses that of the down-votes. In a scenario where a proposal fails to pass the previously stated condition, a user can claim back the amount that they contributed to a failed proposal until all funds have been retrieved. On the other hand, when a proposal passes, the said proposal becomes a bounty, open to be claimed by anyone willing to fulfill the task.  

> This workshop assumes that you have previously completed the Rock, Papers, Scissors, and or Wisdom for Sale tutorial(s) and have a good understanding of interactive test deployment  

We assume that you'll go through this workshop in a directory named `~/reach/rsh_dao-ws`:

```shell
> mkdir -p ~/reach/rsh_dao-ws && cd ~/reach/rsh_dao-ws
```

And that you have a copy of Reach installed in `~/reach/rsh_dao-ws`, so that you can write

```shell
> ./reach version
```

And it will run Reach. You should start by initializing your Reach program with two files, the contract `index.rsh` file, and the test suite `index.mjs`  file:

```shell
> touch index.rsh
> touch index.mjs
```

Then insert the following boilerplate in the respective files to kick off the development of the program.

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

console.log(`Reach DAO by Team 18`)
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

console.log('[.] Exiting Reach DAO by Team 18')

process.exit(0)
```

> Please note the following prefixes used in the console messages and their meaning  
>
> - [.] : This denotes a process.
> - [+] : This denotes a message.
> - [‼] : This denotes an error or an important/ sensitive message.  

Ensure the following commands run perfectly, and you are all set to continue.

```shell
> ./reach compile
```

```shell
> ./reach run
```

## Problem Analysis

First, we should deliberate upon the required functionality of the program and answer some questions to help lay out the implementation of the program. Let's consider some constraints and problem analysis.  

The overall purpose of this program is that:

- A user should be able to create a proposal.
- This proposal must be visible to other users, allowing them to vote on, and contribute to it.
- After a predefined deadline is reached, the outcome of the proposal is determined on the basis of the votes cast for and against it.
- The funds contributed to a passed proposal are sent to the proposer and the proposal made a bounty, while for a failed proposal, the funds are made available for users who contributed to said funds to claim a refund.

With this in mind, let's answer the following questions:

- How many participants does this program require, and who are they?
- How do we implement voluntary interaction?
- How do we ensure every user is made aware of the current state of affairs?
- How do we ensure that when a contract gets created for a new proposal, it can be attached to by anyone to interact with?  
- How do we enforce that when a proposal's window for interactions closes that it gets evaluated and is either taken down or moved to the next stage in its life cycle?

**Write down the problem analysis of this program as a comment.**

Let's see if we arrived at the same conclusions:

- This program requires just one participant declaration, that is the Deployer. This participant would be responsible for deploying the contract, and when a proposal is being created by a user, that user assumes the role of the Deployer for that proposal, which in itself would be a contract.  
- To implement voluntary interaction with the contract, [**API**](https://docs.reach.sh/rsh/appinit/#ref-programs-appinit-api) calls to the contract must be set up.
- To notify every user connected to the contract, [**Events**](https://docs.reach.sh/rsh/appinit/#ref-programs-appinit-events) must be used.
- The information of the contract for a proposal must be provided along with the details for the proposal, that way it is accessible upon a request to interact with one.
- Using deadlines, proposals can be timed to determine when (in consensus time, measured in blocks) its window for interactions is closed.

It's totally fine if we came up with different solutions/ conclusions! Such is the art of programming.

## Data Definition

Now after we've successfully, outlined—for the most part—how the program would handle things, let's now take some time to consider how information will be represented in the program.  

First, we need to consider what kind of information is needed to represent a proposal in our backend.  

**You can at this point take some time to figure this out and write it down as a comment in your `index.rsh` file.**

Let's see if our answers match:

- **ID**: A proposal would require a unique identifier, to distinguish it from others in a pool of proposals.
- **Title**: A proposal must have a definite name. This will be referred to as its title.
- **Link**: Surely all the information regarding the proposal cannot just be stored in our contract as bytes, no, we would exceed the number of bytes that can be published to consensus. Therefore, we would have a link to an external source where a more detailed explanation would be found such as GitHub Readme.md or a Google Doc.
- **Description**: Okay we can't store overly large amounts of bytes in our contract, but we can have a brief one-sentence or two-sentence description of the proposal. This would enable users to quickly identify proposals they may be interested in finding more information about vis the proposal link.
- **Owner**: Books have authors and every invention has an inventor, nothing comes by chance, and the same applies to proposals.
- **Deadline**: This is a predefined period set by the origin/ Admin Deployer for all proposals to handle interactions.  

With these properties in mind, more questions seem to arise:

- What data type will represent the ID of the proposal?
- What data type will represent the title of the proposal?
- What data type will represent the link to the proposal's complete details?
- What data type will represent the description of the proposal?
- What data type will represent the owner of a proposal?
- What data type will represent the deadline set by the origin/ Admin Deployer?

> Refer to [Types](https://docs.reach.sh/rsh/compute/#ref-program-types) for a reminder of what data types are available in Reach.

Now that we've decided what data types to use, we need to determine how the program will obtain this information. We need to outline the participant interact interface for the only participant in the program—the Deployer.  

- What participant interact interface will Deployer use?
- Taking into account that the Deployer can either deploy the main contract or make a proposal upon a contract creation, how do we notify the backend which of the options is the case in each interaction via the interact interface?

Revisit the problem analysis section when completing this section.  

You should write down your answers in your Reach file (`index.rsh`) as the participant interact interface for the Deployer.

**Write down the data definitions for this program as definitions.**

Let's now compare your answers with ours:

- The `id` will be represented by a [`UInt`](https://docs.reach.sh/rsh/compute/#rsh_UInt).
- The `title` will be represented by [`Bytes(25)`](https://docs.reach.sh/rsh/compute/#rsh_Bytes) (Bytes with a maximum of 25 characters).
- The `link` will be represented by [`Bytes(150)`](https://docs.reach.sh/rsh/compute/#rsh_Bytes) (Bytes with a maximum of 150 characters), considering the length of most URLs.
- The `description` will be represented by [`Bytes(180)`](https://docs.reach.sh/rsh/compute/#rsh_Bytes) (Bytes with a maximum of 180 characters), for a really short description.
- The `owner` will be represented by an [`Address`](https://docs.reach.sh/rsh/compute/#rsh_Address). In order to maintain anonymity, using only the wallet address of the proposer as a means of identification is sufficient.
- The `deadline` will be represented by a [`UInt`](https://docs.reach.sh/rsh/compute/#rsh_UInt), as it is a relative time delta signifying a change in block number.  

Now the Admin would like to deploy the main contract, and a user could create a proposal. How do we pass this to the backend?

We'll now introduce another proposal property to the Deployer interface:

- **isProposal**: This value would be what the contract considers before deploying as the main contract or as a proposal contract.

Were you able to guess what type `isProposal` will be?

- It will be represented by a [`Bool`](https://docs.reach.sh/rsh/compute/#rsh_Bool).

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

We've set the Deployer's interact object to have only one property `getProposal`, which holds all the values needed for a proposal, and the boolean `isProposal` that dictates if the contract assumes the role of the main contract or a proposal contract.  
> At this point, you can modify your JavaScript file (`index.mjs`) to mirror your backend, although you may want to use placeholders for the actual values, except when you actually create a proposal. It's good practice to have these two files open side-by-side in the early stages of development, for simultaneous updates as you make decisions regarding the participant interact interface.

The Deployer's interact interface is set, and we can already imagine how the flow of our DApp would be, and the pattern of communication among those using the DApp. In order to implement this flow, we must answer the following questions:

- How do other users know of the state of affairs of the contract, if we only declared one participant?
- How do they vote?
- How do they contribute?
- How are they informed of the outcome of the proposal after a timeout?
- How do they claim refunds?

Earlier in the [**Problem Analysis**](#problem-analysis) section, we mentioned using API calls and Events to achieve this. But what are these concepts?

Events are **values** or **data** that a contract sends to all attached to the contract at any point in the contract's life cycle. They are often used to inform all users of different events that occur over the contract's life cycle.

APIs are **defined functionality** that can be voluntarily called upon from the frontend by anyone attached to a contract. In this workshop, we would define these API calls in a [**Parallel Reduce**](https://docs.reach.sh/rsh/consensus/#parallelreduce).

> **What is a Parallel Reduce?**  
> Like [while](https://docs.reach.sh/rsh/consensus/#while) loops, it is another way to mutate values in a contract, but unlike the while loop, not with repetitive action but through user interaction with the contract, while a condition, referred to as an [invariant](https://docs.reach.sh/guide/loop-invs/#guide-loop-invs), remains true, and only if a value—usually the contract's balance—remains invariable for the duration of the parallel reduce no matter what kind of operation the user takes.  

**Therefore, users interact with the contracts of proposals using API calls, then, the outcome of these interactions and the internal state of proposals are made known to other users using Events.**

Like the Deployer's interact interface, API calls and Events need to be declared first before their actual use in the business logic of the contract.  

And so, to do that, we need to map out what scenarios would require their use, this will guide us in deciding what kind of data we would send to the frontend in each scenario. These are outlined below:

- **User creates a proposal**: At this point, the information of that proposal needs to be fed to the main contract in order to notify all others connected to the main contract that a proposal has been created and their views updated to reflect that change.
- **User votes on a proposal**: When this takes place, the contract whose proposal got voted upon, needs to be notified of that action to update its internal state with regard to the pending evaluation after the deadline set for interactivity. Afterward, the main contract gets notified of the action taken in order for other users to be notified as well.
- **User contributes to a proposal**: This calls for the user to pay to the contract and the total amount of contributions updated in the frontend. All other users are entitled to be made aware of this change too.

What other scenario in a proposal's contract would require an event to be fired?

- **When a proposal reaches its deadline**: At this point, the results are evaluated, and then the main contract must be notified of the proposal's time out as well as the results of its evaluation i.e if it passed or failed.
- **A failed proposal's refundable balance reaches zero**: For failed proposals with funds already contributed, must refund all contributed funds before being taken down from the platform, hence users must be able to voluntarily claim a refund. If successful, the user gets notified, if not he sees this outcome too. But immediately after a failed proposal's contract's balance hits zero, the main contract must be notified to take that proposal down, as it is no longer relevant/ required.

Keeping in mind that Events are just data sent to the frontend for evaluation, how do we represent the actions we want to take to reflect these updated states using just data? First, we must know what to send.

Let's review the instances an Event would need to be fired and discern what kind of data would be appropriate to send out for evaluation.

- User creates a proposal: This requires a complete representation of the proposal along with the contract information and the time of creation, to be sent to the main contract for other users to get their views updated with the said information. Hence we would be sending the following details:
  - ID
  - Title
  - Link
  - Description
  - Owner
  - Contract information
  - Block created
- User votes on a proposal: Regardless of the option chosen by the user(up-vote or down-vote), the proposal's contract must inform the main contract of the following details:
  - ID
  - Total number of votes of each class(up-votes and down-votes)  
- User contributes to a proposal: The main contract must be informed of the following details when such an action takes place:
  - ID
  - Total amount contributed
- When a proposal reaches its deadline: In order for the main contract to perform an evaluation it would be needing the following details:
  - ID
  - Outcome of evaluation (passed/failed)
- A failed proposal's refundable balance reaches zero: The main contract would need only the id of the proposal:
  - ID

> You may have noticed that as opposed to our understanding of Events sending data to the frontend, we speak of the proposal contract sending information to the main contract instead of the frontend. This is because of the nature of Events and how they are handled in the frontend.  
> Events declared in the backend are bound to functions in the frontend that get called every time the Event bound to it gets fired in the contract. Combining this with API calls, we can make a proposal contract fire up an Event that makes the user's frontend interact with the main contract to fire up an Event too, this time to everyone. Just like a chain reaction.  
> Another fine thing about Events, is that, since they are bound to functions in the frontend, the data sent to the frontend through an Event, act as arguments for the function's execution. This gives us room to be flexible, so although we could declare several different Events for different actions; rather than that,  for a group of related actions, we could use just one Event declaration and in the frontend switch between the several possible values of data sent to it via the Event.  

**Now try to figure out the right declarations for both API calls and Events, write your findings in a comment.**

Were you able to come up with the declarations for the Events and API calls? Here are ours:

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v6/index.rsh)

---

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

- First, we have the entire information of a proposal to be communicated between the frontend and backend represented by a [`Struct`](https://docs.reach.sh/rsh/compute/#ref-programs-structs) and not an [`Object`](https://docs.reach.sh/rsh/compute/#ref-programs-objects). This is because the `Object` type is internal to Reach and can only be automatically consumed by other Reach programs. For a detailed explanation see error code [RW0005](https://docs.reach.sh/rsh/errors/#RW0005) in the Reach Docs.  
- Next, we have the response returned on a user's attempt to claim a refund represented by a `Struct` too.
- Then we have our API declarations. Those handled by the proposal contract are `upvote`, `downvote`, `contribute`, and `claimRefund`, the rest are handled by the main contract to reflect the action taken on a proposal contract, with the exception of `checkTime`. This API call is a last resort to carry out frontend re-evaluation of a proposal that may have failed to be updated with the outcome of its evaluation.
- Lastly, we have the Events declarations. The `that` and `log` Events, are Events that can invoke different actions in different scenarios, while `create` and `created`, invoke a single action. The `log` and `created` events are fired by the proposal contract, while the `that` and `create` are fired by the main contract.

You've probably noticed that the variable `state` is undefined. We'll handle that in a section to come.

> In the frontend, Events are bound to handler functions in this manner after deployment:
>
> ```javascript
> ctc.events.create.monitor(createProposal)
> ctc.events.that.monitor(acknowledge)
> ```
>
> Where `create` and `that` are Events declared in the backend, whereas `createProposal` and `acknowledge` are functions defined in the frontend to carry out actions based on data sent from these Events.  

## Communication Construction

A fundamental aspect of a decentralized application is the pattern or structure of communication between all those connected to the contract. We should write down this pattern as comments in our program to act as a guide as we start work on implementation. For example, for the [tutorial](https://docs.reach.sh/tut/rps/#tut) version of _Rock, Paper, Scissors!_, we could write the following pattern:

```javascript
// Alice publishes the wager and pays it
// Bob accepts the wager and pays it
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
//    I. In the case of a proposal contract, the Deployer publishes the complete details of
//       the proposal and the contract notifies the creation of a new proposal
//       a. The deadline for the proposal is set
//       b. Users are allowed to express their interest in proposals by either up-voting or
//          down-voting and optionally contributing to these proposals, then everyone else sees
//          the total number of votes of each class a proposal has and the amount that has been contributed to it
//       c. For each proposal, after its deadline is reached, depending on the votes:
//          - It either becomes a bounty and the balance of the contract is sent to the proposer or 
//          - If its contract balance wasn't empty at the time of the deadline, then its open to 
//            process refunds, then when its balance hits zero it closes and the proposal is taken down, else
//          - It is taken down immediately
//    II. For the main contract, it waits indefinitely for any data sent from the frontend
//        from an Event fired by a proposal contract to notify all connected parties of the occurrence
```

It's time to convert this outline into a real program.

**Write down the communication pattern for this program as code.**

The body of your code should be similar to this:

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v6/index.rsh)

---

```javascript
// 1. The origin Deployer publishes information needed to define the purpose of deployment
Deployer.publish(description, isProposal)

// 2. The contract checks the purpose of deployment and assumes the appropriate role
if (isProposal) {
      commit()
      // 3. Depending on the purpose of deployment:
      //    I. In the case of a proposal contract, the Deployer publishes the complete details of 
      //       the proposal and the contract notifies the creation of a new proposal
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

      // 3. I. b. Users are allowed to express their interest in proposals by either up-voting or
      //          down-voting and optionally contributing to these proposals, then everyone else sees
      //          the total number of votes a proposal has and the amount it has raised
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
              // 3. 1. c. For each proposal, after its deadline is reached, depending on the votes:              
              if (checkStatus(upvote, downvote) == PASSED) {
                  // - It either becomes a bounty and the balance of the contract is sent to the proposer or 
                  Proposals.log(state.pad('passed'), id)
                  transfer(balance()).to(owner)
              } else {
                  if (balance() > 0) {
                    // - If its contract balance wasn't empty at the time of the deadline, then its open to
                    //   process refunds, then when its balance hits zero it closes and the proposal is taken down, else
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
    //    II. For the main contract, it waits indefinitely for any data sent from the frontend  
    //        from an Event fired by a proposal contract to notify all connected parties of the occurrence
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

We use multiple `parallelReduce` cases to allow users to interact with the contracts and update their internal states. We maintained the invariant that for the proposal contract, while it is open to interactions, its balance remains equal to the total amount of funds contributed to the contract, and after its timeout, if it fails with funds, its balance is equal to amount of funds as at when it timed-out, which gets decremented by each successfully processed refund. For the main contract, however, we maintained the invariant that the balance is always zero.  

You've probably noticed that the variables `description`, `isProposal`, `title`, `link`, `owner`, `id`, `deadline`, and `PASSED` are undefined at this point. We'll handle that shortly.

## Assertion Insertion

When we are programming, it is necessary to add assertions to our programs to ensure the theories behind our program's behavior hold true. As we further develop our application the depth of complexity increases and could eventually engulf the theory we hold in our minds as regards the behavior of the program from its previous events and things that hold true at any point of the program. In addition, when another programmer such as our future self reads through our code, it is very difficult to understand this theory for ourselves. Assertions are ways of encoding this theory directly into the text of the program in a way that will be checked by Reach and available to all future readers and editors of the code.  

Look at your application. What are the assumptions you have about the values in the program?

**Write down the properties you know are true about the various values in the program.**

Now after all that, we can tell you that not much is required to assert in our program except for the fact that no matter the amount of up-votes or down-votes a proposal has that an outcome must always be discernable.

Now that we know what the properties are, we need to encode them into our program via calls to Reach functions such as [`assert`](https://docs.reach.sh/rsh/compute/#assert), and [`forall`](https://docs.reach.sh/rsh/compute/#forall) and another concept called [Enumerations](https://docs.reach.sh/rsh/compute/#term_enumeration). Let's do that now.

**Insert assertions into the program corresponding to the facts that should be true.**

Here's what we did:

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v6/index.rsh)

---

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
- Next, we have the declaration of our `state` variable used in our Events declaration a couple of sections back.
- Then, we have a utility function that handles the evaluation of the outcome of the voting process.
- Afterwards, we make three assertions that given a set amount of votes for up-votes and down-votes, the expected behaviour occurs.
- Lastly, we validate that given any value for up-votes and down-votes a valid outcome must be derived.

We would soon be able to run our program, after making a few additions.  

## Interaction Introduction

Next, we need to insert the appropriate calls to interact. In this case, our program although complex, doesn't require an equally complex interaction between the sole participant and the contract, instead, we'll need a simple call to the frontend to send over the contract information defined during the [**Data Definition**](#data-definition) section.  

In our program, that means defining `description`, `isProposal`, `title`, `link`, `owner`, `id`, and `deadline` by Deployer. Do that in your code now.  

**Insert `interact` calls to the frontend into the program.**  

Let's look at our whole program now:  

[`~/reach/rsh_dao-ws/index.rsh`](./rsh_dao-v6/index.rsh)

---

```javascript
'reach 0.1'

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

export const main = Reach.App(() => {
    setOptions({ untrustworthyMaps: true })
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
    init()
    Deployer.only(() => {
        const { title, link, description, owner, id, isProposal, deadline } =
          declassify(interact.getProposal)
    })
    Deployer.publish(description, isProposal)

    if (isProposal) {
          commit()
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

          const [timeRemaining, keepGoing] = makeDeadline(deadline)
          const contributors = new Map(Address, Address)
          const amtContributed = new Map(Address, UInt)
          const contributorsSet = new Set()

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
                  if (checkStatus(upvote, downvote) == PASSED) {
                      Proposals.log(state.pad('passed'), id)
                      transfer(balance()).to(owner)
                  } else {
                      if (balance() > 0) {
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
                      Proposals.log(state.pad('down'), id)
                  }
                  return [upvote, downvote, balance()]
              })
          transfer(balance()).to(Deployer)
    } else {
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
    exit()
})
```

As we can see from the complete program we had the Deployer retrieve all information about the proposal, and the purpose of deployment in one big interact call to `getProposal` but had the Deployer publish just `description` and `isProposal`. This was done to limit the amount of publishes to just two in entire program, as is evident in the second publish the Deployer makes, where the Deployer publishes the remaining information about the proposal if the purpose of deployment is for a proposal contract.  

At this point, when we run:

```shell
> ./reach compile
```

We'll get a happy message that all our theorems are true. Great job! But the fact remains that we are yet to run our program!  

## Deployment Decisions

At this point, we need to decide how we're going to deploy this program and really use it in the real world. We need to decide how to deploy the contract, as well as what kind of user interaction modality we'll implement inside of our frontend.  

**Decide how you will deploy and use this application.**  

Next, we'll settle for a simple yet fully interactive testing program for now to show the application, and leave you to decide a befitting GUI implementation. Here's the JavaScript frontend we wrote:

[`~/reach/rsh_dao-ws/index.mjs`](./rsh_dao-v6/index.mjs)

---

```javascript
import { loadStdlib, ask } from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'
const reach = loadStdlib()

const sleep = (mSecs) => new Promise((resolve) => setTimeout(resolve, mSecs))
const alertThis = async (message, positive = true) => {
 if (positive) {
  console.log(`[+] ${message}`)
 } else {
  console.log(`[‼] ${message}`)
 }
 await sleep(message.length * 100)
}
const noneNull = (byte) => {
 let string = '',
  i = 0
 for (i; i < byte.length; i++)
  if (String(byte[i]) !== String('\u0000')) string += byte[i]
 return string
}
const deadline = { ETH: 2, ALGO: 20, CFX: 2000 }[reach.connector]

let [
 user,
 contractInstance,
 contract,
 proposals,
 bounties,
 createPromise,
 contribPromise,
 upvotePromise,
 downvotePromise,
] = [{}, null, {}, [], [], {}, {}, {}, {}]

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
  try {
   const account = await reach.newAccountFromSecret(secret)
   user = {
    account,
    balance: async () => {
     const balAtomic = await reach.balanceOf(account)
     const balance = reach.formatCurrency(balAtomic, 4)
     return balance
    },
   }
  } catch (error) {
   await alertThis('Failed to connect account', false)
   await connectAccount()
  }
 }
 await setRole()
}

const setRole = async () => {
 [
  contractInstance,
  contract,
  proposals,
  bounties,
  createPromise,
  contribPromise,
  upvotePromise,
  downvotePromise,
 ] = [null, {}, [], [], {}, {}, {}, {}]
 console.clear()

 console.log(`Reach DAO by Team 18`)
 console.log(`Wallet Balance: ${await user.balance()}`)
 console.log(``)
 console.log('Select Role')

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
 console.info(contract.ctcInfoStr ? contract.ctcInfoStr : '')
 console.log('[.] Attaching')
 try {
  const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
  contractInstance = ctc
  contract = { ctcInfoStr }
  ctc.events.create.monitor(createProposal)
  ctc.events.that.monitor(acknowledge)
  await showInfoCenter()
 } catch (error) {
  await alertThis(`Unable to attach`, false)
  await setRole()
 }
}

const reevaluate = async ({
 id,
 blockCreated,
 upvotes,
 downvotes,
 contribs,
}) => {
 try {
  const currentConsensusTime = parseInt(
   await contractInstance.apis.Voters.checkTime()
  )
  if (blockCreated + deadline < currentConsensusTime) {
   if (upvotes > downvotes) {
    const nBounty = proposals.filter((el) => Number(el.id) === id)[0]
    bounties.push(nBounty)

    const xXProposals = proposals.filter((el) => Number(el.id) !== id)
    proposals = xXProposals
    await alertThis(
     'This proposal seems to have missed becoming a bounty, you can now find it on the Bounties List'
    )
   } else if (contribs > 0) {
    const fProposals = proposals.map((el) => {
     if (Number(el.id) === id) {
      el['timedOut'] = true
      el['didPass'] = false
     }
     return el
    })
    proposals = fProposals
    await alertThis(
     'This proposal already failed with funds, you can now find it on the Timed Out Proposals list'
    )
   } else {
    const remainingProposals = proposals.filter((el) => {
     if (Number(el.id) === id) {
      el['isDown'] = true
     }
     return Number(el.id) !== id
    })
    proposals = remainingProposals
    await alertThis(
     'This appears to be a rogue proposal, and has been taken down'
    )
   }
  } else {
   await alertThis(
    'Evaluation failed, please contact Reach DAO by Team 18 technical team on Discord',
    false
   )
  }
 } catch (error) {
  await alertThis('Unable to reevaluate proposal', false)
 }
}

const connectAndUpvote = async (id, ctcInfoStr) => {
 try {
  const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
  const upvotes = await ctc.apis.Voters.upvote()
  await contractInstance.apis.Voters.upvoted(id, parseInt(upvotes))
 } catch (error) {
  await alertThis('Unable to process up vote', false)
  upvotePromise?.reject && upvotePromise.reject()
 }
}

const connectAndDownvote = async (id, ctcInfoStr) => {
 try {
  const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
  const downvotes = await ctc.apis.Voters.downvote()
  await contractInstance.apis.Voters.downvoted(id, parseInt(downvotes))
 } catch (error) {
  await alertThis('Unable to process down vote', false)
  downvotePromise?.reject && downvotePromise.reject()
 }
}

const makeContribution = async (amount, id, ctcInfoStr) => {
 try {
  const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
  const contribs = await ctc.apis.Voters.contribute(
   reach.parseCurrency(amount)
  )
  await contractInstance.apis.Voters.contributed(id, parseInt(contribs))
 } catch (error) {
  await alertThis('Unable to process contribution', false)
  contribPromise?.reject && contribPromise.reject()
 }
}

const connectAndClaimRefund = async (id, ctcInfoStr) => {
 try {
  const ctc = user.account.contract(backend, JSON.parse(ctcInfoStr))
  const result = await ctc.apis.Voters.claimRefund()
  if (result.didRefund) {
   const conProposals = proposals.map((el) => {
    if (Number(el.id) === id) {
     el['contribs'] = reach.formatCurrency(result.balance, 4)
    }
    return el
   })
   proposals = conProposals
   await alertThis('Success')
  } else {
   await alertThis(
    `It seems you don't have funds to claim, did you contribute to this proposal?`,
    false
   )
  }
  refundResolve?.resolve && refundResolve.resolve(didRefund)
 } catch (error) {
  await alertThis('Request failed', false)
 }
}

const updateProposals = async ({ what }) => {
 try {
  await contractInstance.apis.Voters.created({
   id: parseInt(what[0]),
   title: noneNull(what[1]),
   link: noneNull(what[2]),
   description: noneNull(what[3]),
   owner: noneNull(what[4]),
   contractInfo: what[5],
   blockCreated: parseInt(what[6]),
  })
 } catch (error) {
  await alertThis('Failed to update proposals', false)
  createPromise?.resolve && createPromise.resolve()
 }
}

const createProposal = async ({ what }) => {
 proposals.push({
  id: parseInt(what[0]),
  title: noneNull(what[1]),
  link: noneNull(what[2]),
  description: noneNull(what[3]),
  owner: noneNull(what[4]),
  contract: JSON.stringify(what[5]),
  blockCreated: parseInt(what[6]),
  upvotes: 0,
  downvotes: 0,
  contribs: 0,
  timedOut: false,
  didPass: false,
  isDown: false,
 })
 createPromise?.resolve &&
  (async () => {
   await alertThis('Created')
   createPromise.resolve()
  })()
}

const acknowledge = async ({ what }) => {
 const ifState = (x) => x.padEnd(20, '\u0000')
 switch (what[0]) {
  case ifState('upvoted'):
   const upProposals = proposals.map((el) => {
    if (Number(el.id) === Number(parseInt(what[1]))) {
     el['upvotes'] = parseInt(what[2])
    }
    return el
   })
   proposals = upProposals

   upvotePromise?.resolve &&
    (async () => {
     await alertThis('Success')
     upvotePromise.resolve()
    })()
   break
  case ifState('downvoted'):
   const downProposals = proposals.map((el) => {
    if (Number(el.id) === Number(parseInt(what[1]))) {
     el['downvotes'] = parseInt(what[2])
    }
    return el
   })
   proposals = downProposals

   downvotePromise?.resolve &&
    (async () => {
     await alertThis('Success')
     downvotePromise.resolve()
    })()
   break
  case ifState('contributed'):
   const conProposals = proposals.map((el) => {
    if (Number(el.id) === Number(parseInt(what[1]))) {
     el['contribs'] = reach.formatCurrency(what[2], 4)
    }
    return el
   })
   proposals = conProposals

   contribPromise?.resolve &&
    (async () => {
     await alertThis('Success')
     contribPromise.resolve()
    })()
   break
  case ifState('timedOut'):
   if (parseInt(what[2])) {
    const nBounty = proposals.filter(
     (el) => Number(el.id) === Number(parseInt(what[1]))
    )[0]
    bounties.push(nBounty)

    const xXProposals = proposals.filter(
     (el) => Number(el.id) !== Number(parseInt(what[1]))
    )
    proposals = xXProposals
   } else {
    const fProposals = proposals.map((el) => {
     if (Number(el.id) === Number(parseInt(what[1]))) {
      el['timedOut'] = true
      el['didPass'] = false
     }
     return el
    })
    proposals = fProposals
   }
   break
  case ifState('projectDown'):
   const remainingProposals = proposals.filter((el) => {
    if (Number(el.id) === Number(parseInt(what[1]))) {
     el['isDown'] = true
    }
    return Number(el.id) !== Number(parseInt(what[1]))
   })
   proposals = remainingProposals
   break
  default:
   break
 }
}

const timeoutProposal = async ({ what }) => {
 const ifState = (x) => x.padEnd(20, '\u0000')
 switch (what[0]) {
  case ifState('passed'):
   try {
    await contractInstance.apis.Voters.timedOut(parseInt(what[1]), 1)
   } catch (error) {
    console.log('[‼] A transaction clashed with a timeout')
   }
   break
  case ifState('failed'):
   try {
    await contractInstance.apis.Voters.timedOut(parseInt(what[1]), 0)
   } catch (error) {
    console.log('[‼] A transaction clashed with a timeout')
   }
   break
  case ifState('down'):
   try {
    await contractInstance.apis.Voters.projectDown(parseInt(what[1]))
   } catch (error) {
    console.log('[‼] A transaction clashed with a teardown')
   }
   break
  default:
   break
 }
}

const deploy = async () => {
 console.clear()

 console.log(`Reach DAO by Team 18`)
 console.log(`Wallet Balance: ${await user.balance()}`)
 console.info(``)
 console.log('[.] Deploying')
 const ctc = user.account.contract(backend)
 contractInstance = ctc
 const interact = {
  getProposal: {
   id: 1,
   title: 'Reach DAO by Team 18',
   link: 'https://github.com/Apostrophe-Corp/Reach-DAO/blob/main/README.md',
   description: `A hub for Web3 Developers`,
   owner: user.account.networkAccount.addr,
   deadline: 0,
   isProposal: false,
  },
 }

 ctc.p.Deployer(interact)
 const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null)
 ctc.events.create.monitor(createProposal)
 ctc.events.that.monitor(acknowledge)
 contract = { ctcInfoStr }
 console.clear()

 console.log(`Reach DAO by Team 18`)
 console.log(`Wallet Balance: ${await user.balance()}`)
 console.info(``)
 console.log(`[+] Deployed`)
 console.group(`Here is the contract information`)
 console.log(`${contract.ctcInfoStr}`)
 console.groupEnd(`Here is the contract information`)
 await sleep(5000)
 await showInfoCenter()
}

const makeProposal = async (proposal) => {
 const proposalSetup = async () => {
  const ctc = user.account.contract(backend)
  ctc.p.Deployer({
   getProposal: {
    ...proposal,
    deadline: deadline,
    isProposal: true,
   },
  })
  ctc.events.log.monitor(timeoutProposal)
  ctc.events.created.monitor(updateProposals)
 }
 await proposalSetup()
}

const showInfoCenter = async () => {
 console.clear()

 console.log(`Reach DAO by Team 18`)
 console.log(`Wallet Balance: ${await user.balance()}`)
 console.info(contract.ctcInfoStr ? contract.ctcInfoStr : '')
 console.group(`Info Center`)
 console.log(`Welcome! To the new Hub!`)
 console.groupEnd(`Info Center`)

 const respondTo = async (request) => {
  switch (request) {
   case 1:
    await showProposals()
    break
   case 2:
    await showBounties()
    break
   case 3:
    await setRole()
    break
   case 0:
    const confirmed = await ask.ask(`[‼] Confirm exit [y/n]`, ask.yesno)
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
  2. View Bounties
  3. Back to Select Roles
  0. Exit Reach DAO by Team 18`,
  (input) => {
   if (isNaN(input)) {
    throw Error('[‼] Please enter a numeric value')
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
 console.info(contract.ctcInfoStr ? contract.ctcInfoStr : '')
 console.group(`Proposals`)
 console.log(`Get the chance to bring your ideas to life!`)
 console.groupEnd(`Proposals`)

 const getProposalInfo = async () => {
  let [title, link, description] = ['', '', '']

  title = await ask.ask(`[+] Enter the Proposal's Title (Max 25)`, (value) =>
   String(value).slice(0, 25)
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
   `[‼] Are you satisfied with these details? [y/n]
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
         proposals.reduce((a, b) => (a.id > b.id ? a.id : b.id))
         ) + 1
      : 1,
    title,
    link,
    description,
    owner: user.account.networkAccount.addr,
   }
   console.log('[.] Creating proposal')
   await makeProposal(proposal).then(async () => {
    await new Promise((resolve) => {
     createPromise['resolve'] = resolve
    })
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
Contributions: ${p.contribs ?? 0} ${reach.standardUnit}
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
       const selectedProposal = proposalsOnDisplay[input - 1]
       const action = await ask.ask(
        `[+] What would you like to do?
  1. Contribute
  2. Up vote
  3. Down vote
  0. Cancel`,
        (x) => {
         if (isNaN(x)) {
          throw Error('[‼] Please enter a numeric value')
         } else {
          return Number(x)
         }
        }
       )

       switch (action) {
        case 1:
         const amount = await ask.ask(
          `[+] Please enter the amount in ${reach.standardUnit}`,
          (x) => {
           if (isNaN(x)) {
            throw Error('[‼] Please enter a numeric value')
           } else {
            return Number(x)
           }
          }
         )
         console.log('[.] Processing contribution')
         if (amount == 0) {
          await alertThis('Contribution is too low', false)
         } else {
          await new Promise(async (resolve, reject) => {
           contribPromise['resolve'] = resolve
           contribPromise['reject'] = reject
           await makeContribution(
            amount,
            selectedProposal.id,
            selectedProposal.contract
           )
          }).catch(async () => {
           await reevaluate(selectedProposal)
          })
         }
         await selectActiveProposal(section)
         break
        case 2:
         console.log('[.] Processing up vote')
         await new Promise(async (resolve, reject) => {
          upvotePromise['resolve'] = resolve
          upvotePromise['reject'] = reject
          await connectAndUpvote(
           selectedProposal.id,
           selectedProposal.contract
          )
         }).catch(async () => {
          await reevaluate(selectedProposal)
         })
         await selectActiveProposal(section)
         break
        case 3:
         console.log('[.] Processing down vote')
         await new Promise(async (resolve, reject) => {
          downvotePromise['resolve'] = resolve
          downvotePromise['reject'] = reject
          await connectAndDownvote(
           selectedProposal.id,
           selectedProposal.contract
          )
         }).catch(async () => {
          await reevaluate(selectedProposal)
         })
         await selectActiveProposal(section)
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
       console.log('[‼] Invalid response')
       await sleep(2000)
       await selectActiveProposal(section)
      }
      return
      }
    : async () => {
      await showProposals()
      }
  )
 }

 const selectTimedOutProposal = async (page = 1) => {
  let [section, timeoutProposals, proposalsOnDisplay] = [
   page,
   proposals.filter((el) => el.timedOut),
   [],
  ]

  proposalsOnDisplay = timeoutProposals.filter(
   (el, i) => i + 1 > (section - 1) * 3 && i + 1 <= section * 3
  )
  const lenOfProposals = proposalsOnDisplay.length
  console.group('Timed Out Proposals')
  if (lenOfProposals) {
   proposalsOnDisplay.forEach((p, i) => {
    console.log(`ID: ${i + 1}
Title: ${p.title ?? 'Title'}
Description: ${p.description ?? 'Description'}
Owner: ${p.owner ?? user.account.networkAccount.addr}
Link: ${p.link ?? 'Link'}\n
`)
   })
  } else {
   console.log('[+] None at the moment.')
  }
  console.groupEnd('Timed Out Proposals')

  await ask.ask(
   lenOfProposals
    ? `[+] Enter the Proposal's ID to claim a refund
  ${
  section < Math.ceil(timeoutProposals.length / 3)
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
       const selectedProposal = proposalsOnDisplay[input - 1]
       console.log(`[+] Processing request`)
       await connectAndClaimRefund(
        selectedProposal.id,
        selectedProposal.contract
       )
       await showProposals()
      } else if (input == 88 && section > 1) {
       await selectActiveProposal(section - 1)
      } else if (
       input == 99 &&
       section < Math.ceil(timeoutProposals.length / 3)
      ) {
       await selectActiveProposal(section + 1)
      } else {
       console.log('[‼] Invalid response')
       await sleep(2000)
       await selectActiveProposal(section)
      }
      return
      }
    : async () => {
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
    await selectTimedOutProposal()
    break
   case 4:
    await showBounties()
    break
   case 5:
    await showInfoCenter()
    break
   case 6:
    await setRole()
    break
   case 0:
    const confirmed = await ask.ask(`[‼] Confirm exit [y/n]`, ask.yesno)
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
  3. Select a Timed Out Proposal
  4. View Bounties
  5. View Info Center
  6. Back to Select Roles
  0. Exit Reach DAO by Team 18`,
  (input) => {
   if (isNaN(input)) {
    throw Error('[‼] Please enter a numeric value')
   } else {
    return Number(input)
   }
  }
 )

 await respondTo(userInput)
}

const showBounties = async () => {
 console.clear()

 console.log(`Reach DAO by Team 18`)
 console.log(`Wallet Balance: ${await user.balance()}`)
 console.info(contract.ctcInfoStr ? contract.ctcInfoStr : '')
 console.group(`Bounties`)
 console.log(`Lets Hack and claim the Bounty...`)
 console.groupEnd(`Bounties`)

 const selectActiveBounty = async (page = 1) => {
  let [i, section, activeBounties, bountiesOnDisplay] = [
   0,
   page,
   bounties,
   [],
  ]

  bountiesOnDisplay = activeBounties.filter(
   (el, i) => i + 1 > (section - 1) * 3 && i + 1 <= section * 3
  )
  const lenOfBounties = bountiesOnDisplay.length
  console.group('Active Bounties')
  if (lenOfBounties) {
   bountiesOnDisplay.forEach((b, i) => {
    console.log(`ID: ${i + 1}
Title: ${b.title ?? 'Title'}
Description: ${b.description ?? 'Description'}
Owner: ${b.owner ?? user.account.networkAccount.addr}
Link: ${b.link ?? 'Link'}
Grand_Prize: 99999 ${reach.standardUnit}\n
`)
   })
  } else {
   console.log('[+] None at the moment.')
  }
  console.groupEnd('Active Bounties')

  await ask.ask(
   lenOfBounties
    ? `[+] Enter the Bounty's ID of interest
  ${
  section < Math.ceil(activeBounties.length / 3)
   ? 'Enter 99 to view the next list'
   : ''
 }
  ${section > 1 ? 'Enter 88 to view the previous list' : ''}
  Or enter 0 to exit`
    : '[+] Enter any key to exit',
   lenOfBounties
    ? async (input) => {
      if (input == 0) {
       await showBounties()
      } else if (
       Number(input) <= bountiesOnDisplay.length &&
       Number(input) >= 1
      ) {
       await alertThis(`[+] Thanks for showing your interest in this quest.
  Stick around a while and our Guild would be fully operational.
  Until then, get your weapons, armor and, party members ready!!!`)
       await sleep(5000)
       await showBounties()
      } else if (input == 88 && section > 1) {
       await selectActiveBounty(section - 1)
      } else if (
       input == 99 &&
       section < Math.ceil(activeBounties.length / 3)
      ) {
       await selectActiveBounty(section + 1)
      } else {
       console.log('[‼] Invalid response')
       await sleep(2000)
       await selectActiveBounty(section)
      }
      return
      }
    : async () => {
      await showBounties()
      }
  )
 }

 const respondTo = async (request) => {
  switch (request) {
   case 1:
    await selectActiveBounty()
    break
   case 2:
    await showInfoCenter()
    break
   case 3:
    await showProposals()
    break
   case 4:
    await setRole()
    break
   case 0:
    const confirmed = await ask.ask(`[‼] Confirm exit [y/n]`, ask.yesno)
    if (confirmed) process.exit(0)
    else await showBounties()
    break
   default:
    await showBounties()
    break
  }
 }

 const userInput = await ask.ask(
  `[+] Console Menu
  1. Select an Active Bounty
  2. View Info Center
  3. View Proposals
  4. Back to Select Roles
  0. Exit Reach DAO by Team 18`,
  (input) => {
   if (isNaN(input)) {
    throw Error('[‼] Please enter a numeric value')
   } else {
    return Number(input)
   }
  }
 )

 await respondTo(userInput)
}

await connectAccount()
ask.done()
process.exit(0)
```

With this testing frontend in place, we can run:  

```shell
> ./reach run
```

And have our interactive test suite up and running.  

## Discussion

You did it!

You implemented a Reach program totally on your own, with only a little guidance.

This workshop uses a "top-down" perspective on Reach application design, where you derive the program from the requirements and slowly fill out the shell, while knowing that each step was correct before moving on. There's no right way to program and in our own Reach development, we use a combination of ingenuity and improvisation.  

If you found this workshop rewarding, please let us know on the [Discord](bit.ly/3BnPyKd) community!  

Stay tuned for a tutorial version of this workshop! Then we'll cover a more efficient way to handle the interactions between the main contract and a proposal contract.  
