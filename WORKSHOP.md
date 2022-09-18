# Reach DAO

In this workshop, we'll design a platform where users can create proposals and have other users in the platform decide the outcome of the proposal created by either up voting or down voting the proposal, and optionally sponsoring the proposal by contributing to it with the condition that the proposer only gets the total funds if the amount of up votes surpasses that of the down votes. In this scenario encountering proposals that fail to pass this condition are inevitable, so we would give users the means to claim back the portions they contributed to a failed proposal until all funds have been retrieved. On the other hand, for passed proposals, we would have them become bounties, open to be claimed by anyone willing to fulfil the proposed task.  

This workshop utilizes API calls and events to handle voluntary interaction with the contracts deployed.  

> This workshop assumes that you have recently completed the Rock, Papers, Scissors tutorial and have a good understanding of interactive test deployment  

We assume that you'll go through this workshop in a directory named `~/reach/rsh_dao-ws`:

```shell
> mkdir -p ~/reach/rsh_dao-ws && cd ~/reach/rsh_dao-ws
```

And that you have a copy of Reach installed in `~/reach/rsh_dao-ws`, so that you can write

```shell
> ./reach version
```

And it will run Reach.

## Problem Analysis

First, we should think over the details of the application and answer some questions to help reason about the implementation of the program. Let's provide some constraints and problem analysis.  

The overall purpose of this application is so that:

- A user should be able to create a proposal.
- This proposal must be visible to other users, allowing them to vote on, and contribute to.
- After a predefined deadline is reached, the outcome of the proposal is determined from its votes.
- The funds raised by a passed proposal are sent to the proposer and the proposal made a bounty, while for a failed proposal, it is made available for users to claim a refund.

With this in mind, lets's answer the questions:

- How many participants does this application require, and who are they?
- How do we implement voluntary interaction?
- How do we ensure every user is aware of the current state of things?

### Write down the problem analysis of this program as a comment

Let's see how your answers compare to our answers:

- This application requires just one participant, the Deployer. He would be responsible for deploying the contract, and when a proposal is being created by a user, that user assumes the role of the Deployer for that proposal, which in itself would be a contract.
