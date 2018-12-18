const { Transform } = require('stream');
const { TokenType } = require('../tokenizer');
const AstPrinter = require('./printer');

const {
  Node,
  Program,
  Subprogram,
  ConstDecls,
  ConstDecl,
  VarDecls,
  ProcedureDecls,
  ProcedureDecl,
  ProcedureHeader,
  Stmts,
  Stmt,
  ReadStmt,
  WriteStmt,
  CallStmt,
  WhileStmt,
  AssignStmt,
  CondStmt,
  Expr,
  CondExpr,
  Term,
  Factor,
  Id,
  Num,
  CondOp,
  UnaryOp,
  BinaryOp,
} = require('./nodes');

class AstException extends Error {
  constructor({ message }) {
    super(message);
  }
}

class Parser {
  constructor (tokens) {
    this.tokens = tokens;
    this.lookptr = 0;
    this.insts = [];
  }

  emit (func, level, offset) {
    const inst = { func, level, offset };
    this.insts.push(inst);
    return inst;
  }

  address () {
    return this.insts.length;
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
    const program = new Program(this);
    program.push(this.subprogram());
    this.match('.');
    return program;
  }

  subprogram () {
    const sub = new Subprogram(this);
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
    const decls = new ConstDecls(this);
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
    const decl = new ConstDecl(this);
    decl.push(this.id());
    this.match('=');
    decl.push(this.num());
    return decl;
  }

  varDecls () {
    const decls = new VarDecls(this);
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
    const decls = new ProcedureDecls(this);
    decls.push(this.procedureDecl());
    return decls;
  }

  procedureDecl () {
    const decl = new ProcedureDecl(this);
    decl.push(this.procedureHeader());
    decl.push(this.subprogram());
    this.match(';');
    return decl;
  }

  procedureHeader () {
    const header = new ProcedureHeader(this);
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
    const stmts = new Stmts(this);
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
    const stmt = new CondStmt(this);
    this.match('if');
    stmt.push(this.condExpr());
    this.match('then');
    stmt.push(this.statements());
    return stmt;
  }

  assignStmt () {
    const stmt = new AssignStmt(this);
    stmt.push(this.id());
    this.match(':=');
    stmt.push(this.expr());
    return stmt;
  }

  whileStmt () {
    const stmt = new WhileStmt(this);
    this.match('while');
    stmt.push(this.condExpr());
    this.match('do');
    stmt.push(this.statements());
    return stmt;
  }

  readStmt () {
    const stmt = new ReadStmt(this);
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
    const stmt = new WriteStmt(this);
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
    const stmt = new CallStmt(this);
    this.match('call');
    stmt.push(this.id());
    return stmt;
  }

  expr () {
    const expr = new Expr(this);
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
    const expr = new CondExpr(this);
    if (this.lookahead().type === 'odd') {
      expr.push(this.unaryOp());
      expr.push(this.expr());
    } else {
      expr.push(this.expr());
      expr.push(this.condOp());
      expr.push(this.expr());
    }
    return expr;
  }

  term () {
    const term = new Term(this);
    term.push(this.factor());
    while (this.lookahead().type === '*' || this.lookahead().type === '/') {
      term.push(this.binaryOp());
      term.push(this.factor());
    }
    return term;
  }

  factor () {
    const factor = new Factor(this);
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
    return new Id(this, this.match(TokenType.ID));
  }

  num () {
    return new Num(this, this.match(TokenType.NUM));
  }

  unaryOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '+' || token.type === '-' || token.type === 'odd') {
      return new UnaryOp(this, token);
    } else {
      throw new AstException({ message: `invalid unaryOp: ${JSON.stringify(token)}` });
    }
  }

  binaryOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '+' || token.type === '-' || token.type === '*' || token.type === '/') {
      return new BinaryOp(this, token);
    } else {
      throw new AstException({ message: `invalid binaryOp: ${JSON.stringify(token)}` });
    }
  }

  condOp () {
    const token = this.lookahead();
    this.move();
    if (token.type === '=' || token.type === '#' || token.type === '<' || token.type === '<=' || token.type === '>' || token.type === '>=') {
      return new CondOp(this, token);
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
    const parser = new Parser(this.tokens);
    const ast = parser.program();
    ast.gen();
    console.log(parser.insts.map(inst => `${inst.func} ${inst.level} ${inst.offset}`).join('\n'));
    parser
    this.push(Buffer.from(JSON.stringify(parser.insts)));
    cb();
  }
}

module.exports = {
  AstGenerator,
};
