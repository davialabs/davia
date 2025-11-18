import chalk from "chalk";

/**
 * Exit the process with an error message and helpful tips
 */
export function exitWithError(message: string, tips: string[]): never {
  console.error(chalk.red.bold(`\n❌ ${message}\n`));
  if (tips.length > 0) {
    console.error(chalk.yellow("💡 Helpful tips:"));
    for (const tip of tips) {
      if (tip.trim() === "") {
        console.error();
      } else {
        console.error(chalk.yellow(`   ${tip}`));
      }
    }
    console.error();
  }
  process.exit(1);
}
