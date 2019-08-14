"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = require("lodash");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _config = _interopRequireDefault(require("./config"));

var _constants = require("./constants");

var _helpers = require("./helpers");

var _types = require("./types");

var _asyncOperationUtils = require("./asyncOperationUtils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// // //
// // // These are all pure functions that return new or existing state or
// // // pieces of new or existing state from their inputs.
// // //
var updateAsyncOperationDescriptor = function updateAsyncOperationDescriptor(state, descriptorOptions) {
  var asyncOperationDescriptor = _objectSpread({
    debug: false,
    parentOperationDescriptorId: null,
    invalidatingOperationsDescriptorIds: null,
    alwaysImmutable: false,
    minCacheTime: 5000,
    maxCacheTime: 60000,
    requiredParams: {}
  }, descriptorOptions);

  _propTypes.default.checkPropTypes(_types.asyncOperationDescriptorPropType, asyncOperationDescriptor, 'prop', 'asyncOperationDescriptor');

  return _objectSpread({}, state, {
    descriptors: _objectSpread({}, state.descriptors, _defineProperty({}, asyncOperationDescriptor.descriptorId, asyncOperationDescriptor))
  });
};

var createInvalidatedOperationState = function createInvalidatedOperationState(state, descriptorId, params) {
  var nonWildcardParams = (0, _lodash.omitBy)(params, function (param) {
    return param === _constants.WILDCARD;
  });
  var matchingDescriptorIdOperations = (0, _lodash.filter)(state.operations, function (operation) {
    return operation.descriptorId === descriptorId;
  });

  if ((0, _lodash.isEmpty)(matchingDescriptorIdOperations)) {
    return state;
  }

  var _getAsyncOperationInf = (0, _helpers.getAsyncOperationInfo)(state.descriptors, descriptorId, params),
      asyncOperationDescriptor = _getAsyncOperationInf.asyncOperationDescriptor;

  var invalidatedOperations = (0, _lodash.reduce)(matchingDescriptorIdOperations, function (acc, operation) {
    var paramMatchCount = 0;
    var invalidatedOperation;
    (0, _lodash.forIn)(nonWildcardParams, function (value, key) {
      var _getAsyncOperationInf2 = (0, _helpers.getAsyncOperationInfo)(state.descriptors, descriptorId, operation),
          asyncOperationParams = _getAsyncOperationInf2.asyncOperationParams,
          asyncOperationKey = _getAsyncOperationInf2.asyncOperationKey;

      if ((0, _lodash.isEqual)((0, _lodash.get)(asyncOperationParams, key), value)) {
        paramMatchCount += 1;

        if (paramMatchCount === (0, _lodash.keys)(nonWildcardParams).length) {
          invalidatedOperation = _defineProperty({}, asyncOperationKey, _objectSpread({}, operation, asyncOperationDescriptor.operationType === _constants.ASYNC_OPERATION_TYPES.READ ? (0, _asyncOperationUtils.initialReadAsyncOperationForAction)(asyncOperationDescriptor.descriptorId, asyncOperationParams) : (0, _asyncOperationUtils.initialWriteAsyncOperationForAction)(asyncOperationDescriptor.descriptorId, asyncOperationParams)));
        }
      }

      return true;
    });

    if (invalidatedOperation) {
      return _objectSpread({}, acc, invalidatedOperation);
    }

    return acc;
  }, {});

  var invalidatedOperationsState = _objectSpread({}, state, {
    operations: _objectSpread({}, state.operations, invalidatedOperations)
  });

  return invalidatedOperationsState;
}; // This function will do all the work to determine if an async operation is returned as an initial async operation
// (if it is not found in state), an asyncOperation with parentAsyncOperation metaData (recursively searched to find if the parentAsyncOperation is more
// up-to-date) or just the asyncOperation itself if the none of the above apply.


var getAsyncOperationFromState = function getAsyncOperationFromState(_ref) {
  var state = _ref.state,
      asyncOperationKey = _ref.asyncOperationKey,
      asyncOperationDescriptor = _ref.asyncOperationDescriptor,
      asyncOperationParams = _ref.asyncOperationParams,
      fieldsToAdd = _ref.fieldsToAdd;
  var operations = state.operations,
      descriptors = state.descriptors;
  var parentAsyncOperation;
  var asyncOperation = operations[asyncOperationKey] || null;

  var config = _config.default.getConfig();

  var fieldsToAddToAction = _objectSpread({}, asyncOperationParams, fieldsToAdd, {
    // key for the descriptor of the asyncOperation
    descriptorId: asyncOperationDescriptor.descriptorId
  });

  if (asyncOperationDescriptor.debug) {
    config.logger.verboseLoggingCallback("Inside getAsyncOperation for ".concat(asyncOperationKey));
    config.logger.infoLoggingCallback('getAsyncOperation [Data Snapshot]:', {
      state: state,
      asyncOperationParams: asyncOperationParams,
      asyncOperationDescriptor: asyncOperationDescriptor,
      asyncOperation: asyncOperation,
      asyncOperationKey: asyncOperationKey
    });
  }

  if (asyncOperationDescriptor.parentOperationDescriptorId) {
    // grab key, descriptor, params, and async operation for parentAsyncOperation
    var _getAsyncOperationInf3 = (0, _helpers.getAsyncOperationInfo)(descriptors, asyncOperationDescriptor.parentOperationDescriptorId, asyncOperationParams),
        parentAsyncOperationDescriptor = _getAsyncOperationInf3.asyncOperationDescriptor,
        parentAsyncOperationKey = _getAsyncOperationInf3.asyncOperationKey;

    if (parentAsyncOperationDescriptor.operationType === _constants.ASYNC_OPERATION_TYPES.READ) {
      parentAsyncOperation = getAsyncOperationFromState({
        state: state,
        asyncOperationKey: parentAsyncOperationKey,
        asyncOperationDescriptor: parentAsyncOperationDescriptor,
        asyncOperationParams: asyncOperationParams,
        fieldsToAdd: fieldsToAddToAction
      });
    }
  }

  if (!asyncOperation) {
    if (asyncOperationDescriptor.debug) {
      config.logger.verboseLoggingCallback("asyncOperation not found with given key: ".concat(asyncOperationKey, ". Defaulting to an initial asyncOperation"));
    }

    return asyncOperationDescriptor.operationType === _constants.ASYNC_OPERATION_TYPES.READ ? (0, _asyncOperationUtils.initialReadAsyncOperationForAction)(asyncOperationDescriptor.descriptorId, fieldsToAddToAction, parentAsyncOperation) : (0, _asyncOperationUtils.initialWriteAsyncOperationForAction)(asyncOperationDescriptor.descriptorId, fieldsToAddToAction);
  } // We want to determine whether or not to use that parentAsyncOperation metaData based on the
  // newness of it's data in comparison to the asyncOperation


  if (parentAsyncOperation) {
    return parentAsyncOperation.lastDataStatusTime.valueOf() >= asyncOperation.lastDataStatusTime.valueOf() ? _objectSpread({}, asyncOperation, (0, _lodash.pick)(parentAsyncOperation, _constants.readAsyncOperationFieldsToPullFromParent)) : asyncOperation;
  }

  return asyncOperation;
};

var updateAsyncOperation = function updateAsyncOperation(_ref2) {
  var state = _ref2.state,
      asyncOperation = _ref2.asyncOperation,
      descriptorId = _ref2.descriptorId;

  var _getAsyncOperationInf4 = (0, _helpers.getAsyncOperationInfo)(state.descriptors, descriptorId, asyncOperation),
      asyncOperationDescriptor = _getAsyncOperationInf4.asyncOperationDescriptor,
      asyncOperationKey = _getAsyncOperationInf4.asyncOperationKey;

  var config = _config.default.getConfig();

  if (asyncOperationDescriptor.debug) {
    config.logger.verboseLoggingCallback("Inside updateAsyncOperation for ".concat(asyncOperationKey));
    config.logger.infoLoggingCallback('updateAsyncOperation [Data Snapshot]:', {
      asyncOperationDescriptor: asyncOperationDescriptor,
      asyncOperation: asyncOperation,
      asyncOperationKey: asyncOperationKey
    });
  }

  _propTypes.default.checkPropTypes(_types.asyncOperationPropType, asyncOperation, 'prop', 'asyncOperation');

  var updatedOperationsState = _objectSpread({}, state, {
    operations: _objectSpread({}, state.operations, _defineProperty({}, asyncOperationKey, asyncOperation))
  });

  return updatedOperationsState;
};

var bulkUpdateAsyncOperations = function bulkUpdateAsyncOperations(state, asyncOperationsList) {
  return (0, _lodash.reduce)(asyncOperationsList, function (accumulator, _ref3) {
    var asyncOperation = _ref3.asyncOperation,
        descriptorId = _ref3.descriptorId;
    return updateAsyncOperation({
      state: accumulator,
      asyncOperation: asyncOperation,
      descriptorId: descriptorId
    });
  }, state);
};

var _default = {
  updateAsyncOperationDescriptor: updateAsyncOperationDescriptor,
  updateAsyncOperation: updateAsyncOperation,
  bulkUpdateAsyncOperations: bulkUpdateAsyncOperations,
  getAsyncOperationFromState: getAsyncOperationFromState,
  createInvalidatedOperationState: createInvalidatedOperationState
};
exports.default = _default;
//# sourceMappingURL=asyncOperationStateUtils.js.map