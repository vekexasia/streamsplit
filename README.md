# streamsplit

[![Travis](https://img.shields.io/travis/vekexasia/streamsplit.svg?style=flat-square)]() [![npm](https://img.shields.io/npm/l/streamsplit.svg?style=flat-square)]() [![npm](https://img.shields.io/npm/v/streamsplit.svg?style=flat-square)]() [![npm](https://img.shields.io/npm/dt/streamsplit.svg?style=flat-square)]() [![Coveralls](https://img.shields.io/coveralls/vekexasia/streamsplit.svg?style=flat-square)]() [![node](https://img.shields.io/node/v/streamsplit.svg?style=flat-square)]()

**streamsplit**. is a Reactive Programming ([rx](https://www.npmjs.com/package/rx)) module which provides a straight-forward and both memory & CPU efficient way to split [readable streams](https://nodejs.org/api/stream.html#stream_class_stream_readable) into chunks of data.

This module was built with the main goal of splitting a large MySQL dump `.sql` file into multiple files (one per each table). ( npm -> `mysqldumpslit` )

Thanks to the great [streamsearch](https://www.npmjs.com/package/streamsearch) library which uses the *Boyer-Moore-Horspool* algorithm (the same used in the Unix `grep` command) the token search is blazing fast and have a very low memory footprint.

This library contains several splitters that will `emit` an item each time a chunk between the split token is found. 

The Module is written in ES6 transpiled using the wonderful Babel library. 

## Requirements

 - node.js - v0.12 or newer!   

## Installation

    npm install streamsplit

### Basic Usage

#### Base splitter

```javascript
import StreamSplit from 'streamsplit';

const readStream = getReadableStreamSomehow();
const splitToken = '\n';

StreamSplit.split({
  stream: readStream,
  token: splitToken
}).subscribe(
  range => {
    console.log(`start: ${range.start}, end: ${range.end}`);
  }
);
```

Assuming `readStream` contains `a\nbb\nc`, the code above will output:

```
start: 0, end: 1
start: 2, end: 4
start: 5, end: 6
```

#### Buffer splitter

The Buffer splitter uses the Base splitter but instead of emitting ranges of start+end it will provide a buffer for each chunk. Using it is pretty straight forward:

```javascript

import toBuffSplit from 'streamsplit/dist/splitters/tobuffer';

const readStream = getReadableStreamSomehow();
const splitToken = '\n';

toBuffSplit({
  stream: readStream,
  token: splitToken
}).subscribe(
  buf => {
    console.log(`Buf: '${buf.toString('utf8')}'`);
  }
);
```

Assuming `readStream` contains `a\nbb\nc`, the code above will output:

```
Buf: 'a'
Buf: 'bb'
Buf: 'c'
```

**Note**: The buffer splitter is memory efficient but if you expect large chunk of data between every split token avoid using it :)

### JSON Splitter

Sometimes you have a stream of data which contains several JSON items. for example, if you've a stream "containing":
```
{"iam": "great"}
{"and": "you"}
{"know": "it"}
```

Aka a stream containing a json per each line; you could parse it using:
```javascript

import toJsonSplit from 'streamsplit/dist/splitters/tojson';

const readStream = getReadableStreamSomehow();
const splitToken = '\n';

toJsonSplit({
  stream: readStream,
  token: splitToken
}).subscribe(
  obj => {
    console.log(`Obj: ',obj);
  }
);
```
And you'll get it parsed for you.


### Need something different?

Thanks to the powerful Rx operators you can manipulate the data the way you prefer.

Lets say you've a very magical stream of data consisting in base64 encoded PNGs separated by a fictional (but magical) separator `-LOL-LIMEWIRE+NYAN-CAT-`, you could do the following to get the original image data back

```javascript
import toBuffSplit from 'streamsplit/dist/splitters/tobuffer';

const readStream = getReadableStreamSomehow();
const splitToken = '-LOL-LIMEWIRE+NYAN-CAT-';

toBuffSplit({
  stream: readStream,
  token: splitToken
})
  .map(base64Buf => new Buffer(base64Buf, 'base64'))
  .subscribe(
    imageData => {
      // imageData contains a single image contente buffer.
    }
  );
```


Lets say youve a stream of mixed data separated by ";". Every 'piece' might contain:
 - a number
 - a string

Ex: '10;lol;haha;13;12;love you!;....

And you want to fetch only the *even* numbers; then:
 

```javascript
import toBuffSplit from 'streamsplit/dist/splitters/tobuffer';

const readStream = getReadableStreamSomehow();

toBuffSplit({
  stream: readStream,
  token: ';'
})
  .map(buf => buf.toString('utf8')) // convert buf to string!
  .filter(item => !isNaN(item)) // filter out strings!
  .map(parseFloat) // remap item from "string representation of a number" to Number
  .filter(n => n % 2 == 0) // filter out odd numbers.
  .subscribe(
    evenNumber => {
      // ..
    }
  );
```

If you're unfamiliar with the RX world I suggest you take a look at [Getting started with Rx](https://github.com/Reactive-Extensions/RxJS/tree/master/doc#getting-started-with-rxjs)

