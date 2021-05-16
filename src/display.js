class Display {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pixels = new Array(width * height);
        this.pixelChanged = (x, y, active) => {};
        this.clear();
    }

    clear() {
        this.pixels.fill(0);
    }

    draw(sprite, x, y) {
        let erased = false;
        for(let i=0;i<sprite.length;i++) {
            let line = sprite[i];
            for(let j=0;j<8;j++) {
                const pixel = (line & 0x80) >> 7;
                const px = (x + j) % this.width;
                const py = (y + i) % this.height;
                const index = (py * this.width) + px
                if(pixel && this.pixels[index]) erased=true;
                this.pixels[index] ^= pixel;
                this.pixelChanged(px, py, this.pixels[index]);
                line = line << 1;
            }
        }

        return erased;
    }
}