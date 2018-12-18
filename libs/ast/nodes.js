const Env = require('./env');

class Node {
  constructor (parser) {
    this.chs = [];
    this.parser = parser;
  }

  push (node) {
    this.chs.push(node);
  }

  emit (func, level, offset) {
    return this.parser.emit(func, level, offset);
  }

  address () {
    return this.parser.address();
  }
}

class Program extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Program';
  }

  gen () {
    const env = new Env();
    env.put('read_memory');
    env.put('write_memory');
    this.chs.forEach(sub => sub.gen(env));
    console.log('env:');
    console.log(env);
  }
}

class Subprogram extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Subprogram';
  }

  gen (env) {
    env = env.newScope();
    const int = this.emit('INT', 0);
    this.chs.forEach(node => node.gen(env));
    int.offset = env.table.size;
    this.emit('OPR', 0, 0);
    console.log('env:');
    console.log(env);
  }
}

class ConstDecls extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'ConstDecls';
  }

  gen (env) {
    this.chs.forEach(node => node.gen(env));
  }
}

class ConstDecl extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'ConstDecl';
  }

  get id () {
    return this.chs[0];
  }

  get value () {
    return this.chs[1];
  }

  gen (env) {
    const id = this.id.token.content;
    const value = parseInt(this.value.token.content, 10);
    env.put(id, value);
    this.emit('LIT', 0, value);
    this.emit('STO', 0, env.get(id).value.offset);
  }
}

class VarDecls extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'VarDecls';
  }

  gen (env) {
    this.chs.forEach(id => env.put(id.token.content));
  }
}

class ProcedureDecls extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'ProcedureDecls';
  }

  gen (env) {
    this.chs.forEach(prod => prod.gen(env));
  }
}

class ProcedureDecl extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'ProcedureDecl';
  }

  get header () {
    return this.chs[0];
  }

  get body () {
    return this.chs[1];
  }

  gen (env) {
    const id = this.header.id.token.content;
    env.put(id, { type: 'func' });
    const lit = this.emit('LIT', 0);
    this.emit('STO', 0, env.get(id).value.offset);
    const jmp = this.emit('JMP', 0);
    const address = this.address();
    lit.offset = address;
    this.body.gen(env);
    jmp.offset = this.address();
  }
}

class ProcedureHeader extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'ProcedureHeader';
  }

  get id () {
    return this.chs[0];
  }
}

class Statement extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Statement';
  }
}

class Stmts extends Statement {
  constructor (parser) {
    super(parser);
    this.type = 'Stmts';
  }

  gen (env) {
    this.chs.forEach(stmt => stmt && stmt.gen(env));
  }
}

class Stmt extends Statement {
  constructor (parser) {
    super(parser);
    this.type = 'Stmt';
  }

  gen (env) {
    console.log(`${this.type}.gen() has not benn implemented.`);
  }
}

class ReadStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'ReadStmt';
  }

  gen (env) {
    const rd = env.get('read_memory');
    this.chs.forEach(id => {
      this.emit('LOD', rd.level, rd.value.offset);
      const info = env.get(id.token.content);
      this.emit('STO', info.level, info.value.offset);
    });
  }
}

class WriteStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'WriteStmt';
  }

  gen (env) {
    const wrt = env.get('write_memory');
    this.chs.forEach(expr => {
      expr.gen(env);
      this.emit('STO', wrt.level, wrt.value.offset);
    });
  }
}

class CallStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'CallStmt';
  }

  get id () {
    return this.chs[0];
  }

  gen (env) {
    const info = env.get(this.id.token.content);
    this.emit('CAL', info.level, info.value.offset);
  }
}

class WhileStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'WhileStmt';
  }

  get cond () {
    return this.chs[0];
  }

  get statement () {
    return this.chs[1];
  }

  gen (env) {
    const begin = this.address();
    this.cond.gen(env);
    const jpc = this.emit('JPC', 0);
    this.statement.gen(env);
    this.emit('JMP', 0, begin);
    jpc.offset = this.address();
  }
}

class AssignStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'AssignStmt';
  }

  get id () {
    return this.chs[0];
  }

  get expr () {
    return this.chs[1];
  }

  gen (env) {
    this.expr.gen(env);
    const id = this.id.token.content;
    const info = env.get(id);
    if (info) {
      this.emit('STO', info.level, info.value.offset);
    } else {
      console.error('error: assign stmt');
    }
  }
}

class CondStmt extends Stmt {
  constructor (parser) {
    super(parser);
    this.type = 'CondStmt';
  }

  get cond () {
    return this.chs[0]
  }

  get statement () {
    return this.chs[1];
  }

  gen (env) {
    this.cond.gen(env);
    const jpc = this.emit('JPC', 0);
    this.statement.gen(env);
    jpc.offset = this.address();
  }
}

class Expr extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Expr';
  }

  gen (env) {
    if (this.chs[0] instanceof UnaryOp) {
      console.log('not implemented... expr');
    }
    
    const term = this.chs.shift();
    term.gen(env);

    if (this.chs.length > 0) {
      const op = this.chs.shift();
      const term = this.chs.shift();
      term.gen(env);
      op.gen(env);
    }
  }
}

class CondExpr extends Expr {
  constructor (parser) {
    super(parser);
    this.type = 'CondExpr';
  }

  gen (env) {
    if (this.chs[0] instanceof UnaryOp) {
      this.chs[1].gen(env);
      this.emit('OPR', 0, 'odd');
    } else {
      this.chs[0].gen(env);
      this.chs[2].gen(env);
      this.emit('OPR', 0, this.chs[1].token.content);
    }
  }
}

class Term extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Term';
  }

  gen (env) {
    const factor = this.chs.shift();
    factor.gen(env);

    if (this.chs.length > 0) {
      const op = this.chs.shift();
      const factor = this.chs.shift();
      factor.gen(env);
      op.gen(env);
    }
  }
}

class Factor extends Node {
  constructor (parser) {
    super(parser);
    this.type = 'Factor';
  }

  gen (env) {
    if (this.chs[0] instanceof Id) {
      const info = env.get(this.chs[0].token.content);
      this.emit('LOD', info.level, info.value.offset);
    } else if (this.chs[0] instanceof Num) {
      this.emit('LIT', 0, parseInt(this.chs[0].token.content, 10));
    } else if (this.chs[0] instanceof Stmt) {
      this.chs[0].gen(env);
    } else {
      console.log('invalid factor');
    }
  }
}

class Id extends Expr {
  constructor (parser, token) {
    super(parser);
    this.token = token;
    this.type = 'Id';
  }
}

class Num extends Node {
  constructor (parser, token) {
    super(parser);
    this.token = token;
    this.type = 'Num';
  }
}

class Op extends Expr {
  constructor (parser) {
    super(parser);
    this.type = 'Op';
  }
}

class CondOp extends Op {
  constructor (parser, token) {
    super(parser);
    this.token = token;
    this.type = 'CondOp';
  }
}

class UnaryOp extends Op {
  constructor (parser, token) {
    super(parser);
    this.token = token;
    this.type = 'UnaryOp';
  }
}

class BinaryOp extends Op {
  constructor (parser, token) {
    super(parser);
    this.token = token;
    this.type = 'BinaryOp';
  }

  gen (env) {
    this.emit('OPR', 0, this.token.content);
  }
}

module.exports = {
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
}