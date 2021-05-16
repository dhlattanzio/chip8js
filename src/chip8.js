class Chip8 {
    constructor() {
        this.cpu = new Cpu();
        this.cpu.setDisplay(new Display(64, 32))
        this.cpu.setKeyboard(new Keyboard());

        document.addEventListener('keydown', (event) => {
            this.cpu.keyboard.pressed(event.key.toUpperCase());
        })
        document.addEventListener('keyup', (event) => {
            this.cpu.keyboard.released(event.key.toUpperCase());
        })
    }

    loadProgram = (program) => {
        this.reset();
        this.cpu.loadProgram(program);
    }

    run = () => {
        this.cpu.run();
    }

    stop = () => {
        this.cpu.stop();
    }

    reset = () => {
        this.cpu.reset();
    }

    getDisplay = () => {
        return this.cpu.display;
    }

    getKeyboard = () => {
        return this.cpu.keyboard;
    }
}