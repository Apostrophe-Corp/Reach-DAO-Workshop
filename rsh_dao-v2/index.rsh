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
    init();
    Deployer.only(() => {
        const { isProposal } = declassify(interact.getProposal);
    });
    Deployer.publish(isProposal);

    if (isProposal) {
        // The contract assumes that of a proposal
    } else {
        // The contract assumes that of the main contract
    }
    commit();
    exit();
});