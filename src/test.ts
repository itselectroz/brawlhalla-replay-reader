import { readFileSync } from "fs";
import { homedir } from "os";
import { ReplayData } from "./ReplayData";

const replayName = "[6.05] VoidMinor.replay";
const replayPath = homedir() + `/BrawlhallaReplays/${replayName}`;

const replayData = readFileSync(replayPath);

const replay = ReplayData.ReadReplay(replayData);

const entities = replay.entities;

for (const death of replay.deaths) {
  const entity = entities.find(e => e.id == death.entityId);
  if (!entity) {
    throw new Error(`Unable to find entity with id ${death.entityId}`);
  }

  console.log(`${entity.name} died at ${death.timestamp / 1000}s`);
}