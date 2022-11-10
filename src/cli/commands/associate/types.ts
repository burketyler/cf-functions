import {
  DistributionResult,
  DistributionEventType,
} from "../../../aws/index.js";
import { BehaviourPattern } from "../../../types.js";
import { DefaultArgs } from "../../types.js";

export type AssociateArgs = DefaultArgs;

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

export interface StatusPollResult {
  distribution: DistributionResult;
}

export interface StatusPollResultError extends StatusPollResult {
  error: Error;
}
