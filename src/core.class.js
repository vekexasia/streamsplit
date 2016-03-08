import StreamSearch from 'streamsearch';
import Decimal from 'decimal.js';
import { Observable, Subject } from 'rx';

class SimpleSplitter {

  constructor({ stream = null, token = null, noEmptyMatches = false } = {}) {
    this.readStream     = stream;
    this.token          = token;
    this._subject       = null;
    this.noEmptyMatches = noEmptyMatches;
    if (token === null) {
      throw new Error(`Token cannot be null`);
    }
    if (stream === null) {
      throw new Error(`Stream param cannot be null or undefined`);
    }
    this.ss = new StreamSearch(this.token);
  }

  _origObservable() {
    if (this._subject !== null) {
      return this._subject;
    }
    const subject = new Subject();


    function emitData(data) {
      process.nextTick(() => {
        subject.onNext(data);
      });
    }

    let nextStart   = new Decimal(0);
    let possibleEnd = new Decimal(0);

    this.ss.on('info', (isMatch, data, start = 0, end = 0) => {
      if (isMatch) {
        emitData({
          start: new Decimal(nextStart),
          end  : possibleEnd.add(end - start)
        });
        nextStart   = possibleEnd.add(end - start).add(this.token.length);
        possibleEnd = new Decimal(nextStart);
      } else {
        possibleEnd = possibleEnd.add(end - start);
      }
    });

    this.readStream.on('data', chunk => this.ss.push(chunk));
    this.readStream.on('end', () => {
      if (!nextStart.eq(possibleEnd)) {
        emitData({
          start: nextStart,
          end  : possibleEnd
        });
      }
      process.nextTick(() => subject.onCompleted());
    });
    this._subject = subject;
    return this._subject;
  }

  observe() {
    return Observable.defer(() => this._origObservable())
      .filter(({ start, end }) => !this.noEmptyMatches || !start.eq(end));
  }

}

export default SimpleSplitter;
export function split(params) {
  return new SimpleSplitter(params).observe();
}
