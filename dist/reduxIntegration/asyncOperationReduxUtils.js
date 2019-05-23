"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getActionForAsyncOperation = exports.getAsyncOperationResolveActionType = exports.createAsyncOperationRejectAction = exports.createAsyncOperationResolveAction = exports.createAsyncOperationBeginAction = exports.createAsyncOperationInitialAction = void 0;

var _lodash = require("lodash");

var _constants = require("../constants");

var _helpers = require("../helpers");

var _asyncOperationManagerUtils = require("../asyncOperationManagerUtils");

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var pullParamsAndKeyFromAction = function pullParamsAndKeyFromAction(descriptorId, action) {
  var state = (0, _asyncOperationManagerUtils.getAsyncOperationsManagerState)();

  var _getAsyncOperationInf = (0, _helpers.getAsyncOperationInfo)(state.descriptors, descriptorId, action),
      params = _getAsyncOperationInf.asyncOperationParams,
      key = _getAsyncOperationInf.asyncOperationKey;

  var actionWithoutParams = (0, _lodash.omit)(action, (0, _lodash.keys)(params));
  return {
    actionWithoutParams: actionWithoutParams,
    params: params,
    key: key
  };
};

var createAsyncOperationInitialAction = function createAsyncOperationInitialAction(descriptorId, action) {
  var _pullParamsAndKeyFrom = pullParamsAndKeyFromAction(descriptorId, action),
      actionWithoutParams = _pullParamsAndKeyFrom.actionWithoutParams,
      params = _pullParamsAndKeyFrom.params,
      key = _pullParamsAndKeyFrom.key;

  var initialAsyncOperationAction = _objectSpread({}, actionWithoutParams, {
    type: descriptorId,
    descriptorId: descriptorId,
    params: params,
    key: key
  });

  return initialAsyncOperationAction;
};

exports.createAsyncOperationInitialAction = createAsyncOperationInitialAction;

var createAsyncOperationBeginAction = function createAsyncOperationBeginAction(descriptorId, action) {
  var _pullParamsAndKeyFrom2 = pullParamsAndKeyFromAction(descriptorId, action),
      actionWithoutParams = _pullParamsAndKeyFrom2.actionWithoutParams,
      params = _pullParamsAndKeyFrom2.params,
      key = _pullParamsAndKeyFrom2.key;

  return _objectSpread({}, actionWithoutParams, {
    descriptorId: descriptorId,
    operationStep: _constants.ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION,
    type: "AOM//BEGIN__".concat(descriptorId),
    params: params,
    key: key
  });
};

exports.createAsyncOperationBeginAction = createAsyncOperationBeginAction;

var createAsyncOperationResolveAction = function createAsyncOperationResolveAction(descriptorId, action) {
  var _pullParamsAndKeyFrom3 = pullParamsAndKeyFromAction(descriptorId, action),
      actionWithoutParams = _pullParamsAndKeyFrom3.actionWithoutParams,
      params = _pullParamsAndKeyFrom3.params,
      key = _pullParamsAndKeyFrom3.key;

  return _objectSpread({}, actionWithoutParams, {
    descriptorId: descriptorId,
    operationStep: _constants.ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION,
    type: "AOM//RESOLVE__".concat(descriptorId),
    params: params,
    key: key
  });
};

exports.createAsyncOperationResolveAction = createAsyncOperationResolveAction;

var createAsyncOperationRejectAction = function createAsyncOperationRejectAction(descriptorId, action) {
  var _pullParamsAndKeyFrom4 = pullParamsAndKeyFromAction(descriptorId, action),
      actionWithoutParams = _pullParamsAndKeyFrom4.actionWithoutParams,
      params = _pullParamsAndKeyFrom4.params,
      key = _pullParamsAndKeyFrom4.key;

  return _objectSpread({}, actionWithoutParams, {
    descriptorId: descriptorId,
    operationStep: _constants.ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION,
    type: "AOM//REJECT__".concat(descriptorId),
    params: params,
    key: key
  });
};

exports.createAsyncOperationRejectAction = createAsyncOperationRejectAction;

var getAsyncOperationResolveActionType = function getAsyncOperationResolveActionType(descriptorId) {
  return "AOM//RESOLVE__".concat(descriptorId);
};

exports.getAsyncOperationResolveActionType = getAsyncOperationResolveActionType;

var getActionForAsyncOperation = function getActionForAsyncOperation(operation) {
  var extraParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // We're going to pull out all the fields we recognize -- for both Read and Write operations --
  // and anything left over is assumed to be part of the action (i.e., any necessary IDs or params)
  var fetchStatus = operation.fetchStatus,
      dataStatus = operation.dataStatus,
      message = operation.message,
      lastFetchStatusTime = operation.lastFetchStatusTime,
      lastDataStatusTime = operation.lastDataStatusTime,
      descriptorId = operation.descriptorId,
      otherProps = _objectWithoutProperties(operation, ["fetchStatus", "dataStatus", "message", "lastFetchStatusTime", "lastDataStatusTime", "descriptorId"]);

  if (!descriptorId) {
    console.warn('AsyncOperation needs to include descriptorId so that we can re-dispatch it.', operation);
  }

  return _objectSpread({
    type: descriptorId
  }, otherProps, extraParams);
};

exports.getActionForAsyncOperation = getActionForAsyncOperation;
//# sourceMappingURL=asyncOperationReduxUtils.js.map