import { Serial } from "./serial.js";

export class Gemini extends Serial {
  constructor(machine) {
    super(machine);
    // prettier-ignore
    this.STENO_KEY_MAP = ["Fn", "#", "#", "#", "#", "#", "#", //
                            "S-", "S-", "T-", "K-", "P-", "W-", "H-", //
                            "R-", "A", "O", "*", "*", "res1", "res2", //
                            "pwr", "*", "*", "E", "U", "-F", "-R", //
                            "-P", "-B", "-L", "-G", "-T", "-S", "-D", //
                            "#", "#", "#", "#", "#", "#", "-Z"];
  }

  handle_packet(packet) {
    //handle broken packets
    if (!(packet[0] & 128)) {
      console.log("broken packet");
      return;
    }

    //handle good packet
    let steno_keys = [];
    packet.forEach((byte, i) => {
      for (let j = 1; j < 8; j++) {
        if (byte & (128 >> j)) {
          steno_keys.push(this.STENO_KEY_MAP[i * 7 + j - 1]);
        }
      }
    });

    // return
    return steno_keys;
  }
}
