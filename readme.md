# shelf [![Build Status](https://travis-ci.org/twistly/shelf.svg?branch=master)](https://travis-ci.org/twistly/shelf) [![Coverage Status](https://coveralls.io/repos/github/twistly/shelf/badge.svg?branch=master)](https://coveralls.io/github/twistly/shelf?branch=master)

> A webhosting manager


## Install

```
$ yarn add shelf
```


## Usage

```js
const shelf = require('shelf');

shelf.adduser({
    username: 'xo'
});
//=> 'Finished setting up user xo.'
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
$ yarn global add shelf
```

```
$ shelf --help

  Usage
    $ shelf [input]

  Options
    --foo    Lorem ipsum [Default: false]

  Examples
    $ shelf adduser xo
    Finished setting up user xo.

    $ shelf adddomain xo example.com
      Finished setting up domain example.com.
      Container running.
      done
```


## License

MIT © [Alexis Tyler](https://github.com/twistly/shelf)
