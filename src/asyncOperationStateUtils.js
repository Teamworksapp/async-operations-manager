
// TODO: JSDocify every function
import {
  pick,
  reduce,
  omitBy,
  forIn,
  get,
  keys,
  filter,
  isEmpty,
} from 'lodash';
import PropTypes from 'prop-types';

import asyncOperationManagerConfig from './config';

import {
  ASYNC_OPERATION_TYPES,
  WILDCARD,
  readAsyncOperationFieldsToPullFromParent,
} from './constants';

import {
  getAsyncOperationInfo,
  getAndValidateParams,
} from './helpers';

import {
  asyncOperationDescriptorPropType,
  asyncOperationPropType,
} from './types';

import {
  initialReadAsyncOperationForAction,
  initialWriteAsyncOperationForAction,
} from './asyncOperationUtils';

// // //
// // // These are all pure functions that return new or existing state or
// // // pieces of new or existing state from their inputs.
// // //

const updateAsyncOperationDescriptor = (state, descriptorOptions) => {
  const asyncOperationDescriptor = {
    debug: false,
    parentOperationDescriptorId: null,
    invalidatingOperationsDescriptorIds: null,
    alwaysImmutable: false,
    minCacheTime: 5000,
    maxCacheTime: 60000,
    requiredParams: {},
    ...descriptorOptions,
  };

  PropTypes.checkPropTypes(asyncOperationDescriptorPropType, asyncOperationDescriptor, 'prop', 'asyncOperationDescriptor');
  
  return {
    ...state,
    descriptors: {
      ...state.descriptors,
      [asyncOperationDescriptor.descriptorId]: asyncOperationDescriptor,
    },
  };
};

const createInvalidatedOperationState = (state, descriptorId, params) => {
  const nonWildcardParams = omitBy(params, param => param === WILDCARD);
  const matchingDescriptorIdOperations = filter(state.operations, operation => operation.descriptorId === descriptorId);

  if (isEmpty(matchingDescriptorIdOperations)) {
    return state;
  }

  const {
    asyncOperationDescriptor,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, params);

  const invalidatedOperations = reduce(matchingDescriptorIdOperations, (acc, operation) => {
    let paramMatchCount = 0;
    let invalidatedOperation;
    forIn(nonWildcardParams, (value, key) => {
      const {
        asyncOperationParams,
        asyncOperationKey,
      } = getAsyncOperationInfo(state.descriptors, descriptorId, operation);

      if (get(asyncOperationParams, key) === value) {
        paramMatchCount += 1;
        if (paramMatchCount === keys(nonWildcardParams).length) {
          invalidatedOperation = {
            [asyncOperationKey]: {
              ...operation,
              ...asyncOperationDescriptor.operationType === ASYNC_OPERATION_TYPES.READ
                ? initialReadAsyncOperationForAction(asyncOperationDescriptor.descriptorId, asyncOperationParams)
                : initialWriteAsyncOperationForAction(asyncOperationDescriptor.descriptorId, asyncOperationParams),
            },
          };
        }
      }
      return true;
    });

    if (invalidatedOperation) {
      return {
        ...acc,
        ...invalidatedOperation,
      };
    }

    return acc;
  }, {});

  const invalidatedOperationsState = {
    ...state,
    operations: {
      ...state.operations,
      ...invalidatedOperations,
    },
  };

  return invalidatedOperationsState;
};

// This function will do all the work to determine if an async operation is returned as an initial async operation
// (if it is not found in state), an asyncOperation with parentAsyncOperation metaData (recursively searched to find if the parentAsyncOperation is more
// up-to-date) or just the asyncOperation itself if the none of the above apply.
const getAsyncOperationFromState = ({
  state,
  asyncOperationKey,
  asyncOperationDescriptor,
  asyncOperationParams,
  fieldsToAdd,
}) => {
  const { operations, descriptors } = state;

  let parentAsyncOperation;
  const asyncOperation = operations[asyncOperationKey] || null;

  const config = asyncOperationManagerConfig.getConfig();
  const fieldsToAddToAction = {
    ...asyncOperationParams,
    ...fieldsToAdd,
    // key for the descriptor of the asyncOperation
    descriptorId: asyncOperationDescriptor.descriptorId,
  };

  if (asyncOperationDescriptor.debug) {
    config.logger.verboseLoggingCallback(`Inside getAsyncOperation for ${asyncOperationKey}`);
    config.logger.infoLoggingCallback('getAsyncOperation [Data Snapshot]:', {
      state,
      asyncOperationParams,
      asyncOperationDescriptor,
      asyncOperation,
      asyncOperationKey,
    });
  }

  if (asyncOperationDescriptor.parentOperationDescriptorId) {
    // grab key, descriptor, params, and async operation for parentAsyncOperation
    const {
      asyncOperationDescriptor: parentAsyncOperationDescriptor,
      asyncOperationKey: parentAsyncOperationKey,
    } = getAsyncOperationInfo(descriptors, asyncOperationDescriptor.parentOperationDescriptorId, asyncOperationParams);

    if (parentAsyncOperationDescriptor.operationType === ASYNC_OPERATION_TYPES.READ) {
      parentAsyncOperation = getAsyncOperationFromState({
        state,
        asyncOperationKey: parentAsyncOperationKey,
        asyncOperationDescriptor: parentAsyncOperationDescriptor,
        asyncOperationParams,
        fieldsToAdd: fieldsToAddToAction,
      });
    }
  }

  if (!asyncOperation) {
    if (asyncOperationDescriptor.debug) {
      config.logger.verboseLoggingCallback(`asyncOperation not found with given key: ${asyncOperationKey}. Defaulting to an initial asyncOperation`);
    }
    return asyncOperationDescriptor.operationType === ASYNC_OPERATION_TYPES.READ
      ? initialReadAsyncOperationForAction(asyncOperationDescriptor.descriptorId, fieldsToAddToAction, parentAsyncOperation)
      : initialWriteAsyncOperationForAction(asyncOperationDescriptor.descriptorId, fieldsToAddToAction);
  }

  // We want to determine whether or not to use that parentAsyncOperation metaData based on the
  // newness of it's data in comparison to the asyncOperation
  if (parentAsyncOperation) {
    return parentAsyncOperation.lastDataStatusTime.valueOf() >= asyncOperation.lastDataStatusTime.valueOf()
      ? {
        ...asyncOperation,
        // use parent async operation metaData (lastDataStatusTime, lastFetchStatusTime. etc...)
        ...pick(parentAsyncOperation, readAsyncOperationFieldsToPullFromParent),
      }
      : asyncOperation;
  }

  return asyncOperation;
};

const updateAsyncOperation = ({
  state,
  asyncOperation,
  descriptorId,
}) => {
  const {
    asyncOperationDescriptor,
    asyncOperationKey,
  } = getAsyncOperationInfo(state.descriptors, descriptorId, asyncOperation);

  const config = asyncOperationManagerConfig.getConfig();
  if (asyncOperationDescriptor.debug) {
    config.logger.verboseLoggingCallback(`Inside updateAsyncOperation for ${asyncOperationKey}`);
    config.logger.infoLoggingCallback('updateAsyncOperation [Data Snapshot]:', {
      asyncOperationDescriptor,
      asyncOperation,
      asyncOperationKey,
    });
  }

  PropTypes.checkPropTypes(asyncOperationPropType, asyncOperation, 'prop', 'asyncOperation');

  const updatedOperationsState = {
    ...state,
    operations: {
      ...state.operations,
      [asyncOperationKey]: asyncOperation,
    },
  };

  return updatedOperationsState;
};

const bulkUpdateAsyncOperations = (state, asyncOperationsList) => {
  return reduce(asyncOperationsList, (accumulator, { asyncOperation, descriptorId }) => {
    return updateAsyncOperation({
      state: accumulator,
      asyncOperation,
      descriptorId,
    });
  }, state);
};

export default {
  updateAsyncOperationDescriptor,

  updateAsyncOperation,
  bulkUpdateAsyncOperations,

  getAsyncOperationFromState,

  createInvalidatedOperationState,
};
