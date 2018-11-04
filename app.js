const fs = require('fs');
const { TokenizerStream } = require('./libs/tokenizer');

try {
  fs.createReadStream('test/programs/1.txt')
    .pipe(new TokenizerStream())
    .pipe(process.stdout);
} catch(err) {
  if(err instanceof TokenizerException) {
  }
  console.log('err', err);
}
