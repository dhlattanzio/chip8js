class Audio {
    constructor() {
        this.context = new AudioContext();
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = "triangle";
        this.oscillator.start(0);

        this.playing = false;
    }

    play = () => {
        if (this.playing) return;
        this.oscillator.connect(this.context.destination);
        this.playing = true;
    }

    stop = () => {
        if (!this.playing) return;
        this.oscillator.disconnect(this.context.destination);
        this.playing = false;
    }
}