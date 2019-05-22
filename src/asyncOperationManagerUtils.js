// TODO: JSDocify every function

// 
// This file contains the 'switchboard' logic to coordinate the various
// lower-level functions that update state. These functions are exposed
// to the consumer of the library.
//

import {
  isArray,
  isEmpty,
  reduce,
  has,
} from 'lodash';

import asyncOperationStateUtils from './asyncOperationStateUtils';
import asyncOperationManagerConfig from './config';
import { asyncOperationManagerState } from './asyncOperationManagerState';

import {
  beginReadAsyncOperation,
  beginWriteAsyncOperation,
  resolveReadAsyncOperation,
  resolveWriteAsyncOperation,
  rejectReadAsyncOperation,
  rejectWriteAsyncOperation,
} from './asyncOperationUtils';

import {
  getAsyncOperationInfo,
} from './helpers';

import {
  ASYNC_OPERATION_TYPES,
  ASYNC_OPERATION_STEPS,
  FETCH_STATUS,
} from './constants';

const getAsyncOperationsManagerState = asyncOperationManagerState.getState;
const clearAsyncOperationsManagerState = asyncOperationManagerState.clearState;
const setAsyncOperationsManagerState = asyncOperationManagerState.setState;

const registerAsyncOperationDescriptors = (asyncOperationDescriptors, ...otherDescriptors) => {
  let newState;
  const state = getAsyncOperationsManagerState();
  const config = asyncOperationManagerConfig.getConfig();

  if (!isEmpty(otherDescriptors)) {
    config.logger.exceptionsCallback(`
      You provided more than one argument to registerAsyncOperationDescriptors.
      You likely forgot to put multiple descriptors within an array`, new Error());
  }
  // handle array or single object arguments
  if (isArray(asyncOperationDescriptors)) {
    newState = reduce(asyncOperationDescriptors, (acc, asyncOperationDescriptor) => {
      return asyncOperationStateUtils.updateAsyncOperationDescriptor(acc, asyncOperationDescriptor);
    }, state);
  } else {
    newState = asyncOperationStateUtils.updateAsyncOperationDescriptor(state, asyncOperationDescriptors);
  }

  return asyncOperationManagerState.setState(newState);
};

const invalidateAsyncOperation = (descriptorId, params) => {
  const state = getAsyncOperationsManagerState();
  const newState = asyncOperationStateUtils.createInvalidatedOperationState(state, descriptorId, params);
  return asyncOperationManagerState.setState(newState);
};

const getAsyncOperation = (
  state,
  descriptorId,
  params,
  otherFields,
) => {
  const {
    asyncOperationDescriptor,
    asyncOperationParams,
    asyncOperationKey,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, params);

  // in case operation/descriptor state is initialized in userland we pass that through
  // to the library state.
  const newState = asyncOperationManagerState.setState(state);

  return asyncOperationStateUtils.getAsyncOperationFromState({
    state: newState,
    asyncOperationKey,
    asyncOperationDescriptor,
    asyncOperationParams,
    fieldsToAdd: otherFields,
  });
};

const shouldRunOperation = (descriptorId, params) => {
  const state = asyncOperationManagerState.getState();

  // @TODO: createAsyncOperationAction functions in reduxIntegration need to have another argument to specify AOM parameters
  // so we can place them in a params property on the action
  const actualParams = has(params, 'params') ? params.params : params;

  const {
    asyncOperationDescriptor,
    asyncOperationParams,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, actualParams);

  const asyncOperation = getAsyncOperation(
    state,
    descriptorId,
    asyncOperationParams,
  );

  if (asyncOperationDescriptor.operationType === ASYNC_OPERATION_TYPES.READ && asyncOperation.fetchStatus !== FETCH_STATUS.NULL) {
    return (Date.now() - asyncOperation.lastFetchStatusTime) >= asyncOperationDescriptor.minCacheTime;
  }

  return true;
};

// switchboard for resolving the Read operation steps
const readStepLookup = {
  [ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION]:
    asyncOperation => beginReadAsyncOperation(asyncOperation),
  [ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION]:
    asyncOperation => resolveReadAsyncOperation(asyncOperation),
  [ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION]:
    asyncOperation => rejectReadAsyncOperation(asyncOperation),
};

// switchboard for resolving Write operation steps
const writeStepLookup = {
  [ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION]:
    asyncOperation => beginWriteAsyncOperation(asyncOperation),
  [ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION]:
    asyncOperation => resolveWriteAsyncOperation(asyncOperation),
  [ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION]:
    asyncOperation => rejectWriteAsyncOperation(asyncOperation),
};

// first switchboard to transform an async operation
const transformTypeLookup = {
  [ASYNC_OPERATION_TYPES.READ]:
    (asyncOperation, asyncOperationStep) => readStepLookup[asyncOperationStep](asyncOperation),
  [ASYNC_OPERATION_TYPES.WRITE]:
    (asyncOperation, asyncOperationStep) => writeStepLookup[asyncOperationStep](asyncOperation),
};

// this function is called in the reducer (in redux integration)
const getStateForOperationAfterStep = (state, asyncOperationStep, descriptorId, params) => {
  // in case operation/descriptor state is initialized in userland we pass that through
  // to the library state.
  let newState = setAsyncOperationsManagerState(state);

  const {
    asyncOperationDescriptor,
    asyncOperationParams,
    otherFields,
  } = getAsyncOperationInfo(newState.descriptors, descriptorId, params);

  // descriptor asyncOperationStep callbacks
  switch (asyncOperationStep) {
    case ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION:
      if (asyncOperationDescriptor.onBegin) {
        asyncOperationDescriptor.onBegin(asyncOperationParams);
      }
      break;
    case ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION:
      if (asyncOperationDescriptor.onResolve) {
        asyncOperationDescriptor.onResolve(asyncOperationParams);
      }
      break;
    case ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION:
      if (asyncOperationDescriptor.onReject) {
        asyncOperationDescriptor.onReject(asyncOperationParams);
      }
      break;
    default:
      break;
  }

  // If any of the asyncOperationStep callbacks changed the state we want to grab the latest state
  newState = getAsyncOperationsManagerState();

  const asyncOperationToTranform = getAsyncOperation(
    newState,
    descriptorId,
    asyncOperationParams,
    otherFields,
  );

  const newAsyncOperation = transformTypeLookup[asyncOperationDescriptor.operationType](asyncOperationToTranform, asyncOperationStep);

  newState = asyncOperationStateUtils.updateAsyncOperation({
    state: newState,
    asyncOperation: newAsyncOperation,
    params: asyncOperationParams,
    descriptorId,
  });

  return asyncOperationManagerState.setState(newState);
};

export {
  getAsyncOperationsManagerState,
  clearAsyncOperationsManagerState,
  setAsyncOperationsManagerState,

  getAsyncOperation,
  invalidateAsyncOperation,
  registerAsyncOperationDescriptors,
  getStateForOperationAfterStep,

  shouldRunOperation,
};
