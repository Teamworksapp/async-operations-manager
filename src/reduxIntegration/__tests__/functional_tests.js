/* eslint-env jest */
import { expect } from 'chai';

import asyncOperationReducer from '../asyncOperationReducer';

import { FETCH_STATUS, DATA_STATUS } from '../../constants';

import {
  createAsyncOperationInitialAction,
  createAsyncOperationBeginAction,
  createAsyncOperationResolveAction,
  createAsyncOperationRejectAction,
} from '../asyncOperationReduxUtils';

import {
  clearAsyncOperationsManagerState,
  getAsyncOperationsManagerState,
  registerAsyncOperationDescriptors,
  invalidateAsyncOperation,
} from '../../asyncOperationManagerUtils';

describe('functional tests', () => {
  let state;

  beforeEach(() => {
    clearAsyncOperationsManagerState();
    const dateNowStub = jest.fn(() => 1530518207007);
    global.Date.now = dateNowStub;
  });

  describe('READ operation scenarios', () => {
    let initialAction;
    let beginAction;
    beforeEach(() => {
      state = {};
      clearAsyncOperationsManagerState();
      registerAsyncOperationDescriptors({
        descriptorId: 'FETCH_PERSON_DATA',
        requiredParams: ['personId'],
        operationType: 'READ',
      });
      initialAction = createAsyncOperationInitialAction('FETCH_PERSON_DATA', {
        personId: 111,
      });
      beginAction = createAsyncOperationBeginAction('FETCH_PERSON_DATA', {
        personId: 111,
      });
    });

    it('should update a successful READ operation as expected from start to finish', () => {
      state = getAsyncOperationsManagerState();
      const resolveAction = createAsyncOperationResolveAction('FETCH_PERSON_DATA', {
        personId: 111,
      });

      const initialActionState = asyncOperationReducer(state, initialAction);
      expect(initialActionState).to.deep.equal(state);

      const beginActionState = asyncOperationReducer(state, beginAction);
      expect(beginActionState.operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: 'PENDING',
          dataStatus: 'ABSENT',
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          personId: 111,
        },
      });

      const resolveActionState = asyncOperationReducer(state, resolveAction);
      expect(resolveActionState.operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: FETCH_STATUS.SUCCESSFUL,
          dataStatus: DATA_STATUS.PRESENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 1530518207007,
          lastFetchFailed: false,
          personId: 111,
        },
      });
    });

    it('should update a failed READ operation as expected from start to finish', () => {
      const rejectAction = createAsyncOperationRejectAction('FETCH_PERSON_DATA', {
        personId: 111,
      });

      const initialActionState = asyncOperationReducer(state, initialAction);
      expect(initialActionState).to.deep.equal(state);

      const beginActionState = asyncOperationReducer(state, beginAction);
      expect(beginActionState.operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: FETCH_STATUS.PENDING,
          dataStatus: DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          personId: 111,
        },
      });

      const rejectActionState = asyncOperationReducer(state, rejectAction);
      expect(rejectActionState.operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: FETCH_STATUS.FAILED,
          dataStatus: DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          lastFetchFailed: true,
          personId: 111,
        },
      });
    });
  });

  describe('Invalidate operations', () => {
    beforeEach(() => {
      state = {};
      clearAsyncOperationsManagerState();
    });

    it('should invalidate async operation if another operation descriptor\'s onResolve invalidates it', () => {
      registerAsyncOperationDescriptors([
        {
          descriptorId: 'UPDATE_APPOINTMENT_DATA',
          requiredParams: ['orgId', 'appointmentId'],
          operationType: 'WRITE',
          onResolve: ({ orgId }) => {
            invalidateAsyncOperation('FETCH_CALENDAR_DATA', { orgId });
          },
        },
        {
          descriptorId: 'FETCH_CALENDAR_DATA',
          requiredParams: ['orgId'],
          operationType: 'READ',
        },
      ]);

      const initialFetchCalendarDataAction = createAsyncOperationInitialAction('FETCH_CALENDAR_DATA', {
        orgId: 22,
      });
      const beginFetchCalendarDataAction = createAsyncOperationBeginAction('FETCH_CALENDAR_DATA', {
        orgId: 22,
      });
      const resolveFetchCalendarDataAction = createAsyncOperationResolveAction('FETCH_CALENDAR_DATA', {
        orgId: 22,
      });

      expect(asyncOperationReducer(state, initialFetchCalendarDataAction)).to.deep.equal(state);

      expect(asyncOperationReducer(state, beginFetchCalendarDataAction).operations).to.deep.include({
        FETCH_CALENDAR_DATA_22: {
          descriptorId: 'FETCH_CALENDAR_DATA',
          fetchStatus: FETCH_STATUS.PENDING,
          dataStatus: DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          orgId: 22,
        },
      });

      expect(asyncOperationReducer(state, resolveFetchCalendarDataAction).operations).to.deep.include({
        FETCH_CALENDAR_DATA_22: {
          descriptorId: 'FETCH_CALENDAR_DATA',
          fetchStatus: 'SUCCESSFUL',
          dataStatus: 'PRESENT',
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 1530518207007,
          lastFetchFailed: false,
          orgId: 22,
        },
      });

      const dateNowStub = jest.fn(() => 1540000000000);
      global.Date.now = dateNowStub;

      const initialUpdateAppointmentDataAction = createAsyncOperationInitialAction('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111,
      });
      const beginUpdateAppointmentDataAction = createAsyncOperationBeginAction('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111,
      });
      const resolveUpdateAppointmentDataAction = createAsyncOperationResolveAction('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111,
      });

      expect(asyncOperationReducer(state, initialUpdateAppointmentDataAction)).to.deep.equal(state);
      expect(asyncOperationReducer(state, beginUpdateAppointmentDataAction).operations).to.deep.include({
        UPDATE_APPOINTMENT_DATA_111_22: {
          fetchStatus: FETCH_STATUS.PENDING,
          message: null,
          lastFetchStatusTime: 1540000000000,
          descriptorId: 'UPDATE_APPOINTMENT_DATA',
          orgId: 22,
          appointmentId: 111,
        },
      });

      expect(asyncOperationReducer(state, resolveUpdateAppointmentDataAction).operations).to.deep.include({
        UPDATE_APPOINTMENT_DATA_111_22: {
          fetchStatus: 'SUCCESSFUL',
          message: null,
          lastFetchStatusTime: 1540000000000,
          descriptorId: 'UPDATE_APPOINTMENT_DATA',
          orgId: 22,
          appointmentId: 111,
        },
      });

      const currentState = getAsyncOperationsManagerState();


      const fetchCalendarDataAsyncOperation = currentState.operations.FETCH_CALENDAR_DATA_22;

      expect(fetchCalendarDataAsyncOperation).to.be.an('object');
      expect(fetchCalendarDataAsyncOperation).to.deep.include({
        lastFetchStatusTime: 0,
        lastDataStatusTime: 0,
      });
      expect(fetchCalendarDataAsyncOperation).to.matchSnapshot('Invalidated read fetchCalendarDataAsyncOperation');
    });
  });

  describe('WRITE operation scenarios', () => {
    beforeEach(() => {
      state = {};
      clearAsyncOperationsManagerState();
    });
  });
});
