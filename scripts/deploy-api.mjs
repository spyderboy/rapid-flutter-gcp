#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";

function run(cmd, cwd) {
  console.log("
> " + cmd);
  execSync(cmd, { stdio: "inherit", cwd });
}

const args = process.argv.slice(2).join(" ");
const apiDir = path.resolve("functions/api");

run(`node scripts/deploy.mjs ${args}`, apiDir);
