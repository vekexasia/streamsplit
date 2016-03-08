import Splitter from '../core.class';
import FileUtils from '../utils/FileUtils.class';
import path from 'path';
import fs from 'fs';
import { Observable } from 'rx';

const splitToken = '\n--\n-- Table structure for table';
const splitTokenLength = splitToken.length;

export default function(fullFilePath) {
  return Splitter.split({
    stream        : fs.createReadStream(fullFilePath),
    token         : splitToken,
    noEmptyMatches: true
  })
    .flatMap(({ start, end }) => {
      return Observable.fromPromise(
        FileUtils.readChunkOfFile(
          fullFilePath,
          start - splitTokenLength,
          start - splitTokenLength + splitTokenLength * 4 // safe guess :)
        )
        )
        .flatMap(chunk => {
          const matches = /for table `(.*?)`/.exec(chunk.toString('utf8'));
          if (matches !== null && matches.length > 0) {
            return Observable.just(matches[1]);
          }
          return Observable.empty();
        })
        .flatMap(tableName => {
          const fileExt = path.extname(fullFilePath);
          return Observable.fromPromise(
            FileUtils.copyChunkOfFileToAnother(
              start - token.length,
              end,
              fullFilePath,
              path.join(
                path.dirname(fullFilePath),
                `${path.basename(fullFilePath, fileExt)}-${tableName}${fileExt}`
              )
            )
          );
        });
    });
};
