import { generateDocumentation } from 'tsdoc-markdown';
import glob from 'glob';

// Generate documentation for a list of files
const files = glob.sync('./libs/**/*.ts');

generateDocumentation({
  inputFiles: files,
  outputFile: './docs/api/api.md',
  buildOptions: {
    explore: true,
    types: true,
    repo: {
      url: 'https://github.com/peterpeterparker/tsdoc-markdown'
    }
  }
});
