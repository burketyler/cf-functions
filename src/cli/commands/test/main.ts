import { TestResult } from "aws-sdk/clients/cloudfront.js";
import cloneDeep from "clone-deep";
import ora, { Ora } from "ora";
import { join } from "path";
import { v4 } from "uuid";
import { CommandBuilder, CommandModule } from "yargs";

import {
  describeFunction,
  DistributionEventType,
  FunctionEvent,
  FunctionResult,
  FunctionStage,
  testFunction,
} from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { logger } from "../../../logging/index.js";
import { LogListItem } from "../../../logging/types.js";
import { isAsymmetricMatch } from "../../../matchers/is-asymmetric-match.js";
import { Config, FunctionConfig } from "../../../types.js";
import { DEFAULT_ARGS } from "../../consts.js";
import {
  assertFileExists,
  parseConfigFile,
  settlePromises,
} from "../../utils.js";

import { DEFAULT_EVENT_OBJECT } from "./consts.js";
import {
  TestArgs,
  TestCase,
  TestCaseResult,
  TestError,
  TestResultMap,
  ViewerRequestTestObject,
  ViewerResponseTestObject,
} from "./types.js";

const command = "test";

const desc = "Run test suite against functions deployed in a specific stage.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
  stage: {
    alias: "s",
    demandOption: true,
    choices: [FunctionStage.DEVELOPMENT, FunctionStage.LIVE],
    describe: "The function stage to run test suite against.",
    type: "string",
  },
};

const handler = async (args: TestArgs) => {
  logger.info("Starting command 'test'.\n");

  const config = await parseConfigFile(args.config);

  logger.info(`Running test suite for stage '${args.stage}'.\n`);

  const testPromises = runTests(config, args.stage);

  await settleAndPrintTestResults(testPromises);

  logger.info("Finishing command 'test'.");
};

async function parseTestData(
  functionName: string,
  functionConfig: FunctionConfig,
  pathPrefix: string | undefined
): Promise<TestCase[]> {
  if (!functionConfig.test) {
    logger.fatal(`Test file for function '${functionName}' is undefined.`);
    process.exit(1);
  }

  const testPath = join(process.cwd(), pathPrefix ?? "", functionConfig.test);

  assertFileExists(
    testPath,
    `Failed to locate test file for function '${functionName}'.`
  );

  return (await import(testPath)).default;
}

function runTests(
  config: Config,
  stage: FunctionStage
): Promise<TestCaseResult[]>[] {
  return Object.entries(config.functions).map(
    async ([functionName, functionConfig]) => {
      const results: TestCaseResult[] = [];

      const progress = ora({
        indent: 2,
        text: functionName,
      }).start();

      try {
        const [testCases, deployedFunction] = await Promise.all([
          parseTestData(functionName, functionConfig, config.pathPrefix),
          describeFunction(functionName, stage),
        ]);

        await iterateTestCases({
          stage,
          deployedFunction,
          functionConfig,
          testCases,
          progress,
          results,
        });
      } catch (error) {
        progress.fail(`Error while running test for '${functionName}'.`);

        throw {
          error,
          functionName,
        } as TestError;
      }

      return results;
    }
  );
}

async function iterateTestCases(inputs: {
  stage: FunctionStage;
  testCases: TestCase[];
  deployedFunction: FunctionResult;
  functionConfig: FunctionConfig;
  progress: Ora;
  results: TestCaseResult[];
}): Promise<void> {
  const {
    stage,
    testCases,
    deployedFunction,
    functionConfig,
    progress,
    results,
  } = inputs;
  await Promise.allSettled(
    testCases.map(async (testCase) => {
      try {
        const testResult = await testFunction({
          stage,
          name: deployedFunction.summary.Name,
          eTag: deployedFunction.eTag,
          eventObject: mergeEventObject(testCase.given, functionConfig),
        });

        const isSuccess = assertExpectedOutput(testResult, testCase.expect);

        if (isSuccess) {
          progress.succeed(testCase.name);
        } else {
          progress.fail(testCase.name);
        }

        results.push({
          ...testResult,
          ...testCase,
          isSuccess,
        });
      } catch (error) {
        progress.fail(testCase.name);

        results.push({
          ...testCase,
          error,
          FunctionSummary: deployedFunction.summary,
          isSuccess: false,
        });
      }
    })
  );
}

function mergeEventObject(
  eventObject: ViewerRequestTestObject | ViewerResponseTestObject,
  config: FunctionConfig
): string {
  const defaults = cloneDeep(DEFAULT_EVENT_OBJECT);
  const { distributionId, eventType } = config.associations[0];

  if (eventType === DistributionEventType.VIEWER_REQUEST) {
    delete defaults.response;
  }

  const mergedObject = {
    ...defaults,
    ...eventObject,
    context: {
      distributionId,
      eventType,
      distributionDomainName: `${distributionId}.cloudfront.net`,
      requestId: `test-${v4()}`,
    },
  } as FunctionEvent;

  return JSON.stringify(mergedObject);
}

function assertExpectedOutput(
  result: TestResult,
  expected: FunctionEvent
): boolean {
  return (
    !result.FunctionErrorMessage &&
    isAsymmetricMatch(
      { ...expected },
      { ...JSON.parse(result.FunctionOutput ?? "") }
    )
  );
}

async function settleAndPrintTestResults(
  testPromises: Promise<TestCaseResult[]>[]
): Promise<void> {
  const results = await settlePromises<TestCaseResult[], TestError>(
    testPromises
  );

  const aggregatedResults = aggregateResults(results);

  if (Object.keys(aggregatedResults.resultsMap)?.[0]) {
    printTestResults(aggregatedResults.resultsMap);
  }

  if (aggregatedResults.errors?.[0]) {
    printErrorResults(aggregatedResults.errors);
  }

  printTotals(aggregatedResults);
}

function aggregateResults(results: {
  successList: TestCaseResult[][];
  rejectList: TestError[];
}): {
  resultsMap: TestResultMap;
  errors: TestError[];
  totalSuites: number;
  totalTests: number;
  totalSuccess: number;
  totalFails: number;
} {
  let totalSuites = 0;
  let totalTests = 0;
  let totalSuccess = 0;
  let totalFails = 0;

  const resultsMap: TestResultMap = {};
  const errors: TestError[] = [];

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  results.successList.forEach((testCases) => {
    totalSuites++;

    testCases
      .filter((tc) => !tc.error)
      .forEach((tc) => {
        totalTests++;

        if (!resultsMap[tc.FunctionSummary!.Name]) {
          resultsMap[tc.FunctionSummary!.Name] = [];
        }

        resultsMap[tc.FunctionSummary!.Name].push(tc);
      });

    testCases
      .filter((tc) => !!tc.error)
      .forEach((tc) => {
        totalTests++;

        errors.push({
          functionName: tc.FunctionSummary!.Name,
          error: tc.error!,
        });
      });

    totalSuccess += testCases.filter((tc) => tc.isSuccess).length;
    totalFails += testCases.filter((tc) => !tc.isSuccess).length;
  });
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  results.rejectList.forEach((error) => errors.push(error));
  totalFails += errors.length;

  return {
    resultsMap,
    errors,
    totalSuites,
    totalTests,
    totalSuccess,
    totalFails,
  };
}

function printTestResults(resultsMap: TestResultMap) {
  new LogBuilder({
    color: "yellow",
    message: "\nFinished running test suites.",
  })
    .break(2)
    .list(
      Object.entries(resultsMap).map(([functionName, testResults]) => ({
        message: functionName,
        color: "cyan",
        children: testResults.map((result) => {
          let message: string;

          if (result.isSuccess) {
            message = `✅  [Success] '${result.name}' [Compute: ${result.ComputeUtilization}]`;
          } else if (result.FunctionErrorMessage) {
            message = `❌  [Error] '${result.name}' | ${result.FunctionErrorMessage}`;
          } else {
            message = `❌  [Failed] '${result.name}' [Compute: ${result.ComputeUtilization}]`;
          }

          const children: LogListItem[] = [];

          if (!result.isSuccess) {
            children.push(
              {
                color: "green",
                message: `Expected: ${JSON.stringify(result.expect)}`,
              },
              {
                color: "red",
                message: `Actual: ${result.FunctionOutput}`,
              }
            );
          }

          result.FunctionExecutionLogs?.forEach((log) =>
            children.push({
              bullet: "",
              message: `Output: ${log}`,
              color: "white",
            })
          );

          return {
            message,
            bullet: "",
            color: result.isSuccess ? "green" : "red",
            children,
          };
        }),
      }))
    )
    .log();
}

function printErrorResults(errors: TestError[]) {
  new LogBuilder({
    color: "red",
    message: "\nUnexpected errors occurred during test run.",
  })
    .break(2)
    .list(
      errors.map((error) => ({
        bullet: "numbered",
        message: error.functionName,
        color: "red",
        children: [
          {
            bullet: "",
            message: error.error.name,
            color: "red",
            children: [
              {
                bullet: "",
                message: error.error.message,
                color: "red",
                children: error.error.stack
                  ? [
                      {
                        bullet: "",
                        message: error.error.stack,
                        color: "red",
                      },
                    ]
                  : [],
              },
            ],
          },
        ],
      }))
    )
    .log();
}

function printTotals(totals: {
  totalSuites: number;
  totalTests: number;
  totalSuccess: number;
  totalFails: number;
}) {
  const delimiter = "*********************************";

  new LogBuilder({
    message: delimiter,
    color: "yellow",
  })
    .break(2)
    .setIndent(2)
    .setColor("white")
    .line(`Total suites: ${totals.totalSuites}`)
    .line(`Total tests: ${totals.totalTests}`)
    .setColor("green")
    .write(`Succeeded: ${totals.totalSuccess}`)
    .setColor("grey")
    .write(" | ")
    .setColor("red")
    .write(`Failed: ${totals.totalFails}`)
    .break(2)
    .setColor("yellow")
    .line(delimiter)
    .log();
}

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, TestArgs>; // eslint-disable-line @typescript-eslint/ban-types
