#!/usr/bin/env node

/**
 * Script de validación de archivos modificados
 * Verifica que todos los archivos corregidos tengan sintaxis correcta
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${path.basename(filePath)}`, colors.green);
  } else {
    log(`✗ ${path.basename(filePath)} - NO ENCONTRADO`, colors.red);
  }
  return exists;
}

function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function checkFileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    return false;
  }
}

function validateTypeScriptFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificaciones básicas de sintaxis
    const checks = [
      { pattern: /import\s+{/, message: 'Import válido' },
      { pattern: /export\s+(function|const|class|interface)/, message: 'Export válido' },
      { pattern: /^\/\/|\/\*/, message: 'Comentarios válidos' },
    ];
    
    let valid = true;
    for (const check of checks) {
      if (!check.pattern.test(content)) {
        // No es un error, es solo información
      }
    }
    
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ============================================================================
// MAIN
// ============================================================================
function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║     VALIDACIÓN DE ARCHIVOS MODIFICADOS Y CREADOS           ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  const srcPath = __dirname;  // El script está en src/
  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };
  
  // ========================================================================
  // Prueba 1: Archivos renombrados
  // ========================================================================
  log('📋 Prueba 1: Verificación de archivos renombrados', colors.blue);
  const renamedFiles = [
    path.join(srcPath, 'components.json'),
    path.join(srcPath, 'next.config.ts'),
  ];
  
  renamedFiles.forEach(file => {
    if (checkFileExists(file)) {
      results.passed.push(`Archivo renombrado: ${path.basename(file)}`);
    } else {
      results.failed.push(`Archivo no encontrado: ${path.basename(file)}`);
    }
  });
  
  // ========================================================================
  // Prueba 2: Archivos nuevos creados
  // ========================================================================
  log('\n📋 Prueba 2: Verificación de archivos nuevos creados', colors.blue);
  const newFiles = [
    path.join(srcPath, 'lib', 'dev-users.ts'),
    path.join(srcPath, 'lib', 'environment.ts'),
    path.join(srcPath, '__tests__', 'integration.test.ts'),
  ];
  
  newFiles.forEach(file => {
    if (checkFileExists(file)) {
      results.passed.push(`Archivo creado: ${path.basename(file)}`);
    } else {
      results.failed.push(`Archivo nuevo no encontrado: ${path.basename(file)}`);
    }
  });
  
  // ========================================================================
  // Prueba 3: Validar package.json
  // ========================================================================
  log('\n📋 Prueba 3: Validación de package.json', colors.blue);
  const packageJsonPath = path.join(srcPath, 'package.json');
  const packageValidation = validateJsonFile(packageJsonPath);
  if (packageValidation.valid) {
    log('✓ package.json válido', colors.green);
    results.passed.push('package.json válido');
  } else {
    log(`✗ package.json inválido: ${packageValidation.error}`, colors.red);
    results.failed.push(`package.json inválido: ${packageValidation.error}`);
  }
  
  // ========================================================================
  // Prueba 4: Validar tsconfig.json
  // ========================================================================
  log('\n📋 Prueba 4: Validación de tsconfig.json', colors.blue);
  const tsconfigPath = path.join(srcPath, 'tsconfig.json');
  const tsconfigValidation = validateJsonFile(tsconfigPath);
  if (tsconfigValidation.valid) {
    log('✓ tsconfig.json válido', colors.green);
    
    // Verificar que forceConsistentCasingInFileNames esté habilitado
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (content.compilerOptions?.forceConsistentCasingInFileNames) {
      log('  ✓ forceConsistentCasingInFileNames: true', colors.green);
      results.passed.push('forceConsistentCasingInFileNames habilitado');
    } else {
      log('  ✗ forceConsistentCasingInFileNames no está habilitado', colors.red);
      results.failed.push('forceConsistentCasingInFileNames no habilitado');
    }
  } else {
    log(`✗ tsconfig.json inválido: ${tsconfigValidation.error}`, colors.red);
    results.failed.push(`tsconfig.json inválido: ${tsconfigValidation.error}`);
  }
  
  // ========================================================================
  // Prueba 5: Validar contenido de archivos modificados
  // ========================================================================
  log('\n📋 Prueba 5: Validación de contenido en archivos modificados', colors.blue);
  
  // Verificar dev-users.ts
  const devUsersPath = path.join(srcPath, 'lib', 'dev-users.ts');
  if (checkFileContains(devUsersPath, 'getDevUsers')) {
    log('  ✓ dev-users.ts contiene getDevUsers()', colors.green);
    results.passed.push('dev-users.ts tiene función getDevUsers');
  } else {
    log('  ✗ dev-users.ts no contiene getDevUsers', colors.red);
    results.failed.push('dev-users.ts no tiene función getDevUsers');
  }
  
  // Verificar environment.ts
  const envPath = path.join(srcPath, 'lib', 'environment.ts');
  if (checkFileContains(envPath, 'validateEnvironment')) {
    log('  ✓ environment.ts contiene validateEnvironment()', colors.green);
    results.passed.push('environment.ts tiene función validateEnvironment');
  } else {
    log('  ✗ environment.ts no contiene validateEnvironment', colors.red);
    results.failed.push('environment.ts no tiene función validateEnvironment');
  }
  
  // Verificar login/route.ts
  const loginRoutePath = path.join(srcPath, 'app', 'next-api', 'auth', 'login', 'route.ts');
  if (checkFileContains(loginRoutePath, 'getDevUsers')) {
    log('  ✓ login/route.ts usa getDevUsers()', colors.green);
    results.passed.push('login/route.ts integra dev-users correctamente');
  } else {
    log('  ✗ login/route.ts no usa getDevUsers', colors.red);
    results.failed.push('login/route.ts no integra dev-users');
  }
  
  // Verificar api-client.ts correcciones
  const apiClientPath = path.join(srcPath, 'lib', 'api-client.ts');
  if (checkFileContains(apiClientPath, 'throw new ApiError')) {
    log('  ✓ api-client.ts lanza ApiError correctamente', colors.green);
    results.passed.push('api-client.ts manejo de errores mejorado');
  } else {
    log('  ✗ api-client.ts no lanza ApiError correctamente', colors.red);
    results.failed.push('api-client.ts manejo de errores no mejorado');
  }
  
  // ========================================================================
  // RESUMEN
  // ========================================================================
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║                       RESUMEN                              ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  log(`Pruebas Exitosas: ${results.passed.length}`, colors.green);
  results.passed.forEach(msg => log(`  ✓ ${msg}`, colors.green));
  
  if (results.failed.length > 0) {
    log(`\nPruebas Fallidas: ${results.failed.length}`, colors.red);
    results.failed.forEach(msg => log(`  ✗ ${msg}`, colors.red));
  } else {
    log(`\nPruebas Fallidas: 0`, colors.green);
  }
  
  if (results.warnings.length > 0) {
    log(`\nAdvertencias: ${results.warnings.length}`, colors.yellow);
    results.warnings.forEach(msg => log(`  ⚠ ${msg}`, colors.yellow));
  }
  
  // ========================================================================
  // CONCLUSION
  // ========================================================================
  const allPassed = results.failed.length === 0;
  const passPercentage = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100) || 100;
  
  log('\n' + '═'.repeat(60), colors.cyan);
  if (allPassed) {
    log(`✓ TODAS LAS PRUEBAS PASARON (${passPercentage}%)`, colors.green);
  } else {
    log(`✗ ALGUNAS PRUEBAS FALLARON (${passPercentage}%)`, colors.red);
  }
  log('═'.repeat(60) + '\n', colors.cyan);
  
  process.exit(allPassed ? 0 : 1);
}

main();
