'use strict';


/**
 * Find the given field in the given object.
 *
 * @param {Object} obj - The object to search through.
 * @param {String} field - The field name to search for.
 *
 * @returns {String|null} Either the field's value, or null if the field cannot be found in the object.
 */
function lookup(obj, field) {
  if (!obj) { return null; }

  var chain = field.split(']').join('').split('[');
  for (var i = 0, len = chain.length; i < len; i++) {
    var prop = obj[chain[i]];

    if (typeof(prop) === 'undefined') { return null; }
    if (typeof(prop) !== 'object') { return prop; }

    obj = prop;
  }

  return null;
}


/**
 * Expose the `lookup` function.
 */
module.exports = lookup;
