const EventEmitter = require('events').EventEmitter;
const Transform = require('stream').Transform;

const State = Object.freeze({
  BEGIN: 'BEGIN',
  PART_SYM: 'PART_SYM',
  ID: 'ID',
  INTEGER: 'INTEGER',
});

const TokenType = Object.freeze({
  KEYWORD: 'KEYWORD',
  ID: 'ID',
  NUM: 'NUM',
  OP: 'OP',
});

const opSet = new Set(['(', ')', '+', '-', '*', '/', ':=', '=', '<', '>', '<=', '>=', '#', ';', ',', '.', '[', ']']);
const keywordSet = new Set(['const', 'var', 'procedure', 'begin', 'end',
                            'if', 'then', 'call', 'while', 'read', 'write', 'do']);

class TokenizerException extends Error {
  constructor({ index, message }) {
    super(message);
    this.index = index;
  }
}

class Tokenizer extends EventEmitter {
  constructor() {
    super();
    this.state = State.BEGIN;
    this.src = '';
    this.startIdx = 0;
  }

  setState(state) {
    this.state = state;
  }

  putToken(token, index = -1) {
    index = index == -1 ? this.startIdx : index;

    let type = null;
    if(opSet.has(token)) {
      type = token;
    } else if(keywordSet.has(token)) {
      type = token;
    } else if(/^[0-9]+$/.test(token)) {
      type = TokenType.NUM;
    } else if(/^[a-zA-Z]{1,10}$/.test(token)) {
      type = TokenType.ID;
    } else {
      console.log('invalid token:', token);
      throw new TokenizerException({ index, message: token });
    }

    this.emit('token', { type, index, content: token });
  }

  putChar(c) {
    // console.log('putChar:', c, this.state);
    switch(this.state) {
      case State.BEGIN:
        switch(c) {
          case '(':
          case ')':
          case '+':
          case '-':
          case '*':
          case '/':
          case '=':
          case ';':
          case ',':
          case '#':
          case '[':
          case ']':
          case '.':
            this.putToken(c, this.startIdx);
            ++this.startIdx;
            break;
          case '<':
          case '>':
          case ':':
            this.setState(State.PART_SYM);
            break;
          case ' ':
          case '\r':
          case '\n':
            ++this.startIdx;
            break;
          default:
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
              this.setState(State.ID);
              this.startIdx = this.src.length;
            } else if (c >= '0' && c <= '9') {
              this.setState(State.INTEGER);
              this.startIdx = this.src.length;
            } else {
              console.log('invalid char', c);
              throw new TokenizerException({ index: this.startIdx, message: c });
            }
        }
        break;
      case State.PART_SYM:
        switch(c) {
          case '=':
            switch(this._getLastChar()) {
              case '>':
                this.putToken('>=');
                ++this.startIdx;
                break;
              case '<':
                this.putToken('<=');
                ++this.startIdx;
                break;
              case ':':
                this.putToken(':=');
                ++this.startIdx;
                break;
              default:
                // TODO: error
            }
            this.setState(State.BEGIN);
            break;
          default:
            console.log('lastChar:', this._getLastChar());
            this.putToken(this._getLastChar());
            this.setState(State.BEGIN);
            return this.putChar(c);
        }
        break;
      case State.ID:
        if((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
          // stay still
        } else {
          this.putToken(this.src.slice(this.startIdx));
          this.setState(State.BEGIN);
          this.startIdx = this.src.length;
          this.putChar(c);
          return;
        }
        break;
      case State.INTEGER:
        if(c >= '0' && c <= '9') {
          // stay still
        } else {
          this.putToken(this.src.slice(this.startIdx));
          this.setState(State.BEGIN);
          this.startIdx = this.src.length;
          this.putChar(c);
          return;
        }
        break;
    }
    this.src += c;
  }

  finalize(cb) {
    const { startIdx } = this;
    switch(this.state) {
      case State.ID:
        this.putToken(this.src.slice(startIdx), startIdx);
        break;
      case State.INTEGER:
        this.putToken(this.src.slice(startIdx), startIdx);
        break;
    }
    cb();
  }

  _getLastChar() {
    const { src } = this;
    return src.length > 0 ? src.slice(-1) : '';
  }
};

class TokenizerStream extends Transform {
  constructor(options) {
    super(options);
    this.tokenizer = new Tokenizer();
    this.tokenizer.on('token', this._tokenHandler.bind(this));
  }

  _tokenHandler(token) {
    this.push(Buffer.from(JSON.stringify(token)));
  }

  _transform(data, encoding, cb) {
    const str = data.toString();
    for(let i = 0; i < str.length; ++i) {
      this.tokenizer.putChar(str[i]);
    }
    cb();
  }

  _flush(cb) {
    this.tokenizer.finalize(cb);
  }
};

class TokenizerPrinter extends Transform {
  constructor(options) {
    super(options);
    this.tokens = [];
    this.ids = [];
  }

  _transform(data, encoding, cb) {
    this.tokens.push(JSON.parse(data.toString()));
    this.push(data);
    cb();
  }

  _flush(cb) {
    // print
    console.log('---------', 'TokenizerPrinter', '---------');
    console.log(this.tokens);
    cb();
  }
}

module.exports = {
  TokenType,
  Tokenizer,
  TokenizerStream,
  TokenizerPrinter,
  TokenizerException,
};
