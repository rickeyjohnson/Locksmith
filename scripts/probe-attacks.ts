import { config as loadEnv } from "dotenv";
loadEnv({ path: [".env.local", ".env"] });
import { getLevel } from "../src/levels";
import { getPassword } from "../src/levels/secrets";
import { runPipeline } from "../src/pipeline/run";
import { loadAttacks } from "./attacks";

const clean = loadAttacks().filter((a) => a.id.endsWith("-clean"));
(async () => {
  for (const lv of [5, 6, 3]) {
    const level = getLevel(lv)!;
    const pw = getPassword(lv);
    let leaks = 0;
    for (const a of clean) {
      const r = await runPipeline(level, pw, a.text);
      if (r.leaked) leaks++;
      console.log(`L${lv} ${a.id.padEnd(15)} leaked=${String(r.leaked).padEnd(5)} rawLeak=${String(r.rawLeaked).padEnd(5)} blocked=${r.blockedBy ?? "-"}`);
    }
    console.log(`--> L${lv}: ${leaks}/${clean.length} player-visible leaks\n`);
  }
})();
