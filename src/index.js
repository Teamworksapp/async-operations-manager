import {
  getAsyncOperationsManagerState,
  clearAsyncOperationsManagerState,
  setAsyncOperationsManagerState,

  getAsyncOperation,
  registerAsyncOperationDescriptors,
  getStateForOperationAfterStep,
  invalidateAsyncOperation,
  
  shouldRunOperation,
} from './asyncOperationManagerUtils';


import {
  ASYNC_OPERATION_TYPES,
  ASYNC_OPERATION_STEPS,
  FETCH_STATUS,
  DATA_STATUS,
  WILDCARD,
} from './constants';

import {
  defaultLoggerOptions,
} from './defaultLoggerOptions';

import asyncOperationManagerConfig from './config';

// export integration as named exports
export reduxIntegration from './reduxIntegration';

// This is the library as exposed to the consumer
export default {
  // CONFIG //
  initializeWithOptions: asyncOperationManagerConfig.setConfig,
  defaultLoggerOptions,

  // State API //
  getAsyncOperationsManagerState,
  clearAsyncOperationsManagerState,
  setAsyncOperationsManagerState,

  // Operation & Decriptor API //
  getAsyncOperation,
  invalidateAsyncOperation,
  getStateForOperationAfterStep,
  registerAsyncOperationDescriptors,
  shouldRunOperation,

  // CONSTANTS //
  ASYNC_OPERATION_TYPES,
  ASYNC_OPERATION_STEPS,
  FETCH_STATUS,
  DATA_STATUS,
  WILDCARD,
};
