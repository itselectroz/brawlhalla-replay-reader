# brawlhalla-replay-reader
A simple repo for reading Brawlhalla replay data.

## Installation

Firstly, ensure you have the lastest version of [node.js](https://nodejs.org/en/) installed.

### NPM

In your project directory simply run:
`npm i https://github.com/itselectroz/brawlhalla-replay-reader`

If you want to only install the CLI tool, run:
`npm i -g https://github.com/itselectroz/brawlhalla-replay-reader`

### From Source

Firstly clone the project

`git clone https://github.com/itselectroz/brawlhalla-replay-reader`

Go into the directory

`cd brawlhalla-replay-reader`

Install the required dependencies.

`npm install`

Before finally building the project!

`npm run build`

You can now either install this project into other projects:
`npm i /source/to/cloned/project`

Or use the CLI from within this project directory using the usage instructions below!

## Usage

### CLI Tool

WIP

### In your project

The main class exported by this project is `ReplayData`.

It contains a static method `ReadReplay` which takes the replay file data as an argument.
See the example below:

```typescript
import { readFileSync } from "fs";
import { homedir } from "os";
import { ReplayData } from "./ReplayData";

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
  const entity = entities.find(e => e.id == death.entityId);
  if (!entity) {
    throw new Error(`Unable to find entity with id ${death.entityId}`);
  }

  console.log(`${entity.name} died at ${death.timestamp / 1000}s`);
}
```
