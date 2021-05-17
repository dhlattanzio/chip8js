const _chip8Sprites = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
  ];

class Cpu {
    constructor() {
        this.mem = new Array(4096);
        this.v = new Uint8Array(16).fill(0);
        this.i = 0;
        this.pc = 0x200;
        this.sp = 0;
        this.stack = new Uint16Array(16).fill(0);
        this.loopId = -1;
        this.dt = 0;
        this.st = 0;
        this.paused = -1;
        this.speed = 10;

        this.display = null;
        this.keyboard = null;
        this.audio = null;
        this.keystatus = new Array().fill(false);

        // load sprites in memory
        for(let i=0;i<_chip8Sprites.length;i++) {
            this.mem[i] = _chip8Sprites[i];
        }
    }

    setDisplay = (display) => {
        this.display = display;
    }

    setKeyboard = (keyboard) => {
        this.keyboard = keyboard;
        this.keyboard.listener = this.onKeyEvent;
    }

    setAudio = (audio) => {
        this.audio = audio;
    }

    onKeyEvent = (keycode, pressed) => {
        if (this.keystatus[keycode] == pressed) return;
        this.keystatus[keycode] = pressed;
        if (this.paused >= 0 && pressed) {
            this.v[this.paused] = keycode;
            this.paused = -1;
        }
    }

    loadProgram = (program) => {
        for(let i=0;i<program.length;i++) {
            this.mem[0x200 + i] = program[i];
        }
    }

    isActive = () => {
        return this.loopId != -1;
    }

    run = () => {
        if (!this.isActive()) {
            this.loopId = setInterval(this.update, 1000/60);
        }
    }

    stop = () => {
        if (this.isActive()) {
            clearInterval(this.loopId);
            this.loopId = -1;
        }
    }

    reset = () => {
        this.v.fill(0);
        this.i = 0;
        this.pc = 0x200;
        this.sp = 0;
        this.dt = 0;
        this.st = 0;
        this.paused = -1;
        this.keystatus.fill(false);
        this.display.clear();
        this.stopTone();
    }

    tone = () => {
        this.audio.play();
    }

    stopTone = () => {
        this.audio.stop();
    }

    perform = (opcode) => {
        const op = opcode >> 12;
        const nnn = opcode & 0xFFF;
        const n = opcode & 0xF;
        const x = (opcode & 0xF00) >> 8;
        const y = (opcode & 0xF0) >> 4;
        const kk = opcode & 0xFF;

        let tmp;
        switch(op) {
            case 0x0:
                if (opcode == 0xE0) {
                    // Clear the display.
                    this.display.clear();
                } else if (opcode == 0xEE) {
                    // Return from a subroutine.
                    this.sp--;
                    this.pc = this.stack[this.sp];
                }
                break;
            case 0x1:
                // Jump to location nnn.
                this.pc = nnn;
                break;
            case 0x2:
                // Call subroutine at nnn.
                this.sp++;
                this.stack[this.sp-1] = this.pc;
                this.pc = nnn;
                break;
            case 0x3:
                // Skip next instruction if Vx = kk.
                if (this.v[x] == kk) {
                    this.pc += 2;
                }
                break;
            case 0x4:
                // Skip next instruction if Vx != kk.
                if (this.v[x] != kk) {
                    this.pc += 2;
                }
                break;
            case 0x5:
                // Skip next instruction if Vx = Vy.
                if (this.v[x] == this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6:
                // Set Vx = kk.
                this.v[x] = kk;
                break;
            case 0x7:
                // Set Vx = Vx + kk.
                this.v[x] = this.v[x] + kk;
                break;
            case 0x8:
                switch(n) {
                    case 0x0:
                        // Set Vx = Vy.
                        this.v[x] = this.v[y];
                        break;
                    case 0x1:
                        // Set Vx = Vx OR Vy.
                        this.v[x] = this.v[x] | this.v[y];
                        break;
                    case 0x2:
                        // Set Vx = Vx AND Vy.
                        this.v[x] = this.v[x] & this.v[y];
                        break;
                    case 0x3:
                        // Set Vx = Vx XOR Vy.
                        this.v[x] = this.v[x] ^ this.v[y];
                        break;
                    case 0x4:
                        // Set Vx = Vx + Vy, set VF = carry.
                        tmp = this.v[x] + this.v[y];
                        this.v[0xF] = tmp > 255 ? 1 : 0;
                        this.v[x] = tmp & 0xFF;
                        break;
                    case 0x5:
                        // Set Vx = Vx - Vy, set VF = NOT borrow.
                        this.v[0xF] = this.v[x] >= this.v[y] ? 1 : 0;
                        this.v[x] = this.v[x] - this.v[y];
                        break;
                    case 0x6:
                        // Set Vx = Vx SHR 1.
                        this.v[0xF] = this.v[x] & 1;
                        this.v[x] = this.v[x] >> 1;
                        break;
                    case 0x7:
                        // Set Vx = Vy - Vx, set VF = NOT borrow.
                        this.v[0xF] = this.v[y] >= this.v[x] ? 1 : 0;
                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    case 0xE:
                        // Set Vx = Vx SHL 1.
                        this.v[0xF] = this.v[x] >> 7;
                        this.v[x] = this.v[x] << 1;
                        break
                }
                break;
            case 0x9:
                // Skip next instruction if Vx != Vy.
                if (this.v[x] != this.v[y]) this.pc += 2;
                break;
            case 0xA:
                // Set I = nnn.
                this.i = nnn;
                break;
            case 0xB:
                // Jump to location nnn + V0.
                this.pc = nnn + this.v[0];
                break;
            case 0xC:
                // Set Vx = random byte AND kk.
                this.v[x] = Math.floor(Math.random() * 256) & kk;
                break;
            case 0xD:
                // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
                let sprite = this.mem.slice(this.i, this.i + n);
                const anyPixelErased = this.display.draw(sprite, this.v[x], this.v[y]);
                this.v[0xF] = anyPixelErased ? 1 : 0;
                break;
            case 0xE:
                if (kk == 0x9E) {
                    // Skip next instruction if key with the value of Vx is pressed.
                    if (this.keystatus[this.v[x]]) this.pc += 2;
                } else if (kk == 0xA1) {
                    // Skip next instruction if key with the value of Vx is not pressed.
                    if (!this.keystatus[this.v[x]]) this.pc += 2;
                }
                break;
            case 0xF:
                switch(kk) {
                    case 0x07:
                        // Set Vx = delay timer value.
                        this.v[x] = this.dt;
                        break;
                    case 0x0A:
                        // Wait for a key press, store the value of the key in Vx.
                        this.paused = x;
                        break;
                    case 0x15:
                        // Set delay timer = Vx.
                        this.dt = this.v[x];
                        break;
                    case 0x18:
                        // Set sound timer = Vx.
                        this.st = this.v[x];
                        break;
                    case 0x1E:
                        // Set I = I + Vx.
                        this.i = (this.i + this.v[x]) & 0xFFFF;
                        break;
                    case 0x29:
                        // Set I = location of sprite for digit Vx.
                        this.i = this.v[x] * 5;
                        break;
                    case 0x33:
                        // Store BCD representation of Vx in memory locations I, I+1, and I+2.
                        tmp = this.v[x];
                        const hundreds = Math.floor(tmp / 100);
                        const tens = Math.floor(tmp % 100 / 10);
                        const ones = tmp % 10;
                        this.mem[this.i] = hundreds;
                        this.mem[this.i + 1] = tens;
                        this.mem[this.i + 2] = ones;
                        break;
                    case 0x55:
                        // Store registers V0 through Vx in memory starting at location I.
                        for(let i=0;i<=x;i++) {
                            this.mem[this.i + i] = this.v[i];
                        }
                        break;
                    case 0x65:
                        // Read registers V0 through Vx from memory starting at location I.
                        for(let i=0;i<=x;i++) {
                            this.v[i] = this.mem[this.i + i];
                        }
                        break;
                }
                break;
        }
    }

    step = () => {
        const opcode = (this.mem[this.pc] << 8) + this.mem[this.pc + 1];
        this.pc += 2;
        this.perform(opcode);
    }

    update = () => {
        if (this.paused >= 0) {
            this.stopTone()
            return;
        }

        if (this.dt > 0) {
            this.dt--;
        }
        if (this.st > 0) {
            this.st--;
            this.tone();
        } else {
            this.stopTone()
        }

        for(let i=0;i<this.speed;i++) {
            this.step();
            if (this.paused >= 0) return;
        }
    }
}