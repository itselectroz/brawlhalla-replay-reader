# brawlhalla-replay-reader

[![Version](https://img.shields.io/npm/v/brawlhalla-replay-reader.svg?style=flat-square)](https://www.npmjs.com/package/brawlhalla-replay-reader)
[![Downloads](https://img.shields.io/npm/dt/brawlhalla-replay-reader.svg?style=flat-square)](https://www.npmjs.com/package/brawlhalla-replay-reader)
[![License](https://img.shields.io/github/license/brawlhalla-replay-reader/vdf.svg?style=flat-square)](https://www.npmjs.com/package/brawlhalla-replay-reader)

**brawlhalla-replay-reader** is a module for parsing replay files for [Brawlhalla](https://www.brawlhalla.com/).

## Installation

You can install **brawlhalla-replay-reader** for use as a module through the command line using `npm` or `yarn`.

```console
npm install brawlhalla-replay-reader
```

If you wish to install the CLI tool we recommend installing it globally:

```console
npm install -g brawlhalla-replay-reader
```

Please note this will add the tool to your environment path for usage anywhere.

## Usage

### CLI Tool

Assuming the tool has been installed globally, you can run the tool using:

```console
replay-reader -h
```

This will give you a brief help page.

In order to export your latest replay simply run:

```console
replay-reader export latest
```

This will write an export of your latest replay to replay.json.

To export a select replay simply replace latest with the name of the file (with or without the .replay extension) (Make sure to add quotation marks!)

```console
replay-reader export "[6.05] ShipreckFalls"
```

To specify the output directory use the `--out` or `-o` option:

```console
replay-reader export -o out.json latest
```

This will write the output to `out.json`!

To specify a custom Brawlhalla replays directory use the `--dir` or `-d` option:

```console
replay-reader export -d C:/BrawlhallaReplays/ latest
```

### As a module

```javascript
import { ReplayData } from "brawlhalla-replay-reader";

// or

import * as ReplayReader from "brawlhalla-replay-reader";
```

The main class exported by this project is `ReplayData`.

It contains a static method `ReadReplay` which takes the replay file data as an argument.
See the example below:

```typescript
import { readFileSync } from "fs";
import { homedir } from "os";
import { ReplayData } from "brawlhalla-replay-reader";

const replayName = "[6.05] VoidMinor.replay";
const replayPath = homedir() + `/BrawlhallaReplays/${replayName}`;

const replayData = readFileSync(replayPath);

const replay = ReplayData.ReadReplay(replayData);
```

From there you can simply interact with the replay object as much as you would like.

For example to print all deaths:

```typescript
const entities = replay.entities;

for (const death of replay.deaths) {
  const entity = entities.find((e) => e.id == death.entityId);
  if (!entity) {
    throw new Error(`Unable to find entity with id ${death.entityId}`);
  }

  console.log(`${entity.name} died at ${death.timestamp / 1000}s`);
}
```

## Documentation

### `ReplayData.ReadReplay(data: Buffer): ReplayData`

> A static method for reading a replay from a buffer.

```javascript
const replayData = readFileSync(replayPath);

const replay = ReplayData.ReadReplay(replayData);

> {
  length: 252624,
  results: { '1': 1, '2': 1, '3': 2, '4': 2 },
  deaths: [
    { entityId: 4, timestamp: 44416 },
    ...
  ],
  inputs: {
    '1': [
      { timestamp: 0, inputState: 0 },
      { timestamp: 6208, inputState: 8 },
      ...
    ],
    ...
  },
  randomSeed: 69330341,
  version: 209,
  playlistId: 7,
  onlineGame: true,
  levelId: 186,
  heroCount: 1,
  entities: [
    {
      id: 1,
      name: 'electroz',
      data: {
        colourId: 2,
        spawnBotId: 1,
        emitterId: 1,
        playerThemeId: 1,
        taunts: [
          12, 43, 64, 68,
          12, 12, 12, 12
        ],
        winTaunt: 64,
        loseTaunt: 64,
        unknown1: [ 0, 2048, 17, 0 ],
        avatarId: 41,
        team: 1,
        unknown2: 1648171893,
        heroes: [
          HeroData {
            heroId: 52,
            costumeId: 432,
            stance: 1,
            weaponSkins: 65864684
          }
        ],
        bot: false
      }
    },
    ...
  ],
  playlistName: 'PlaylistType_2v2Ranked_DisplayName',
  gameSettings: {
    flags: 3,
    maxPlayers: 4,
    duration: 480,
    roundDuration: 0,
    startingLives: 3,
    scoringType: 2,
    scoreToWin: 0,
    gameSpeed: 100,
    damageRatio: 100,
    levelSetID: 4
  }
}
```

## Documentation - Types

### ReplayData

> The root replay object.

```typescript
{
  length: number;
  results: {
    [entityId: number]: number
  };
  deaths: Death[];
  inputs: {
    [entityId: number]: Input[]
  };
  randomSeed: number;
  version: number;
  playlistId: number;
  playlistName: string | undefined;
  onlineGame: boolean;
  gameSettings: GameSettings | undefined;
  levelId: number;
  heroCount: number;
  entities: Entity[];
}
```

### Death

> Object containing data on an entity death

```typescript
{
  entityId: number;
  timestamp: number;
}
```

### Input

> Timestamped input. \
> Input state is bitmap of possible keys being pressed.

```typescript
{
  timestamp: number;
  inputState: number;
}
```

### GameSettings

> Data about game/match settings.

```typescript
{
  flags: number;
  maxPlayers: number;
  duration: number;
  roundDuration: number;
  startingLives: number;
  scoringType: number;
  scoreToWin: number;
  gameSpeed: number;
  damageRatio: number;
  levelSetID: number;
}
```

### Entity

> Data about an entity in a match

```typescript
{
  id: number;
  name: string;
  data: PlayerData;
}
```

### PlayerData

> Data about a specific player

```typescript
{
  colourId: number;
  spawnBotId: number;
  emitterId: number;
  playerThemeId: number;
  taunts: number[];
  winTaunt: number;
  loseTaunt: number;
  unknown1: number[];
  avatarId: number;
  team: number;
  unknown2: number;
  heroes: HeroData[];
  bot: boolean;
}
```

### HeroData

> Data about a legend selection.

```typescript
{
  heroId: number;
  costumeId: number;
  stance: number;
  weaponSkins: number;
}
```

## Contributing

Interested in contributing to **brawlhalla-replay-reader**?

Contributions are welcome, and are accepted via pull requests. Please [review these guidelines](contributing.md) before submitting any pull requests.

### Help

**Installing dependencies:**

```console
npm install
```

**Compile:**

```console
npm run build
```

## License

All code in this repository is licensed under [MIT](LICENSE).
