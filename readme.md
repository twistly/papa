# shelf [![Build Status](https://travis-ci.org/twistly/shelf.svg?branch=master)](https://travis-ci.org/twistly/shelf) [![Coverage Status](https://coveralls.io/repos/github/twistly/shelf/badge.svg?branch=master)](https://coveralls.io/github/twistly/shelf?branch=master)

> A webhosting manager


## Install

```
$ npm install --save shelf
```


## Usage

```js
const shelf = require('shelf');

shelf('unicorns');
//=> 'unicorns & rainbows'
```


## API

### shelf(input, [options])

#### input

Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`<br>
Default: `false`

Lorem ipsum.


## CLI

```
$ npm install --global shelf
```

```
$ shelf --help

  Usage
    shelf [input]

  Options
    --foo  Lorem ipsum [Default: false]

  Examples
    $ shelf
    unicorns & rainbows
    $ shelf ponies
    ponies & rainbows
```


## License

MIT © [Alexis Tyler](https://github.com/twistly/shelf)
