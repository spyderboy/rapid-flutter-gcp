#!/usr/bin/env node
import fs from "fs";

function ok(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("OK:", msg);
}

ok(fs.existsSync("apps/client/pubspec.yaml"), "Flutter app exists at apps/client");
ok(fs.existsSync("functions/api/package.json"), "API exists at functions/api");
ok(fs.existsSync("netlify.toml"), "netlify.toml exists");
ok(fs.existsSync(".gitignore"), ".gitignore exists");

console.log("
Smoke checks passed.");
