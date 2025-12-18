/**
 * Code Quality Checker - Enforces AGENTS.md principles
 * Detects over-engineering, incomplete code, and anti-patterns
 */

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100
  warnings: QualityWarning[];
  suggestions: string[];
}

export interface QualityWarning {
  severity: 'low' | 'medium' | 'high';
  category: string;
  message: string;
  pattern?: string;
}

/**
 * Check code for over-engineering and AGENTS.md violations
 */
export function checkCodeQuality(code: string, language: string): QualityCheckResult {
  const warnings: QualityWarning[] = [];
  const suggestions: string[] = [];

  // 1. Check for incomplete code (TODO, FIXME, HACK comments)
  const incompletePatterns = [
    { pattern: /TODO|FIXME|HACK|XXX/gi, message: 'Contains TODO/FIXME comments - code should be complete' },
    { pattern: /\/\/ temporary|\/\/ temp|\/\/ placeholder/gi, message: 'Contains "temporary" comments - avoid band-aid fixes' },
  ];

  incompletePatterns.forEach(({ pattern, message }) => {
    if (pattern.test(code)) {
      warnings.push({
        severity: 'high',
        category: 'Production-Ready',
        message,
        pattern: pattern.source,
      });
    }
  });

  // 2. Check for over-abstraction
  const abstractionPatterns = [
    { pattern: /abstract\s+class/gi, message: 'Uses abstract classes - ensure abstraction is necessary' },
    { pattern: /interface\s+\w+\s+extends/gi, message: 'Complex interface inheritance - keep interfaces simple' },
    { pattern: /(Factory|Builder|Strategy|Observer)Pattern/gi, message: 'Design pattern detected - ensure it\'s not over-engineering' },
  ];

  abstractionPatterns.forEach(({ pattern, message }) => {
    const matches = code.match(pattern);
    if (matches && matches.length > 2) {
      warnings.push({
        severity: 'medium',
        category: 'Simplicity',
        message: `${message} (${matches.length} occurrences)`,
      });
    }
  });

  // 3. Check for unused utilities/helpers
  const helperPattern = /export\s+(const|function)\s+\w*(helper|util|utility)\w*/gi;
  const helperMatches = code.match(helperPattern);

  if (helperMatches && helperMatches.length > 0) {
    // Check if they're actually used
    helperMatches.forEach((helper) => {
      const funcName = helper.match(/\w+(helper|util|utility)\w*/i)?.[0];
      if (funcName) {
        const usagePattern = new RegExp(`\\b${funcName}\\(`, 'g');
        const usages = code.match(usagePattern);

        if (!usages || usages.length <= 1) {
          warnings.push({
            severity: 'medium',
            category: 'No Unused Code',
            message: `Unused helper/utility function: ${funcName}`,
          });
        }
      }
    });
  }

  // 4. Check for generic/flexible code when specific would work
  const genericPatterns = [
    { pattern: /<T\s+extends/gi, message: 'Generic types - ensure flexibility is needed' },
    { pattern: /config:\s*\{[\s\S]{100,}\}/gi, message: 'Large config objects - might be over-configurable' },
  ];

  genericPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(code)) {
      warnings.push({
        severity: 'low',
        category: 'Simplicity',
        message,
      });
    }
  });

  // 5. Language-specific checks
  if (language.toLowerCase().includes('python')) {
    // Check for unnecessary classes in Python
    const classCount = (code.match(/^class\s+\w+/gm) || []).length;
    const functionCount = (code.match(/^def\s+\w+/gm) || []).length;

    if (classCount > functionCount && functionCount > 0) {
      suggestions.push('Consider using functions instead of classes for simpler code');
    }
  }

  if (language.toLowerCase().includes('react') || language.toLowerCase().includes('tsx')) {
    // Check for over-componentization
    const componentCount = (code.match(/export\s+(default\s+)?function\s+\w+/g) || []).length;

    if (componentCount > 5) {
      warnings.push({
        severity: 'low',
        category: 'Simplicity',
        message: `${componentCount} components exported - ensure they're all necessary`,
      });
    }
  }

  // 6. Check for proper error handling without over-doing it
  const tryCatchCount = (code.match(/try\s*\{/g) || []).length;
  const codeLines = code.split('\n').length;

  if (tryCatchCount > codeLines / 20) {
    warnings.push({
      severity: 'low',
      category: 'Simplicity',
      message: 'Excessive error handling - only handle errors at boundaries',
    });
  }

  // Calculate score
  let score = 100;
  warnings.forEach((warning) => {
    if (warning.severity === 'high') score -= 20;
    if (warning.severity === 'medium') score -= 10;
    if (warning.severity === 'low') score -= 5;
  });
  score = Math.max(0, score);

  // Add suggestions based on score
  if (score < 70) {
    suggestions.push('Review AGENTS.md principles: simplicity first, no over-engineering');
  }
  if (warnings.some((w) => w.category === 'Production-Ready')) {
    suggestions.push('Remove all TODO/FIXME comments - code should be complete');
  }

  return {
    passed: score >= 80 && warnings.filter((w) => w.severity === 'high').length === 0,
    score,
    warnings,
    suggestions,
  };
}

/**
 * Format quality check results for display
 */
export function formatQualityReport(result: QualityCheckResult): string {
  const lines: string[] = [];

  lines.push(`Quality Score: ${result.score}/100 ${result.passed ? '✅' : '⚠️'}`);
  lines.push('');

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach((warning) => {
      const icon = warning.severity === 'high' ? '🔴' : warning.severity === 'medium' ? '🟡' : '🔵';
      lines.push(`  ${icon} [${warning.category}] ${warning.message}`);
    });
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('Suggestions:');
    result.suggestions.forEach((suggestion) => {
      lines.push(`  💡 ${suggestion}`);
    });
  }

  return lines.join('\n');
}
