const EventEmitter = require('events').EventEmitter;
const Transform = require('stream').Transform;
const { TokenType } = require('./tokenizer');
const fs = require('fs');

class Node {
  constructor () {
    this.chs = [];
  }

  push (node) {
    this.chs.push(node);
  }
}

class Program extends Node {
  constructor () {
    super();
    this.type = 'Program';
  }
}

class Subprogram extends Node {
  constructor () {
    super();
    this.type = 'Subprogram';
  }
}

class ConstDecls extends Node {
  constructor () {
    super();
    this.type = 'ConstDecls';
  }
}

class ConstDecl extends Node {
  constructor () {
    super();
    this.type = 'ConstDecl';
  }
}

class VarDecls extends Node {
  constructor () {
    super();
    this.type = 'VarDecls';
  }
}

class ProcedureDecls extends Node {
  constructor () {
    super();
    this.type = 'ProcedureDecls';
  }
}

class ProcedureDecl extends Node {
  constructor () {
    super();
    this.type = 'ProcedureDecl';
  }
}

class ProcedureHeader extends Node {
  constructor () {
    super();
    this.type = 'ProcedureHeader';
  }
}

class Stmts extends Node {
  constructor () {
    super();
    this.type = 'Stmts';
  }
}

class Stmt extends Node {
  constructor () {
    super();
    this.type = 'Stmt';
  }
}

class ReadStmt extends Stmt {
  constructor () {
    super();
    this.type = 'ReadStmt';
  }
}

class WriteStmt extends Stmt {
  constructor () {
    super();
    this.type = 'WriteStmt';
  }
}

class CallStmt extends Stmt {
  constructor () {
    super();
    this.type = 'CallStmt';
  }
}

class WhileStmt extends Stmt {
  constructor () {
    super();
    this.type = 'WhileStmt';
  }
}

class AssignStmt extends Stmt {
  constructor () {
    super();
    this.type = 'AssignStmt';
  }
}

class CondStmt extends Stmt {
  constructor () {
    super();
    this.type = 'CondStmt';
  }
}

class Expr extends Node {
  constructor () {
    super();
    this.type = 'Expr';
  }
}

class CondExpr extends Expr {
  constructor () {
    super();
    this.type = 'CondExpr';
  }
}

class Term extends Node {
  constructor () {
    super();
    this.type = 'Term';
  }
}

class Factor extends Node {
  constructor () {
    super();
    this.type = 'Factor';
  }
}

class Id extends Node {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'Id';
  }
}

class Num extends Node {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'Num';
  }
}

class CondOp extends Node {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'CondOp';
  }
}

class UnaryOp extends Node {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'UnaryOp';
  }
}

class BinaryOp extends Node {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'BinaryOp';
  }
}

class AstException extends Error {
  constructor({ message }) {
    super(message);
  }
}

class Parser {
  constructor (tokens) {
    this.tokens = tokens;
    this.lookptr = 0;
  }

  lookahead () {
    return this.lookptr < this.tokens.length ? this.tokens[this.lookptr] : {};
  }

  lookahead2 () {
    return this.lookptr + 1 < this.tokens.length ? this.tokens[this.lookptr + 1] : {};
  }

  move () {
    ++this.lookptr;
    return this.lookptr < this.tokens.length;
  }

  unmove () {
    --this.lookptr;
    return this.lookptr >= 0;
  }

  error () {
    throw new AstException({ message: `syntax error, current token: ${JSON.stringify(this.lookahead())}` });
  }

  match (type) {
    if (this.lookahead().type === type) {
      const token = this.lookahead();
      this.move();
      return token;
    } else {
      this.error();
    }
  }

  program () {
    return this.subprogram();
  }

  subprogram () {
    const sub = new Subprogram();
    if (this.lookahead().type === 'const') {
      sub.push(this.constDecls());
    }
    if (this.lookahead().type === 'var') {
      sub.push(this.varDecls());
    }
    if (this.lookahead().type === 'procedure') {
      sub.push(this.procedureDecls());
    }
    sub.push(this.statements());
    return sub;
  }

  constDecls () {
    const decls = new ConstDecls();
    this.match('const');
    decls.push(this.constDecl());
    while (this.lookahead().type === ',') {
      this.match(',');
      decls.push(this.constDecl());
    }
    this.match(';');
    return decls;
  }

  constDecl () {
    const decl = new ConstDecl();
    decl.push(this.id());
    this.match('=');
    decl.push(this.num());
    return decl;
  }

  varDecls () {
    const decls = new VarDecls();
    this.match('var');
    decls.push(this.id());
    while (this.lookahead().type === ',') {
      this.match(',');
      decls.push(this.id());
    }
    this.match(';');
    return decls;
  }

  procedureDecls () {
    const decls = new ProcedureDecls();
    decls.push(this.procedureDecl());
    return decls;
  }

  procedureDecl () {
    const decl = new ProcedureDecl();
    decl.push(this.procedureHeader());
    decl.push(this.subprogram());
    this.match(';');
    return decl;
  }

  procedureHeader () {
    const header = new ProcedureHeader();
    this.match('procedure');
    header.push(this.id());
    this.match(';');
    return header;
  }

  statements () {
    if (this.lookahead().type === 'begin') {
      return this.stmts();
    } else {
      return this.stmt();
    }
  }

  stmts () {
    const stmts = new Stmts();
    this.match('begin');
    stmts.push(this.statements());

    while (this.lookahead().type === ';') {
      this.match(';');
      stmts.push(this.statements());
    }
    this.match('end');
    return stmts;
  }

  stmt () {
    if (this.lookahead().type === 'while') {
      return this.whileStmt();
    } else if (this.lookahead().type === 'if') {
      return this.condStmt();
    } else if (this.lookahead().type === 'read') {
      return this.readStmt();
    } else if (this.lookahead().type === 'write') {
      return this.writeStmt();
    } else if (this.lookahead().type === 'call') {
      return this.callStmt();
    } else if (this.lookahead().type === TokenType.ID && this.lookahead2().type === ':=') {
      return this.assignStmt();
    } else { // empty stmt
      return null;
    }
  }

  condStmt () {
    const stmt = new CondStmt();
    this.match('if');
    stmt.push(this.condExpr());
    this.match('then');
    stmt.push(this.statements());
    return stmt;
  }

  assignStmt () {
    const stmt = new AssignStmt();
    stmt.push(this.id());
    this.match(':=');
    stmt.push(this.expr());
    return stmt;
  }

  whileStmt () {
    const stmt = new WhileStmt();
    this.match('while');
    stmt.push(this.condExpr());
    this.match('do');
    stmt.push(this.statements());
    return stmt;
  }

  readStmt () {
    const stmt = new ReadStmt();
    this.match('read');
    this.match('(');
    stmt.push(this.id());
    while (this.lookahead().type === ',') {
      this.match(',');
      stmt.push(this.id());
    }
    this.match(')');
    return stmt;
  }

  writeStmt () {
    const stmt = new WriteStmt();
    this.match('write');
    this.match('(');
    stmt.push(this.expr());
    while (this.lookahead().type === ',') {
      this.match(',');
      stmt.push(this.expr());
    }
    this.match(')');
    return stmt;
  }

  callStmt () {
    const stmt = new CallStmt();
    this.match('call');
    stmt.push(this.id());
    return stmt;
  }

  expr () {
    const expr = new Expr();
    if (this.lookahead().type === '+' || this.lookahead().type === '-') {
      expr.push(this.unaryOp());
    }
    expr.push(this.term());
    while (this.lookahead().type === '+' || this.lookahead().type === '-') {
      expr.push(this.binaryOp());
      expr.push(this.term());
    }
    return expr;
  }

  condExpr () {
    const expr = new CondExpr();
    if (this.lookahead().type === 'odd') {
      expr.push(this.binaryOp());
      expr.push(this.expr());
    } else {
      expr.push(this.expr());
      expr.push(this.condOp());
      expr.push(this.expr());
    }
    return expr;
  }

  term () {
    const term = new Term();
    term.push(this.factor());
    while (this.lookahead().type === '*' || this.lookahead().type === '/') {
      term.push(this.binaryOp());
      term.push(this.factor());
    }
    return term;
  }

  factor () {
    const factor = new Factor();
    if (this.lookahead().type === '(') {
      this.match('(');
      factor.push(this.expr());
      this.match(')');
    } else if (this.lookahead().type === TokenType.NUM) {
      factor.push(this.num());
    } else {
      factor.push(this.id());
    }
    return factor;
  }

  id () {
    return new Id(this.match(TokenType.ID));
  }

  num () {
    return new Num(this.match(TokenType.NUM));
  }

  unaryOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '+' || token.type === '-' || token.type === 'odd') {
      return new UnaryOp(token);
    } else {
      throw new AstException({ message: `invalid unaryOp: ${JSON.stringify(token)}` });
    }
  }

  binaryOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '+' || token.type === '-' || token.type === '*' || token.type === '/') {
      return new BinaryOp(token);
    } else {
      throw new AstException({ message: `invalid binaryOp: ${JSON.stringify(token)}` });
    }
  }

  condOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '=' || token.type === '#' || token.type === '<' || token.type === '<=' || token.type === '>' || token.type === '>=') {
      return new CondOp(token);
    } else {
      throw new AstException({ message: `invalid condOp: ${JSON.stringify(token)}` });
    }
  }
}

class AstGenerator extends Transform {
  constructor () {
    super();
    this.tokens = [];
  }

  _transform(data, encoding, cb) {
    this.tokens.push(JSON.parse(data.toString()));
    cb();
  }

  _flush(cb) {
    // print
    console.log('---------', 'AST Generating', '---------');
    const parser = new Parser(this.tokens);
    const ast = parser.program();
    const printer = new AstPrinter();
    printer.print(ast);
    cb();
  }
}

class AstPrinter {
  constructor () {
    this.fs = fs.createWriteStream('./generated/ast.dot');
    this.nodes = new Map();
  }

  dfs1 (x) {
    const id = this.nodes.size;
    this.nodes.set(x, id);
    this.fs.write(`${id} [label="${x.type}"];\n`);
    x.chs.forEach(c => c && this.dfs1(c));
  }

  dfs2 (x) {
    const id = this.nodes.get(x);
    x.chs.forEach(c => {
      if (c) {
        this.fs.write(`${id}->${this.nodes.get(c)};\n`);
        this.dfs2(c);
      }
    });
  }
  
  print (ast) {
    this.fs.write('digraph ast {\n');
    this.dfs1(ast);
    this.dfs2(ast);
    this.fs.write('}');
  }
}


module.exports = {
  AstGenerator,
  AstPrinter,
};
