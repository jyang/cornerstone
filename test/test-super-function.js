var assert = require('assert');
var csf = require('../src/cornerstone');

// function 1

function addBase(x) {
  return this.base + x;
};
addBase = addBase.bind({base: 10});

assert.equal(20, addBase(10));

// function 2

function subtractBase(x) {
  return x - this.base;
};
subtractBase = subtractBase.bind({base: 20});

assert.equal(-10, subtractBase(10));

// combined

function addBasePlusDelta(x) {
  return this.super(x) + this.delta;
};
addBasePlusDelta = addBasePlusDelta.bind({super: addBase, delta: 5});

assert.equal(18, addBasePlusDelta(3));
