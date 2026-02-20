#!/usr/bin/env node
/**
 * update-demo-bytecode.js
 *
 * Foundry artifact(out)에서 bytecode를 읽어 demo-next/public/*.txt를 최신화합니다.
 *
 * 사용법:
 *   forge build && node scripts/update-demo-bytecode.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = [
  {
    name: 'MainVoting',
    artifactPath: 'out/MainVoting.sol/MainVoting.json',
    outputPath: 'demo-next/public/MainVoting-bytecode.txt',
  },
  {
    name: 'SubVoting',
    artifactPath: 'out/SubVoting.sol/SubVoting.json',
    outputPath: 'demo-next/public/SubVoting-bytecode.txt',
  },
  {
    name: 'Boosting',
    artifactPath: 'out/Boosting.sol/Boosting.json',
    outputPath: 'demo-next/public/Boosting-bytecode.txt',
  },
  {
    name: 'CelebToken',
    artifactPath: 'out/CelebToken.sol/CelebToken.json',
    outputPath: 'demo-next/public/CelebToken-bytecode.txt',
  },
  {
    name: 'VIBENFT',
    artifactPath: 'out/VIBENFT.sol/VIBENFT.json',
    outputPath: 'demo-next/public/VIBENFT-bytecode.txt',
  },
];

function readBytecode(artifactRelativePath) {
  const artifactPath = path.join(ROOT_DIR, artifactRelativePath);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactRelativePath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact?.bytecode?.object;
  if (!bytecode || typeof bytecode !== 'string') {
    throw new Error(`bytecode.object missing: ${artifactRelativePath}`);
  }
  return bytecode;
}

function writeBytecode(outputRelativePath, bytecode) {
  const outputPath = path.join(ROOT_DIR, outputRelativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${bytecode}\n`, 'utf8');
}

function verifyBytecode(outputRelativePath, expectedBytecode) {
  const outputPath = path.join(ROOT_DIR, outputRelativePath);
  if (!fs.existsSync(outputPath)) {
    return false;
  }
  const content = fs.readFileSync(outputPath, 'utf8').trim();
  return content === expectedBytecode;
}

function main() {
  console.log('========================================');
  console.log(' Demo-next Bytecode Updater');
  console.log('========================================\n');

  let updated = 0;
  let failed = 0;

  for (const target of TARGETS) {
    process.stdout.write(`[${target.name}] `);
    try {
      const bytecode = readBytecode(target.artifactPath);
      writeBytecode(target.outputPath, bytecode);

      if (!verifyBytecode(target.outputPath, bytecode)) {
        throw new Error(`verification failed: ${target.outputPath}`);
      }

      updated += 1;
      console.log(`OK (${bytecode.length} chars) -> ${target.outputPath}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log(` Updated: ${updated}`);
  console.log(` Failed:  ${failed}`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

main();
