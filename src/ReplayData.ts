import { inflateSync } from "zlib";
import { BitStream } from "./BitStream";

const XOR_KEY = [107, 16, 222, 60, 68, 75, 209, 70, 160, 16, 82, 193, 178, 49, 211, 106, 251, 172, 17, 222, 6, 104, 8, 120, 140, 213, 179, 249, 106, 64, 214, 19, 12, 174, 157, 197, 212, 107, 84, 114, 252, 87, 93, 26, 6, 115, 194, 81, 75, 176, 201, 140, 120, 4, 17, 122, 239, 116, 62, 70, 57, 160, 199, 166];

export class ReplayData {

  public randomSeed: number = -1;
  public version: number = -1;
  public playlistId: number = -1;
  public playlistName?: string;
  public onlineGame: boolean = false;

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

    while (data.getReadBytesAvailable() > 0) {
      let state: number = data.ReadBits(3);

      console.log(state);

      switch (state) {
        case 3:
          this.readHeader(data);
          break;
      }

      break;
    }
  }

  public static ReadReplay(data: BitStream): ReplayData {
    const replay = new ReplayData();
    replay.read(data);
    return replay;
  }
}