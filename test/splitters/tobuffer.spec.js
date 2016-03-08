import toBuffer from '../../src/splitters/tobuffer.js';
import { expect } from 'chai';
import streamBuffers from 'stream-buffers';
import sinon from 'sinon';
import { Observable } from 'rx';
/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions, no-new */

describe('toBuffer', () => {
  let readableStreamBuffer;
  beforeEach(() => {
    readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 10,   // in milliseconds.
      chunkSize: 5  // in bytes.
    });
  });


  describe('buffer generation', () => {
    let splitter;
    beforeEach(() => {
      splitter = toBuffer({ stream: readableStreamBuffer, token: '\n' });
    });
    it('should provide a buffer', done => {
      readableStreamBuffer.put('a', 'utf8');
      readableStreamBuffer.stop();
      splitter
        .subscribe(
          n => expect(n).to.be.an.instanceof(Buffer),
          done,
          done
        );
    });
    it('should provide a buffer with the given content', done => {
      readableStreamBuffer.put('a', 'utf8');
      readableStreamBuffer.stop();
      splitter
        .subscribe(
          n => expect(Buffer.compare(n, new Buffer('a'))).to.be.equal(0),
          done,
          done
        );
    });
    it('should provide 3 buffers with no token', done => {
      readableStreamBuffer.put('aa\nb\n\nc', 'utf8');
      readableStreamBuffer.stop();
      splitter
        .toArray()
        .subscribe(
          n => {
            expect(Buffer.compare(n[0], new Buffer('aa'))).to.be.equal(0);
            expect(Buffer.compare(n[1], new Buffer('b'))).to.be.equal(0);
            expect(Buffer.compare(n[2], new Buffer('c'))).to.be.equal(0);
          },
          done,
          done
        );
    });
    describe('empty chunks', () => {
      it('should handle correctly stream ending with token emitting only 2 items', done => {
        readableStreamBuffer.put('a\na\n');
        readableStreamBuffer.stop();
        splitter
          .toArray()
          .subscribe(
            n => {
              expect(n.length).to.be.equal(2);
              expect(Buffer.compare(n[0], new Buffer('a'))).to.deep.equal(0);
              expect(Buffer.compare(n[1], new Buffer('a'))).to.deep.equal(0);
            },
            done,
            done
          );
      });
      it('should handle correctly stream with empty token within', done => {
        readableStreamBuffer.put('a\n\na');
        readableStreamBuffer.stop();
        splitter
          .toArray()
          .subscribe(
            n => {
              expect(n.length).to.be.equal(2);
              expect(Buffer.compare(n[0], new Buffer('a'))).to.deep.equal(0);
              expect(Buffer.compare(n[1], new Buffer('a'))).to.deep.equal(0);
            },
            done,
            done
          );
      });

      it('should handle correctly stream starting with two tokens', done => {
        readableStreamBuffer.put('\n\na');
        readableStreamBuffer.stop();
        splitter
          .toArray()
          .subscribe(
            n => {
              expect(n.length).to.be.equal(1);
              expect(Buffer.compare(n[0], new Buffer('a'))).to.deep.equal(0);
            },
            done,
            done
          );
      });
    });
  });

  describe('chunk size stress test', () => {
    const items            = ['aa', 'bb', 'cc', '', 'dd'];
    const stringToSearchIn = `\n\n${items.join('\n\n')}\n\n`;
    const pattern          = '\n\n';
    let splitter;
    [1, 2, 3, 4, 5].forEach(chunkSize => {
      describe(`chunkSize=${chunkSize}`, () => {
        beforeEach(() => {
          readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
            chunkSize // in bytes.
          });
          readableStreamBuffer.put(stringToSearchIn);
          readableStreamBuffer.stop();
          splitter = toBuffer({ stream: readableStreamBuffer, token: pattern });
        });
        it(`it should emit 4 items with chunkSize = ${chunkSize}`, done => {
          splitter
            .count()
            .subscribe(
              n => expect(n).to.be.equal(4),
              done,
              done
            );
        });
        items.filter(a => a !== '').forEach(item => {
          const reqStart = stringToSearchIn.indexOf(item);
          const reqEnd   = reqStart + item.length;
          it(`should emit at least one item for '${item}' having start = ${reqStart}, end = ${reqEnd}`, done => {
            splitter
              .filter(buf => Buffer.compare(buf, new Buffer(item)) === 0)
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
