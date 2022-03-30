#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ReplayData } from './ReplayData';

function getLatestReplay(dir: string) {
  if (!dir) {
    dir = path.join(homedir(), 'BrawlhallaReplays');
  }

  const files = readdirSync(dir);
  let replays = files.filter(f => f.endsWith('.replay'));

  if (replays.length < 1) {
    return false;
  }

  replays = replays.map(function (fileName) {
    return {
      name: fileName,
      time: statSync(path.join(dir, fileName)).mtime.getTime()
    };
  }).sort(function (a, b) {
    return b.time - a.time;
  }).map(function (v) {
    return v.name;
  });

  return path.join(dir, replays[0]);
}

yargs(hideBin(process.argv))
  .command('export <replayName|latest>', 'read a replay file', (yargs) => {
    return yargs
      .positional('replayName', {
        describe: 'the name of the replay file with or without extension. Set it to "latest" to read the latest replay file',
        demandOption: true,
        type: 'string'
      })
      .option('dir', {
        alias: 'd',
        describe: 'the directory containing the replay file, defaults to $HOME/BrawlhallaReplays',
        demandOption: false,
        type: 'string'
      })
      .option('out', {
        alias: 'o',
        describe: 'the output file',
        demandOption: false,
        type: 'string',
        default: 'replay.json'
      })
  }, (argv) => {
    const { replayName, dir, out } = argv;

    let replayPath;

    if (replayName == "latest") {
      const latestReplay = getLatestReplay(dir || "");
      if (!latestReplay) {
        console.error("No replay file found");
        process.exit(1);
      }
      replayPath = latestReplay;
    }
    else if (!dir) {
      if (existsSync(replayName)) {
        replayPath = replayName;
      }
      else {
        replayPath = path.join(homedir(), 'BrawlhallaReplays', replayName);
      }
    }
    else {
      replayPath = path.resolve(dir, replayName);
    }

    if (!replayPath.endsWith('.replay')) {
      replayPath += '.replay';
    }

    if (!existsSync(replayPath)) {
      console.error(`File ${replayPath} does not exist`);
      process.exit(1);
    }

    const replayData = readFileSync(replayPath);

    if (!replayData) {
      console.error(`Unable to read file ${replayPath}`);
      process.exit(1);
    }

    console.log(`Reading replay file ${replayPath}`);

    const replay = ReplayData.ReadReplay(replayData);

    const jsonData = JSON.stringify(replay, null, 2);

    writeFileSync(out, jsonData);

    console.log(`Wrote replay data to ${out}`);
    console.log(`The match was ${replay.length / 1000}s long`);
  })
  .demandCommand(1)
  .help()
  .parse()