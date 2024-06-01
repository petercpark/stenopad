import { Gemini } from "./machine/gemini.js";

export class Machine {
  constructor() {
    this.listeners = [];
    this.protocol = new Gemini();

    this.port = null;
    this.reader = null;
    this.connect_button = document.getElementById("connect-button");
    this.connect_button.addEventListener("click", this.connect.bind(this));
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(steno_keys) {
    this.listeners.forEach((callback) => callback(steno_keys));
  }

  async connect() {
    try {
      // If there is an existing connection, close it
      if (this.currentPort && this.currentPort.readable) {
        await this.disconnect();
        this.connect_button.textContent = "Connect";
      }
      // Request access to the serial port
      this.currentPort = await navigator.serial.requestPort();

      // Open the serial port
      await this.currentPort.open({ baudRate: 9600 }); // Adjust the baud rate as needed

      console.log("Connected to serial device.");
      //read port
      if (this.currentPort.readable) {
        console.log(this.currentPort.readable);
        this.reader = this.currentPort.readable.getReader();
        this.connect_button.textContent = "Connected";
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
              // |this.reader| has been canceled.
              this.connect_button.textContent = "Connect";
              break;
            }
            // Handle |packet|…
            if (value) {
              try {
                let steno_keys = this.protocol.handle_packet(value);
                if (steno_keys) {
                  this.notifyListeners(steno_keys);
                }
              } catch (error) {
                console.error("Error:", error);
              }
            }
          }
        } catch (error) {
          this.connect_button.textContent = "Connect";
          console.error("Error:", error);
        } finally {
          this.reader.releaseLock();
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async disconnect() {
    await this.reader.cancel();
    await this.currentPort.close();
    this.currentPort = null;
    console.log("Disconnected from serial device.");
  }
}
