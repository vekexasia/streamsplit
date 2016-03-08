import fs from 'fs';

class FileUtils {

  static copyChunkOfFileToAnother(start, end, sourceFile, endFile) {
    const opts       = { start, end: end - 1 };
    const copyStream = fs.createReadStream(sourceFile, opts);
    return new Promise((resolve, reject) => {
      copyStream.pipe(fs.createWriteStream(endFile));
      copyStream.on('end', () => resolve(endFile));
      copyStream.on('error', err => reject(err));
    });
  }

  static readChunkOfFileToBuff(file, start, end) {
    const buf = new Buffer(end - start);
    return new Promise((resolve, reject) => {
      fs.open(file, 'r', (err, fd) => {
        if (err) {
          return reject(err);
        }
        resolve(fd);
      });
    })
    // Read chunk!
      .then(fd => new Promise((resolve, reject) => {
        fs.read(fd, buf, 0, end - start, start, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(fd);
        });
      }))
      // close fd.
      .then(fd => new Promise((resolve, reject) => {
        fs.close(fd, err => {
          if (err) {
            return reject(err);
          }
          resolve(buf);
        });
      }));
  }
}

export default FileUtils;
