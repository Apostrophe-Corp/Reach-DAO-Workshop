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
    deadline: { ETH: 2, ALGO: 20, CFX: 2000 }[reach.connector],
    isProposal: false,
  }
};

console.log("[..] Deploying");
ctc.p.Deployer(interact);

console.log(`[+] Deployed`);
console.log("[..] Exiting Reach DAO");

process.exit(0);
