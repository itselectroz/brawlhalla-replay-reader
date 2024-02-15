import { deflateSync, inflateSync } from "zlib";
import { BitStream } from "./BitStream";
import { GameSettings } from "./GameSettings";
import { PlayerData } from "./PlayerData";

const XOR_KEY = [
  107, 16, 222, 60, 68, 75, 209, 70, 160, 16, 82, 193, 178, 49, 211, 106, 251,
  172, 17, 222, 6, 104, 8, 120, 140, 213, 179, 249, 106, 64, 214, 19, 12, 174,
  157, 197, 212, 107, 84, 114, 252, 87, 93, 26, 6, 115, 194, 81, 75, 176, 201,
  140, 120, 4, 17, 122, 239, 116, 62, 70, 57, 160, 199, 166,
];

export type Entity = {
  id: number;
  name: string;
  data: PlayerData;
};

export type Input = {
  timestamp: number;
  inputState: number;
};

export type Face = {
  entityId: number;
  timestamp: number;
};

export class ReplayData {
  // Keeps track of the order of state writes
  public stateOrder: number[] = [3, 4, 6, 1, 5];

  public length: number = -1;
  public results: {
    [entityId: number]: number;
  } = {};
  public deaths: Face[] = [];
  public victoryFaces: Face[] = [];

  public inputs: {
    [entityId: number]: Input[];
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

  public endOfMatchFanfare: number = 0;

  private readHeader(data: BitStream) {
    this.randomSeed = data.ReadInt();
    this.version = data.ReadInt();
    this.playlistId = data.ReadInt();

    if (this.playlistId != 0) {
      this.playlistName = data.ReadString();
    }

    this.onlineGame = data.ReadBoolean();
  }

  private writeHeader(data: BitStream) {
    data.WriteInt(this.randomSeed);
    data.WriteInt(this.version);
    data.WriteInt(this.playlistId);

    if (this.playlistId != 0 && !!this.playlistName) {
      data.WriteString(this.playlistName);
    }

    data.WriteBoolean(this.onlineGame);
  }

  private readPlayerData(data: BitStream) {
    this.gameSettings = GameSettings.read(data);
    this.levelId = data.ReadInt();

    this.heroCount = data.ReadShort();

    this.entities = [];

    let calculatedChecksum = 0;

    while (data.ReadBoolean()) {
      const entityId = data.ReadInt();
      const entityName = data.ReadString();

      const playerData = PlayerData.read(data, this.heroCount);

      this.entities.push({
        id: entityId,
        name: entityName,
        data: playerData,
      });

      calculatedChecksum += playerData.calcChecksum();
    }

    let secondVersionCheck = data.ReadInt();

    if (secondVersionCheck != this.version) {
      throw new Error(
        "Second version check does not match first version check"
      );
    }

    calculatedChecksum += this.levelId * 47;

    calculatedChecksum = calculatedChecksum % 173;

    const checksum = data.ReadInt();

    if (checksum != calculatedChecksum) {
      console.log(
        `[DEV WARNING] Data checksums don't match: Got ${checksum}, calculated ${calculatedChecksum}`
      );
    }
  }

  private writePlayerData(data: BitStream) {
    if (!this.gameSettings) throw new Error("Game settings is undefined");
    this.gameSettings.write(data);

    data.WriteInt(this.levelId);

    data.WriteShort(this.heroCount);

    let checksum = 0;

    for (const entity of this.entities) {
      data.WriteBoolean(true);
      data.WriteInt(entity.id);
      data.WriteString(entity.name);

      checksum += entity.data.calcChecksum();

      entity.data.write(data, this.heroCount);
    }

    data.WriteBoolean(false);

    data.WriteInt(this.version);

    checksum += this.levelId * 47;

    data.WriteInt(checksum % 173);
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

    this.endOfMatchFanfare = data.ReadInt(); // end of match fanfare id
  }

  private writeResults(data: BitStream) {
    data.WriteInt(this.length);
    data.WriteInt(this.version);

    data.WriteBoolean(!!this.results);
    if (this.results) {
      const entities: number[] = Object.keys(this.results) as any;

      for (const entityId of entities) {
        data.WriteBoolean(true);
        data.WriteBits(entityId, 5);
        data.WriteShort(this.results[entityId]);
      }
      data.WriteBoolean(false);
    }

    data.WriteInt(this.endOfMatchFanfare);
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
          inputState: inputState,
        });
      }
    }
  }

  private writeInputs(data: BitStream) {
    // TS being jank
    const entityIds: number[] = Object.keys(this.inputs) as any;
    for (let entityId of entityIds) {
      data.WriteBoolean(true);
      data.WriteBits(entityId, 5);

      const inputs = this.inputs[entityId];
      data.WriteInt(inputs.length);
      for (let input of inputs) {
        data.WriteInt(input.timestamp);
        data.WriteBoolean(input.inputState != 0);
        if (input.inputState != 0) data.WriteBits(input.inputState, 14);
      }
    }

    data.WriteBoolean(false);
  }

  private readFaces(data: BitStream, kos: boolean) {
    if (kos) {
      this.deaths = [];
    } else {
      this.victoryFaces = [];
    }

    const arr = kos ? this.deaths : this.victoryFaces;

    while (data.ReadBoolean()) {
      const entityId = data.ReadBits(5);
      const timestamp = data.ReadInt();

      arr.push({
        entityId,
        timestamp,
      });
    }

    arr.sort((a, b) => a.timestamp - b.timestamp);
  }

  private writeFaces(data: BitStream, kos: boolean) {
    const arr = kos ? this.deaths : this.victoryFaces;

    for (const face of arr) {
      data.WriteBoolean(true);

      data.WriteBits(face.entityId, 5);
      data.WriteInt(face.timestamp);
    }

    data.WriteBoolean(false);
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

  private compress(data: BitStream) {
    const buffer = data.getBuffer();
    const compressed = deflateSync(buffer);
    data.setBuffer(compressed);
  }

  public read(data: BitStream) {
    this.decompress(data);
    this.xorData(data);

    this.stateOrder = [];

    let stop = false;
    while (data.getReadBytesAvailable() > 0 && !stop) {
      let state: number = data.ReadBits(3);
      this.stateOrder.push(state);
      switch (state) {
        case 1:
          this.readInputs(data);
          break;
        case 2:
          stop = true;
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
          throw new Error("Unknown replay read state: " + state);
      }
    }
  }

  public write(stream?: BitStream): Buffer {
    if (stream) {
      this.xorData(stream);
      this.compress(stream);

      return stream.getBuffer();
    }

    // TODO: dynamically resize
    const data = new BitStream(Buffer.alloc(1024 * 512));

    let stop = false;
    for (let state of this.stateOrder) {
      data.WriteBits(state, 3);

      switch (state) {
        case 1:
          this.writeInputs(data);
          break;
        case 2:
          stop = true;
          break;
        case 3:
          this.writeHeader(data);
          break;
        case 4:
          this.writePlayerData(data);
          break;
        case 6:
          this.writeResults(data);
          break;
        case 5:
        case 7:
          this.writeFaces(data, state == 5);
          break;
        default:
          throw new Error("Unknown replay write state: " + state);
      }

      if (stop) break;
    }

    data.shrink();

    this.xorData(data);
    this.compress(data);

    return data.getBuffer();
  }

  public static ReadReplay(data: Buffer): ReplayData {
    const replay = new ReplayData();
    replay.read(new BitStream(data));
    return replay;
  }
}
