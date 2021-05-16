const expect = chai.expect;

describe("#Chip-8", () => {
    let chip8;
    let cpu;

    beforeEach(() => {
        chip8 = new Chip8();
        cpu = chip8.cpu;
        cpu.speed = 1;
    });

    it("has a cpu", () => {
        expect(chip8).to.have.property("cpu");
    });

    it("has a memory", () => {
        expect(chip8.cpu).to.have.property("mem");
    });

    it("has a display", () => {
        expect(cpu).to.have.property("display");
    });

    it("has a keyboard", () => {
        expect(chip8.cpu).to.have.property("keyboard");
    });

    describe("#Memory", () => {
        it("ram size is 4096 bytes", () => {
            expect(cpu.mem).to.have.lengthOf(4096);
        });
    
        it("pc start at location 0x200", () => {
            expect(cpu.pc).to.equal(0x200);
        });

        it("has a group of sprites (5 bytes long) representing the hexadecimal digits store in 0x000 to 0x1FF", () => {
            expect(cpu.mem[0]).to.equal(0xF0);
            expect(cpu.mem[16*5-1]).to.equal(0x80);
        });
    });

    describe("#Registers", () => {
        it("has 16 general purpose 8-bit registers (Vx)", () => {
            expect(cpu).to.have.property("v");
            expect(cpu.v).to.have.lengthOf(16);
        });

        it("has a 16-bit register (I) used to store memory address", () => {
            expect(cpu).to.have.property("i");
        });

        it("has two special purpose 8-bit register, for the delay and sound timers", () => {
            expect(cpu).to.have.property("dt");
            expect(cpu).to.have.property("st");
        });

        it("has a 16-bit program counter register (PC)", () => {
            expect(cpu).to.have.property("pc");
        });

        it("has a 8-bit stack pointer register (SP)", () => {
            expect(cpu).to.have.property("sp");
        });
        
        it("has a stack array of 16 16-bit values", () => {
            expect(cpu).to.have.property("stack");
            expect(cpu.stack).to.have.lengthOf(16);
        });
    });

    describe("#Keyboard", () => {
        it("has a 16-key hexadecimal keypad", () => {
            expect(Object.keys(cpu.keyboard.keysmap)).to.have.lengthOf(16);
        });
    });

    describe("#Display", () => {
        let display;
        beforeEach(() => {
            display = cpu.display;
        });

        it("has a 64x32-pixel display", () => {
            expect(display).to.have.property("pixels");
            expect(display.pixels).to.have.lengthOf(64*32);
        });
    })

    describe("#Timers & Sound", () => {
        context("delay timer", () => {
            it("subtract 1 from the value of DT", () => {
                cpu.dt = 10;
                cpu.update();
                cpu.update();
                cpu.update();
                expect(cpu.dt).to.equal(7);
            })

            it("when DT reaches 0, the delay timer deactivates", () => {
                cpu.dt = 1;
                cpu.update();
                expect(cpu.dt).to.equal(0);
                cpu.update();
                expect(cpu.dt).to.equal(0);
            });

            it("does nothing if paused", () => {
                cpu.dt = 10;
                cpu.paused = 1;
                cpu.update();
                cpu.update();
                expect(cpu.dt).to.equal(10);
            });
        })

        context("sound timer", () => {
            it("subtract 1 from the value of ST", () => {
                cpu.st = 10;
                cpu.update();
                cpu.update();
                cpu.update();
                expect(cpu.st).to.equal(7);
            })

            it("when ST reaches zero, the sound timer deactivates.", () => {
                cpu.st = 1;
                cpu.update();
                expect(cpu.st).to.equal(0);
                cpu.update();
                expect(cpu.st).to.equal(0);
            });

            it("play tone", (done) => {
                cpu.st = 10;
                cpu.tone = done;
                cpu.update();
            })

            it("does nothing if paused", () => {
                cpu.st = 10;
                cpu.paused = 1;
                cpu.update();
                cpu.update();
                expect(cpu.st).to.equal(10);
            });
        })
    });

    describe("#OpCodes", () => {
        context("00E0 - CLS", () => {
            it("clear the display", () => {
                cpu.display.pixels.fill(1);
            cpu.perform(0x00E0);
            expect(cpu.display.pixels).to.satisfy(nums => nums.every(n => n==0));
            });
        });

        context("00EE - RET", () => {
            it("sets the program counter to the address at the top of the stack", () => {
                cpu.sp = 3;
                cpu.stack = [50, 300, 500];
                cpu.perform(0x00EE);
                expect(cpu.pc).to.equal(500);
            });
        });

        context("1nnn - JP addr", () => {
            it("sets the program counter to nnn", () => {
                cpu.perform(0x100F);
                expect(cpu.pc).to.equal(0xF);
            });
        });

        context("2nnn - CALL addr", () => {
            beforeEach(() => {
                cpu.pc = 1000;
                cpu.stack = new Uint16Array(16).fill(0);
                cpu.sp = 0;
                cpu.perform(0x200F);
            });

            it("increments the stack pointer", () => {
                expect(cpu.sp).to.equal(1);
            });

            it("puts the current PC on the top of the stack", () => {
                expect(cpu.stack[cpu.sp-1]).to.equal(1000);
            });

            it("set PC to nnn", () => {
                expect(cpu.pc).to.equal(0xF);
            })
        });

        context("3xkk - SE Vx, byte", () => {
            it("skip next instruction if Vx and kk are equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xFF;
                cpu.perform(0x30FF);
                expect(cpu.pc).to.equal(2);
            });

            it("don't skip next instruction if Vx and kk are not equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xFF;
                cpu.perform(0x30AA);
                expect(cpu.pc).to.equal(0);
            });
        });

        context("4xkk - SNE Vx, byte", () => {
            it("skip next instruction if Vx and kk are not equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xAA;
                cpu.perform(0x40FF);
                expect(cpu.pc).to.equal(2);
            });

            it("don't skip next instruction if Vx and kk are equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xAA;
                cpu.perform(0x40AA);
                expect(cpu.pc).to.equal(0);
            });
        });

        context("5xy0 - SE Vx, Vy", () => {
            it("skip next instruction if Vx and Vy are equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xAA;
                cpu.v[1] = 0xAA;
                cpu.perform(0x5010);
                expect(cpu.pc).to.equal(2);
            });

            it("don't skip next instruction if Vx and Vy are not equal", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xAA;
                cpu.v[1] = 0xBB;
                cpu.perform(0x5010);
                expect(cpu.pc).to.equal(0);
            });
        });

        context("6xkk - LD Vx, byte", () => {
            it("puts the value kk into register Vx", () => {
                cpu.perform(0x60FF);
                expect(cpu.v[0]).to.equal(0xFF);
            });
        });

        context("7xkk - ADD Vx, byte", () => {
            it("adds the value kk to the value of register Vx, then stores the result in Vx", () => {
                cpu.v[5] = 100;
                cpu.perform(0x7505);
                expect(cpu.v[5]).to.equal(105);
            });

            it("only keep lower 8-bit in case of overflow", () => {
                cpu.v[5] = 0xFF;
                cpu.perform(0x750A);
                expect(cpu.v[5]).to.equal(9);
            });
        });

        context("8xy0 - LD Vx, Vy", () => {
            it("stores the value of register Vy in register Vx.", () => {
                cpu.v[0] = 5;
                cpu.v[1] = 70;
                cpu.perform(0x8010);
                expect(cpu.v[0]).to.equal(70);
            });
        });

        context("8xy1 - OR Vx, Vy", () => {
            it("performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx", () => {
                cpu.v[0] = 0b01010110;
                cpu.v[1] = 0b10101001;
                cpu.perform(0x8011);
                expect(cpu.v[0]).to.equal(255);
            });
        });

        context("8xy2 - AND Vx, Vy", () => {
            it("performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx", () => {
                cpu.v[0] = 0b01100011;
                cpu.v[1] = 0b10101001;
                cpu.perform(0x8012);
                expect(cpu.v[0]).to.equal(0b00100001);
            });
        });

        context("8xy3 - XOR Vx, Vy", () => {
            it("performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx", () => {
                cpu.v[0] = 0b01100011;
                cpu.v[1] = 0b10101001;
                cpu.perform(0x8013);
                expect(cpu.v[0]).to.equal(0b11001010);
            });
        });

        context("8xy4 - ADD Vx, Vy", () => {
            it("the values of Vx and Vy are added together and stored in Vx", () => {
                cpu.v[0] = 70;
                cpu.v[1] = 30;
                cpu.perform(0x8014);
                expect(cpu.v[0]).to.equal(100);
            });

            it("VF is set to 1 if the result is greater than 8 bits (i.e., > 255,)", () => {
                cpu.v[0] = 200;
                cpu.v[1] = 200;
                cpu.v[0xF] = 0;
                cpu.perform(0x8014);
                expect(cpu.v[0xF]).to.equal(1);
            });

            it("VF is set to 0 if the result is not greater than 8 bits (i.e., > 255,)", () => {
                cpu.v[0] = 1;
                cpu.v[1] = 1;
                cpu.v[0xF] = 1;
                cpu.perform(0x8014);
                expect(cpu.v[0xF]).to.equal(0);
            });

            it("only the lowest 8 bits of the result are kept, and stored in Vx", () => {
                cpu.v[0] = 200;
                cpu.v[1] = 200;
                cpu.perform(0x8014);
                expect(cpu.v[0]).to.equal(0x90);
            });
        });

        context("8xy5 - SUB Vx, Vy", () => {
            it("Vy is subtracted from Vx, and the results stored in Vx", () => {
                cpu.v[0] = 150;
                cpu.v[1] = 100;
                cpu.perform(0x8015);
                expect(cpu.v[0]).to.equal(50);
            });

            it("if Vx > Vy, then VF is set to 1", () => {
                cpu.v[0] = 150;
                cpu.v[1] = 100;
                cpu.v[0xF] = 0;
                cpu.perform(0x8015);
                expect(cpu.v[0xF]).to.equal(1);
            });

            it("if Vx <= Vy, then VF is set to 0", () => {
                cpu.v[0] = 100;
                cpu.v[1] = 200;
                cpu.v[0xF] = 1;
                cpu.perform(0x8015);
                expect(cpu.v[0xF]).to.equal(0);
            });

            it("only the lowest 8 bits of the result are kept, and stored in Vx", () => {
                cpu.v[0] = 0;
                cpu.v[1] = 1;
                cpu.perform(0x8015);
                expect(cpu.v[0]).to.equal(0xFF);
            });
        });

        context("8xy6 - SHR Vx {, Vy}", () => {
            it("Vx is divided by 2", () => {
                cpu.v[0] = 100;
                cpu.perform(0x8016);
                expect(cpu.v[0]).to.equal(50);
            });

            it("Vx is divided by 2 and round down", () => {
                cpu.v[0] = 3;
                cpu.perform(0x8016);
                expect(cpu.v[0]).to.equal(1);
            });

            it("if the least-significant bit of Vx is 1, then VF is set to 1", () => {
                cpu.v[0] = 3;
                cpu.perform(0x8016);
                expect(cpu.v[0xF]).to.equal(1);
            });

            it("if the least-significant bit of Vx is 0, then VF is set to 0", () => {
                cpu.v[0] = 4;
                cpu.perform(0x8016);
                expect(cpu.v[0xF]).to.equal(0);
            });
        });

        context("8xy7 - SUBN Vx, Vy", () => {
            it("Vx is subtracted from Vy, and the results stored in Vx", () => {
                cpu.v[0] = 15;
                cpu.v[1] = 30;
                cpu.perform(0x8017);
                expect(cpu.v[0]).to.equal(15);
            });

            it("if Vy > Vx, then VF is set to 1", () => {
                cpu.v[0] = 15;
                cpu.v[1] = 30;
                cpu.v[0xF] = 0;
                cpu.perform(0x8017);
                expect(cpu.v[0xF]).to.equal(1);
            });

            it("if Vy <= Vx, then VF is set to 0", () => {
                cpu.v[0] = 30;
                cpu.v[1] = 15;
                cpu.v[0xF] = 1;
                cpu.perform(0x8017);
                expect(cpu.v[0xF]).to.equal(0);
            });

            it("only the lowest 8 bits of the result are kept, and stored in Vx", () => {
                cpu.v[0] = 1;
                cpu.v[1] = 0;
                cpu.perform(0x8017);
                expect(cpu.v[0]).to.equal(0xFF);
            });
        });

        context("8xyE - SHL Vx {, Vy}", () => {
            it("Vx is multiplied by 2", () => {
                cpu.v[0] = 8;
                cpu.perform(0x801E);
                expect(cpu.v[0]).to.equal(16);
            });

            it("if the most-significant bit of Vx is 1, then VF is set to 1", () => {
                cpu.v[0] = 129;
                cpu.v[0xF] = 0;
                cpu.perform(0x801E);
                expect(cpu.v[0xF]).to.equal(1);
            });

            it("if the most-significant bit of Vx is 0, then VF is set to 0", () => {
                cpu.v[0] = 64;
                cpu.v[0xF] = 1;
                cpu.perform(0x801E);
                expect(cpu.v[0xF]).to.equal(0);
            });

            it("only the lowest 8 bits of the result are kept, and stored in Vx", () => {
                cpu.v[0] = 192;
                cpu.v[0xF] = 1;
                cpu.perform(0x801E);
                expect(cpu.v[0]).to.equal(128);
            });
        });

        context("9xy0 - SNE Vx, Vy", () => {
            it("if Vx and Vy are not equal, the program counter is increased by 2", () => {
                cpu.pc = 0;
                cpu.v[0] = 11;
                cpu.v[1] = 22;
                cpu.perform(0x9010);
                expect(cpu.pc).to.equal(2);
            });

            it("if Vx and Vy are equal, do nothing", () => {
                cpu.pc = 0;
                cpu.v[0] = 33;
                cpu.v[1] = 33;
                cpu.perform(0x9010);
                expect(cpu.pc).to.equal(0);
            });
        });

        context("Annn - LD I, addr", () => {
            it("the value of register I is set to nnn", () => {
                cpu.i = 0;
                cpu.perform(0xA123);
                expect(cpu.i).to.equal(0x123);
            });
        });

        context("Bnnn - JP V0, addr", () => {
            it("the program counter is set to nnn plus the value of V0", () => {
                cpu.pc = 0;
                cpu.v[0] = 0xF;
                cpu.perform(0xBFAA);
                expect(cpu.pc).to.equal(0xFB9);
            });
        });

        context("Cxkk - RND Vx, byte", () => {
            it("generates a random number from 0 to 255 ANDed with the value kk and stored in Vx", () => {
                cpu.v[0] = 200;
                cpu.perform(0xC00A);
                expect(cpu.v[0]).to.be.at.most(0xB);
            });
        });

        context("Dxyn - DRW Vx, Vy, nibble", () => {
            beforeEach(() => {
                cpu.i = 1000;
                cpu.mem[1000] = 0xF0;
                cpu.mem[1001] = 0xF0;
                cpu.mem[1002] = 0xF0;
                cpu.mem[1003] = 0xF0;
            });

            it("draw a sprite in Vx, Vy", () => {
                cpu.v[0] = 0;
                cpu.v[1] = 0;
                cpu.perform(0xD014);

                expect(cpu.display.pixels.filter(pixel => pixel)).to.have.lengthOf(16);

                for(let i=0;i<4;i++) {
                    let index = i*cpu.display.width;
                    cpu.display.pixels.slice(index, index + 4).every(pixel => expect(pixel).to.equal(1));
                }
            });

            it("if the sprite is outside of the display, it wraps around to the opposite side of the screen", () => {
                cpu.v[0] = cpu.display.width-2;
                cpu.v[1] = cpu.display.height-1;
                cpu.perform(0xD012);

                const width = cpu.display.width;
                const height = cpu.display.height;

                expect(cpu.display.pixels[0]).to.equal(1);
                expect(cpu.display.pixels[width-1]).to.equal(1);
                expect(cpu.display.pixels[((height-1)*width)+1]).to.equal(1);
                expect(cpu.display.pixels[(height*width)-1]).to.equal(1);
            });

            it("if this causes any pixels to be erased, VF is set to 1", () => {
                cpu.v[0] = 0;
                cpu.v[1] = 0;
                cpu.v[0xF] = 0;
                cpu.perform(0xD011);
                cpu.perform(0xD011);

                expect(cpu.v[0xF]).to.equal(1);
            });

            it("if not pixels was erased, VF is set to 0", () => {
                cpu.v[0] = 0;
                cpu.v[1] = 0;
                cpu.v[0xF] = 1;
                cpu.perform(0xD011);

                cpu.v[1] = 1;
                cpu.perform(0xD011);

                expect(cpu.v[0xF]).to.equal(0);
            });
        });

        context("Ex9E - SKP Vx", () => {
            it("skip next instruction if key with the value of Vx is pressed", () => {
                cpu.pc = 0;
                cpu.v[2] = 0x5;
                cpu.keystatus[0x5] = false;
                cpu.perform(0xE29E);
                expect(cpu.pc).to.equal(0);
                
                cpu.keystatus[0x5] = true;
                cpu.perform(0xE29E);
                expect(cpu.pc).to.equal(2);
            });
        });

        context("ExA1 - SKNP Vx", () => {
            it("skip next instruction if key with the value of Vx is not pressed", () => {
                cpu.pc = 0;
                cpu.v[2] = 0x5;
                cpu.keystatus[0x5] = true;
                cpu.perform(0xE2A1);
                expect(cpu.pc).to.equal(0);
                
                cpu.keystatus[0x5] = false;
                cpu.perform(0xE2A1);
                expect(cpu.pc).to.equal(2);
            });
        });

        context("Fx07 - LD Vx, DT", () => {
            it("the value of DT is placed into Vx.", () => {
                cpu.v[0] = 11;
                cpu.dt = 55;
                cpu.perform(0xF007);
                expect(cpu.v[0]).to.equal(55);
            });
        });

        context("Fx0A - LD Vx, K", () => {
            it("all execution stops until a key is pressed, then the value of that key is stored in Vx", () => {
                cpu.pc = 1000;
                cpu.v[0] = 0;
                cpu.perform("0xF00A");
                cpu.update();
                cpu.update();
                expect(cpu.pc).to.equal(1000);

                cpu.onKeyEvent(0x10, true);
                expect(cpu.v[0]).to.equal(0x10);
                cpu.update();
                cpu.update();
                expect(cpu.pc).to.equal(1004);
            });
        });

        context("Fx15 - LD DT, Vx", () => {
            it("DT is set equal to the value of Vx.", () => {
                cpu.v[0] = 44;
                cpu.dt = 0;
                cpu.perform(0xF015);
                expect(cpu.dt).to.equal(44);
            });
        });

        context("Fx18 - LD ST, Vx", () => {
            it("ST is set equal to the value of Vx.", () => {
                cpu.v[0] = 22;
                cpu.st = 0;
                cpu.perform(0xF018);
                expect(cpu.st).to.equal(22);
            });
        });

        context("Fx1E - ADD I, Vx", () => {
            it("the values of I and Vx are added, and the results are stored in I.", () => {
                cpu.v[5] = 10;
                cpu.i = 20;
                cpu.perform(0xF51E);
                expect(cpu.i).to.equal(30);
            });

            it("only the lowest 16 bits of the result are kept, and stored in I", () => {
                cpu.v[5] = 1;
                cpu.i = 0xFFFF;
                cpu.perform(0xF51E);
                expect(cpu.i).to.equal(0);
            });
        });

        context("Fx29 - LD F, Vx", () => {
            it("the value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx", () => {
                cpu.v[0] = 0xA;
                cpu.perform(0xF029);
                expect(cpu.i).to.equal(0xA * 5);
            });
        });

        context("Fx33 - LD B, Vx", () => {
            beforeEach(() => {
                cpu.i = 1000;
                cpu.v[9] = 123;
                cpu.perform(0xF933);
            });

            it("the interpreter takes the decimal value of Vx, and places the hundreds digit at location in I", () => {
                expect(cpu.mem[cpu.i]).to.equal(1);
            });

            it("the interpreter takes the decimal value of Vx, and places the tens digit at location I+1", () => {
                expect(cpu.mem[cpu.i+1]).to.equal(2);
            });

            it("the interpreter takes the decimal value of Vx, and places the the ones digit at location I+2", () => {
                expect(cpu.mem[cpu.i+2]).to.equal(3);
            });
        });

        context("Fx55 - LD [I], Vx", () => {
            it("the interpreter copies the values of registers V0 through Vx into memory, starting at the address in I", () => {
                const nums = [10, 20, 30, 40, 50]
                nums.forEach((value, index) => {
                    cpu.v[index] = value;
                });
                cpu.i = 1000;
                cpu.perform(0xF455);

                for(let i=0;i<nums.length;i++) {
                    expect(cpu.mem[cpu.i+i]).to.equal(nums[i]);
                }
            });
        });

        context("Fx65 - LD Vx, [I]", () => {
            it("the interpreter reads values from memory starting at location I into registers V0 through Vx", () => {
                const nums = [10, 20, 30, 40, 50]
                cpu.i = 1000;
                nums.forEach((value, index) => {
                    cpu.mem[cpu.i+index] = value;
                });
                cpu.perform(0xF465);

                for(let i=0;i<nums.length;i++) {
                    expect(cpu.v[i]).to.equal(nums[i]);
                }
            });
        });
    });
});