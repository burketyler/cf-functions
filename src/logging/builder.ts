import chalk, { ColorName } from "chalk";
import { EOL } from "os";

import { logger } from "./index.js";
import { LogListItem } from "./types.js";

export class LogBuilder {
  private message: string;
  private indCursor: number;
  private paintColor: ColorName;
  private numBreaks: number;

  constructor(options?: {
    message?: string;
    color?: ColorName;
    indent?: number;
    breaks?: number;
  }) {
    this.indCursor = options?.indent ?? 0;
    this.numBreaks = options?.breaks ?? 1;
    this.paintColor = options?.color ?? "white";
    this.message = chalk[this.paintColor](options?.message ?? "");
  }

  public build(): string {
    return this.message;
  }

  public log(): void {
    return logger.log(this.build());
  }

  public setColor(color: ColorName): LogBuilder {
    this.paintColor = color;
    return this;
  }

  public setIndent(ind: number): LogBuilder {
    this.indCursor = ind;
    return this;
  }

  public setBreaks(breaks: number): LogBuilder {
    this.numBreaks = breaks;
    return this;
  }

  public break(count = this.numBreaks): LogBuilder {
    this.message += EOL.repeat(count);
    return this;
  }

  public write(message: string, color?: ColorName): LogBuilder {
    this.message += chalk[color ?? this.paintColor](message);
    return this;
  }

  public line(message: string, color?: ColorName): LogBuilder {
    this.write(`${message}`, color);
    this.break();
    return this;
  }

  public list(items: LogListItem[], indent = 0): LogBuilder {
    items.forEach((item, index) => {
      const bullet =
        item.bullet === "numbered" ? index + 1 : item.bullet ?? "-";

      this.write(
        `${" ".repeat(item.indent ?? indent)} ${bullet} ${item.message}`,
        item.color
      );
      this.break(item.breaks ?? 1);

      if (item.children) {
        this.list(item.children, indent + 3);
      }
    });

    if (indent === 0 && this.numBreaks > 1) {
      this.break(this.numBreaks - 1);
    }

    return this;
  }
}
