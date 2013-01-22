var get = Ember.get, set = Ember.set, forEach = Ember.EnumerableUtils.forEach;

require("ember-data/system/model/model");

DS.Model.reopen({
  getHasMany: function(key, type, meta) {
    var data = get(this, 'data').hasMany,
        store = get(this, 'store'),
        ids, relationship,
        options = meta.options;

    if (typeof type === 'string') {
      type = get(this, type, false) || get(Ember.lookup, type);
    }

    //ids can be references or opaque token
    //(e.g. `{url: '/relationship'}`) that will be passed to the adapter
    ids = data[key];

    relationship = store.findMany(type, ids, this, meta);
    set(relationship, 'owner', this);
    set(relationship, 'name', key);
    set(relationship, 'isPolymorphic', options.polymorphic);

    return relationship;
  }
});

var hasRelationship = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany' };

  return Ember.computed(function(key, value) {
    return this.getHasMany(key, type, meta);
  }).property().meta(meta);
};

DS.hasMany = function(type, options) {
  Ember.assert("The type passed to DS.hasMany must be defined", !!type);
  return hasRelationship(type, options);
};

function clearUnmaterializedHasMany(record, relationship) {
  var store = get(record, 'store'),
      data = get(record, 'data').hasMany;

  var references = data[relationship.key];

  if (!references) { return; }

  var inverse = record.constructor.inverseFor(relationship.key);

  if (inverse) {
    forEach(references, function(reference) {
      var childRecord;

      if (childRecord = reference.record) {
        record.suspendRelationshipObservers(function() {
          set(childRecord, inverse.name, null);
        });
      }
    });
  }
}

DS.Model.reopen({
  clearHasMany: function(relationship) {
    var hasMany = this.cacheFor(relationship.name);

    if (hasMany) {
      hasMany.clear();
    } else {
      clearUnmaterializedHasMany(this, relationship);
    }
  }
});
