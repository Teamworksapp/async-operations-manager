/* eslint-env jest */
import { expect } from 'chai';

import {
  getAsyncOperationsManagerState,
  setAsyncOperationsManagerState,
  registerAsyncOperationDescriptors,
  getStateForOperationAfterStep,
  invalidateAsyncOperation,
  shouldRunOperation,
} from '../asyncOperationManagerUtils';

import { ASYNC_OPERATION_STEPS } from '../constants';

import {
  asyncOperationManagerState,
} from '../asyncOperationManagerState';

const initialState = {
  operations: {},
  descriptors: {},
};

describe('asyncOperationManagerUtils', () => {
  let state;
  beforeEach(() => {
    asyncOperationManagerState.clearState();
    state = initialState;
  });
  describe('registerAsyncOperationDescriptors', () => {
    it('should accept object argument to register one async operation decriptor to state', () => {
      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_ALL_BEVERAGES_FOR_ORG',
          requiredParams: ['orgId'],
          operationType: 'READ',
        },
      );

      const { descriptors: registeredAsyncDescriptors } = getAsyncOperationsManagerState(state);
      expect(Object.keys(registeredAsyncDescriptors)).to.have.lengthOf(1);
      expect(registeredAsyncDescriptors).to.have.all.keys('FETCH_ALL_BEVERAGES_FOR_ORG');
    });

    it('should accept array argument to register multiple async operation descriptors to state', () => {
      registerAsyncOperationDescriptors([
        {
          descriptorId: 'FETCH_ALL_BEVERAGES_FOR_ORG',
          requiredParams: ['orgId'],
          operationType: 'READ',
        },
        {
          descriptorId: 'DRINK_BEVERAGE_BY_ID_FOR_ORG',
          requiredParams: ['orgId', 'beverageId'],
          operationType: 'WRITE',
        },
      ]);

      const { descriptors: registeredAsyncDescriptors } = getAsyncOperationsManagerState(state);
      expect(Object.keys(registeredAsyncDescriptors)).to.have.lengthOf(2);
      expect(registeredAsyncDescriptors).to.have.all.keys('FETCH_ALL_BEVERAGES_FOR_ORG', 'DRINK_BEVERAGE_BY_ID_FOR_ORG');
    });
  });

  describe('getAsyncOperationDescriptor', () => {
    it('should successfully return a registered asyncOperationDescriptor', () => {
      registerAsyncOperationDescriptors({
        descriptorId: 'FETCH_PERSON_DATA_BY_ID',
        requiredParams: ['personId'],
        operationType: 'READ',
        // optional values
        parentAsyncOperation: 'FETCH_ALL_PERSON_DATA',
        debug: false,
        alwaysImmutable: false,
        minCacheTime: 5000,
        maxCacheTime: 60000,
      });

      const { descriptors: registeredAsyncDescriptors } = getAsyncOperationsManagerState(state);
      const asyncOperationDescriptor = registeredAsyncDescriptors.FETCH_PERSON_DATA_BY_ID;
      expect(asyncOperationDescriptor).to.be.an('object');
      expect(asyncOperationDescriptor).to.matchSnapshot('well formed async operation descriptor');
    });
  });

  describe('getStateForOperationAfterStep', () => {
    beforeEach(() => {
      const dateNowStub = jest.fn(() => 1530518207007);
      global.Date.now = dateNowStub;
    });

    it('should return an object containing only operations and descriptors keys', () => {
      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_PERSON_DATA',
          requiredParams: ['personId'],
          operationType: 'READ',
        },
      );

      const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION, 'FETCH_PERSON_DATA', { personId: 111 });
      expect(newOperationsState).to.have.all.keys('operations', 'descriptors');
      expect(newOperationsState).to.matchSnapshot('state with only operations and descriptors keys');
    });

    describe('READ async operations', () => {
      it('should update state to read show async operation as pending state from initial state', () => {
        registerAsyncOperationDescriptors(
          {
            descriptorId: 'FETCH_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'READ',
          },
        );

        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION, 'FETCH_PERSON_DATA', { personId: 111 });
        expect(newOperationsState).to.nested.include({ 'operations.FETCH_PERSON_DATA_111.fetchStatus': 'PENDING' });
        expect(newOperationsState).to.matchSnapshot('updated state showing begun read async operation');
      });

      it('should update state to read show async operation as successful state from pending state', () => {
        state = {
          operations: {
            FETCH_PERSON_DATA_111: {
              descriptorId: 'FETCH_PERSON_DATA',
              fetchStatus: 'PENDING',
              dataStatus: 'ABSENT',
              message: null,
              lastFetchStatusTime: 0,
              lastDataStatusTime: 0,
              params: { personId: 111 },
              key: 'FETCH_PERSON_DATA_111',
            },
          },
        };

        registerAsyncOperationDescriptors(
          {
            descriptorId: 'FETCH_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'READ',
          },
        );

        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION, 'FETCH_PERSON_DATA', { personId: 111 });

        expect(newOperationsState).to.nested.include({ 'operations.FETCH_PERSON_DATA_111.fetchStatus': 'SUCCESSFUL' });
        expect(newOperationsState).to.matchSnapshot('updated state showing successful read async operation');
      });

      it('should update state to read show async operation as failed state from pending state', () => {
        state = {
          operations: {
            FETCH_PERSON_DATA_111: {
              descriptorId: 'FETCH_PERSON_DATA',
              fetchStatus: 'PENDING',
              dataStatus: 'ABSENT',
              message: null,
              lastFetchStatusTime: 0,
              lastDataStatusTime: 0,
              params: { personId: 111 },
              key: 'FETCH_PERSON_DATA_111',
            },
          },
        };

        registerAsyncOperationDescriptors(
          {
            descriptorId: 'FETCH_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'READ',
          },
        );

        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION, 'FETCH_PERSON_DATA', { personId: 111 });
        expect(newOperationsState).to.nested.include({ 'operations.FETCH_PERSON_DATA_111.fetchStatus': 'FAILED' });
        expect(newOperationsState).to.matchSnapshot('updated state showing rejected async operation');
      });
    });

    describe('WRITE async operations', () => {
      it('should update state to show write async operation as pending state from initial state', () => {
        registerAsyncOperationDescriptors(
          {
            descriptorId: 'UPDATE_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'WRITE',
          },
        );
  
        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.BEGIN_ASYNC_OPERATION, 'UPDATE_PERSON_DATA', { personId: 111 });
        expect(newOperationsState).to.nested.include({ 'operations.UPDATE_PERSON_DATA_111.fetchStatus': 'PENDING' });
        expect(newOperationsState).to.matchSnapshot('updated state showing pending write async operation');
      });
  
      it('should update state to show write async operation as successful state from pending state', () => {
        state = {
          operations: {
            UPDATE_PERSON_DATA_111: {
              descriptorId: 'UPDATE_PERSON_DATA',
              fetchStatus: 'PENDING',
              message: null,
              lastFetchStatusTime: 0,
              lastDataStatusTime: 0,
              params: { personId: 111 },
              key: 'UPDATE_PERSON_DATA_111',
            },
          },
        };
  
        registerAsyncOperationDescriptors(
          {
            descriptorId: 'UPDATE_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'WRITE',
          },
        );
  
        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.RESOLVE_ASYNC_OPERATION, 'UPDATE_PERSON_DATA', { personId: 111 });
        expect(newOperationsState).to.nested.include({ 'operations.UPDATE_PERSON_DATA_111.fetchStatus': 'SUCCESSFUL' });
        expect(newOperationsState).to.matchSnapshot('updated state showing successful write async operation');
      });

      it('should update state to show write async operation as failed state from pending state', () => {
        state = {
          operations: {
            UPDATE_PERSON_DATA_111: {
              descriptorId: 'UPDATE_PERSON_DATA',
              fetchStatus: 'PENDING',
              message: null,
              lastFetchStatusTime: 0,
              lastDataStatusTime: 0,
              params: { personId: 111 },
              key: 'UPDATE_PERSON_DATA_111',
            },
          },
        };
  
        registerAsyncOperationDescriptors(
          {
            descriptorId: 'UPDATE_PERSON_DATA',
            requiredParams: ['personId'],
            operationType: 'WRITE',
          },
        );
  
        const newOperationsState = getStateForOperationAfterStep(state, ASYNC_OPERATION_STEPS.REJECT_ASYNC_OPERATION, 'UPDATE_PERSON_DATA', { personId: 111 });
        expect(newOperationsState).to.nested.include({ 'operations.UPDATE_PERSON_DATA_111.fetchStatus': 'FAILED' });
        expect(newOperationsState).to.matchSnapshot('updated state showing failed write async operation');
      });
    });
  });

  describe('invalidateAsyncOperation', () => {
    it('should invalidate an asyncOperation with params', () => {
      state = {
        operations: {
          FETCH_CALENDAR_DATA_33: {
            descriptorId: 'FETCH_CALENDAR_DATA',
            fetchStatus: 'SUCCESSFUL',
            dataStatus: 'PRESENT',
            message: null,
            lastFetchStatusTime: '2018-09-01T19:12:46.189Z',
            lastDataStatusTime: '2018-09-01T19:12:53.189Z',
            params: { orgId: 33 },
            key: 'FETCH_CALENDAR_DATA_33',
          },
        },
      };

      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_CALENDAR_DATA',
          requiredParams: ['orgId'],
          operationType: 'READ',
        },
      );

      setAsyncOperationsManagerState(state);

      const newState = invalidateAsyncOperation('FETCH_CALENDAR_DATA', { orgId: 33 });
      expect(newState.operations.FETCH_CALENDAR_DATA_33).to.deep.include({
        lastFetchStatusTime: 0,
        lastDataStatusTime: 0,
      });
    });
    it('should invalidate an asyncOperation with params and wildcard ', () => {
      state = {
        operations: {
          FETCH_APPOINTMENT_DATA_2_33: {
            descriptorId: 'FETCH_APPOINTMENT_DATA',
            fetchStatus: 'SUCCESSFUL',
            dataStatus: 'PRESENT',
            message: null,
            lastFetchStatusTime: '2018-09-01T19:12:46.189Z',
            lastDataStatusTime: '2018-09-01T19:12:53.189Z',
            params: { appointmentId: 33, orgId: 2 },
            key: 'FETCH_APPOINTMENT_DATA_2_33',
          },
          FETCH_APPOINTMENT_DATA_2_44: {
            descriptorId: 'FETCH_APPOINTMENT_DATA',
            fetchStatus: 'SUCCESSFUL',
            dataStatus: 'PRESENT',
            message: null,
            lastFetchStatusTime: '2018-09-01T19:12:47.189Z',
            lastDataStatusTime: '2018-09-01T19:12:54.189Z',
            params: { appointmentId: 44, orgId: 2 },
            key: 'FETCH_APPOINTMENT_DATA_2_44',
          },
        },
      };

      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_APPOINTMENT_DATA',
          requiredParams: ['orgId', 'appointmentId'],
          operationType: 'READ',
        },
      );

      setAsyncOperationsManagerState(state);

      const newState = invalidateAsyncOperation('FETCH_APPOINTMENT_DATA', { orgId: 2, appointmentId: '*' });
      expect(newState.operations.FETCH_APPOINTMENT_DATA_2_33).to.deep.include({
        lastFetchStatusTime: 0,
        lastDataStatusTime: 0,
      });
      expect(newState.operations.FETCH_APPOINTMENT_DATA_2_44).to.deep.include({
        lastFetchStatusTime: 0,
        lastDataStatusTime: 0,
      });
    });
  });
  describe('shouldRunOperation', () => {
    beforeEach(() => {
      const dateNowStub = jest.fn(() => 1530518207007);
      global.Date.now = dateNowStub;
    });

    it('should allow operation to run', () => {
      state = {
        operations: {
          FETCH_CALENDAR_DATA_33: {
            descriptorId: 'FETCH_CALENDAR_DATA',
            fetchStatus: 'SUCCESSFUL',
            dataStatus: 'PRESENT',
            message: null,
            lastFetchStatusTime: 1530018207007,
            lastDataStatusTime: 1530018207007,
            params: { orgId: 33 },
            key: 'FETCH_CALENDAR_DATA_33',
          },
        },
      };

      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_CALENDAR_DATA',
          requiredParams: ['orgId'],
          operationType: 'READ',
        },
      );

      setAsyncOperationsManagerState(state);

      const operationShouldRun = shouldRunOperation('FETCH_CALENDAR_DATA', { orgId: 33 });
      expect(operationShouldRun).to.be.true;
    });
    it('should not allow operation to run', () => {
      state = {
        operations: {
          FETCH_CALENDAR_DATA_33: {
            descriptorId: 'FETCH_CALENDAR_DATA',
            fetchStatus: 'SUCCESSFUL',
            dataStatus: 'PRESENT',
            message: null,
            lastFetchStatusTime: 1530518207002,
            lastDataStatusTime: 1530518207004,
            params: { orgId: 33 },
            key: 'FETCH_CALENDAR_DATA_33',
          },
        },
      };

      registerAsyncOperationDescriptors(
        {
          descriptorId: 'FETCH_CALENDAR_DATA',
          requiredParams: ['orgId'],
          operationType: 'READ',
          minCacheTime: 5000,
        },
      );

      setAsyncOperationsManagerState(state);

      const operationShouldRun = shouldRunOperation('FETCH_CALENDAR_DATA', { orgId: 33 });
      expect(operationShouldRun).to.be.false;
    });
  });
});
