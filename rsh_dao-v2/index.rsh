'reach 0.1';

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
    });
    init();
    Deployer.only(() => {
        const { title, link, description, owner, id, isProposal, deadline } = declassify(interact.getProposal);
    });
    Deployer.publish(description, isProposal);

    if (isProposal) {
        commit();
        Deployer.publish(title, link, owner, id, deadline);
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
        transfer(balance()).to(Deployer);
    } else {
        // The contract assumes that of the main contract
    }
    commit();
    exit();
});