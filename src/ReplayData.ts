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

export class ReplayData {

  public randomSeed: number = -1;
  public version: number = -1;
  public playlistId: number = -1;
  public playlistName?: string;
  public onlineGame: boolean = false;

  public gameSettings?: GameSettings;
  public levelId: number = -1;

  public heroCount: number = -1; // the number of heroes each player has.
  public entities: Entity[] = [];

  public readHeader(data: BitStream) {
    this.randomSeed = data.ReadInt();
    this.version = data.ReadInt();
    this.playlistId = data.ReadInt();

    if (this.playlistId != 0) {
      this.playlistName = data.ReadString();
    }

    this.onlineGame = data.ReadBoolean();
  }

  xorData(data: BitStream) {
    const buffer = data.getBuffer();
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= XOR_KEY[i % XOR_KEY.length];
    }
  }

  decompress(data: BitStream) {
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
        case 3:
          this.readHeader(data);
          break;
        case 4:
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

          data.ReadShort(); // used in checksum

          break;
        default:
          console.log("Unknown state: " + state);
          stop = true;
          break;
      }
    }
  }

  public static ReadReplay(data: BitStream): ReplayData {
    const replay = new ReplayData();
    replay.read(data);
    return replay;
  }
}