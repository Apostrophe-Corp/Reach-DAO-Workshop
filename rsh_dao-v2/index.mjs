import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const reach = loadStdlib();

console.clear();

let user = await reach.newTestAccount(reach.parseCurrency(1000));

console.log(`Reach DAO by Team 18`);
const ctc = user.contract(backend);

const interact = {
  getProposal: {
    id: 1,
    title: "AroTable",
    link: "https://github.com/Aro1914/AroTable/blob/main/README.md",
    description: `A self-sorting number data structure`,
    owner: user.networkAccount.addr,
    deadline: { ETH: 5, ALGO: 50, CFX: 500 }[reach.connector],
    isProposal: false,
  }
};

console.log("[..] Deploying");
ctc.p.Deployer(interact);

const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
console.log(`[+] Deployed`);
console.group(`Here is the contract information`);
console.log(`${JSON.stringify(JSON.parse(ctcInfoStr))}`);
console.groupEnd(`Here is the contract information`);
console.log("[..] Exiting Reach DAO");

process.exit(0);
