import Joi from "joi";

import { DistributionEventType, FunctionRuntime } from "./aws/index.js";
import { Config, FunctionAssociationConfig, FunctionConfig } from "./types.js";

const associationSchema = Joi.object<FunctionAssociationConfig>({
  distributionId: Joi.string().required(),
  eventType: Joi.string()
    .valid(...Object.values(DistributionEventType))
    .required(),
  behaviourPattern: Joi.string().required(),
}).required();

const runtimeSchema = Joi.string()
  .valid(...Object.values(FunctionRuntime))
  .optional();

const fnSchema = Joi.object<FunctionConfig>().pattern(
  Joi.string().required(),
  Joi.object({
    runtime: runtimeSchema,
    handler: Joi.string().required(),
    test: Joi.string().optional(),
    associations: Joi.array().items(associationSchema).required(),
    isEnabled: Joi.boolean().optional(),
    description: Joi.string().optional(),
  })
);

export const configSchema = Joi.object<Config>({
  pathPrefix: Joi.string().optional(),
  defaultRuntime: runtimeSchema,
  functions: fnSchema.required(),
});
