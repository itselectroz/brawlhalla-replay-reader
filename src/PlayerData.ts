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
  public ownedTaunts: number[] = []; // not a list of ids, it's some weird bit field thing
  public avatarId: number = -1;
  public team: number = -1;
  public unknown2: number = -1; // probably player number or something
  public heroes: HeroData[] = [];
  public bot: boolean = false;

  // Not reversed by me
  public handicapsEnabled: boolean = false;
  public handicapStockCount: number = 3;
  public handicapDamageDoneMultiplier = 1;
  public handicapDamageTakenMultiplier = 1;

  read(data: BitStream, heroCount: number) {
    this.colourId = data.ReadInt();
    this.spawnBotId = data.ReadInt();
    this.emitterId = data.ReadInt();
    this.playerThemeId = data.ReadInt();

    this.taunts = [];
    for (let i = 0; i < 8; i++) {
      this.taunts.push(data.ReadInt());
    }

    this.winTaunt = data.ReadShort();
    this.loseTaunt = data.ReadShort();

    this.ownedTaunts = []; // This is an educated guess
    while (data.ReadBoolean()) {
      this.ownedTaunts.push(data.ReadInt());
    }

    this.avatarId = data.ReadShort();
    this.team = data.ReadInt();
    this.unknown2 = data.ReadInt();

    this.heroes = [];
    for (let i = 0; i < heroCount; i++) {
      this.heroes.push(HeroData.read(data));
    }

    this.bot = data.ReadBoolean();

    this.handicapsEnabled = data.ReadBoolean();

    if (this.handicapsEnabled) {
      this.handicapStockCount = data.ReadInt();
      this.handicapDamageDoneMultiplier = data.ReadInt();
      this.handicapDamageTakenMultiplier = data.ReadInt();
    }
  }

  write(data: BitStream, heroCount: number) {
    data.WriteInt(this.colourId);
    data.WriteInt(this.spawnBotId);
    data.WriteInt(this.emitterId);
    data.WriteInt(this.playerThemeId);

    if (this.taunts.length != 8) throw new Error("Invalid number of taunts");
    for (let i = 0; i < 8; i++) {
      data.WriteInt(this.taunts[i]);
    }

    data.WriteShort(this.winTaunt);
    data.WriteShort(this.loseTaunt);

    for (let ownedTaunt of this.ownedTaunts) {
      data.WriteBoolean(true);
      data.WriteInt(ownedTaunt);
    }
    data.WriteBoolean(false);

    data.WriteShort(this.avatarId);
    data.WriteInt(this.team);
    data.WriteInt(this.unknown2);

    if (this.heroes.length != heroCount)
      throw new Error("Invalid number of heroes");
    for (let hero of this.heroes) {
      hero.write(data);
    }

    data.WriteBoolean(this.bot);

    data.WriteBoolean(this.handicapsEnabled);

    if (this.handicapsEnabled) {
      data.WriteInt(this.handicapStockCount);
      data.WriteInt(this.handicapDamageDoneMultiplier);
      data.WriteInt(this.handicapDamageTakenMultiplier);
    }
  }

  public calcChecksum(): number {
    let checksum = 0;
    checksum += this.colourId * 5;
    checksum += this.spawnBotId * 93;
    checksum += this.emitterId * 97;
    checksum += this.playerThemeId * 53;

    for (let i = 0; i < this.taunts.length; i++) {
      checksum += this.taunts[i] * (13 + i);
    }

    checksum += this.winTaunt * 37;
    checksum += this.loseTaunt * 41;

    for (let i = 0; i < this.ownedTaunts.length; i++) {
      // I think this calculates the number of owned taunts... but I have no idea
      let taunt = this.ownedTaunts[i];
      taunt -= (taunt >> 1) & 1431655765;
      taunt = (taunt & 858993459) + ((taunt >> 2) & 858993459);
      taunt = (((taunt + (taunt >> 4)) & 252645135) * 16843009) >> 24;

      checksum += taunt * (11 + i);
    }

    checksum += this.team * 43;

    for (let i = 0; i < this.heroes.length; i++) {
      const hero = this.heroes[i];

      checksum += hero.heroId * (17 + i);
      checksum += hero.costumeId * (7 + i);
      checksum += hero.stance * (3 + i);
      checksum += hero.weaponSkins * (2 + i);
    }

    /*
    this.handicapsEnabled = data.ReadBoolean();

    if (this.handicapsEnabled) {
      this.handicapStockCount = data.ReadInt();
      this.handicapDamageDoneMultiplier = data.ReadInt();
      this.handicapDamageTakenMultiplier = data.ReadInt();
    }
    */

    if (!this.handicapsEnabled) {
      checksum += 29;
    } else {
      checksum += this.handicapStockCount * 31;
      checksum += Math.round(this.handicapDamageDoneMultiplier / 10) * 3;
      checksum += Math.round(this.handicapDamageTakenMultiplier / 10) * 23;
    }

    return checksum;
  }

  static read(data: BitStream, heroCount: number): PlayerData {
    const playerData = new PlayerData();
    playerData.read(data, heroCount);
    return playerData;
  }
}
