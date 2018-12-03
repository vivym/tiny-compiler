const { EventEmitter } = require('events');
const { Transform } = require('stream');

class MemoryBlock {
  constructor (size) {
    this.mem = new Array(size);
  }

  get (idx) {
    return this.mem[idx];
  }

  set(idx, value) {
    return this.mem[idx] = value;
  }
}

class GlobalMemoryBlock {
  constructor () {
    this.readStream = [16, 56];
  }
  
  get (idx) {
    if (idx == 0) { // read
      return this.readStream.shift();
    }
  }

  set (idx, value) {
    if (idx === 1) { // write
      console.log('write:', value);
    }
  }
}

class Memory {
  constructor () {
    this.blocks = [];
    this.blocks.push(new GlobalMemoryBlock());
  }

  newBlock (size) {
    this.blocks.push(new MemoryBlock(size));
  }

  exitBlock () {
    this.blocks.pop();
  }

  get (level, offset) {
    return this.blocks[-level - 1 + this.blocks.length].get(offset);
  }

  set (level, offset, value) {
    return this.blocks[-level - 1 + this.blocks.length].set(offset, value);
  }
}

class Vm extends EventEmitter {
  constructor () {
    super();
    this.handlers = {
      'LIT': this.litHandler.bind(this),
      'LOD': this.lodHandler.bind(this),
      'STO': this.stoHandler.bind(this),
      'CAL': this.calHandler.bind(this),
      'INT': this.intHandler.bind(this),
      'JMP': this.jmpHandler.bind(this),
      'JPC': this.jpcHandler.bind(this),
      'OPR': this.oprHandler.bind(this),
    };
    this.stack = [];
    this.memory = new Memory();
    this.eip = 0;
  }

  litHandler (_, value) {
    this.stack.push(value);
  }

  lodHandler (level, offset) {
    const value = this.memory.get(level, offset);
    this.stack.push(value);
  }

  stoHandler (level, offset) {
    this.memory.set(level, offset, this.stack.pop());
  }

  calHandler (level, offset) {
    this.stack.push(this.eip);
    this.eip = this.memory.get(level, offset);
  }

  intHandler (_, size) {
    this.memory.newBlock(size);
  }

  jmpHandler (_, address) {
    this.eip = address;
  }

  jpcHandler (_, address) {
    const cond = this.stack.pop();
    if (!cond) {
      this.eip = address;
    }
  }

  oprHandler (_, op) {
    if (op === 0) {
      this.memory.exitBlock();
      this.eip = this.stack.length > 0 ? this.stack.pop() : -1;

    } else {
      const val1 = this.stack.pop();
      const val0 = this.stack.pop();
      if (op === '+') {
        this.stack.push(val0 + val1);
      } else if (op === '-') {
        this.stack.push(val0 - val1);
      } else if (op === '*') {
        this.stack.push(val0 * val1);
      } else if (op === '/') {
        this.stack.push(Math.floor(val0 / val1));
      } else if (op === '=') {
        this.stack.push(val0 === val1);
      } else if (op === '#') {
        this.stack.push(val0 !== val1);
      } else if (op === '<') {
        this.stack.push(val0 < val1);
      } else if (op === '<=') {
        this.stack.push(val0 <= val1);
      } else if (op === '>') {
        this.stack.push(val0 > val1);
      } else if (op === '>=') {
        this.stack.push(val0 >= val1);
      }
    }
  }

  run (insts) {
    this.eip = 0;
    let i = 0
    while (this.eip !== -1) {
      const inst = insts[this.eip++];
      this.handlers[inst.func](inst.level, inst.offset);
    }
  }
}

class VmStream extends Transform {
  constructor () {
    super();
  }

  _transform(data, encoding, cb) {
    const vm = new Vm();
    vm.run(JSON.parse(data.toString()));
    cb();
  }

  _flush(cb) {
    cb();
  }
}

module.exports = {
  VmStream,
};
