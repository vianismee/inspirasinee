import { createClient } from '@/utils/supabase/client';
import { logger } from './logger';

interface DebugQuery {
  name: string;
  query: string;
  expectedResults: number;
}

export class SupabaseDebugger {
  private static instance: SupabaseDebugger;
  private supabase = createClient();

  public static getInstance(): SupabaseDebugger {
    if (!SupabaseDebugger.instance) {
      SupabaseDebugger.instance = new SupabaseDebugger();
    }
    return SupabaseDebugger.instance;
  }

  async testConnection(): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const results: any[] = [];
    const errors: any[] = [];

    const tests: DebugQuery[] = [
      {
        name: 'Orders - Basic Count',
        query: 'orders',
        expectedResults: 1
      },
      {
        name: 'Customers - Basic Count',
        query: 'customers',
        expectedResults: 1
      },
      {
        name: 'Order Items - Basic Count',
        query: 'order_item',
        expectedResults: 1
      },
      {
        name: 'Points Transactions - Basic Count',
        query: 'points_transactions',
        expectedResults: 1
      },
      {
        name: 'Referral Usage - Basic Count',
        query: 'referral_usage',
        expectedResults: 1
      }
    ];

    logger.info('Starting Supabase connection debugging', { testCount: tests.length }, 'SupabaseDebugger');

    for (const test of tests) {
      try {
        logger.debug(`Testing: ${test.name}`, {}, 'SupabaseDebugger');

        const { data, error } = await this.supabase
          .from(test.query)
          .select('*')
          .limit(test.expectedResults);

        if (error) {
          const errorInfo = {
            test: test.name,
            error: error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          };
          errors.push(errorInfo);
          logger.error(`Test failed: ${test.name}`, errorInfo, 'SupabaseDebugger');
        } else {
          const resultInfo = {
            test: test.name,
            success: true,
            count: data?.length || 0,
            hasData: data && data.length > 0
          };
          results.push(resultInfo);
          logger.info(`Test passed: ${test.name}`, resultInfo, 'SupabaseDebugger');
        }
      } catch (err) {
        const errorInfo = {
          test: test.name,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        };
        errors.push(errorInfo);
        logger.error(`Test crashed: ${test.name}`, errorInfo, 'SupabaseDebugger');
      }
    }

    const summary = {
      success: errors.length === 0,
      totalTests: tests.length,
      passedTests: results.length,
      failedTests: errors.length,
      results,
      errors
    };

    logger.info('Supabase debugging complete', summary, 'SupabaseDebugger');
    return summary;
  }

  async testSpecificQueries(): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const results: any[] = [];
    const errors: any[] = [];

    // Test the specific queries that the tracking and customer dashboard use
    const specificTests = [
      {
        name: 'Orders by Invoice (Tracking)',
        query: () => this.supabase
          .from('orders')
          .select('*')
          .eq('invoice_id', 'test-invoice') // This will return 0 but shouldn't error
          .limit(1)
      },
      {
        name: 'Customers by Phone (Dashboard)',
        query: () => this.supabase
          .from('customers')
          .select('*')
          .eq('whatsapp', 'test-phone') // This will return 0 but shouldn't error
          .limit(1)
      },
      {
        name: 'Orders with Customer Join',
        query: () => this.supabase
          .from('orders')
          .select(`
            *,
            customer:customer_id (
              customer_id,
              username,
              email,
              whatsapp
            )
          `)
          .limit(1)
      },
      {
        name: 'Points Transactions by Customer',
        query: () => this.supabase
          .from('points_transactions')
          .select('*')
          .eq('customer_id', 'test-customer') // This will return 0 but shouldn't error
          .limit(1)
      }
    ];

    logger.info('Testing specific client-side queries', { testCount: specificTests.length }, 'SupabaseDebugger');

    for (const test of specificTests) {
      try {
        logger.debug(`Testing specific query: ${test.name}`, {}, 'SupabaseDebugger');

        const { data, error } = await test.query();

        if (error) {
          const errorInfo = {
            test: test.name,
            error: error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          };
          errors.push(errorInfo);
          logger.error(`Specific query failed: ${test.name}`, errorInfo, 'SupabaseDebugger');
        } else {
          const resultInfo = {
            test: test.name,
            success: true,
            count: data?.length || 0,
            hasData: data && data.length > 0,
            sampleData: data?.[0] || null
          };
          results.push(resultInfo);
          logger.info(`Specific query passed: ${test.name}`, resultInfo, 'SupabaseDebugger');
        }
      } catch (err) {
        const errorInfo = {
          test: test.name,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        };
        errors.push(errorInfo);
        logger.error(`Specific query crashed: ${test.name}`, errorInfo, 'SupabaseDebugger');
      }
    }

    const summary = {
      success: errors.length === 0,
      totalTests: specificTests.length,
      passedTests: results.length,
      failedTests: errors.length,
      results,
      errors
    };

    logger.info('Specific query testing complete', summary, 'SupabaseDebugger');
    return summary;
  }

  async getEnvironmentInfo(): Promise<any> {
    try {
      // Test environment variables
      const envInfo = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
        appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'Unknown',
        nodeEnv: process.env.NODE_ENV || 'Unknown'
      };

      // Test actual Supabase connection
      const { data, error } = await this.supabase
        .from('orders')
        .select('count')
        .limit(1);

      const connectionInfo = {
        canConnect: !error,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details
        } : null,
        hasData: data && data.length > 0
      };

      logger.info('Environment info gathered', { envInfo, connectionInfo }, 'SupabaseDebugger');

      return {
        environment: envInfo,
        connection: connectionInfo,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Failed to get environment info', { error: err }, 'SupabaseDebugger');
      return {
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const supabaseDebugger = SupabaseDebugger.getInstance();