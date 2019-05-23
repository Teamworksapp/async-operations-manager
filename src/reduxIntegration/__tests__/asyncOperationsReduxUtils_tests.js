/* eslint-env jest */
import { expect } from 'chai';
import sinon from 'sinon';

import asyncOperationManagerConfig from '../../config';

import {
  createAsyncOperationInitialAction,
} from '../asyncOperationReduxUtils';

import {
  clearAsyncOperationsManagerState,
  registerAsyncOperationDescriptors,
} from '../../asyncOperationManagerUtils';


describe('asyncOperationReduxUtils', () => {
  beforeEach(() => {
    asyncOperationManagerConfig.setConfig({
      logger: {
        exceptionsCallback: sinon.spy(),
      },
    });

    clearAsyncOperationsManagerState();
  });

  describe('createAsyncOperationInitialAction', () => {
    it('should create an initial async operation action with a params prop', () => {
      registerAsyncOperationDescriptors({
        descriptorId: 'CREATE_PERSON_REQUEST',
        requiredParams: ['teamId'],
        operationType: 'WRITE',
      });

      const initialAsyncOperationAction = createAsyncOperationInitialAction(
        'CREATE_PERSON_REQUEST', {
          teamId: 3,
          fieldValues: {
            name: 'Darien',
            title: 'Developer',
          },
          configContainer: {},
          promiseCallbacks: {},
        },
      );

      expect(initialAsyncOperationAction).to.deep.include({
        params: {
          teamId: 3,
        },
      });
    });
  });
});
