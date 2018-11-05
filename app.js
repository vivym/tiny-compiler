const glob = require('glob');
const fs = require('fs');
const { TokenizerStream, TokenizerPrinter, TokenizerException } = require('./libs/tokenizer');

glob.sync('test/programs/*.txt').forEach(src => {
  try {
    fs.createReadStream(src)
      .pipe(new TokenizerStream())
      .pipe(new TokenizerPrinter());
  } catch(err) {
    if(err instanceof TokenizerException) {
    }
    console.log('err', err);
  }
});
