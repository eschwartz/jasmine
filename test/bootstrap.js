// Bootstrap Test Reporter function
var reporter = function () {

  var total = 0;
  var passes = 0;
  var fails = 0;

  var that = {
    test: function (result, message) {
      total++;

      if (result) {
        passes++;
        iconElement = $('icons');
        iconElement.appendChild(new Element('img', {src: '../images/accept.png'}));
      }
      else {
        fails++;
        var fails_report = $('fails');
        fails_report.show();

        var iconElement = $('icons');
        iconElement.appendChild(new Element('img', {src: '../images/exclamation.png'}));

        var failMessages = $('fail_messages');
        var newFail = new Element('p', {'class': 'fail'});
        newFail.innerHTML = message;
        failMessages.appendChild(newFail);
      }
    },

    summary: function () {
      var el = new Element('p', {'class': ((fails > 0) ? 'fail_in_summary' : '') });
      el.innerHTML = total + ' expectations, ' + passes + ' passing, ' + fails + ' failed.';

      var summaryElement = $('results_summary');
      summaryElement.appendChild(el);
      summaryElement.show();
    }
  }
  return that;
}();

var testMatchersComparisons = function () {
  var expected = new Jasmine.Matchers(true);
  reporter.test(expected.should_equal(true),
      'expects_that(true).should_equal(true) returned false');

  expected = new Jasmine.Matchers(false);
  reporter.test(!(expected.should_equal(true)),
      'expects_that(true).should_equal(true) returned true');

  expected = new Jasmine.Matchers(true);
  reporter.test(expected.should_not_equal(false),
      'expects_that(true).should_not_equal(false) retruned false');

  expected = new Jasmine.Matchers(true);
  reporter.test(!(expected.should_not_equal(true)),
      'expects_that(true).should_not_equal(false) retruned true');
}

var testMatchersReporting = function () {

  var results = [];
  var expected = new Jasmine.Matchers(true, results);
  expected.should_equal(true);
  expected.should_equal(false);

  reporter.test((results.length == 2),
      "Results array doesn't have 2 results");

  reporter.test((results[0].passed === true),
      "First spec didn't pass");

  reporter.test((results[1].passed === false),
      "Second spec did pass");

  results = [];
  expected = new Jasmine.Matchers(false, results);
  expected.should_equal(true);

  reporter.test((results[0].message == 'Expected true but got false.'),
      "Failed expectation didn't test the failure message");

  results = [];
  expected = new Jasmine.Matchers(true, results);
  expected.should_equal(true);

  reporter.test((results[0].message == 'Passed.'),
      "Passing expectation didn't test the passing message");
}

var testSpecs = function () {
  var currentSuite = describe('default current suite', function() {
  });

  var spec = it('new spec');
  reporter.test((spec.description == 'new spec'),
      "Spec did not have a description");

  var another_spec = it('spec with an expectation').runs(function () {
    var foo = 'bar';
    this.expects_that(foo).should_equal('bar');
  });
  another_spec.execute();
  another_spec.done = true;

  reporter.test((another_spec.results.results.length === 1),
      "Results aren't there after a spec was executed");
  reporter.test((another_spec.results.results[0].passed === true),
      "Results has a result, but it's true");
  reporter.test((another_spec.results.description === 'spec with an expectation'),
      "Spec's results did not get the spec's description");

  var yet_another_spec = it('spec with failing expectation').runs(function () {
    var foo = 'bar';
    this.expects_that(foo).should_equal('baz');
  });
  yet_another_spec.execute();
  yet_another_spec.done = true;

  reporter.test((yet_another_spec.results.results[0].passed === false),
      "Expectation that failed, passed");

  var yet_yet_another_spec = it('spec with multiple assertions').runs(function () {
    var foo = 'bar';
    var baz = 'quux';

    this.expects_that(foo).should_equal('bar');
    this.expects_that(baz).should_equal('quux');
  });
  yet_yet_another_spec.execute();
  yet_yet_another_spec.done = true;

  reporter.test((yet_yet_another_spec.results.results.length === 2),
      "Spec doesn't support multiple expectations");
}

var testAsyncSpecs = function () {
  var foo = 0;

  var a_spec = it('simple queue test', function () {
    runs(function () {
      foo++;
    });
    runs(function () {
      this.expects_that(foo).should_equal(1)
    });
  });

  reporter.test(a_spec.queue.length === 2,
      'Spec queue length is not 2');

  foo = 0;
  a_spec = it('spec w/ queued statments', function () {
    runs(function () {
      foo++;
    });
    runs(function () {
      this.expects_that(foo).should_equal(1);
    });
  });

  a_spec.execute();

  reporter.test((a_spec.results.results.length === 1),
      'No call to waits(): Spec queue did not run all functions');
  reporter.test((a_spec.results.results[0].passed === true),
      'No call to waits(): Queued expectation failed');

  foo = 0;
  a_spec = it('spec w/ queued statments', function () {
    runs(function () {
      setTimeout(function() {
        foo++
      }, 500);
    });
    waits(1000);
    runs(function() {
      this.expects_that(foo).should_equal(1);
    });
  });

  var mockSuite = {
    next: function() {
      reporter.test((a_spec.results.results.length === 1),
          'Calling waits(): Spec queue did not run all functions');

      reporter.test((a_spec.results.results[0].passed === true),
          'Calling waits(): Queued expectation failed');
    }
  };

  a_spec.execute();
  waitForDone(a_spec, mockSuite);

  var bar = 0;
  var another_spec = it('spec w/ queued statments', function () {
    runs(function () {
      setTimeout(function() {
        bar++;
      }, 250);

    });
    waits(500);
    runs(function () {
      setTimeout(function() {
        bar++;
      }, 250);
    });
    waits(500);
    runs(function () {
      this.expects_that(bar).should_equal(2);
    });
  });

  mockSuite = {
    next: function() {
      reporter.test((another_spec.queue.length === 3),
          'Calling 2 waits(): Spec queue was less than expected length');
      reporter.test((another_spec.results.results.length === 1),
          'Calling 2 waits(): Spec queue did not run all functions');
      reporter.test((another_spec.results.results[0].passed === true),
          'Calling 2 waits(): Queued expectation failed');
    }
  };
  another_spec.execute();
  waitForDone(another_spec, mockSuite);

  var baz = 0;
  var yet_another_spec = it('spec w/ async fail', function () {
    runs(function () {
      setTimeout(function() {
        baz++;
      }, 250);
    });
    waits(100);
    runs(function() {
      this.expects_that(baz).should_equal(1);
    });
  });


  mockSuite = {
    next: function() {

      reporter.test((yet_another_spec.queue.length === 2),
          'Calling 2 waits(): Spec queue was less than expected length');
      reporter.test((yet_another_spec.results.results.length === 1),
          'Calling 2 waits(): Spec queue did not run all functions');
      reporter.test((yet_another_spec.results.results[0].passed === false),
          'Calling 2 waits(): Queued expectation failed');
    }
  };

  yet_another_spec.execute();
  waitForDone(yet_another_spec, mockSuite);
}

var testAsyncSpecsWithMockSuite = function () {
  var bar = 0;
  var another_spec = it('spec w/ queued statments', function () {
    runs(function () {
      setTimeout(function() {
        bar++;
      }, 250);
    });
    waits(500);
    runs(function () {
      setTimeout(function() {
        bar++;
      }, 250);
    });
    waits(1500)
    runs(function() {
      this.expects_that(bar).should_equal(2);
    });
  });

  var mockSuite = {
    next: function () {
      reporter.test((another_spec.queue.length === 3),
          'Calling 2 waits(): Spec queue was less than expected length');
      reporter.test((another_spec.results.results.length === 1),
          'Calling 2 waits(): Spec queue did not run all functions');
      reporter.test((another_spec.results.results[0].passed === true),
          'Calling 2 waits(): Queued expectation failed');
    }
  };
  another_spec.execute();
  waitForDone(another_spec, mockSuite);
}

var waitForDone = function(spec, mockSuite) {
  var id = setInterval(function () {
    if (spec.finished) {
      clearInterval(id);
      mockSuite.next();
    }
  }, 150);
}

var testSuites = function () {

  // suite has a description
  var suite = describe('one suite description', function() {
  });
  reporter.test((suite.description == 'one suite description'),
      'Suite did not get a description');

  // suite can have a test
  suite = describe('one suite description', function () {
    it('should be a test');
  });

  reporter.test((suite.specs.length === 1),
      'Suite did not get a spec pushed');
  reporter.test((suite.specs[0].queue.length === 0),
      "Suite's Spec should not have queuedFunctions");

  suite = describe('one suite description', function () {
    it('should be a test with queuedFunctions', function() {
      runs(function() {
        var foo = 0;
        foo++;
      });
    });
  });

  reporter.test((suite.specs[0].queue.length === 1),
      "Suite's spec did not get a function pushed");

  suite = describe('one suite description', function () {
    it('should be a test with queuedFunctions', function() {
      runs(function() {
        var foo = 0;
        foo++;
      });
      waits(100);
      runs(function() {
        var bar = 0;
        bar++;
      });

    });
  });

  reporter.test((suite.specs[0].queue.length === 2),
      "Suite's spec did not get 2 functions pushed");

  var foo = 0;
  suite = describe('one suite description', function () {
    it('should be a test with queuedFunctions', function() {
      runs(function() {
        foo++;
      });
    });

    it('should be a another spec with queuedFunctions', function() {
      runs(function() {
        foo++;
      });
    });
  });

  suite.execute();

  setTimeout(function () {
    reporter.test((suite.specs.length === 2),
        "Suite doesn't have two specs");
    reporter.test((foo === 2),
        "Suite didn't execute both specs");
  }, 500);
}

var testBeforeAndAfterCallbacks = function () {

  var suiteWithBefore = describe('one suite with a before', function () {

    beforeEach(function () {
      this.foo = 1;
    });

    it('should be a spec', function () {
      runs(function() {
        this.foo++;
        this.expects_that(this.foo).should_equal(2);
      });
    });

    it('should be another spec', function () {
      runs(function() {
        this.foo++;
        this.expects_that(this.foo).should_equal(2);
      });
    });
  });

  suiteWithBefore.execute();
  setTimeout(function () {
    var suite = suiteWithBefore;
    reporter.test((suite.beforeEach !== undefined),
        "Suite's beforeEach was not defined");
    reporter.test((suite.results.results[0].results[0].passed === true),
        "the first spec's foo should have been 2");
    reporter.test((suite.results.results[1].results[0].passed === true),
        "the second spec's this.foo should have been 2");
  }, 750);

  setTimeout(function () {
    var suiteWithAfter = describe('one suite with an after_each', function () {

      it('should be a spec with an after_each', function () {
        runs(function() {
          this.foo = 0;
          this.foo++;
          this.expects_that(this.foo).should_equal(1);
        });
      });

      it('should be another spec with an after_each', function () {
        runs(function() {
          this.foo = 0;
          this.foo++;
          this.expects_that(this.foo).should_equal(1);
        });
      });

      afterEach(function () {
        this.foo = 0;
      });
    });

    suiteWithAfter.execute();
    setTimeout(function () {
      var suite = suiteWithAfter;
      reporter.test((suite.afterEach !== undefined),
          "Suite's afterEach was not defined");
      reporter.test((suite.results.results[0].results[0].passed === true),
          "afterEach failure: " + suite.results.results[0].results[0].message);
      reporter.test((suite.specs[0].foo === 0),
          "afterEach failure: foo was not reset to 0");
      reporter.test((suite.results.results[1].results[0].passed === true),
          "afterEach failure: " + suite.results.results[0].results[0].message);
      reporter.test((suite.specs[1].foo === 0),
          "afterEach failure: foo was not reset to 0");
    }, 500);
  }, 1200);

}

var testSpecScope = function () {

  var suite = describe('one suite description', function () {
    it('should be a test with queuedFunctions', function() {
      runs(function() {
        this.foo = 0;
        this.foo++;
      });

      runs(function() {
        var that = this;
        setTimeout(function() {
          that.foo++;
        }, 250);
      });

      runs(function() {
        this.expects_that(this.foo).should_equal(2);
      });

      waits(300);

      runs(function() {
        this.expects_that(this.foo).should_equal(2);
      });
    });

  });

  suite.execute();

  setTimeout(function () {
    reporter.test((suite.specs[0].foo === 2),
        "Spec does not maintain scope in between functions");
    reporter.test((suite.specs[0].results.results.length === 2),
        "Spec did not get results for all expectations");
    reporter.test((suite.specs[0].results.results[0].passed === false),
        "Spec did not return false for a failed expectation");
    reporter.test((suite.specs[0].results.results[1].passed === true),
        "Spec did not return true for a passing expectation");
    reporter.test((suite.results.description === 'one suite description'),
        "Suite did not get its description in the results");
  }, 1000);
}


var testRunner = function() {

  var runner = Runner();
  describe('one suite description', function () {
    it('should be a test');
  });
  reporter.test((runner.suites.length === 1),
      "Runner expected one suite, got " + runner.suites.length);

  runner = Runner();
  describe('one suite description', function () {
    it('should be a test');
  });
  describe('another suite description', function () {
    it('should be a test');
  });
  reporter.test((runner.suites.length === 2),
      "Runner expected two suites, but got " + runner.suites.length);

  runner = Runner();
  describe('one suite description', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });
  });

  describe('another suite description', function () {
    it('should be another test', function() {
      runs(function () {
        this.expects_that(true).should_equal(false);
      });
    });
  });

  runner.execute();

  setTimeout(function () {
    reporter.test((runner.suites.length === 2),
        "Runner expected two suites, got " + runner.suites.length);
    reporter.test((runner.suites[0].specs[0].results.results[0].passed === true),
        "Runner should have run specs in first suite");
    reporter.test((runner.suites[1].specs[0].results.results[0].passed === false),
        "Runner should have run specs in second suite");
  }, 1000);
}

var testRunnerFinishCallback = function () {
  var runner = Runner();
  var foo = 0;

  runner.finish();

  reporter.test((runner.finished === true),
      "Runner finished flag was not set.");

  runner.finishCallback = function () {
    foo++;
  }

  runner.finish();

  reporter.test((runner.finished === true),
      "Runner finished flag was not set.");
  reporter.test((foo === 1),
      "Runner finish callback was not called");
}


var testNestedResults = function () {

  // Leaf case
  var results = nestedResults();

  results.push({passed: true, message: 'Passed.'});

  reporter.test((results.results.length === 1),
      "nestedResults.push didn't work");
  reporter.test((results.totalCount === 1),
      "nestedResults.push didn't increment totalCount");
  reporter.test((results.passedCount === 1),
      "nestedResults.push didn't increment passedCount");
  reporter.test((results.failedCount === 0),
      "nestedResults.push didn't ignore failedCount");

  results.push({passed: false, message: 'FAIL.'});

  reporter.test((results.results.length === 2),
      "nestedResults.push didn't work");
  reporter.test((results.totalCount === 2),
      "nestedResults.push didn't increment totalCount");
  reporter.test((results.passedCount === 1),
      "nestedResults.push didn't ignore passedCount");
  reporter.test((results.failedCount === 1),
      "nestedResults.push didn't increment failedCount");

  // Branch case
  var leafResultsOne = nestedResults();
  leafResultsOne.push({passed: true, message: ''});
  leafResultsOne.push({passed: false, message: ''});

  var leafResultsTwo = nestedResults();
  leafResultsTwo.push({passed: true, message: ''});
  leafResultsTwo.push({passed: false, message: ''});

  var branchResults = nestedResults();
  branchResults.push(leafResultsOne);
  branchResults.push(leafResultsTwo);

  reporter.test((branchResults.results.length === 2),
      "Branch Results should have 2 nestedResults, has " + branchResults.results.length);
  reporter.test((branchResults.totalCount === 4),
      "Branch Results should have 4 results, has " + branchResults.totalCount);
  reporter.test((branchResults.passedCount === 2),
      "Branch Results should have 2 passed, has " + branchResults.passedCount);
  reporter.test((branchResults.failedCount === 2),
      "Branch Results should have 2 failed, has " + branchResults.failedCount);
}

var testResults = function () {
  var runner = Runner();
  describe('one suite description', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });
  });

  describe('another suite description', function () {
    it('should be another test', function() {
      runs(function () {
        this.expects_that(true).should_equal(false);
      });
    });
  });

  runner.execute();

  setTimeout(function () {
    reporter.test((runner.results.totalCount === 2),
        'Expectation count should be 2, but was ' + runner.results.totalCount);
    reporter.test((runner.results.passedCount === 1),
        'Expectation Passed count should be 1, but was ' + runner.results.passedCount);
    reporter.test((runner.results.failedCount === 1),
        'Expectation Failed count should be 1, but was ' + runner.results.failedCount);
    reporter.test((runner.results.description === 'All Jasmine Suites'),
        'Jasmine Runner does not have the expected description, has: ' + runner.results.description);
  }, 500);

}

var testReporterWithCallbacks = function () {
  jasmine = Jasmine.init();
  var runner = Runner();
  
  describe('Suite for JSON Reporter with Callbacks', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });
    it('should be a failing test', function() {
      runs(function () {
        this.expects_that(false).should_equal(true);
      });
    });
  });
  describe('Suite for JSON Reporter with Callbacks 2', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });

  });

  var foo = 0;
  var bar = 0;
  var baz = 0;

  var specCallback   = function (results) { foo++; }
  var suiteCallback  = function (results) { bar++; }
  var runnerCallback = function (results) { baz++; }

  jasmine.reporter = Jasmine.Reporters.reporter({
    specCallback: specCallback,
    suiteCallback: suiteCallback,
    runnerCallback: runnerCallback
  });
  runner.execute();

  setTimeout(function() {
    reporter.test((foo === 3),
        'foo was expected to be 3, was ' + foo);
    reporter.test((bar === 2),
        'bar was expected to be 2, was ' + bar);
    reporter.test((baz === 1),
        'baz was expected to be 1, was ' + baz);

  }, 750);
}

var testJSONReporter = function () {
  jasmine = Jasmine.init();
  var runner = Runner();

  describe('Suite for JSON Reporter, NO DOM', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });
  });

  jasmine.reporter = Jasmine.Reporters.JSON();

  runner.execute();

  setTimeout(function() {
    var expectedSpecJSON   = '{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"passed": true, "message": "Passed."}], "description": "should be a test"}';
    var expectedSuiteJSON  = '{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"passed": true, "message": "Passed."}], "description": "should be a test"}], "description": "Suite for JSON Reporter, NO DOM"}';
    var expectedRunnerJSON = '{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"passed": true, "message": "Passed."}], "description": "should be a test"}], "description": "Suite for JSON Reporter, NO DOM"}], "description": "All Jasmine Suites"}';

    specJSON = jasmine.reporter.specJSON;
    reporter.test((specJSON === expectedSpecJSON),
        'JSON Reporter does not have the expected Spec results report.<br /> <b>Expected:</b><br /> ' + expectedSpecJSON +
        '<br /><b>Got:</b><br /> ' + specJSON);

    suiteJSON = jasmine.reporter.suiteJSON;
    reporter.test((suiteJSON === expectedSuiteJSON),
        'JSON Reporter does not have the expected Suite results report.<br /> <b>Expected:</b><br /> ' + expectedSuiteJSON +
        '<br /><b>Got:</b><br /> ' + suiteJSON);

    runnerJSON = jasmine.reporter.runnerJSON;
    reporter.test((runnerJSON === expectedRunnerJSON),
        'JSON Reporter does not have the expected Runner results report.<br /> <b>Expected:</b><br /> ' + expectedRunnerJSON +
        '<br /><b>Got:</b><br /> ' + runnerJSON);
  }, 500);
}

var testJSONReporterWithDOM = function () {
  jasmine = Jasmine.init();
  var runner = Runner();

  describe('Suite for JSON Reporter/DOM', function () {
    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });
  });

  jasmine.reporter = Jasmine.Reporters.JSONtoDOM('json_reporter_results');
  runner.execute();

  setTimeout(function() {
    var expectedJSONString = '{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"totalCount": 1, "passedCount": 1, "failedCount": 0, "results": [{"passed": true, "message": "Passed."}], "description": "should be a test"}], "description": "Suite for JSON Reporter/DOM"}], "description": "All Jasmine Suites"}';

    reporter.test((document.getElementById('json_reporter_results').innerHTML === expectedJSONString),
        'JSON Reporter with DOM did not write the expected report to the DOM, got:' + document.getElementById('json_reporter_results').innerHTML);
  }, 250);
}

var testHandlesBlankSpecs = function () {
  jasmine = Jasmine.init();
  var runner = Runner();

  describe('Suite for handles blank specs', function () {
    it('should be a test with a blank runs block', function() {
      runs(function () {
      });
    });
    it('should be a blank (empty function) test', function() {

    });
    
  });
  runner.execute();

  setTimeout(function() {
    reporter.test((runner.results.results[0].results.results.length === 2),
        'Should have found 2 spec results, got ' + runner.results.results[0].results.results.length );
    reporter.test((runner.results.results[0].results.passedCount === 2),
        'Should have found 2 passing specs, got ' + runner.results.results[0].results.passedCount);
  }, 250);
}

var testResultsAliasing = function () {
  jasmine = Jasmine.init();
  var runner = Runner();

  describe('Suite for result aliasing test', function () {

    it('should be a test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });

  });

  describe('Suite number two for result aliasing test', function () {
    it('should be a passing test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });

    it('should be a passing test', function() {
      runs(function () {
        this.expects_that(true).should_equal(true);
      });
    });

  });


  runner.execute();

  setTimeout(function() {

    reporter.test((runner.suiteResults !== undefined),
        'runner.suiteResults was not defined');

    reporter.test((runner.suiteResults == runner.results.results),
        'runner.suiteResults should have been ' + Object.toJSON(runner.results.results) +
        ', but was ' + Object.toJSON(runner.suiteResults));

    reporter.test((runner.suiteResults[1] == runner.results.results[1]),
        'runner.suiteResults should have been ' + Object.toJSON(runner.results.results[1]) +
        ', but was ' + Object.toJSON(runner.suiteResults[1]));

    reporter.test((runner.suites[0].specResults !== undefined),
        'runner.suites[0].specResults was not defined');

    reporter.test((runner.suites[0].specResults == runner.results.results[0].results),
        'runner.suites[0].specResults should have been ' + Object.toJSON(runner.results.results[0].results) +
        ', but was ' + Object.toJSON(runner.suites[0].specResults));

    reporter.test((runner.suites[0].specs[0].expectationResults !== undefined),
        'runner.suites[0].specs[0].expectationResults was not defined');

    reporter.test((runner.suites[0].specs[0].expectationResults == runner.results.results[0].results[0].results),
        'runner.suites[0].specs[0].expectationResults should have been ' + Object.toJSON(runner.results.results[0].results[0].results) +
        ', but was ' + Object.toJSON(runner.suites[0].specs[0].expectationResults));
    
  }, 250);
}


var runTests = function () {
  $('spinner').show();

  testMatchersComparisons();
  testMatchersReporting();
  testSpecs();
  testAsyncSpecs();
  testAsyncSpecsWithMockSuite();
  testSuites();
  testBeforeAndAfterCallbacks();
  testSpecScope();
  testRunner();
  testRunnerFinishCallback();
  testNestedResults();
  testResults();
//  testHandlesBlankSpecs();

  // Timing starts to matter with these tests; ALWAYS use setTimeout()
  setTimeout(function () {
    testReporterWithCallbacks();
  }, 2500);
  setTimeout(function () {
    testJSONReporter();
  }, 3500);
  setTimeout(function () {
    testJSONReporterWithDOM();
  }, 5000);

  testResultsAliasing();
  setTimeout(function() {
    $('spinner').hide();
    reporter.summary();
  }, 6000);
}


