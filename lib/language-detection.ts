/**
 * Detects the intended programming language/framework from a user message
 */
export function detectLanguage(message: string): string {
  const lower = message.toLowerCase();

  // Python patterns
  if (
    lower.includes('python') ||
    lower.includes('flask') ||
    lower.includes('django') ||
    lower.includes('pygame') ||
    lower.match(/\b(py|\.py)\b/)
  ) {
    return 'Python';
  }

  // HTML/Vanilla JS patterns
  if (
    (lower.includes('html') && !lower.includes('react')) ||
    lower.includes('vanilla js') ||
    lower.includes('vanilla javascript') ||
    (lower.includes('web page') && !lower.includes('react'))
  ) {
    return 'HTML';
  }

  // Vue patterns
  if (lower.includes('vue')) {
    return 'Vue';
  }

  // Next.js (specific React framework)
  if (lower.includes('next.js') || lower.includes('nextjs')) {
    return 'Next.js';
  }

  // React patterns (more general)
  if (
    lower.includes('react') ||
    lower.includes('tsx') ||
    lower.includes('jsx') ||
    lower.includes('component')
  ) {
    return 'React';
  }

  // Node.js/Express patterns
  if (
    lower.includes('node') ||
    lower.includes('express') ||
    lower.includes('nodejs') ||
    (lower.includes('server') && lower.includes('javascript'))
  ) {
    return 'Node.js';
  }

  // Rust patterns
  if (lower.includes('rust')) {
    return 'Rust';
  }

  // Go patterns
  if (lower.includes('golang') || lower.match(/\bgo\b/)) {
    return 'Go';
  }

  // Java patterns
  if (lower.includes('java') && !lower.includes('javascript')) {
    return 'Java';
  }

  // C/C++ patterns
  if (lower.match(/\bc\+\+\b/) || lower.includes('cpp')) {
    return 'C++';
  }
  if (lower.match(/\bc\b/) && !lower.includes('react')) {
    return 'C';
  }

  // TypeScript (non-React)
  if (
    lower.includes('typescript') &&
    !lower.includes('react') &&
    !lower.includes('component')
  ) {
    return 'TypeScript';
  }

  // JavaScript (non-React)
  if (
    (lower.includes('javascript') || lower.includes('js')) &&
    !lower.includes('react') &&
    !lower.includes('component')
  ) {
    return 'JavaScript';
  }

  // Default to React (matches current behavior)
  return 'React';
}

/**
 * Formats the language name for display
 */
export function formatLanguageName(language: string): string {
  const formatMap: Record<string, string> = {
    Python: 'Python',
    HTML: 'HTML/CSS/JS',
    Vue: 'Vue.js',
    React: 'React',
    'Next.js': 'Next.js',
    'Node.js': 'Node.js',
    Rust: 'Rust',
    Go: 'Go',
    Java: 'Java',
    'C++': 'C++',
    C: 'C',
    TypeScript: 'TypeScript',
    JavaScript: 'JavaScript',
  };

  return formatMap[language] || language;
}
