class Keyboard {
    constructor() {
        this.listener = () => {}
        this.keysmap = {
            "1": 0x1, "2": 0x2, "3": 0x3, "4": 0xC,
            "Q": 0x4, "W": 0x5, "E": 0x6, "R": 0xD,
            "A": 0x7, "S": 0x8, "D": 0x9, "F": 0xE,
            "Z": 0xA, "X": 0x0, "C": 0xB, "V": 0xF
        };
    }

    setKeyMap = (localKeycode, cpuKeycode) => {
        this.keysmap[localKeycode] = cpuKeycode;
    }

    isValid = (localKeycode) => {
        return localKeycode in this.keysmap;
    }

    pressed = (localKeycode) => {
        if (this.isValid(localKeycode)) {
            this.listener(this.keysmap[localKeycode], true);
        }
    }

    released = (localKeycode) => {
        if (this.isValid(localKeycode)) {
            this.listener(this.keysmap[localKeycode], false);
        }
    }
}