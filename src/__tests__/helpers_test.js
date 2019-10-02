/* eslint-env jest */
import { expect } from "chai";
import sinon from "sinon";

import asyncOperationManagerConfig from "../config";

import {
  makeConstantsObject,
  generateAsyncOperationKey,
  getAndValidateParams
} from "../helpers";

describe("helpers", () => {
  beforeEach(() => {
    asyncOperationManagerConfig.setConfig({
      logger: {
        exceptionsCallback: sinon.spy()
      }
    });
  });

  describe("generateAsyncOperationKey", () => {
    it("should create an asyncOperation key with no params", () => {
      const asyncOperationKey = generateAsyncOperationKey(
        "UPDATE_PERSON_DATA",
        {}
      );

      expect(asyncOperationKey).to.equal("UPDATE_PERSON_DATA");
    });

    it("should create an asyncOperation key with one param", () => {
      const asyncOperationKey = generateAsyncOperationKey(
        "UPDATE_PERSON_DATA",
        { personId: 111 }
      );

      expect(asyncOperationKey).to.equal("UPDATE_PERSON_DATA_111");
    });

    it("should create an asyncOperation key with multiple params", () => {
      const asyncOperationKey = generateAsyncOperationKey(
        "UPDATE_PERSON_DATA",
        { orgId: 222, personId: 111 }
      );

      expect(asyncOperationKey).to.equal("UPDATE_PERSON_DATA_111_222");
    });

    it("should create an asyncOperation key with unsorted params", () => {
      const asyncOperationKey = generateAsyncOperationKey("UPDATE_KITTY_DATA", {
        orgId: 222,
        personId: 111,
        catIds: ["person_1246_25291", "person_1246_25271", "person_1246_25292"]
      });

      expect(asyncOperationKey).to.equal(
        "UPDATE_KITTY_DATA_111_222_person_1246_25271,person_1246_25291,person_1246_25292"
      );
    });

    it("should create an asyncOperation key with unsorted params in a different order", () => {
      const asyncOperationKey = generateAsyncOperationKey("UPDATE_KITTY_DATA", {
        orgId: 222,
        personId: 111,
        catIds: ["person_1246_25292", "person_1246_25271", "person_1246_25291"]
      });

      expect(asyncOperationKey).to.equal(
        "UPDATE_KITTY_DATA_111_222_person_1246_25271,person_1246_25291,person_1246_25292"
      );
    });

    it("should create an asyncOperation key with unsorted params in a third order", () => {
      const asyncOperationKey = generateAsyncOperationKey("UPDATE_KITTY_DATA", {
        personId: 222,
        orgId: 111,
        catIds: ["person_1246_25292", "person_1246_25271", "person_1246_25291"]
      });

      expect(asyncOperationKey).to.equal(
        "UPDATE_KITTY_DATA_111_222_person_1246_25271,person_1246_25291,person_1246_25292"
      );
    });

    it("should create an asyncOperation key with unsorted params in a fourth order", () => {
      const asyncOperationKey = generateAsyncOperationKey("UPDATE_KITTY_DATA", {
        personId: 111,
        orgId: 222,
        catIds: ["person_1246_25292", "person_1246_25271", "person_1246_25291"]
      });

      expect(asyncOperationKey).to.equal(
        "UPDATE_KITTY_DATA_111_222_person_1246_25271,person_1246_25291,person_1246_25292"
      );
    });

    it("should not modify input parameters", () => {
      const catIds = ["1", "3", "2"];

      const inputParameters = {
        personId: 111,
        orgId: 222,
        catIds: [...catIds]
      };

      generateAsyncOperationKey("UPDATE_KITTY_DATA", inputParameters);

      expect(catIds).to.deep.equal(inputParameters.catIds);
    });

    it("should throw an exception if a label is not provided", () => {
      const { logger } = asyncOperationManagerConfig.getConfig();
      generateAsyncOperationKey();
      generateAsyncOperationKey("");
      generateAsyncOperationKey(undefined);
      expect(logger.exceptionsCallback.called).to.equal(true);
      expect(logger.exceptionsCallback.callCount).to.equal(3);
    });

    it("should throw an exception if a label is not a string", () => {
      const { logger } = asyncOperationManagerConfig.getConfig();
      generateAsyncOperationKey({});
      generateAsyncOperationKey([]);
      generateAsyncOperationKey(2);
      expect(logger.exceptionsCallback.called).to.equal(true);
      expect(logger.exceptionsCallback.callCount).to.equal(3);
    });
  });

  describe("getAndValidateParams", () => {
    let params;

    beforeEach(() => {
      asyncOperationManagerConfig.setConfig({
        logger: {
          exceptionsCallback: sinon.spy()
        }
      });

      params = {
        personId: 2,
        orgId: 10,
        name: "Name"
      };
    });

    it("should validate requiredParams and successfully return correct asyncOperation params", () => {
      const asyncOperationDescriptor = {
        requiredParams: ["personId", "orgId"]
      };

      const asyncOperationParams = getAndValidateParams(
        params,
        asyncOperationDescriptor
      );

      expect(asyncOperationParams).to.deep.equal({
        personId: params.personId,
        orgId: params.orgId
      });
    });

    it("should validate requiredParams and successfully return all correct asyncOperation params including optionalParams", () => {
      params.age = 25;

      const asyncOperationDescriptor = {
        requiredParams: ["personId", "orgId"],
        optionalParams: ["age"]
      };

      const asyncOperationParams = getAndValidateParams(
        params,
        asyncOperationDescriptor
      );

      expect(asyncOperationParams).to.deep.equal({
        personId: params.personId,
        orgId: params.orgId,
        age: params.age
      });
    });

    it("should return only optionalParams", () => {
      params.age = 25;

      const asyncOperationDescriptor = {
        optionalParams: ["age"]
      };

      const asyncOperationParams = getAndValidateParams(
        params,
        asyncOperationDescriptor
      );

      expect(asyncOperationParams).to.deep.equal({ age: params.age });
    });

    it("should validate and fail on an undefined required param", () => {
      const { logger } = asyncOperationManagerConfig.getConfig();

      params.personId = undefined;

      const asyncOperationDescriptor = {
        requiredParams: ["personId", "orgId"]
      };

      getAndValidateParams(params, asyncOperationDescriptor);

      expect(logger.exceptionsCallback.called).to.equal(true);
    });

    it("should validate and succeed on a falsey required param", () => {
      const { logger } = asyncOperationManagerConfig.getConfig();

      params.personId = null;

      const asyncOperationDescriptor = {
        requiredParams: ["personId", "orgId"]
      };

      getAndValidateParams(params, asyncOperationDescriptor);

      expect(logger.exceptionsCallback.called).to.equal(false);
    });

    it("should validate and fail on a missing required param", () => {
      const { logger } = asyncOperationManagerConfig.getConfig();

      const invalidParams = {
        personId: params.personId
      };

      const asyncOperationDescriptor = {
        requiredParams: ["personId", "orgId"]
      };

      getAndValidateParams(invalidParams, asyncOperationDescriptor);

      expect(logger.exceptionsCallback.called).to.equal(true);
    });
  });

  describe("makeConstantsObject", () => {
    beforeEach(() => {
      asyncOperationManagerConfig.setConfig({
        logger: {
          exceptionsCallback: sinon.spy()
        }
      });
    });

    it("should make a constants object out of an array of string values", () => {
      const fruits = makeConstantsObject(["APPLE", "BANANA"]);
      expect(fruits).to.deep.equal({
        APPLE: "APPLE",
        BANANA: "BANANA"
      });
    });

    it("should make a constants object that is immutable", () => {
      const fruits = makeConstantsObject(["APPLE", "BANANA"]);
      expect(Object.isExtensible(fruits)).to.be.false;
    });
  });
});
