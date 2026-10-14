'use strict';

/**
 * Entry file for `node --test tests/`.
 * Node 24 discovers tests through this file, so every suite is required here.
 */
require('./methods.test.js');
require('./problems.test.js');
require('./errors.test.js');
require('./rounding.test.js');
require('./presentation.test.js');
require('./integrity.test.js');
