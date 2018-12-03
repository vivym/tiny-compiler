class Env {
  constructor (prev = null) {
    this.prev = prev;
    this.table = new Map();
  }

  put (id, value = 'NO') {
    if (typeof value === 'number' || typeof value === 'string') {
      value = { value, type: typeof value === 'number' ? 'const' : 'var' };
    }
    value.offset = this.table.size;
    this.table.set(id, value);
  }

  get (id) {
    let level = 0;
    for (let e = this; e !== null; e = e.prev, ++level) {
      const value = e.table.get(id);
      if (value) {
        return { value, level };
      }
    }
    return null;
  }

  newScope () {
    return new Env(this);
  }
}

module.exports = Env;
