import { loadStdlib, ask } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const reach = loadStdlib();

console.clear();

let user = await reach.newTestAccount(reach.parseCurrency(1000));

console.log(`Reach DAO by Team 18`);
const ctc = user.contract(backend);

const interact = {
  // The deployer's interact interface
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
