const fs = require('fs');
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

class AstPrinter {
  constructor () {
    this.fs = fs.createWriteStream('./generated/ast.dot');
    this.nodes = new Map();
  }

  dfs1 (x) {
    const id = this.nodes.size;
    this.nodes.set(x, id);
    this.fs.write(`${id} [label="${x.type}"];\n`);
    if (x instanceof ConstDecl) {
      const vNode = new Node();
      vNode.type = '=';
      x.chs.splice(1, 0, vNode);
    } else if (x instanceof ProcedureHeader) {
      const vNode = new Node();
      vNode.type = ';';
      x.chs.push(vNode);
    } else if (x instanceof WhileStmt) {
      {
        const vNode = new Node();
        vNode.type = 'while';
        x.chs.splice(0, 0, vNode);
      }
      {
        const vNode = new Node();
        vNode.type = 'do';
        x.chs.splice(2, 0, vNode);
      }
    } else if (x instanceof AssignStmt) {
      const vNode = new Node();
      vNode.type = ':=';
      x.chs.splice(1, 0, vNode);
    } else if (x instanceof ReadStmt) {
      const vNode = new Node();
      vNode.type = 'read';
      x.chs.splice(0, 0, vNode);
    } else if (x instanceof WriteStmt) {
      const vNode = new Node();
      vNode.type = 'write';
      x.chs.splice(0, 0, vNode);
    } else if (x instanceof CondStmt) {
      {
        const vNode = new Node();
        vNode.type = 'if';
        x.chs.splice(0, 0, vNode);
      }
      {
        const vNode = new Node();
        vNode.type = 'then';
        x.chs.splice(2, 0, vNode);
      }
    } else if (x instanceof CallStmt) {
      const vNode = new Node();
      vNode.type = 'call';
      x.chs.splice(0, 0, vNode);
    }
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

module.exports = AstPrinter;
