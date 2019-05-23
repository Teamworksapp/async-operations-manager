// TODO: JSDocify every function

import {
  ASYNC_OPERATION_STEPS,
} from '../constants';

import {
  getAsyncOperationInfo,
} from '../helpers';

import {
  getAsyncOperationsManagerState,
} from '../asyncOperationManagerUtils';

const createAsyncOperationInitialAction = (descriptorId, action) => {
  const state = getAsyncOperationsManagerState();
  const {
    asyncOperationParams: params,
    asyncOperationKey: key,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, action);

  return {
    ...action,
    type: descriptorId,
    descriptorId,
    params,
    key,
  };
};

const createAsyncOperationBeginAction = (descriptorId, action) => {
  return {
    ...action,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION,
    type: `AOM//BEGIN__${descriptorId}`,
  };
};

const createAsyncOperationResolveAction = (descriptorId, action) => {
  return {
    ...action,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION,
    type: `AOM//RESOLVE__${descriptorId}`,
  };
};

const createAsyncOperationRejectAction = (descriptorId, action) => {
  return {
    ...action,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION,
    type: `AOM//REJECT__${descriptorId}`,
  };
};

const getAsyncOperationResolveActionType = descriptorId => `AOM//RESOLVE__${descriptorId}`;

const getActionForAsyncOperation = (
  operation,
  extraParams = {},
) => {
  // We're going to pull out all the fields we recognize -- for both Read and Write operations --
  // and anything left over is assumed to be part of the action (i.e., any necessary IDs or params)
  const {
    fetchStatus,
    dataStatus,
    message,
    lastFetchStatusTime,
    lastDataStatusTime,
    descriptorId,
    ...otherProps
  } = operation;

  if (!descriptorId) {
    console.warn('AsyncOperation needs to include descriptorId so that we can re-dispatch it.', operation);
  }

  return {
    type: descriptorId,
    ...otherProps,
    ...extraParams,
  };
};

export {
  createAsyncOperationInitialAction,
  createAsyncOperationBeginAction,
  createAsyncOperationResolveAction,
  createAsyncOperationRejectAction,
  getAsyncOperationResolveActionType,
  getActionForAsyncOperation,
};
