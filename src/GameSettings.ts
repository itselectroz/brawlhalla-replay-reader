import { BitStream } from "./BitStream";

export class GameSettings {
  flags: number = -1;
  maxPlayers: number = -1;
  duration: number = -1;
  roundDuration: number = -1;
  startingLives: number = -1;
  scoringType: number = -1;
  scoreToWin: number = -1;
  gameSpeed: number = -1;
  damageRatio: number = -1;
  levelSetID: number = -1;

  read(data: BitStream) {
    this.flags = data.ReadInt();
    this.maxPlayers = data.ReadInt();
    this.duration = data.ReadInt();
    this.roundDuration = data.ReadInt();
    this.startingLives = data.ReadInt();
    this.scoringType = data.ReadInt();
    this.scoreToWin = data.ReadInt();
    this.gameSpeed = data.ReadInt();
    this.damageRatio = data.ReadInt();
    this.levelSetID = data.ReadInt();
  }

  write(data: BitStream) {
    data.WriteInt(this.flags);
    data.WriteInt(this.maxPlayers);
    data.WriteInt(this.duration);
    data.WriteInt(this.roundDuration);
    data.WriteInt(this.startingLives);
    data.WriteInt(this.scoringType);
    data.WriteInt(this.scoreToWin);
    data.WriteInt(this.gameSpeed);
    data.WriteInt(this.damageRatio);
    data.WriteInt(this.levelSetID);
  }

  static read(data: BitStream): GameSettings {
    const settings = new GameSettings();
    settings.read(data);
    return settings;
  }
}