# brawlhalla-replay-reader

A simple repo for reading Brawlhalla replay data.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)

## Installation

Firstly, ensure you have the lastest version of [node.js](https://nodejs.org/en/) installed.

### NPM

In your project directory simply run:
`npm i https://github.com/itselectroz/brawlhalla-replay-reader`

If you want to globally install the CLI tool, run:
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
`npm i /path/to/cloned/project`

Or use the CLI from within this project directory using the usage instructions below!

## Usage

### CLI Tool

Assuming the tool has been installed globally, you can run the tool using:

`replay-reader -h`

This will give you a brief help page.

In order to export your latest replay simply run:

`replay-reader export latest`

This will write an export of your latest replay to replay.json.

To export a select replay simply replace latest with the name of the file (with or without the .replay extension) (Make sure to add quotation marks!)

`replay-reader export "[6.05] ShipreckFalls"`

To specify the output directory use the `--out` or `-o` option:

`replay-reader export -o out.json latest`

This will write the output to `out.json`!

To specify a custom Brawlhalla replays directory use the `--dir` or `-d` option:

`replay-reader export -d C:/BrawlhallaReplays/ latest`

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
