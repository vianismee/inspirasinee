/**
 * Menghasilkan checksum CRC16 dari sebuah string.
 * @param str String yang akan dihitung checksum-nya.
 * @returns Checksum CRC16 dalam format heksadesimal 4 digit.
 */
const crc16 = (str: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
};

/**
 * Menghasilkan kode QRIS dinamis dari kode QRIS statis dan nominal tertentu.
 * @param staticQris String kode QRIS statis.
 * @param amount Nominal transaksi.
 * @returns String kode QRIS dinamis.
 * @throws Error jika format QRIS tidak valid.
 */
export const generateQRIS = (staticQris: string, amount: number): string => {
  const qrisWithoutCrc = staticQris.substring(0, staticQris.length - 4);
  const step1 = qrisWithoutCrc.replace("010211", "010212");
  const parts = step1.split("5802ID");
  if (parts.length !== 2) {
    throw new Error("Format QRIS tidak valid");
  }
  const amountStr = String(Math.trunc(amount));
  const lengthStr = String(amountStr.length).padStart(2, "0");
  const amountTag = `54${lengthStr}${amountStr}`;
  const payload = `${parts[0]}${amountTag}5802ID${parts[1]}`;
  const newCrc = crc16(payload);
  return payload + newCrc;
};
