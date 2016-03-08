import toJson from '../../src/splitters/tojson.js';
import { expect } from 'chai';
import streamBuffers from 'stream-buffers';
import sinon from 'sinon';
import { Observable } from 'rx';
/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions, no-new */
describe('toJSON', () => {
  let readableStreamBuffer;
  beforeEach(() => {
    readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 10,   // in milliseconds.
      chunkSize: 5  // in bytes.
    });
  });

  it('should emit no jsonobject', done => {
    readableStreamBuffer.stop();
    toJson({ stream: readableStreamBuffer })
      .subscribe(
        () => done(new Error('should not emit anything')),
        done,
        done
      );
  });
  it('should emit one item and one error if json is unparseable at some point', done => {
    readableStreamBuffer.push(JSON.stringify({ a: 2 }), 'utf8')
    readableStreamBuffer.push('\n', 'utf8')
    readableStreamBuffer.push(JSON.stringify({ a: 2 }).substr(1), 'utf8')
    readableStreamBuffer.stop();
    let emitted = false;
    toJson({ stream: readableStreamBuffer })
      .subscribe(
        () => emitted = true,
        e => {
          expect(emitted).to.be.true;
          done();
        }
      );
  });
  it('should emit jsonobjects', done => {
    readableStreamBuffer.push(JSON.stringify({ a: 2 }), 'utf8');
    readableStreamBuffer.stop();
    toJson({ stream: readableStreamBuffer })
      .subscribe(
        n => expect(n).to.deep.equal({ a: 2 }),
        done,
        done
      );
  });
  it('should use \\n as default token', done => {
    readableStreamBuffer.push(JSON.stringify({ a: 23 }), 'utf8');
    readableStreamBuffer.push('\n', 'utf8');
    readableStreamBuffer.push(JSON.stringify({ b: 2 }), 'utf8');

    readableStreamBuffer.stop();
    toJson({ stream: readableStreamBuffer })
      .count()
      .subscribe(
        n => expect(n).to.equal(2),
        done,
        done
      );
  });
  it('should use given split token', done => {
    readableStreamBuffer.push(JSON.stringify({ a: 23 }), 'utf8');
    readableStreamBuffer.push('@@@@', 'utf8');
    readableStreamBuffer.push(JSON.stringify({ b: 2 }), 'utf8');

    readableStreamBuffer.stop();
    toJson({ token: '@@@@', stream: readableStreamBuffer })
      .count()
      .subscribe(
        n => expect(n).to.equal(2),
        done,
        done
      );
  });
});
