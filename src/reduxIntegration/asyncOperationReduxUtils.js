// TODO: JSDocify every function

import {
  omit,
  keys,
} from 'lodash';

import {
  ASYNC_OPERATION_STEPS,
} from '../constants';

import {
  getAsyncOperationInfo,
} from '../helpers';

import {
  getAsyncOperationsManagerState,
} from '../asyncOperationManagerUtils';

const pullParamsAndKeyFromAction = (descriptorId, action) => {
  const state = getAsyncOperationsManagerState();
  const {
    asyncOperationParams: params,
    asyncOperationKey: key,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, action);

  const actionWithoutParams = omit(action, keys(params));

  return {
    actionWithoutParams,
    params,
    key,
  };
};

const createAsyncOperationInitialAction = (descriptorId, action) => {
  const {
    actionWithoutParams,
    params,
    key,
  } = pullParamsAndKeyFromAction(descriptorId, action);

  const initialAsyncOperationAction = {
    ...actionWithoutParams,
    type: descriptorId,
    descriptorId,
    params,
    key,
  };

  return initialAsyncOperationAction;
};

const createAsyncOperationBeginAction = (descriptorId, action) => {
  const {
    actionWithoutParams,
    params,
    key,
  } = pullParamsAndKeyFromAction(descriptorId, action);

  return {
    ...actionWithoutParams,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION,
    type: `AOM//BEGIN__${descriptorId}`,
    params,
    key,
  };
};

const createAsyncOperationResolveAction = (descriptorId, action) => {
  const {
    actionWithoutParams,
    params,
    key,
  } = pullParamsAndKeyFromAction(descriptorId, action);

  return {
    ...actionWithoutParams,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION,
    type: `AOM//RESOLVE__${descriptorId}`,
    params,
    key,
  };
};

const createAsyncOperationRejectAction = (descriptorId, action) => {
  const {
    actionWithoutParams,
    params,
    key,
  } = pullParamsAndKeyFromAction(descriptorId, action);

  return {
    ...actionWithoutParams,
    descriptorId,
    operationStep: ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION,
    type: `AOM//REJECT__${descriptorId}`,
    params,
    key,
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
