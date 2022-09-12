import { loadStdlib } from "@reach-sh/stdlib";
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

console.log(`[+] Deployed`);
console.log("[..] Exiting Reach DAO");

process.exit(0);
