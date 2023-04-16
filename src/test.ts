import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { BitStream, ReplayData } from ".";

const replayDir = homedir() + `/BrawlhallaReplays`;
const inPath = `${replayDir}/7.06_ShipwreckFalls_32.replay`;
// const inPath = `${replayDir}/[7.06] SmallGreatHall.replay`;
const outPath = `${replayDir}/out.replay`;

const replayData = readFileSync(inPath);

const replay = new ReplayData();  
const stream = new BitStream(replayData);

replay.read(stream);

replay.entities.forEach(ent => ent.data.colourId = 64)

writeFileSync(outPath, replay.write());

ReplayData.ReadReplay(readFileSync(outPath))
