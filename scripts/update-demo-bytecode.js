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
    abiPaths: ['demo/MainVoting-abi.json', 'demo/js/abi/MainVoting.json'],
  },
  {
    name: 'SubVoting',
    artifactPath: 'out/SubVoting.sol/SubVoting.json',
    configPath: 'sub_demo/js/config.js',
    variableName: 'SUBVOTING_BYTECODE',
    abiPaths: ['sub_demo/SubVoting-abi.json', 'sub_demo/js/abi/SubVoting.json'],
  },
  {
    name: 'Boosting',
    artifactPath: 'out/Boosting.sol/Boosting.json',
    configPath: 'boosting_demo/js/config.js',
    variableName: 'BOOSTING_BYTECODE',
    abiPaths: ['boosting_demo/Boosting-abi.json', 'boosting_demo/js/abi/Boosting.json'],
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
 * forge artifact에서 ABI 추출
 */
function getAbiFromArtifact(artifactPath) {
  const fullPath = path.join(ROOT_DIR, artifactPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`  [ERROR] Artifact not found: ${artifactPath}`);
    console.error(`  Run 'forge build' first.`);
    return null;
  }

  const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const abi = artifact.abi;

  if (!Array.isArray(abi)) {
    console.error(`  [ERROR] No abi in artifact: ${artifactPath}`);
    return null;
  }

  return abi;
}

function writeJsonFile(relativePath, data) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * config.js 내 embedded ABI 배열 업데이트 (file:// 환경 fallback용)
 */
function updateConfigEmbeddedAbi(configPath, newAbi) {
  const fullPath = path.join(ROOT_DIR, configPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`  [ERROR] Config file not found: ${configPath}`);
    return { success: false, skipped: false };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const abiLineMatch = content.match(/^\s*ABI\s*:\s*\[/m);
  if (!abiLineMatch || abiLineMatch.index === undefined) {
    console.error(`  [ERROR] Embedded ABI not found in ${configPath}`);
    return { success: false, skipped: false };
  }

  const abiPropStart = abiLineMatch.index;
  const indent = abiLineMatch[0].match(/^\s*/)?.[0] ?? '';

  const arrayStart = content.indexOf('[', abiPropStart);
  if (arrayStart === -1) {
    console.error(`  [ERROR] Embedded ABI array start not found in ${configPath}`);
    return { success: false, skipped: false };
  }

  // Bracket matching with string awareness (handles JSON-like ABI pretty safely)
  let i = arrayStart;
  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (; i < content.length; i++) {
    const ch = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\\\') {
        escaped = true;
        continue;
      }
      if (ch === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      continue;
    }

    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        i++; // include closing bracket
        break;
      }
    }
  }

  if (depth !== 0) {
    console.error(`  [ERROR] Failed to parse embedded ABI array in ${configPath}`);
    return { success: false, skipped: false };
  }

  // Include trailing comma if present
  let end = i;
  while (end < content.length && /\s/.test(content[end])) end++;
  if (content[end] === ',') end++;

  const abiJson = JSON.stringify(newAbi, null, 2);
  const abiLines = abiJson.split('\n');
  const abiLiteral =
    abiLines.length <= 1
      ? abiLines[0]
      : abiLines[0] + '\n' + abiLines.slice(1).map((l) => indent + l).join('\n');

  const replacement = `${indent}ABI: ${abiLiteral},`;
  const newContent = content.slice(0, abiPropStart) + replacement + content.slice(end);

  if (newContent === content) {
    return { success: true, skipped: true };
  }

  fs.writeFileSync(fullPath, newContent, 'utf8');
  return { success: true, skipped: false };
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
  let abiUpdateCount = 0;
  let abiFailCount = 0;
  let embeddedAbiUpdateCount = 0;
  let embeddedAbiFailCount = 0;

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

    // ABI 업데이트
    const abi = getAbiFromArtifact(demo.artifactPath);
    if (!abi) {
      abiFailCount++;
      console.log(`  [WARN] ABI not updated (artifact ABI missing)`);
    } else if (Array.isArray(demo.abiPaths)) {
      for (const abiPath of demo.abiPaths) {
        try {
          writeJsonFile(abiPath, abi);
          abiUpdateCount++;
          console.log(`  [SUCCESS] Updated ABI: ${abiPath}`);
        } catch (e) {
          abiFailCount++;
          console.log(`  [FAIL] Failed to update ABI: ${abiPath}`);
          console.log(`    ${e.message}`);
        }
      }
    }

    console.log(`  Bytecode length: ${bytecode.length} chars`);

    // Embedded ABI 업데이트 (file:// fallback)
    if (abi) {
      const { success: abiOk, skipped: abiSkipped } = updateConfigEmbeddedAbi(
        demo.configPath,
        abi
      );
      if (abiOk) {
        if (abiSkipped) {
          console.log(`  [SKIP] Embedded ABI already up-to-date`);
        } else {
          console.log(`  [SUCCESS] Updated embedded ABI in ${demo.configPath}`);
        }
        embeddedAbiUpdateCount++;
      } else {
        embeddedAbiFailCount++;
      }
    }

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
  console.log(` ABI:      ${abiUpdateCount} updated, ${abiFailCount} failed`);
  console.log(` ABI(embed): ${embeddedAbiUpdateCount} updated, ${embeddedAbiFailCount} failed`);
  console.log(` Verify:   ${verifyPassCount} passed, ${verifyFailCount} failed`);
  console.log('========================================');

  // 검증 실패 시 exit code 1
  process.exit(verifyFailCount > 0 ? 1 : 0);
}

main();
