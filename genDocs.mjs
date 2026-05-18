import { generateDocumentation } from 'tsdoc-markdown';
import { glob } from 'glob';
import { mkdirSync } from 'fs';
import { basename, extname } from 'path';

// Generate documentation for a list of files
const files = glob.sync(['./libs/**/*.ts','./libs/**/*.tsx']);

console.log(`Generating API documentation for ${files.length} files...`);

mkdirSync('docs/api', { recursive: true });

for (const f of files) {
  if(f.includes('index') || f.includes('vitest')) continue;
  const name = basename(f, extname(f));
  console.log(`Generating documentation for ${name}...`);
  generateDocumentation({
    inputFiles: [f],
    outputFile: `./docs/api/${name}.md`,
    buildOptions: {
      types: true,
      repo: {
        url: 'https://github.com/peterpeterparker/tsdoc-markdown'
      }
    },
    markdownOptions: {
      emoji: {
        classes: 'books',
        functions: 'gear',
        constants: 'nut_and_bolt',
        enum: '1234',
        entry: 'page_facing_up',
        link: 'link',
        interfaces: 'triangular_ruler',
        types: 'abc',
      }
    }
  });
}


