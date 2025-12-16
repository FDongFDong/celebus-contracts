#!/usr/bin/env node
/**
 * update-demo-bytecode.js
 *
 * forge 빌드 결과에서 바이트코드를 추출하여 각 데모의 config.js를 업데이트합니다.
 * 업데이트 후 자동으로 검증하여 일치 여부를 확인합니다.
 *
 * 사용법:
 *   forge build && node scripts/update-demo-bytecode.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트 디렉토리
const ROOT_DIR = path.resolve(__dirname, '..');

// 업데이트할 데모 설정
const DEMOS = [
  {
    name: 'MainVoting',
    artifactPath: 'out/MainVoting.sol/MainVoting.json',
    configPath: 'demo/js/config.js',
    variableName: 'MAINVOTING_BYTECODE',
  },
  {
    name: 'SubVoting',
    artifactPath: 'out/SubVoting.sol/SubVoting.json',
    configPath: 'sub_demo/js/config.js',
    variableName: 'SUBVOTING_BYTECODE',
  },
  {
    name: 'Boosting',
    artifactPath: 'out/Boosting.sol/Boosting.json',
    configPath: 'boosting_demo/js/config.js',
    variableName: 'BOOSTING_BYTECODE',
  }
];

/**
 * forge artifact에서 바이트코드 추출
 */
function getBytecodeFromArtifact(artifactPath) {
  const fullPath = path.join(ROOT_DIR, artifactPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`  [ERROR] Artifact not found: ${artifactPath}`);
    console.error(`  Run 'forge build' first.`);
    return null;
  }

  const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const bytecode = artifact.bytecode?.object;

  if (!bytecode) {
    console.error(`  [ERROR] No bytecode in artifact: ${artifactPath}`);
    return null;
  }

  return bytecode;
}

/**
 * config.js에서 현재 바이트코드 추출
 */
function getBytecodeFromConfig(configPath, variableName) {
  const fullPath = path.join(ROOT_DIR, configPath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // 큰따옴표 또는 작은따옴표 패턴 매칭
  const doubleQuoteMatch = content.match(
    new RegExp(`export\\s+const\\s+${variableName}\\s*=\\s*"([^"]*)"`)
  );
  const singleQuoteMatch = content.match(
    new RegExp(`export\\s+const\\s+${variableName}\\s*=\\s*'([^']*)'`)
  );

  if (doubleQuoteMatch) return doubleQuoteMatch[1];
  if (singleQuoteMatch) return singleQuoteMatch[1];
  return null;
}

/**
 * config.js 파일의 바이트코드 업데이트
 */
function updateConfigBytecode(configPath, variableName, newBytecode) {
  const fullPath = path.join(ROOT_DIR, configPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`  [ERROR] Config file not found: ${configPath}`);
    return { success: false, skipped: false };
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // 바이트코드 변수 패턴 (큰따옴표 또는 작은따옴표)
  const doubleQuotePattern = new RegExp(
    `(export\\s+const\\s+${variableName}\\s*=\\s*)"[^"]*"`,
    'g'
  );
  const singleQuotePattern = new RegExp(
    `(export\\s+const\\s+${variableName}\\s*=\\s*)'[^']*'`,
    'g'
  );

  let matched = false;
  let newContent = content;

  // 큰따옴표 패턴 확인
  if (doubleQuotePattern.test(content)) {
    newContent = content.replace(doubleQuotePattern, `$1"${newBytecode}"`);
    matched = true;
  }
  // 작은따옴표 패턴 확인
  else if (singleQuotePattern.test(content)) {
    newContent = content.replace(singleQuotePattern, `$1'${newBytecode}'`);
    matched = true;
  }

  if (!matched) {
    console.error(`  [ERROR] Variable ${variableName} not found in ${configPath}`);
    return { success: false, skipped: false };
  }

  // 변경 사항이 있는지 확인
  if (content === newContent) {
    return { success: true, skipped: true };
  }

  fs.writeFileSync(fullPath, newContent, 'utf8');
  return { success: true, skipped: false };
}

/**
 * 메인 실행
 */
function main() {
  console.log('========================================');
  console.log(' Demo Bytecode Updater');
  console.log('========================================\n');

  const results = [];
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const demo of DEMOS) {
    console.log(`[${demo.name}]`);

    // 바이트코드 추출
    const bytecode = getBytecodeFromArtifact(demo.artifactPath);
    if (!bytecode) {
      failCount++;
      results.push({ name: demo.name, status: 'FAIL', reason: 'artifact not found' });
      console.log('');
      continue;
    }

    console.log(`  Bytecode length: ${bytecode.length} chars`);

    // config.js 업데이트
    const { success, skipped } = updateConfigBytecode(
      demo.configPath,
      demo.variableName,
      bytecode
    );

    if (success) {
      if (skipped) {
        console.log(`  [SKIP] Already up-to-date`);
        skipCount++;
        results.push({ name: demo.name, status: 'SKIP', bytecodeLength: bytecode.length });
      } else {
        console.log(`  [SUCCESS] Updated ${demo.configPath}`);
        successCount++;
        results.push({
          name: demo.name,
          status: 'UPDATE',
          bytecodeLength: bytecode.length,
          configPath: demo.configPath,
          variableName: demo.variableName,
          artifactBytecode: bytecode
        });
      }
    } else {
      failCount++;
      results.push({ name: demo.name, status: 'FAIL', reason: 'update failed' });
    }

    console.log('');
  }

  // 검증 단계
  console.log('========================================');
  console.log(' Verification');
  console.log('========================================\n');

  let verifyPassCount = 0;
  let verifyFailCount = 0;

  for (const demo of DEMOS) {
    const artifactBytecode = getBytecodeFromArtifact(demo.artifactPath);
    const configBytecode = getBytecodeFromConfig(demo.configPath, demo.variableName);

    console.log(`[${demo.name}]`);

    if (!artifactBytecode) {
      console.log(`  [FAIL] Artifact bytecode not found`);
      verifyFailCount++;
      continue;
    }

    if (!configBytecode) {
      console.log(`  [FAIL] Config bytecode not found`);
      verifyFailCount++;
      continue;
    }

    const artifactLen = artifactBytecode.length;
    const configLen = configBytecode.length;

    if (artifactBytecode === configBytecode) {
      console.log(`  [PASS] Bytecode match (${artifactLen} chars)`);
      verifyPassCount++;
    } else {
      console.log(`  [FAIL] Bytecode mismatch!`);
      console.log(`    Artifact: ${artifactLen} chars`);
      console.log(`    Config:   ${configLen} chars`);
      console.log(`    Diff:     ${artifactLen - configLen} chars`);
      verifyFailCount++;
    }

    console.log('');
  }

  // 최종 결과
  console.log('========================================');
  console.log(' Results');
  console.log('========================================');
  console.log(` Update:   ${successCount} updated, ${skipCount} skipped, ${failCount} failed`);
  console.log(` Verify:   ${verifyPassCount} passed, ${verifyFailCount} failed`);
  console.log('========================================');

  // 검증 실패 시 exit code 1
  process.exit(verifyFailCount > 0 ? 1 : 0);
}

main();
