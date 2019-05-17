/* eslint-env jest */
import { expect } from 'chai';
import asyncOperationsManager, { reduxIntegration } from '../index';


describe('API', () => {
  it('should expose library as default export and integrations as named exports', () => {
    expect(reduxIntegration).to.exist;
    expect(asyncOperationsManager).to.exist;
  });
  it('should assert the correct library asyncOperationsManager API', () => {
    expect(asyncOperationsManager).to.have.all.keys(
      // CONFIG //
      'initializeWithOptions',
      'defaultLoggerOptions',

      // State API //
      'getAsyncOperationsManagerState',
      'clearAsyncOperationsManagerState',
      'setAsyncOperationsManagerState',

      // Operation & Decriptor API //
      'getAsyncOperation',
      'invalidateAsyncOperation',
      'getStateForOperationAfterStep',
      'registerAsyncOperationDescriptors',
      'shouldRunOperation',

      // CONSTANTS //
      'ASYNC_OPERATION_TYPES',
      'ASYNC_OPERATION_STEPS',
      'FETCH_STATUS',
      'DATA_STATUS',
    );
  });
  it('should assert the correct library reduxIntegration API', () => {
    expect(reduxIntegration).to.have.all.keys(
      'createAsyncOperationInitialAction',
      'createAsyncOperationBeginAction',
      'createAsyncOperationResolveAction',
      'createAsyncOperationRejectAction',
      'getAsyncOperationResolveActionType',
      'asyncOperationReducer',
      'getActionForAsyncOperation',
    );
  });
});
