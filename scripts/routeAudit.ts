#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

interface RouteInfo {
  path: string;
  filePath?: string;
  status?: number;
  finalUrl?: string;
  note?: string;
  isRedirect?: boolean;
  redirectTarget?: string;
}

interface AuditResult {
  routes: RouteInfo[];
  broken: RouteInfo[];
  fixed: RouteInfo[];
  redirects: RouteInfo[];
}

class RouteAuditor {
  private baseUrl: string;
  private projectRoot: string;
  private results: AuditResult;

  constructor(baseUrl: string = 'http://localhost:3003') {
    this.baseUrl = baseUrl;
    this.projectRoot = process.cwd();
    this.results = {
      routes: [],
      broken: [],
      fixed: [],
      redirects: [],
    };
  }

  /**
   * Discover all routes from the codebase
   */
  async discoverRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];

    // 1. Discover routes from app/**/page.tsx files
    const pageFiles = await glob('src/app/**/page.tsx', { cwd: this.projectRoot });

    for (const file of pageFiles) {
      const routePath = this.filePathToRoute(file);
      // Skip invalid routes
      if (routePath && routePath !== '/page.tsx') {
        routes.push({
          path: routePath,
          filePath: file,
        });
      }
    }

    // 2. Add canonical sidebar routes
    const canonicalRoutes = [
      '/',
      '/dashboard',
      '/sites',
      '/materials',
      '/purchase',
      '/work-progress',
      '/work-progress/activity',
      '/vehicles',
      '/vendors',
      '/expenses',
      '/payments',
      '/scheduling',
      '/reports',
      '/organization',
      '/organization/setup',
      '/settings',
      '/login',
      '/signup',
      '/home',
    ];

    for (const route of canonicalRoutes) {
      if (!routes.find((r) => r.path === route)) {
        routes.push({ path: route });
      }
    }

    // 3. Extract redirects from next.config.ts
    const redirects = await this.extractRedirects();
    routes.push(...redirects);

    return routes;
  }

  /**
   * Convert file path to route path
   */
  private filePathToRoute(filePath: string): string {
    // Remove src/app/ prefix and /page.tsx suffix
    let route = filePath.replace('src/app/', '').replace('/page.tsx', '');

    // Handle root page
    if (route === 'page' || route === '') {
      return '/';
    }

    // Add leading slash
    if (!route.startsWith('/')) {
      route = '/' + route;
    }

    return route;
  }

  /**
   * Extract redirects from next.config.ts
   */
  private async extractRedirects(): Promise<RouteInfo[]> {
    const configPath = path.join(this.projectRoot, 'next.config.ts');

    if (!fs.existsSync(configPath)) {
      return [];
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const redirects: RouteInfo[] = [];

    // Simple regex to extract redirects (this could be more sophisticated)
    const redirectMatches = configContent.match(
      /source:\s*['"`]([^'"`]+)['"`].*?destination:\s*['"`]([^'"`]+)['"`]/g,
    );

    if (redirectMatches) {
      for (const match of redirectMatches) {
        const sourceMatch = match.match(/source:\s*['"`]([^'"`]+)['"`]/);
        const destMatch = match.match(/destination:\s*['"`]([^'"`]+)['"`]/);

        if (sourceMatch && destMatch) {
          redirects.push({
            path: sourceMatch[1],
            isRedirect: true,
            redirectTarget: destMatch[1],
          });
        }
      }
    }

    return redirects;
  }

  /**
   * Verify routes by making HTTP requests
   */
  async verifyRoutes(routes: RouteInfo[]): Promise<RouteInfo[]> {
    console.log(`\n🔍 Verifying ${routes.length} routes...`);

    const verifiedRoutes: RouteInfo[] = [];

    for (const route of routes) {
      try {
        const url = `${this.baseUrl}${route.path}`;
        console.log(`  Testing: ${route.path}`);

        const response = await fetch(url, {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects automatically
        });

        const finalUrl = response.headers.get('location') || url;
        const status = response.status;

        let note = '';
        if (status >= 200 && status < 300) {
          note = 'OK';
        } else if (status >= 300 && status < 400) {
          note = 'Redirect';
        } else if (status === 404) {
          note = 'Missing Page';
        } else if (status >= 500) {
          note = 'Server Error';
        }

        verifiedRoutes.push({
          ...route,
          status,
          finalUrl,
          note,
        });

        // Add small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ❌ Error testing ${route.path}:`, error);
        verifiedRoutes.push({
          ...route,
          status: 0,
          note: 'Connection Error',
        });
      }
    }

    return verifiedRoutes;
  }

  /**
   * Identify broken routes
   */
  identifyBrokenRoutes(routes: RouteInfo[]): RouteInfo[] {
    return routes.filter(
      (route) =>
        route.status === 404 ||
        route.status === 500 ||
        route.status === 0 ||
        (route.status &&
          route.status >= 300 &&
          route.status < 400 &&
          !route.isRedirect &&
          !this.isExpectedRedirect(route)),
    );
  }

  /**
   * Check if a redirect is expected (like root redirecting to home)
   */
  private isExpectedRedirect(route: RouteInfo): boolean {
    // Root redirecting to home is expected
    if (route.path === '/' && route.finalUrl?.includes('/home')) {
      return true;
    }
    return false;
  }

  /**
   * Generate route table
   */
  generateRouteTable(routes: RouteInfo[]): string {
    let table = '\n## Route Status Table\n\n';
    table += '| Path | Status | Final URL | Note | File |\n';
    table += '|------|--------|-----------|------|------|\n';

    for (const route of routes) {
      const status = route.status ? route.status.toString() : '-';
      const finalUrl = route.finalUrl ? route.finalUrl.replace(this.baseUrl, '') : '-';
      const note = route.note || '-';
      const file = route.filePath ? route.filePath.replace('src/app/', '') : '-';

      table += `| ${route.path} | ${status} | ${finalUrl} | ${note} | ${file} |\n`;
    }

    return table;
  }

  /**
   * Save results to files
   */
  async saveResults(routes: RouteInfo[]): Promise<void> {
    const tmpDir = path.join(this.projectRoot, 'tmp', 'route-audit');

    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Save routes as JSON
    fs.writeFileSync(path.join(tmpDir, 'routes-before.json'), JSON.stringify(routes, null, 2));

    // Generate markdown report
    const report = this.generateReport(routes);
    fs.writeFileSync(path.join(tmpDir, 'status-table.md'), report);

    console.log(`\n📁 Results saved to: ${tmpDir}`);
  }

  /**
   * Generate comprehensive report
   */
  generateReport(routes: RouteInfo[]): string {
    const broken = this.identifyBrokenRoutes(routes);
    const redirects = routes.filter((r) => r.isRedirect);
    const working = routes.filter((r) => r.status && r.status >= 200 && r.status < 300);

    let report = '# Route Audit Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Routes:** ${routes.length}\n`;
    report += `**Working Routes:** ${working.length}\n`;
    report += `**Broken Routes:** ${broken.length}\n`;
    report += `**Redirects:** ${redirects.length}\n\n`;

    if (broken.length > 0) {
      report += '## 🚨 Broken Routes\n\n';
      for (const route of broken) {
        report += `- **${route.path}**: ${route.note} (Status: ${route.status})\n`;
      }
      report += '\n';
    }

    if (redirects.length > 0) {
      report += '## 🔄 Active Redirects\n\n';
      for (const route of redirects) {
        report += `- **${route.path}** → **${route.redirectTarget}**\n`;
      }
      report += '\n';
    }

    report += this.generateRouteTable(routes);

    return report;
  }

  /**
   * Main audit function
   */
  async runAudit(): Promise<void> {
    console.log('🚀 Starting Route Audit...\n');

    try {
      // Discover routes
      console.log('📋 Discovering routes...');
      const routes = await this.discoverRoutes();
      console.log(`Found ${routes.length} routes`);

      // Verify routes
      const verifiedRoutes = await this.verifyRoutes(routes);

      // Identify issues
      const broken = this.identifyBrokenRoutes(verifiedRoutes);

      // Save results
      await this.saveResults(verifiedRoutes);

      // Print summary
      console.log('\n📊 Audit Summary:');
      console.log(`  Total routes: ${verifiedRoutes.length}`);
      console.log(
        `  Working: ${verifiedRoutes.filter((r) => r.status && r.status >= 200 && r.status < 300).length}`,
      );
      console.log(`  Broken: ${broken.length}`);
      console.log(`  Redirects: ${verifiedRoutes.filter((r) => r.isRedirect).length}`);

      if (broken.length > 0) {
        console.log('\n🚨 Broken Routes:');
        for (const route of broken) {
          console.log(`  - ${route.path}: ${route.note}`);
        }
      }

      this.results.routes = verifiedRoutes;
      this.results.broken = broken;
    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new RouteAuditor();
  auditor.runAudit().catch(console.error);
}

export { RouteAuditor };
