import Decimal from 'decimal.js';
import Splitter from '../core.class';
import extend from 'extend';

/**
 * Creates a splitter that emits chunks of data in the form of a Buffer
 * @param {object} params the constructor params for the Splitter
 * @returns {Observable.<Buffer>}
 */
export default function (params) {
  const mySplitter = new Splitter(extend(params, { noEmptyMatches: true }));
  let curBuffer    = new Buffer(0);
  let curBuffPos   = new Decimal(0);
  mySplitter.ss.on('info', (isMatch, data = new Buffer(0), start = 0, end = 0) => {
    const tmpBuff = new Buffer(end - start);
    data.copy(tmpBuff, 0, start, end);

    curBuffer = Buffer.concat([curBuffer, tmpBuff]);
    if (isMatch) {
      curBuffer = Buffer.concat([curBuffer, new Buffer(params.token, 'utf8')]);
    }
  });
  return mySplitter.observe()
    // .doOnNext(({start,end}) => console.log({ start: start.toNumber(), end: end.toNumber() }))
    .map(({ start, end }) => ({
      start: start.sub(curBuffPos),
      end  : end.sub(curBuffPos)
    }))
    // .doOnNext(({start,end}) => console.log({ start: start.toNumber(), end: end.toNumber() }))
    .map(({ start, end }) => {
      const chunkLength  = end.sub(start).toNumber();
      curBuffPos         = curBuffPos.add(start).add(chunkLength);
      const chunkBuffer  = new Buffer(chunkLength);
      const newCurBuffer = new Buffer(curBuffer.length - chunkLength - start.toNumber());
      curBuffer.copy(chunkBuffer, 0, start.toNumber(), start.add(chunkLength).toNumber());
      curBuffer.copy(newCurBuffer, 0, start.add(chunkLength).toNumber());
      curBuffer = newCurBuffer;
      return chunkBuffer;
    });
}
