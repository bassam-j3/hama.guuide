import axios from 'axios';

const ALB_URL = 'http://hamaguide-alb-1438235207.eu-north-1.elb.amazonaws.com/api';
const GRAPHQL_URL = 'http://hamaguide-alb-1438235207.eu-north-1.elb.amazonaws.com/graphql';

async function checkEndpoints() {
    console.log(`Starting Live Health Check against: ${ALB_URL}`);
    const results = { passed: 0, failed: 0, errors: [] };

    const check = async (name, url, method = 'get', data = null) => {
        try {
            console.log(`[TEST] Ping ${name}: ${url}`);
            const response = await axios({ method, url, data, timeout: 5000 });
            console.log(`  ✅ Passed (Status: ${response.status})`);
            results.passed++;
        } catch (error) {
            console.log(`  ❌ Failed: ${error.message}`);
            if (error.response) {
                console.log(`    Status: ${error.response.status}`);
            }
            results.failed++;
            results.errors.push({ name, error: error.message, status: error.response?.status });
        }
    };

    // REST endpoints
    await check('GET /Sections/all', `${ALB_URL}/Sections/all`);
    await check('GET /Services', `${ALB_URL}/Services`);
    
    // Auth endpoints (expected 400 or 401 but reachable)
    await check('POST /auth/login (Empty)', `${ALB_URL}/auth/login`, 'post', {});

    // GraphQL endpoint check
    await check('GraphQL Introspection', GRAPHQL_URL, 'post', {
        query: `query { __schema { types { name } } }`
    });

    console.log('\n--- Summary ---');
    console.log(`Passed: ${results.passed} | Failed: ${results.failed}`);
    if (results.failed > 0) {
        console.log('Errors:', results.errors);
        process.exit(1);
    }
}

checkEndpoints();
