export class SimpleParser {
  private content: string;

  private debug: boolean;

  constructor(content: string, debug = false) {
    this.content = content;
    this.debug = debug;
  }

  generateEntities(): {
    classNames: string[];
    displayNames: string[];
    mainClassName: string;
  } {
    let openBrackets = 0;
    let closeBrackets = 0;
    let inCfgWeapons = false;
    let mainClassName = "";
    const displayNames: string[] = [];
    const classNames: string[] = [];

    const lines = this.content
      // @ts-ignore
      .replaceAll("\r", "")
      // @ts-ignore
      .replaceAll("\t", "")
      .split("\n");

    lines.forEach((line: string, index: number) => {
      if (line.trim().startsWith("//")) return;
      if (this.debug) console.log(index, line);
      const bracketsDiff = openBrackets - closeBrackets;
      if (bracketsDiff === 0) {
        if (inCfgWeapons && mainClassName) {
          if (this.debug) console.log('out from "CfgWeapons"');
          inCfgWeapons = false;
        } else {
          if (
            line.toLowerCase().includes("class CfgWeapons".toLowerCase()) ||
            line.toLowerCase().includes("class CfgVehicles".toLowerCase())
          ) {
            if (this.debug) console.log('in "CfgWeapons"');
            inCfgWeapons = true;
          }
        }
      } else {
        if (
          inCfgWeapons &&
          bracketsDiff === 1 &&
          line.match(/class\s+.+\s*:\s*.+/)
        ) {
          if (!mainClassName) {
            mainClassName = line
              .split(":")[1]
              .replace("{", "")
              .replace("}", "")
              .trim();
          }

          const className = line
            .replace(":", " : ")
            .split(" ")
            .filter(Boolean)[1]
            .trim();

          if (className) {
            classNames.push(className);
          }
        } else {
          if (
            inCfgWeapons &&
            bracketsDiff === 2 &&
            line.match(/displayName\s*=\s*.+/)
          ) {
            displayNames.push(
              // @ts-ignore
              line.split("=")[1].replaceAll('"', "").replaceAll(";", "").trim()
            );
          }
        }
      }
      line.split("").forEach((char: string) => {
        if (char === "{") {
          openBrackets++;
        } else if (char === "}") {
          closeBrackets++;
        }
      });
    });

    return { classNames, mainClassName, displayNames };
  }
}
