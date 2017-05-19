import toBuffer from './tobuffer.js';
import extend from 'extend';
import { Observable } from 'rxjs';
/**
 * Creates a splitter that emits chunks of data in the form of a JSON Object.
 * By default token is '\n' and can be undefined when calling this.
 * @param {object} params the constructor params for the Splitter
 * @returns {Observable.<object>}
 */
export default function (params) {
  return toBuffer(extend({ token: '\n' }, params))
    .flatMap(buf => {
      try {
        return Observable.of(JSON.parse(buf));
      } catch (e) {
        return Observable.throw(e);
      }
    });
}
