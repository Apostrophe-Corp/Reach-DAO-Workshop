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