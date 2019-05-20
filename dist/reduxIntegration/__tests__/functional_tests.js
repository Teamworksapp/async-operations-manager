"use strict";

var _chai = require("chai");

var _asyncOperationReducer = _interopRequireDefault(require("../asyncOperationReducer"));

var _constants = require("../../constants");

var _asyncOperationReduxUtils = require("../asyncOperationReduxUtils");

var _asyncOperationManagerUtils = require("../../asyncOperationManagerUtils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env jest */
describe('functional tests', function () {
  var state;
  beforeEach(function () {
    (0, _asyncOperationManagerUtils.clearAsyncOperationsManagerState)();
    var dateNowStub = jest.fn(function () {
      return 1530518207007;
    });
    global.Date.now = dateNowStub;
  });
  describe('READ operation scenarios', function () {
    var initialAction;
    var beginAction;
    beforeEach(function () {
      state = {};
      (0, _asyncOperationManagerUtils.clearAsyncOperationsManagerState)();
      (0, _asyncOperationManagerUtils.registerAsyncOperationDescriptors)({
        descriptorId: 'FETCH_PERSON_DATA',
        requiredParams: ['personId'],
        operationType: 'READ'
      });
      initialAction = (0, _asyncOperationReduxUtils.createAsyncOperationInitialAction)('FETCH_PERSON_DATA', {
        personId: 111
      });
      beginAction = (0, _asyncOperationReduxUtils.createAsyncOperationBeginAction)('FETCH_PERSON_DATA', {
        personId: 111
      });
    });
    it('should update a successful READ operation as expected from start to finish', function () {
      var resolveAction = (0, _asyncOperationReduxUtils.createAsyncOperationResolveAction)('FETCH_PERSON_DATA', {
        personId: 111
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, initialAction)).to.deep.equal(state);
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, beginAction).operations).to.deep.equal({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: _constants.FETCH_STATUS.PENDING,
          dataStatus: _constants.DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          personId: 111,
          key: 'FETCH_PERSON_DATA_111'
        }
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, resolveAction).operations).to.deep.equal({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: _constants.FETCH_STATUS.SUCCESSFUL,
          dataStatus: _constants.DATA_STATUS.PRESENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 1530518207007,
          personId: 111,
          lastFetchFailed: false,
          key: 'FETCH_PERSON_DATA_111'
        }
      });
    });
    it('should update a failed READ operation as expected from start to finish', function () {
      var rejectAction = (0, _asyncOperationReduxUtils.createAsyncOperationRejectAction)('FETCH_PERSON_DATA', {
        personId: 111
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, initialAction)).to.deep.equal(state);
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, beginAction).operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: _constants.FETCH_STATUS.PENDING,
          dataStatus: _constants.DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          personId: 111,
          key: 'FETCH_PERSON_DATA_111'
        }
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, rejectAction).operations).to.deep.include({
        FETCH_PERSON_DATA_111: {
          descriptorId: 'FETCH_PERSON_DATA',
          fetchStatus: _constants.FETCH_STATUS.FAILED,
          dataStatus: _constants.DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          personId: 111,
          lastFetchFailed: true,
          key: 'FETCH_PERSON_DATA_111'
        }
      });
    });
  });
  describe('Invalidate operations', function () {
    beforeEach(function () {
      state = {};
      (0, _asyncOperationManagerUtils.clearAsyncOperationsManagerState)();
    });
    it('should invalidate async operation if another operation descriptor\'s onResolve invalidates it', function () {
      (0, _asyncOperationManagerUtils.registerAsyncOperationDescriptors)([{
        descriptorId: 'UPDATE_APPOINTMENT_DATA',
        requiredParams: ['orgId', 'appointmentId'],
        operationType: 'WRITE',
        onResolve: function onResolve(_ref) {
          var orgId = _ref.orgId;
          (0, _asyncOperationManagerUtils.invalidateAsyncOperation)('FETCH_CALENDAR_DATA', {
            orgId: orgId
          });
        }
      }, {
        descriptorId: 'FETCH_CALENDAR_DATA',
        requiredParams: ['orgId'],
        operationType: 'READ'
      }]);
      var initialFetchCalendarDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationInitialAction)('FETCH_CALENDAR_DATA', {
        orgId: 22
      });
      var beginFetchCalendarDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationBeginAction)('FETCH_CALENDAR_DATA', {
        orgId: 22
      });
      var resolveFetchCalendarDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationResolveAction)('FETCH_CALENDAR_DATA', {
        orgId: 22
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, initialFetchCalendarDataAction)).to.deep.equal(state);
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, beginFetchCalendarDataAction).operations).to.deep.include({
        FETCH_CALENDAR_DATA_22: {
          descriptorId: 'FETCH_CALENDAR_DATA',
          fetchStatus: _constants.FETCH_STATUS.PENDING,
          dataStatus: _constants.DATA_STATUS.ABSENT,
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 0,
          orgId: 22,
          key: 'FETCH_CALENDAR_DATA_22'
        }
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, resolveFetchCalendarDataAction).operations).to.deep.include({
        FETCH_CALENDAR_DATA_22: {
          descriptorId: 'FETCH_CALENDAR_DATA',
          fetchStatus: 'SUCCESSFUL',
          dataStatus: 'PRESENT',
          message: null,
          lastFetchStatusTime: 1530518207007,
          lastDataStatusTime: 1530518207007,
          orgId: 22,
          lastFetchFailed: false,
          key: 'FETCH_CALENDAR_DATA_22'
        }
      });
      var dateNowStub = jest.fn(function () {
        return 1540000000000;
      });
      global.Date.now = dateNowStub;
      var initialUpdateAppointmentDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationInitialAction)('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111
      });
      var beginUpdateAppointmentDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationBeginAction)('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111
      });
      var resolveUpdateAppointmentDataAction = (0, _asyncOperationReduxUtils.createAsyncOperationResolveAction)('UPDATE_APPOINTMENT_DATA', {
        orgId: 22,
        appointmentId: 111
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, initialUpdateAppointmentDataAction)).to.deep.equal(state);
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, beginUpdateAppointmentDataAction).operations).to.deep.include({
        UPDATE_APPOINTMENT_DATA_22_111: {
          descriptorId: 'UPDATE_APPOINTMENT_DATA',
          fetchStatus: _constants.FETCH_STATUS.PENDING,
          message: null,
          lastFetchStatusTime: 1540000000000,
          orgId: 22,
          appointmentId: 111,
          key: 'UPDATE_APPOINTMENT_DATA_22_111'
        }
      });
      (0, _chai.expect)((0, _asyncOperationReducer.default)(state, resolveUpdateAppointmentDataAction).operations).to.deep.include({
        UPDATE_APPOINTMENT_DATA_22_111: {
          fetchStatus: 'SUCCESSFUL',
          message: null,
          lastFetchStatusTime: 1540000000000,
          descriptorId: 'FETCH_CALENDAR_DATA',
          orgId: 22,
          appointmentId: 111,
          key: 'UPDATE_APPOINTMENT_DATA_22_111',
          dataStatus: 'ABSENT',
          lastFetchFailed: false,
          lastDataStatusTime: 0
        }
      });
      var currentState = (0, _asyncOperationManagerUtils.getAsyncOperationsManagerState)();
      var fetchCalendarDataAsyncOperation = currentState.operations.FETCH_CALENDAR_DATA_22;
      (0, _chai.expect)(fetchCalendarDataAsyncOperation).to.be.an('object');
      (0, _chai.expect)(fetchCalendarDataAsyncOperation).to.deep.include({
        lastFetchStatusTime: 0,
        lastDataStatusTime: 0
      });
      (0, _chai.expect)(fetchCalendarDataAsyncOperation).to.matchSnapshot('Invalidated read fetchCalendarDataAsyncOperation');
    });
  });
  describe('WRITE operation scenarios', function () {
    beforeEach(function () {
      state = {};
      (0, _asyncOperationManagerUtils.clearAsyncOperationsManagerState)();
    });
  });
});
//# sourceMappingURL=functional_tests.js.map