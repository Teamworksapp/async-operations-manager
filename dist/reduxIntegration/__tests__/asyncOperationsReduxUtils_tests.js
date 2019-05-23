"use strict";

var _chai = require("chai");

var _sinon = _interopRequireDefault(require("sinon"));

var _config = _interopRequireDefault(require("../../config"));

var _asyncOperationReduxUtils = require("../asyncOperationReduxUtils");

var _asyncOperationManagerUtils = require("../../asyncOperationManagerUtils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env jest */
describe('asyncOperationReduxUtils', function () {
  beforeEach(function () {
    _config.default.setConfig({
      logger: {
        exceptionsCallback: _sinon.default.spy()
      }
    });

    (0, _asyncOperationManagerUtils.clearAsyncOperationsManagerState)();
  });
  describe('createAsyncOperationInitialAction', function () {
    it('should create an initial async operation action with a params prop', function () {
      (0, _asyncOperationManagerUtils.registerAsyncOperationDescriptors)({
        descriptorId: 'CREATE_PERSON_REQUEST',
        requiredParams: ['teamId'],
        operationType: 'WRITE'
      });
      var initialAsyncOperationAction = (0, _asyncOperationReduxUtils.createAsyncOperationInitialAction)('CREATE_PERSON_REQUEST', {
        teamId: 3,
        fieldValues: {
          name: 'Darien',
          title: 'Developer'
        },
        configContainer: {},
        promiseCallbacks: {}
      });
      (0, _chai.expect)(initialAsyncOperationAction).to.deep.include({
        params: {
          teamId: 3
        }
      });
    });
  });
});
//# sourceMappingURL=asyncOperationsReduxUtils_tests.js.map