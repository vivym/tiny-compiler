const glob = require('glob');
const fs = require('fs');
const { TokenizerStream, TokenizerPrinter, TokenizerException } = require('./libs/tokenizer');
const { AstGenerator } = require('./libs/ast');
const { VmStream } = require('./libs/vm');

glob.sync('test/programs/*.txt').forEach(src => {
  try {
    fs.createReadStream(src)
      .pipe(new TokenizerStream())
      // .pipe(new TokenizerPrinter())
      .pipe(new AstGenerator())
      .pipe(new VmStream());
  } catch(err) {
    if(err instanceof TokenizerException) {
    }
    console.log('err', err);
  }
});
