// Static BR Code: EMV TLV fields and CRC16-CCITT-FALSE.
export function pixPayload(key: string, amount?: number): string {
  const field = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;
  const account = field("00", "br.gov.bcb.pix") + field("01", key);
  const value = Number.isFinite(amount) && amount! > 0 ? field("54", amount!.toFixed(2)) : "";
  const payload = field("00", "01") + field("26", account) + field("52", "0000") + field("53", "986") + value + field("58", "BR") + field("59", "TIFFANY") + field("60", "CANOAS") + field("62", field("05", "***")) + "6304";
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(payload)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
}
