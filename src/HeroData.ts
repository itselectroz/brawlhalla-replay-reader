import { BitStream } from "./BitStream";

export class HeroData {
  public heroId: number = -1;
  public costumeId: number = -1;
  public stance: number = -1;
  public weaponSkins: number = -1;

  read(data: BitStream) {
    this.heroId = data.ReadInt();
    this.costumeId = data.ReadInt();  
    this.stance = data.ReadInt();
    this.weaponSkins = data.ReadInt(); // split into one high field and one low field (16 bits each)
  }

  write(data: BitStream) {
    data.WriteInt(this.heroId);
    data.WriteInt(this.costumeId);
    data.WriteInt(this.stance);
    data.WriteInt(this.weaponSkins);
  }

  static read(data: BitStream): HeroData {
    const heroData = new HeroData();
    heroData.read(data);
    return heroData;
  }
}