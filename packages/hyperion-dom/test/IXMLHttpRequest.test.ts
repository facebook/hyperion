/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import xhrmock from 'xhr-mock';
import * as IXMLHttpRequest from "../src/IXMLHttpRequest";
import * as IWindow from "../src/IWindow";
import { intercept } from "@hyperion/hyperion-core/src/intercept";

async function asyncxhr(request: {
  method: string,
  url: string,
  headers?: { [name: string]: string },
  data?: XMLHttpRequestBodyInit
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    intercept(xhr);

    function loadData() {
      if (xhr.status === 201) {
        try {
          resolve(JSON.parse(xhr.responseText).data);
        } catch (error) {
          reject(error);
        }
      } else if (xhr.status) {
        try {
          reject(JSON.parse(xhr.responseText).error);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('An error ocurred whilst sending the request.'));
      }
    }

    xhr.onload = loadData;

    xhr.onreadystatechange = () => {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        loadData();
      }
    };
    xhr.open(request.method, request.url);
    if (request.headers) {
      for (const key of Object.keys(request.headers)) {
        xhr.setRequestHeader(key, request.headers[key]);
      }
    }
    xhr.send(request.data);
  });
}

describe('test XHR interception', () => {
  // https://www.npmjs.com/package/xhr-mock
  // replace the real XHR object with the mock XHR object before each test
  beforeEach(() => {
    // xhrmock.setup();
    intercept(window);
  }
  );

  // put the real XHR object back and clear the mocks after each test
  afterEach(() => {
    // xhrmock.teardown();
  });

  test('test open', async () => {
    // expect.assertions(3);

    // const url = "/api/user";
    const url = "http://www.example.com";

    xhrmock.post(url, (req, res) => {
      expect(req.header('Content-Type')).toEqual('application/json');
      expect(req.body()).toEqual('{"name":"John"}');
      return res.status(201).body('{"id":"abc-123"}');
    });

    let result: any[] = [];
    // const observer = (function <T, V>(this: T, value: V) {
    //   result = [this, value];
    // });
    // IWindow.XMLHttpRequest.onArgsObserverAdd(function (this, value) {
    IXMLHttpRequest.constructor.onAfterReturnValueObserverAdd(function (this, value) {
      expect(value).toBeInstanceOf(XMLHttpRequest);
    });

    IXMLHttpRequest.open.onBeforeCallArgsObserverAdd(function (this, method, url) {
      result = [this, method, url];
    });

    // const data = await asyncxhr({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   data: JSON.stringify({ name: "John" })
    // });

    const data = asyncxhr({
      method: 'get',
      url,
    });

    expect(result[2]).toBe(url);
    // expect(data).toBe('{"id":"abc-123"}');
  });
});