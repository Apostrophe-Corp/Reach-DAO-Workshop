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