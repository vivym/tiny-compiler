class Node {
  constructor () {
    this.chs = [];
    this.os = process.stdout;
  }

  push (node) {
    this.chs.push(node);
  }

  newlabel () {
    if (Node.labels === undefined) {
      Node.labels = 0;
    }
    return ++ Node.labels;
  }

  emitlabel (i) {
    this.os.write(`L${i}:`);
  }

  emit (s) {
    this.os.write(`\t${s}\n`);
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

  gen () {
    return this;
  }

  reduce () {
    return this;
  }

  op () {
    return this.chs[0].token;
  }

  jumping (t, f) {
    this.emitjumps(this.op().content, t, f);
  }

  emitjumps (test, t, f) {
    if (t && f) {
      this.emit(`if ${test} goto L${t}`);
      this.emit(`goto L${f}`);
    } else if (t) {
      this.emit(`if ${test} goto L${t}`);
    } else if (f) {
      this.emit(`iffalse ${test} goto L${f}`);
    } else {
      // do nothing
    }
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

class Id extends Expr {
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

class Op extends Expr {
  constructor () {
    super();
    this.type = 'Op';
  }

  reduce () {
    const x = gen();
  }
}

class CondOp extends Op {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'CondOp';
  }
}

class UnaryOp extends Op {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'UnaryOp';
  }
}

class BinaryOp extends Op {
  constructor (token) {
    super();
    this.token = token;
    this.type = 'BinaryOp';
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