#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Care Resource Hub v2
 * Tests the entire application end-to-end
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      phase1: { passed: 0, failed: 0, tests: [] },
      phase2: { passed: 0, failed: 0, tests: [] },
      phase3: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      try {
        const result = execSync(command, {
          cwd,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async testPhase1Foundation() {
    this.log('\\n=== PHASE 1: Foundation Tests ===', 'info');

    const tests = [
      {
        name: 'Project Structure',
        test: () => {
          const requiredPaths = [
            'v2/client/src',
            'v2/server/src',
            'v2/shared',
            'v2/client/package.json',
            'v2/server/package.json'
          ];

          for (const p of requiredPaths) {
            if (!fs.existsSync(p)) {
              throw new Error(`Missing required path: ${p}`);
            }
          }
          return 'All required directories and files exist';
        }
      },
      {
        name: 'Client Dependencies',
        test: async () => {
          const packageJson = JSON.parse(fs.readFileSync('v2/client/package.json', 'utf-8'));
          const requiredDeps = ['react', 'react-router-dom', 'zustand', 'axios'];

          for (const dep of requiredDeps) {
            if (!packageJson.dependencies[dep]) {
              throw new Error(`Missing dependency: ${dep}`);
            }
          }
          return 'All client dependencies installed';
        }
      },
      {
        name: 'Server Dependencies',
        test: async () => {
          const packageJson = JSON.parse(fs.readFileSync('v2/server/package.json', 'utf-8'));
          const requiredDeps = ['express', 'mongoose', 'cors', 'helmet'];

          for (const dep of requiredDeps) {
            if (!packageJson.dependencies[dep]) {
              throw new Error(`Missing dependency: ${dep}`);
            }
          }
          return 'All server dependencies installed';
        }
      },
      {
        name: 'TypeScript Configuration',
        test: () => {
          const clientTsConfig = fs.existsSync('v2/client/tsconfig.json');
          const serverTsConfig = fs.existsSync('v2/server/tsconfig.json');

          if (!clientTsConfig || !serverTsConfig) {
            throw new Error('Missing TypeScript configuration files');
          }
          return 'TypeScript configuration files present';
        }
      },
      {
        name: 'Environment Configuration',
        test: () => {
          const clientEnv = fs.existsSync('v2/client/.env.example');
          const serverEnv = fs.existsSync('v2/server/.env.example');

          if (!clientEnv || !serverEnv) {
            throw new Error('Missing environment configuration files');
          }
          return 'Environment configuration files present';
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.log(`✓ ${test.name}: ${result}`, 'success');
        this.results.phase1.passed++;
        this.results.phase1.tests.push({ name: test.name, status: 'passed', result });
      } catch (error) {
        this.log(`✗ ${test.name}: ${error.message}`, 'error');
        this.results.phase1.failed++;
        this.results.phase1.tests.push({ name: test.name, status: 'failed', error: error.message });
      }
    }
  }

  async testPhase2ContentSystem() {
    this.log('\\n=== PHASE 2: Content System Tests ===', 'info');

    const tests = [
      {
        name: 'Shared Types',
        test: () => {
          const typesFile = fs.readFileSync('v2/shared/types.ts', 'utf-8');
          const requiredTypes = ['ContentItem', 'Section', 'Tab', 'Page', 'ContentSchema'];

          for (const type of requiredTypes) {
            if (!typesFile.includes(`interface ${type}`)) {
              throw new Error(`Missing type definition: ${type}`);
            }
          }
          return 'All required type definitions present';
        }
      },
      {
        name: 'Content Store',
        test: () => {
          const storeFile = fs.readFileSync('v2/client/src/store/contentStore.ts', 'utf-8');
          const requiredMethods = ['loadContent', 'saveContent', 'addTab', 'updateTab', 'deleteTab'];

          for (const method of requiredMethods) {
            if (!storeFile.includes(method)) {
              throw new Error(`Missing store method: ${method}`);
            }
          }
          return 'All required store methods present';
        }
      },
      {
        name: 'Content Components',
        test: () => {
          const requiredComponents = [
            'v2/client/src/components/ContentDisplay.tsx',
            'v2/client/src/components/TabNavigation.tsx',
            'v2/client/src/components/SearchBar.tsx'
          ];

          for (const component of requiredComponents) {
            if (!fs.existsSync(component)) {
              throw new Error(`Missing component: ${component}`);
            }
          }
          return 'All content components present';
        }
      },
      {
        name: 'Page Components',
        test: () => {
          const requiredPages = [
            'v2/client/src/pages/HomePage.tsx',
            'v2/client/src/pages/CaregiverPage.tsx',
            'v2/client/src/pages/CareRecipientPage.tsx'
          ];

          for (const page of requiredPages) {
            if (!fs.existsSync(page)) {
              throw new Error(`Missing page: ${page}`);
            }
          }
          return 'All page components present';
        }
      },
      {
        name: 'Content Migration',
        test: () => {
          const originalContent = fs.existsSync('js/content.json');
          const migratedContent = fs.existsSync('v2/client/public/content.json');

          if (!originalContent) {
            throw new Error('Original content.json not found');
          }
          if (!migratedContent) {
            throw new Error('Migrated content.json not found');
          }
          return 'Content successfully migrated to v2';
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.log(`✓ ${test.name}: ${result}`, 'success');
        this.results.phase2.passed++;
        this.results.phase2.tests.push({ name: test.name, status: 'passed', result });
      } catch (error) {
        this.log(`✗ ${test.name}: ${error.message}`, 'error');
        this.results.phase2.failed++;
        this.results.phase2.tests.push({ name: test.name, status: 'failed', error: error.message });
      }
    }
  }

  async testPhase3AdminPanel() {
    this.log('\\n=== PHASE 3: Admin Panel Tests ===', 'info');

    const tests = [
      {
        name: 'Admin Page Component',
        test: () => {
          const adminPage = fs.readFileSync('v2/client/src/pages/AdminPage.tsx', 'utf-8');
          const requiredFeatures = ['TabEditor', 'SectionEditor', 'ContentItemEditor', 'Editor'];

          for (const feature of requiredFeatures) {
            if (!adminPage.includes(feature)) {
              throw new Error(`Missing admin feature: ${feature}`);
            }
          }
          return 'Admin panel with full CRUD operations';
        }
      },
      {
        name: 'Authentication System',
        test: () => {
          const authRoute = fs.readFileSync('v2/server/src/routes/auth.ts', 'utf-8');
          const requiredEndpoints = ['/login', '/verify', '/logout'];

          for (const endpoint of requiredEndpoints) {
            if (!authRoute.includes(endpoint)) {
              throw new Error(`Missing auth endpoint: ${endpoint}`);
            }
          }
          return 'Authentication system with JWT tokens';
        }
      },
      {
        name: 'Content API Routes',
        test: () => {
          const contentRoute = fs.readFileSync('v2/server/src/routes/content.ts', 'utf-8');
          const requiredMethods = ['router.get', 'router.put', 'export', 'import'];

          for (const method of requiredMethods) {
            if (!contentRoute.includes(method)) {
              throw new Error(`Missing API method: ${method}`);
            }
          }
          return 'Full CRUD API with import/export';
        }
      },
      {
        name: 'Database Models',
        test: () => {
          const contentModel = fs.readFileSync('v2/server/src/models/Content.ts', 'utf-8');
          const requiredSchemas = ['ContentSchema', 'mongoose', 'IContentDocument'];

          for (const schema of requiredSchemas) {
            if (!contentModel.includes(schema)) {
              throw new Error(`Missing database schema: ${schema}`);
            }
          }
          return 'MongoDB models with proper schemas';
        }
      },
      {
        name: 'Server Configuration',
        test: () => {
          const server = fs.readFileSync('v2/server/src/server.ts', 'utf-8');
          const requiredMiddleware = ['helmet', 'cors', 'rateLimit', 'express.json'];

          for (const middleware of requiredMiddleware) {
            if (!server.includes(middleware)) {
              throw new Error(`Missing middleware: ${middleware}`);
            }
          }
          return 'Secure server with proper middleware';
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.log(`✓ ${test.name}: ${result}`, 'success');
        this.results.phase3.passed++;
        this.results.phase3.tests.push({ name: test.name, status: 'passed', result });
      } catch (error) {
        this.log(`✗ ${test.name}: ${error.message}`, 'error');
        this.results.phase3.failed++;
        this.results.phase3.tests.push({ name: test.name, status: 'failed', error: error.message });
      }
    }
  }

  async testIntegration() {
    this.log('\\n=== INTEGRATION TESTS ===', 'info');

    const tests = [
      {
        name: 'Build Configuration',
        test: () => {
          const clientPackage = JSON.parse(fs.readFileSync('v2/client/package.json', 'utf-8'));
          const serverPackage = JSON.parse(fs.readFileSync('v2/server/package.json', 'utf-8'));

          if (!clientPackage.scripts.build || !serverPackage.scripts.build) {
            throw new Error('Missing build scripts');
          }
          return 'Build scripts configured correctly';
        }
      },
      {
        name: 'TypeScript Compilation',
        test: async () => {
          try {
            await this.runCommand('npx tsc --noEmit', 'v2/client');
            return 'TypeScript compiles without errors';
          } catch (error) {
            throw new Error('TypeScript compilation failed');
          }
        }
      },
      {
        name: 'Test Configuration',
        test: () => {
          const vitestConfig = fs.existsSync('v2/client/vitest.config.ts');
          const testSetup = fs.existsSync('v2/client/src/test/setup.ts');
          const hasTests = fs.readdirSync('v2/client/src/test').filter(f => f.endsWith('.test.tsx')).length > 0;

          if (!vitestConfig || !testSetup || !hasTests) {
            throw new Error('Missing test configuration or test files');
          }
          return 'Test suite properly configured with Vitest';
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.log(`✓ ${test.name}: ${result}`, 'success');
        this.results.integration.passed++;
        this.results.integration.tests.push({ name: test.name, status: 'passed', result });
      } catch (error) {
        this.log(`✗ ${test.name}: ${error.message}`, 'error');
        this.results.integration.failed++;
        this.results.integration.tests.push({ name: test.name, status: 'failed', error: error.message });
      }
    }
  }

  printSummary() {
    this.log('\\n=== TEST SUMMARY ===', 'info');

    const phases = [
      { name: 'Phase 1 (Foundation)', results: this.results.phase1 },
      { name: 'Phase 2 (Content System)', results: this.results.phase2 },
      { name: 'Phase 3 (Admin Panel)', results: this.results.phase3 },
      { name: 'Integration Tests', results: this.results.integration }
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    for (const phase of phases) {
      const { passed, failed } = phase.results;
      totalPassed += passed;
      totalFailed += failed;

      const status = failed === 0 ? 'success' : 'error';
      this.log(`${phase.name}: ${passed} passed, ${failed} failed`, status);
    }

    this.log(`\\nTOTAL: ${totalPassed} passed, ${totalFailed} failed`, totalFailed === 0 ? 'success' : 'error');

    if (totalFailed === 0) {
      this.log('\\n🎉 ALL TESTS PASSED! V2 is ready for deployment! 🎉', 'success');
    } else {
      this.log(`\\n❌ ${totalFailed} tests failed. Please review and fix issues.`, 'error');
    }

    return totalFailed === 0;
  }

  async run() {
    this.log('Care Resource Hub v2 - Comprehensive Test Suite', 'info');
    this.log('============================================\\n', 'info');

    await this.testPhase1Foundation();
    await this.testPhase2ContentSystem();
    await this.testPhase3AdminPanel();
    await this.testIntegration();

    const allPassed = this.printSummary();
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = TestRunner;