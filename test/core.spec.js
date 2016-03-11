import Splitter from '../src/core.class';
import { expect } from 'chai';
import streamBuffers from 'stream-buffers';
import sinon from 'sinon';
import { Observable } from 'rx';
/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions, no-new, max-len */

function mapDecimalJsToNumber({ start, end }) {
  return { start: start.toNumber(), end: end.toNumber() };
}
describe('SimpleSplitter', () => {
  let readableStreamBuffer;
  beforeEach(() => {
    readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 10,   // in milliseconds.
      chunkSize: 5  // in bytes.
    });
  });
  describe('constructor', () => {
    it('shouldnt allow undefined token', () => {
      expect(() => {
        new Splitter({ stream: readableStreamBuffer });
      }).to.throw();
    });
    it('shouldnt allow null token', () => {
      expect(() => {
        new Splitter({ stream: readableStreamBuffer, token: null });
      }).to.throw();
    });
    it('shouldnt allow null stream', () => {
      expect(() => {
        new Splitter({ stream: null, token: '\n' });
      }).to.throw();
    });
    it('shouldnt allow undefined stream', () => {
      expect(() => {
        new Splitter({ token: '\n' });
      }).to.throw();
    });

    it('.split should return observable', () => {
      expect(Splitter.split({stream: readableStreamBuffer, token:'\n'})).to.be.an.instanceof(Observable);

    });
  });
  describe('splitter', () => {
    let splitter;
    beforeEach(() => {
      splitter = new Splitter({ stream: readableStreamBuffer, token: '\n' });
    });
    it('should not emit anything if stream is empty', done => {
      readableStreamBuffer.stop();
      splitter.observe()
        .subscribe(
          () => new Error('shouldnt emit nothing'),
          done,
          done
        );
    });
    it('should emit only one item even if no match', done => {
      readableStreamBuffer.put('a', 'utf8');
      readableStreamBuffer.stop();
      splitter.observe()
        .count()
        .subscribe(
          n => expect(n).to.be.equal(1),
          done,
          done
        );
    });
    describe('multiple subscriptions', () => {
      it('should allow multiple subscriber but subscribe to the readream data only once',
        done => {
          readableStreamBuffer.put('a\n');
          readableStreamBuffer.stop();
          sinon.spy(readableStreamBuffer, 'on');
          splitter.observe()
            .flatMap(splitter.observe())
            .toArray()
            .subscribe(
              n => expect(n.length).is.equal(0),
              done,
              () => {
                expect(readableStreamBuffer.on.withArgs('data').calledOnce).is.true;
                expect(readableStreamBuffer.on.withArgs('end').calledOnce).is.true;
                done();
              }
            );
        });
    });
    describe('emitted positions', () => {
      it('should do provide correct start end datas for \'a\\na\\naaaaa\'', done => {
        readableStreamBuffer.put('a\na\naaaaa');
        readableStreamBuffer.stop();
        splitter.observe()
          .map(mapDecimalJsToNumber)
          .toArray()
          .subscribe(
            n => {
              expect(n[0]).to.deep.equal({ start: 0, end: 1 });
              expect(n[1]).to.deep.equal({ start: 2, end: 3 });
              expect(n[2]).to.deep.equal({ start: 4, end: 9 });
            },
            done,
            done
          );
      });
      it('should do provide correct start end datas for \'a\\na\\naaaaa\'', done => {
        readableStreamBuffer.put('aa\nb');
        readableStreamBuffer.stop();
        splitter.observe()
          .map(mapDecimalJsToNumber)
          .toArray()
          .subscribe(
            n => {
              expect(n[0]).to.deep.equal({ start: 0, end: 2 });
              expect(n[1]).to.deep.equal({ start: 3, end: 4 });
            },
            done,
            done
          );
      });
      it('should provide 4 buffers (1 empty) correctly', done => {
        readableStreamBuffer.put('aa\nb\n\nc', 'utf8');
        readableStreamBuffer.stop();
        splitter.observe()
          .map(mapDecimalJsToNumber)
          .toArray()
          .subscribe(
            n => {
              expect(n.length).is.equal(4);
              expect(n[0]).to.deep.equal({ start: 0, end: 2 });
              expect(n[1]).to.deep.equal({ start: 3, end: 4 });
              expect(n[2]).to.deep.equal({ start: 5, end: 5 });
              expect(n[3]).to.deep.equal({ start: 6, end: 7 });
            },
            done,
            done
          );
      });
    });

    describe('chunk size stress test', () => {
      const items            = ['aa', 'bb', 'cc', '', 'dd'];
      const stringToSearchIn = `\n\n${items.join('\n\n')}\n\n`;
      const pattern          = '\n\n';
      [1, 2, 3, 4, 5].forEach(chunkSize => {
        describe(`chunkSize=${chunkSize}`, () => {
          beforeEach(() => {
            readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
              chunkSize // in bytes.
            });
            readableStreamBuffer.put(stringToSearchIn);
            readableStreamBuffer.stop();
            splitter = new Splitter({ stream: readableStreamBuffer, token: pattern });
          });
          it(`it should emit 6 (2 empty) items with chunkSize = ${chunkSize}`, done => {
            splitter.observe()
              .count()
              .subscribe(
                n => expect(n).to.be.equal(6),
                done,
                done
              );
          });
          items.filter(a => a !== '').forEach(item => {
            const reqStart = stringToSearchIn.indexOf(item);
            const reqEnd   = reqStart + item.length;
            it(`should emit at least one item for '${item}' having start = ${reqStart}, end = ${reqEnd}`, done => {
              splitter.observe()
                .filter(({ start, end }) => start.eq(reqStart) && end.eq(reqEnd))
                .count()
                .subscribe(
                  n => expect(n).to.be.equal(1),
                  done,
                  done
                );
            });
          });
        });
      });
    });
  });
});
