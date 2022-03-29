import { inflateSync } from "zlib";
import { BitStream } from "./BitStream";
import { GameSettings } from "./GameSettings";
import { PlayerData } from "./PlayerData";

const XOR_KEY = [107, 16, 222, 60, 68, 75, 209, 70, 160, 16, 82, 193, 178, 49, 211, 106, 251, 172, 17, 222, 6, 104, 8, 120, 140, 213, 179, 249, 106, 64, 214, 19, 12, 174, 157, 197, 212, 107, 84, 114, 252, 87, 93, 26, 6, 115, 194, 81, 75, 176, 201, 140, 120, 4, 17, 122, 239, 116, 62, 70, 57, 160, 199, 166];

export type Entity = {
  id: number;
  name: string;
  data: PlayerData;
}

export type Input = {
  timestamp: number;
  inputState: number;
}

export type Death = {
  entityId: number;
  timestamp: number;
}

export class ReplayData {

  public length: number = -1;
  public results: {
    [entityId: number]: number
  } = {};
  public deaths: Death[] = [];

  public inputs: {
    [entityId: number]: Input[]
  } = {};

  public randomSeed: number = -1;
  public version: number = -1;
  public playlistId: number = -1;
  public playlistName?: string;
  public onlineGame: boolean = false;

  public gameSettings?: GameSettings;
  public levelId: number = -1;

  public heroCount: number = -1; // the number of heroes each player has.
  public entities: Entity[] = [];

  private readHeader(data: BitStream) {
    this.randomSeed = data.ReadInt();
    this.version = data.ReadInt();
    this.playlistId = data.ReadInt();

    if (this.playlistId != 0) {
      this.playlistName = data.ReadString();
    }

    this.onlineGame = data.ReadBoolean();
  }

  private readPlayerData(data: BitStream) {
    this.gameSettings = GameSettings.read(data);
    this.levelId = data.ReadInt();

    this.heroCount = data.ReadShort();

    this.entities = [];

    while (data.ReadBoolean()) {
      const entityId = data.ReadInt();
      const entityName = data.ReadString();

      const playerData = PlayerData.read(data, this.heroCount);

      this.entities.push({
        id: entityId,
        name: entityName,
        data: playerData
      });
    }

    let secondVersionCheck = data.ReadInt();

    if (secondVersionCheck != this.version) {
      throw new Error("Second version check does not match first version check");
    }

    data.ReadInt(); // used in checksum
  }

  private readResults(data: BitStream) {
    this.length = data.ReadInt();
    const thirdVersionCheck = data.ReadInt();

    if (thirdVersionCheck != this.version) {
      throw new Error("Third version check does not match first version check");
    }

    if (data.ReadBoolean()) {
      this.results = {};
      while (data.ReadBoolean()) {
        const entityId = data.ReadBits(5);
        const result = data.ReadShort();
        this.results[entityId] = result;
      }
    }
  }

  private readInputs(data: BitStream) {
    this.inputs = {};
    while (data.ReadBoolean()) {
      const entityId = data.ReadBits(5);
      const inputCount = data.ReadInt();

      if (!this.inputs[entityId]) {
        this.inputs[entityId] = [];
      }

      for (let i = 0; i < inputCount; i++) {
        const timestamp = data.ReadInt();
        const inputState = data.ReadBoolean() ? data.ReadBits(14) : 0;

        this.inputs[entityId].push({
          timestamp: timestamp,
          inputState: inputState
        });
      }
    }
  }

  private readFaces(data: BitStream, kos: boolean) {
    if (kos) {
      this.deaths = [];
    }

    while (data.ReadBoolean()) {
      const entityId = data.ReadBits(5);
      const timestamp = data.ReadInt();

      if (kos) {
        this.deaths.push({
          entityId,
          timestamp
        });
      }
    }

    if (kos) {
      this.deaths.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  private xorData(data: BitStream) {
    const buffer = data.getBuffer();
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= XOR_KEY[i % XOR_KEY.length];
    }
  }

  private decompress(data: BitStream) {
    const buffer = data.getBuffer();
    const decompressed = inflateSync(buffer);
    data.setBuffer(decompressed);
  }

  public read(data: BitStream) {
    this.decompress(data);
    this.xorData(data);

    let stop = false;
    while (data.getReadBytesAvailable() > 0 && !stop) {
      let state: number = data.ReadBits(3);

      switch (state) {
        case 1:
          this.readInputs(data);
          break;
        case 3:
          this.readHeader(data);
          break;
        case 4:
          this.readPlayerData(data);
          break;
        case 6:
          this.readResults(data);
          break;
        case 5:
        case 7:
          this.readFaces(data, state == 5);
          break;
        default:
          console.log("Unknown state: " + state);
          stop = true;
          break;
      }
    }

    console.log("Finished reading replays...");
  }

  public static ReadReplay(data: BitStream): ReplayData {
    const replay = new ReplayData();
    replay.read(data);
    return replay;
  }
}