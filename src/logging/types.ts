import { ColorName } from "chalk";

export interface LogListItem {
  message: string;
  bullet?: string | "numbered";
  color?: ColorName;
  breaks?: number;
  indent?: number;
  children?: LogListItem[];
}
