import { readFileSync } from "fs";
import { BitStream } from "./BitStream";
import { ReplayData } from "./ReplayData";

const replayPath = "/Users/harrywhittle/BrawlhallaReplays/[6.05] VoidMinor.replay";

const replayData = new BitStream(readFileSync(replayPath));

const replay = ReplayData.ReadReplay(replayData);

console.log(replay);