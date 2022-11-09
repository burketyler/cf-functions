import Joi from "joi";

import { FunctionEventType, FunctionRuntime } from "./aws/index.js";

const associationSchema = Joi.object({
  distributionId: Joi.string().required(),
  eventType: Joi.string()
    .valid(...Object.values(FunctionEventType))
    .required(),
}).required();

const runtimeSchema = Joi.string()
  .valid(...Object.values(FunctionRuntime))
  .optional();

const fnSchema = Joi.object().pattern(
  Joi.string().required(),
  Joi.object({
    handler: Joi.string().required(),
    runtime: runtimeSchema,
    associations: Joi.array().items(associationSchema).required(),
    isEnabled: Joi.boolean().optional(),
    description: Joi.string().optional(),
  })
);

export const configSchema = Joi.object({
  functions: fnSchema.required(),
  pathPrefix: Joi.string().optional(),
  defaultRuntime: runtimeSchema,
});
