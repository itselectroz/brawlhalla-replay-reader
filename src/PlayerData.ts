import { BitStream } from "./BitStream";
import { HeroData } from "./HeroData";

export class PlayerData {
  public colourId: number = -1;
  public spawnBotId: number = -1;
  public emitterId: number = -1;
  public playerThemeId: number = -1;
  public taunts: number[] = [];
  public winTaunt: number = -1;
  public loseTaunt: number = -1;
  public unknown1: number[] = [];
  public avatarId: number = -1;
  public team: number = -1;
  public unknown2: number = -1; // probably player number or something
  public heroes: HeroData[] = [];
  public bot: boolean = false;

  read(data: BitStream, heroCount: number) {
    this.colourId = data.ReadInt();
    this.spawnBotId = data.ReadInt();
    this.emitterId = data.ReadInt();
    this.playerThemeId = data.ReadInt();

    this.taunts = [];
    for(let i = 0; i < 8; i++) {
      this.taunts.push(data.ReadInt());
    }

    this.winTaunt = data.ReadShort();
    this.loseTaunt = data.ReadShort();

    this.unknown1 = [];
    while (data.ReadBoolean()) {
      this.unknown1.push(data.ReadInt());
    }

    this.avatarId = data.ReadShort();
    this.team = data.ReadInt();
    this.unknown2 = data.ReadInt();

    this.heroes = [];
    for (let i = 0; i < heroCount; i++) {
      this.heroes.push(HeroData.read(data));
    }

    this.bot = data.ReadBoolean();
  
    // wasn't in the game @ v6.03, probably new to v6.05 but not gonna check rn
    if (data.ReadBoolean()) {
      data.ReadInt();
      data.ReadInt();
      data.ReadInt();
    }
  }

  write(data: BitStream) {
    
  }

  static read(data: BitStream, heroCount: number): PlayerData {
    const playerData = new PlayerData();
    playerData.read(data, heroCount);
    return playerData;
  }
}