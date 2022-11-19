import {
  DistributionEventType,
  DistributionResult,
  FunctionInputs,
  listFunctions,
} from "../aws/index.js";
import { BehaviourPattern } from "../types.js";

export interface DefaultArgs {
  config?: string;
  env?: string;
}

export interface FunctionResultError {
  functionInputs: FunctionInputs;
  error: Error;
}

export interface FunctionManifest {
  functionInputs: FunctionInputs[];
  deployedFunctions: Awaited<ReturnType<typeof listFunctions>>;
}

export interface AssociationManifest {
  [distributionId: string]: {
    distribution: DistributionResult;
    associations: ManifestAssociation[];
  };
}

export interface ManifestAssociation {
  PathPattern: BehaviourPattern;
  EventType: DistributionEventType;
  FunctionARN: string;
}

export interface AssociateResult {
  associations: ManifestAssociation[];
  distribution: DistributionResult;
}

export interface AssociateResultError {
  distribution: DistributionResult;
  error: Error;
}
