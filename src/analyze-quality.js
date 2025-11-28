#!/usr/bin/env node

/**
 * Script de análisis de calidad del código
 * Verifica métricas de calidad y genera un reporte
 */

const fs = require('fs');
const path = require('path');

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

function analyzeCodeQuality() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║           ANÁLISIS DE CALIDAD DEL CÓDIGO                  ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  const srcPath = __dirname;
  const results = {
    files: {},
    totals: {
      files: 0,
      lines: 0,
      comments: 0,
      functions: 0,
      exports: 0,
      types: 0,
      errorHandling: 0,
    },
    quality: {
      documentation: 0,
      errorHandling: 0,
      typeAnnotations: 0,
      modularity: 0,
    },
  };
  
  const filesToAnalyze = [
    { path: 'lib/dev-users.ts', type: 'utility' },
    { path: 'lib/environment.ts', type: 'utility' },
    { path: 'lib/api-client.ts', type: 'utility' },
    { path: 'components/auth/AuthProvider.tsx', type: 'component' },
    { path: 'components/dashboard/admin-dashboard.tsx', type: 'component' },
    { path: 'app/next-api/auth/login/route.ts', type: 'route' },
    { path: '__tests__/integration.test.ts', type: 'test' },
  ];
  
  // ========================================================================
  // ANÁLISIS DE ARCHIVOS
  // ========================================================================
  
  log('📊 Análisis de archivos:\n', colors.blue);
  
  filesToAnalyze.forEach(({ path: filePath, type }) => {
    const fullPath = path.join(srcPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      log(`  ✗ ${filePath} - NO ENCONTRADO`, colors.red);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    // Count both regular comments and JSDoc comments
    const commentLines = lines.filter(l =>
      l.trim().startsWith('//') ||
      l.trim().startsWith('*') ||
      l.trim().startsWith('/**') ||
      l.trim().startsWith(' *')
    ).length;
    const functionMatches = content.match(/(?:function|const\s+\w+\s*=\s*(?:async\s*)?\(|export\s+function)/g);
    const exportMatches = content.match(/export\s+(function|const|interface|class|type)/g);
    const typeMatches = content.match(/:\s*(?:string|number|boolean|object|any|[\w<>[\]]+)(?![a-zA-Z])/g);
    const errorHandling = content.match(/(?:try|catch|throw|error|Error)/g);
    
    const functions = functionMatches ? functionMatches.length : 0;
    const exports = exportMatches ? exportMatches.length : 0;
    const types = typeMatches ? typeMatches.length : 0;
    const errors = errorHandling ? errorHandling.length : 0;
    
    const fileResult = {
      type,
      lines: lines.length,
      comments: commentLines,
      functions,
      exports,
      types,
      errorHandling: errors,
      documentationRatio: (commentLines / lines.length * 100).toFixed(1),
      complexity: Math.min(100, Math.round((functions / lines.length) * 100 * 10)),
    };
    
    results.files[filePath] = fileResult;
    results.totals.files++;
    results.totals.lines += lines.length;
    results.totals.comments += commentLines;
    results.totals.functions += functions;
    results.totals.exports += exports;
    results.totals.types += types;
    results.totals.errorHandling += errors;
    
    log(`  ✓ ${path.basename(filePath)}`, colors.green);
    log(`    • Líneas: ${lines.length}`, colors.cyan);
    log(`    • Comentarios: ${commentLines} (${fileResult.documentationRatio}%)`, colors.cyan);
    log(`    • Funciones: ${functions}`, colors.cyan);
    log(`    • Exports: ${exports}`, colors.cyan);
    log(`    • Anotaciones de Tipo: ${types}`, colors.cyan);
    log(`    • Manejo de Errores: ${errors}`, colors.cyan);
  });
  
  // ========================================================================
  // CÁLCULO DE PUNTUACIÓN
  // ========================================================================
  
  log('\n📈 Puntuación de Calidad:\n', colors.blue);
  
  // Documentación: ratio de comentarios
  const documentationRatios = Object.values(results.files).map(f => parseFloat(f.documentationRatio) || 0);
  const avgDocumentation = documentationRatios.reduce((sum, ratio) => sum + ratio, 0) / documentationRatios.length || 0;
  results.quality.documentation = Math.min(100, avgDocumentation * 2);

  // Debug logging
  console.log(`\nDEBUG - Documentation ratios:`, documentationRatios);
  console.log(`DEBUG - Average documentation: ${avgDocumentation.toFixed(2)}%`);
  console.log(`DEBUG - Documentation score: ${results.quality.documentation.toFixed(1)}/100\n`);
  
  // Manejo de errores: cantidad de manejo de errores
  results.quality.errorHandling = Math.min(100, (results.totals.errorHandling / results.totals.lines) * 1000);
  
  // Anotaciones de tipo: cantidad de tipos
  results.quality.typeAnnotations = Math.min(100, (results.totals.types / results.totals.lines) * 100);
  
  // Modularidad: cantidad de exports
  results.quality.modularity = Math.min(100, (results.totals.exports / results.totals.functions) * 100);
  
  const overall = (
    results.quality.documentation +
    results.quality.errorHandling +
    results.quality.typeAnnotations +
    results.quality.modularity
  ) / 4;
  
  log(`Documentación: ${results.quality.documentation.toFixed(1)}/100`, colors.cyan);
  log(`Manejo de Errores: ${results.quality.errorHandling.toFixed(1)}/100`, colors.cyan);
  log(`Anotaciones de Tipo: ${results.quality.typeAnnotations.toFixed(1)}/100`, colors.cyan);
  log(`Modularidad: ${results.quality.modularity.toFixed(1)}/100`, colors.cyan);
  
  // ========================================================================
  // RESUMEN TOTAL
  // ========================================================================
  
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║                    RESUMEN TOTAL                           ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  log(`Total de Archivos: ${results.totals.files}`, colors.green);
  log(`Total de Líneas: ${results.totals.lines}`, colors.green);
  log(`Total de Comentarios: ${results.totals.comments}`, colors.green);
  log(`Total de Funciones: ${results.totals.functions}`, colors.green);
  log(`Total de Exports: ${results.totals.exports}`, colors.green);
  log(`Total de Tipos: ${results.totals.types}`, colors.green);
  log(`Total de Manejo de Errores: ${results.totals.errorHandling}`, colors.green);
  
  // ========================================================================
  // PUNTUACIÓN GENERAL
  // ========================================================================
  
  log('\n📊 Puntuación General del Proyecto:\n', colors.cyan);
  
  const scoreBar = '█'.repeat(Math.round(overall / 5)) + '░'.repeat(20 - Math.round(overall / 5));
  const scoreColor = overall >= 80 ? colors.green : overall >= 60 ? colors.yellow : colors.red;
  
  log(`${scoreColor}${scoreBar}${colors.reset} ${overall.toFixed(1)}/100`, colors.reset);
  
  log(`\nNivel: `, colors.reset);
  if (overall >= 90) {
    log('⭐⭐⭐⭐⭐ Excelente', colors.green);
  } else if (overall >= 80) {
    log('⭐⭐⭐⭐ Muy Bueno', colors.green);
  } else if (overall >= 70) {
    log('⭐⭐⭐ Bueno', colors.yellow);
  } else if (overall >= 60) {
    log('⭐⭐ Aceptable', colors.yellow);
  } else {
    log('⭐ Necesita Mejora', colors.red);
  }
  
  // ========================================================================
  // RECOMENDACIONES
  // ========================================================================
  
  log('\n💡 Recomendaciones:\n', colors.blue);
  
  if (results.quality.documentation < 80) {
    log('  • Aumentar comentarios y documentación en funciones complejas', colors.yellow);
  }
  
  if (results.quality.errorHandling < 80) {
    log('  • Mejorar el manejo de errores en algunas secciones', colors.yellow);
  }
  
  if (results.quality.typeAnnotations < 80) {
    log('  • Agregar más anotaciones de tipo explícitas', colors.yellow);
  }
  
  if (results.quality.modularity < 80) {
    log('  • Considerar dividir algunos archivos en módulos más pequeños', colors.yellow);
  }
  
  if (overall >= 80) {
    log('  ✓ ¡Buen trabajo! La calidad del código es alta', colors.green);
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  log(`PUNTUACIÓN FINAL: ${overall.toFixed(1)}/100`, colors.cyan);
  log('═'.repeat(60) + '\n', colors.cyan);
  
  return overall >= 70; // Aprobado si >= 70
}

// Ejecutar
const passed = analyzeCodeQuality();
process.exit(passed ? 0 : 1);
