import StreamSearch from 'streamsearch';
import Long from 'long';
import { Observable, Subject } from 'rxjs';

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
        subject.next(data);
      });
    }

    let nextStart   = new Long(0);
    let possibleEnd = new Long(0);

    this.ss.on('info', (isMatch, data, start = 0, end = 0) => {
      if (isMatch) {
        emitData({
          start: new Long(nextStart),
          end  : possibleEnd.add(end - start)
        });
        nextStart   = possibleEnd.add(end - start).add(this.token.length);
        possibleEnd = new Long(nextStart);
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
      process.nextTick(() => subject.complete());
    });
    this._subject = subject;
    return this._subject;
  }

  observe() {
    return Observable.defer(() => this._origObservable())
      .filter(({ start, end }) => !this.noEmptyMatches || !start.eq(end));
  }

  static split(params) {
    return new SimpleSplitter(params).observe();
  }
}

export default SimpleSplitter;
