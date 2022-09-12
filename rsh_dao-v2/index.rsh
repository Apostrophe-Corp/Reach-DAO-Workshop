'reach 0.1';

export const main = Reach.App(() => {

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

        const [
            upvote,
            downvote,
        ] = parallelReduce([0, 0])
            .invariant(balance() == 0)
            .while(keepGoing())
            .api(Voters.upvote, (notify) => {
                notify(upvote + 1);
                return [upvote + 1, downvote];
            })
            .api(Voters.downvote, (notify) => {
                notify(downvote + 1);
                return [upvote, downvote + 1];
            })
    } else {
        // The contract assumes that of the main contract
    }
    commit();
    exit();
});