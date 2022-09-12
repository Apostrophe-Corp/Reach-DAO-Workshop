'reach 0.1';

const [isOutcome, NOT_PASSED, PASSED] = makeEnum(2);

const state = Bytes(20);

const checkStatus = (upVotes, downVotes) => {
    if (downVotes > upVotes) {
        return NOT_PASSED;
    } else if (upVotes == downVotes) {
        return NOT_PASSED;
    } else {
        return PASSED;
    }
};

assert(checkStatus(100, 100) == NOT_PASSED);
assert(checkStatus(50, 100) == NOT_PASSED);
assert(checkStatus(100, 50) == PASSED);

forall(UInt, upVotes =>
    forall(UInt, downVotes =>
        assert(isOutcome(checkStatus(upVotes, downVotes)))));

export const main = Reach.App(() => {
    setOptions({ untrustworthyMaps: true });
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
    });

    const Voters = API('Voters', {
        upvote: Fun([], UInt),
        downvote: Fun([], UInt),
        contribute: Fun([UInt], UInt),
        claimRefund: Fun([], Bool),
    });

    const Proposals = Events({
        log: [state, UInt],
        created: [UInt, Bytes(25), Bytes(150), Bytes(180), Address, Contract],
    });
    init();

    Deployer.only(() => {
        const { title, link, description, owner, id, isProposal, deadline } = declassify(interact.getProposal);
    });
    Deployer.publish(description, isProposal);

    if (isProposal) {
        commit();
        Deployer.publish(title, link, owner, id, deadline);
        Proposals.created(id, title, link, description, owner, getContract());
        const [timeRemaining, keepGoing] = makeDeadline(deadline);
        const contributors = new Map(Address, Address);
        const amtContributed = new Map(Address, UInt);
        const contributorsSet = new Set();

        const [
            upvote,
            downvote,
            amtTotal,
        ] = parallelReduce([0, 0, balance()])
            .invariant(balance() == amtTotal)
            .while(keepGoing())
            .api(Voters.upvote, (notify) => {
                notify(upvote + 1);
                return [upvote + 1, downvote, amtTotal];
            })
            .api(Voters.downvote, (notify) => {
                notify(downvote + 1);
                return [upvote, downvote + 1, amtTotal];
            })
            .api_(Voters.contribute, (amt) => {
                check(amt > 0, "Contribution too small");
                const payment = amt;
                return [payment, (notify) => {
                    notify(balance());
                    if (contributorsSet.member(this)) {
                        const fromMapAmt = (m) => fromMaybe(m, (() => 0), ((x) => x));
                        amtContributed[this] = fromMapAmt(amtContributed[this]) + amt;
                    } else {
                        contributors[this] = this;
                        amtContributed[this] = amt;
                        contributorsSet.insert(this);
                    }
                    return [upvote, downvote, amtTotal + amt];
                }];
            })
            .timeout(timeRemaining(), () => {
                Deployer.publish();
                if (checkStatus(upvote, downvote) == PASSED) {
                    Proposals.log(state.pad('passed'), id);
                    transfer(balance()).to(owner);
                } else {
                    if (balance() > 0) {
                        const fromMapAdd = (m) => fromMaybe(m, (() => Deployer), ((x) => x));
                        const fromMapAmt = (m) => fromMaybe(m, (() => 0), ((x) => x));
                        Proposals.log(state.pad('failed'), id);
                        const currentBalance = parallelReduce(balance())
                            .invariant(balance() == currentBalance)
                            .while(currentBalance > 0)
                            .api(Voters.claimRefund, (notify) => {
                                const amountTransferable = fromMapAmt(amtContributed[this]);
                                if (balance() >= amountTransferable && contributorsSet.member(this)) {
                                    transfer(amountTransferable).to(
                                        fromMapAdd(contributors[this])
                                    );
                                    contributorsSet.remove(this);
                                    Proposals.log(state.pad('refundPassed'), id); // Have this as a challenge to implement a custom handler for it
                                    notify(true);
                                    return currentBalance - amountTransferable;
                                } else {
                                    Proposals.log(state.pad('refundFailed'), id); // Have this as a challenge to implement a custom handler for it
                                    notify(false);
                                    return currentBalance;
                                }
                            });
                    }
                    Proposals.log(state.pad('down'), id);
                }
                return [upvote, downvote, balance()];
            });
        transfer(balance()).to(Deployer);
    } else {
        // The contract assumes that of the main contract
    }

    commit();
    exit();
});