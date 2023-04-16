const MASKS = [
  0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767,
  65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215,
  33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647,
  -1,
];

export class BitStream {
  private data: Buffer;
  private readOffset: number = 0;
  private writeOffset: number = 0;

  constructor(data?: Buffer) {
    this.data = data || Buffer.alloc(0);
    this.readOffset = 0;
    this.writeOffset = 0;
  }

  public getBuffer() {
    return this.data;
  }

  public setBuffer(data: Buffer) {
    this.data = data;
  }

  public setReadOffset(offset: number) {
    this.readOffset = offset;
  }

  public setWriteOffset(offset: number) {
    this.writeOffset = offset;
  }

  public getReadBytesAvailable() {
    return (this.data.length * 8 - this.readOffset) >>> 3;
  }

  public getWriteBytesAvailable() {
    return (this.data.length * 8 - this.writeOffset) >>> 3;
  }

  public shrink() {
    this.data = this.data.slice(0, Math.ceil(this.writeOffset / 8) + 1);
  }

  public ReadBits(count: number): number {
    let result = 0;

    while (count != 0) {
      if (this.readOffset >= this.data.length * 8)
        throw new Error("End of stream reached");

      const byte = this.data[this.readOffset >> 3];
      const bit = this.readOffset & 7;
      const remainingBits = 8 - bit;
      const bitsToRead = count < remainingBits ? count : remainingBits;

      const mask = MASKS[remainingBits];

      const value = (byte & mask) >>> (remainingBits - bitsToRead);
      result |= value << (count - bitsToRead);
      count -= bitsToRead;
      this.readOffset += bitsToRead;
    }

    return result;
  }

  public ReadByte(): number {
    return this.ReadBits(8);
  }

  public ReadByteList(count: number): Buffer {
    const result = Buffer.alloc(count);

    for (let i = 0; i < count; i++) {
      result[i] = this.ReadByte();
    }

    return result;
  }

  public ReadChar(): string {
    return String.fromCharCode(this.ReadByte());
  }

  public ReadShort(): number {
    return this.ReadBits(16);
  }

  public ReadInt(): number {
    return this.ReadBits(32);
  }

  public ReadFloat(): number {
    const buffer = Buffer.from([this.ReadBits(32)]);
    return buffer.readFloatBE(0);
  }

  public ReadString(): string {
    const length = this.ReadShort();
    return this.ReadByteList(length).toString("utf-8");
  }

  public ReadBoolean(): boolean {
    return this.ReadBits(1) != 0;
  }

  public WriteBits(value: number, count: number) {
    while (count > 0) {
      const byteOffset = this.writeOffset >>> 3;
      const bitOffset = this.writeOffset & 7;

      const bitsRemaining = 8 - bitOffset;

      let bitsToWrite;
      if (count < bitsRemaining) {
        bitsToWrite = count;
      } else {
        bitsToWrite = bitsRemaining;
      }

      const bits = (value & MASKS[count]) >>> (count - bitsToWrite);
      const wipeMask = MASKS[count] >>> (count - bitsToWrite);
      this.data[byteOffset] &= ~(wipeMask << (bitsRemaining - bitsToWrite));
      this.data[byteOffset] |= bits << (bitsRemaining - bitsToWrite);

      count -= bitsToWrite;
      this.writeOffset += bitsToWrite;
    }
  }

  public WriteByte(value: number) {
    this.WriteBits(value, 8);
  }

  public WriteByteList(value: Buffer) {
    for (let i = 0; i < value.length; i++) {
      this.WriteByte(value[i]);
    }
  }

  public WriteChar(value: string) {
    this.WriteByte(value.charCodeAt(0));
  }

  public WriteShort(value: number) {
    this.WriteBits(value, 16);
  }

  public WriteInt(value: number) {
    this.WriteBits(value, 32);
  }

  public WriteFloat(value: number) {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatBE(value, 0);
    this.WriteByteList(buffer);
  }

  public WriteString(value: string) {
    const buffer = Buffer.from(value, "utf-8");
    this.WriteShort(buffer.length);
    this.WriteByteList(buffer);
  }

  public WriteBoolean(value: boolean) {
    this.WriteBits(value ? 1 : 0, 1);
  }
}
