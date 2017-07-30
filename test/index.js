import test from 'ava';
import fn from '..';

test('start returns opts', t => {
    t.deepEqual(fn.start({a: '123'}), {a: '123'});
});
