'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MongoStorageAdapter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _MongoCollection = require('./MongoCollection');

var _MongoCollection2 = _interopRequireDefault(_MongoCollection);

var _MongoSchemaCollection = require('./MongoSchemaCollection');

var _MongoSchemaCollection2 = _interopRequireDefault(_MongoSchemaCollection);

var _mongodbUrl = require('../../../vendor/mongodbUrl');

var _MongoTransform = require('./MongoTransform');

var transform = _interopRequireWildcard(_MongoTransform);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var MongoSchemaCollectionName = '_SCHEMA';
var DefaultMongoURI = 'mongodb://localhost:27017/parse';

var MongoStorageAdapter = exports.MongoStorageAdapter = function () {
  // Public

  function MongoStorageAdapter(_ref) {
    var _ref$uri = _ref.uri;
    var uri = _ref$uri === undefined ? DefaultMongoURI : _ref$uri;
    var _ref$collectionPrefix = _ref.collectionPrefix;
    var collectionPrefix = _ref$collectionPrefix === undefined ? '' : _ref$collectionPrefix;
    var _ref$mongoOptions = _ref.mongoOptions;
    var mongoOptions = _ref$mongoOptions === undefined ? {} : _ref$mongoOptions;

    _classCallCheck(this, MongoStorageAdapter);

    this._uri = uri;
    this._collectionPrefix = collectionPrefix;
    this._mongoOptions = mongoOptions;
  }
  // Private


  _createClass(MongoStorageAdapter, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      if (this.connectionPromise) {
        return this.connectionPromise;
      }

      // parsing and re-formatting causes the auth value (if there) to get URI
      // encoded
      var encodedUri = (0, _mongodbUrl.format)((0, _mongodbUrl.parse)(this._uri));

      this.connectionPromise = MongoClient.connect(encodedUri, this._mongoOptions).then(function (database) {
        _this.database = database;
      });
      return this.connectionPromise;
    }
  }, {
    key: 'collection',
    value: function collection(name) {
      var _this2 = this;

      return this.connect().then(function () {
        return _this2.database.collection(name);
      });
    }
  }, {
    key: 'adaptiveCollection',
    value: function adaptiveCollection(name) {
      var _this3 = this;

      return this.connect().then(function () {
        return _this3.database.collection(_this3._collectionPrefix + name);
      }).then(function (rawCollection) {
        return new _MongoCollection2.default(rawCollection);
      });
    }
  }, {
    key: 'schemaCollection',
    value: function schemaCollection() {
      var _this4 = this;

      return this.connect().then(function () {
        return _this4.adaptiveCollection(MongoSchemaCollectionName);
      }).then(function (collection) {
        return new _MongoSchemaCollection2.default(collection);
      });
    }
  }, {
    key: 'collectionExists',
    value: function collectionExists(name) {
      var _this5 = this;

      return this.connect().then(function () {
        return _this5.database.listCollections({ name: _this5._collectionPrefix + name }).toArray();
      }).then(function (collections) {
        return collections.length > 0;
      });
    }
  }, {
    key: 'dropCollection',
    value: function dropCollection(name) {
      return this.collection(this._collectionPrefix + name).then(function (collection) {
        return collection.drop();
      });
    }

    // Used for testing only right now.

  }, {
    key: 'allCollections',
    value: function allCollections() {
      var _this6 = this;

      return this.connect().then(function () {
        return _this6.database.collections();
      }).then(function (collections) {
        return collections.filter(function (collection) {
          if (collection.namespace.match(/\.system\./)) {
            return false;
          }
          return collection.collectionName.indexOf(_this6._collectionPrefix) == 0;
        });
      });
    }

    // Remove the column and all the data. For Relations, the _Join collection is handled
    // specially, this function does not delete _Join columns. It should, however, indicate
    // that the relation fields does not exist anymore. In mongo, this means removing it from
    // the _SCHEMA collection.  There should be no actual data in the collection under the same name
    // as the relation column, so it's fine to attempt to delete it. If the fields listed to be
    // deleted do not exist, this function should return successfully anyways. Checking for
    // attempts to delete non-existent fields is the responsibility of Parse Server.

    // Pointer field names are passed for legacy reasons: the original mongo
    // format stored pointer field names differently in the database, and therefore
    // needed to know the type of the field before it could delete it. Future database
    // adatpers should ignore the pointerFieldNames argument. All the field names are in
    // fieldNames, they show up additionally in the pointerFieldNames database for use
    // by the mongo adapter, which deals with the legacy mongo format.

    // This function is not obligated to delete fields atomically. It is given the field
    // names in a list so that databases that are capable of deleting fields atomically
    // may do so.

    // Returns a Promise.

  }, {
    key: 'deleteFields',
    value: function deleteFields(className, fieldNames, pointerFieldNames) {
      var _this7 = this;

      var nonPointerFieldNames = _lodash2.default.difference(fieldNames, pointerFieldNames);
      var mongoFormatNames = nonPointerFieldNames.concat(pointerFieldNames.map(function (name) {
        return '_p_' + name;
      }));
      var collectionUpdate = { '$unset': {} };
      mongoFormatNames.forEach(function (name) {
        collectionUpdate['$unset'][name] = null;
      });

      var schemaUpdate = { '$unset': {} };
      fieldNames.forEach(function (name) {
        schemaUpdate['$unset'][name] = null;
      });

      return this.adaptiveCollection(className).then(function (collection) {
        return collection.updateMany({}, collectionUpdate);
      }).then(function (updateResult) {
        return _this7.schemaCollection();
      }).then(function (schemaCollection) {
        return schemaCollection.updateSchema(className, schemaUpdate);
      });
    }
  }, {
    key: 'transform',
    get: function get() {
      return transform;
    }
  }]);

  return MongoStorageAdapter;
}();

exports.default = MongoStorageAdapter;

module.exports = MongoStorageAdapter; // Required for tests