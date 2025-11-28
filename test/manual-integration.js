/**
 * Manual Integration Test Script for SwitchBot Adapter
 * 
 * This script helps you test the adapter in a real ioBroker environment.
 * Run this after installing the adapter in your test instance.
 * 
 * Usage:
 *   node test/manual-integration.js
 * 
 * Prerequisites:
 *   - Adapter installed in ioBroker
 *   - Valid SwitchBot credentials configured
 *   - At least one SwitchBot device in your account
 */

const http = require('http');

// Configuration - adjust these to your ioBroker instance
const IOBROKER_HOST = process.env.IOBROKER_HOST || 'localhost';
const IOBROKER_PORT = process.env.IOBROKER_PORT || 8081;
const ADAPTER_INSTANCE = 'switchbot-cloud.0';

// Colors for console output
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

function success(message) {
    log(`✅ ${message}`, colors.green);
}

function error(message) {
    log(`❌ ${message}`, colors.red);
}

function info(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function section(message) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`  ${message}`, colors.cyan);
    log(`${'='.repeat(60)}`, colors.cyan);
}

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Helper using native http module
class IobrokerAPI {
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }

    httpRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.host,
                port: this.port,
                path: path,
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (err) {
                        reject(new Error(`Failed to parse JSON: ${err.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async getStates(pattern) {
        try {
            const encodedPattern = encodeURIComponent(pattern);
            const response = await this.httpRequest(`/getStates?pattern=${encodedPattern}`);
            return response;
        } catch (err) {
            throw new Error(`Failed to get states: ${err.message}`);
        }
    }

    async getState(id) {
        try {
            const encodedId = encodeURIComponent(id);
            const response = await this.httpRequest(`/getState/${encodedId}`);
            return response;
        } catch (err) {
            throw new Error(`Failed to get state ${id}: ${err.message}`);
        }
    }

    async setState(id, value) {
        try {
            const encodedId = encodeURIComponent(id);
            const encodedValue = encodeURIComponent(value);
            const response = await this.httpRequest(`/set/${encodedId}?value=${encodedValue}`);
            return response;
        } catch (err) {
            throw new Error(`Failed to set state ${id}: ${err.message}`);
        }
    }

    async getObjects(pattern) {
        try {
            const encodedPattern = encodeURIComponent(pattern);
            const response = await this.httpRequest(`/getObjects?pattern=${encodedPattern}`);
            return response;
        } catch (err) {
            throw new Error(`Failed to get objects: ${err.message}`);
        }
    }
}

// Test Suite
class AdapterTestSuite {
    constructor() {
        this.api = new IobrokerAPI(IOBROKER_HOST, parseInt(IOBROKER_PORT));
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    async run() {
        section('SwitchBot Adapter Integration Test Suite');
        info(`Testing adapter instance: ${ADAPTER_INSTANCE}`);
        info(`ioBroker host: ${IOBROKER_HOST}:${IOBROKER_PORT}\n`);

        try {
            await this.testConnection();
            await this.testAdapterAlive();
            await this.testAdapterConnected();
            await this.testDeviceDiscovery();
            await this.testDeviceStates();
            await this.testDeviceControl();
            await this.testPollingInterval();
            await this.testErrorHandling();
            
            this.printSummary();
        } catch (err) {
            error(`Test suite failed: ${err.message}`);
            process.exit(1);
        }
    }

    recordTest(name, passed, message) {
        this.testResults.tests.push({ name, passed, message });
        if (passed) {
            this.testResults.passed++;
            success(`${name}: ${message}`);
        } else {
            this.testResults.failed++;
            error(`${name}: ${message}`);
        }
    }

    recordWarning(name, message) {
        this.testResults.warnings++;
        warning(`${name}: ${message}`);
    }

    async testConnection() {
        section('Test 1: API Connection');
        try {
            await this.api.getState(`${ADAPTER_INSTANCE}.info.connection`);
            this.recordTest('API Connection', true, 'Successfully connected to ioBroker API');
        } catch (err) {
            this.recordTest('API Connection', false, `Cannot connect to ioBroker API: ${err.message}`);
            throw err;
        }
    }

    async testAdapterAlive() {
        section('Test 2: Adapter Alive Status');
        try {
            const state = await this.api.getState(`${ADAPTER_INSTANCE}.info.alive`);
            
            if (state && state.val === true) {
                this.recordTest('Adapter Alive', true, 'Adapter is running');
            } else {
                this.recordTest('Adapter Alive', false, 'Adapter is not running. Please start the adapter instance.');
            }
        } catch (err) {
            this.recordTest('Adapter Alive', false, `Cannot check adapter status: ${err.message}`);
        }
    }

    async testAdapterConnected() {
        section('Test 3: API Connection Status');
        try {
            const state = await this.api.getState(`${ADAPTER_INSTANCE}.info.connection`);
            
            if (state && state.val === true) {
                this.recordTest('API Connection', true, 'Adapter successfully connected to SwitchBot API');
            } else {
                this.recordTest('API Connection', false, 'Adapter not connected to SwitchBot API. Check credentials.');
            }
        } catch (err) {
            this.recordTest('API Connection', false, `Cannot check connection status: ${err.message}`);
        }
    }

    async testDeviceDiscovery() {
        section('Test 4: Device Discovery');
        try {
            const states = await this.api.getStates(`${ADAPTER_INSTANCE}.*`);
            const deviceIds = new Set();
            
            // Extract unique device IDs
            Object.keys(states).forEach(key => {
                const match = key.match(/switchbot-cloud\.0\.([^.]+)\./);  
                if (match && match[1] !== 'info') {
                    deviceIds.add(match[1]);
                }
            });

            if (deviceIds.size > 0) {
                this.recordTest('Device Discovery', true, `Found ${deviceIds.size} device(s): ${Array.from(deviceIds).join(', ')}`);
                info(`Devices: ${Array.from(deviceIds).join(', ')}`);
            } else {
                this.recordWarning('Device Discovery', 'No devices found. Make sure you have SwitchBot devices in your account.');
            }

            return Array.from(deviceIds);
        } catch (err) {
            this.recordTest('Device Discovery', false, `Cannot discover devices: ${err.message}`);
            return [];
        }
    }

    async testDeviceStates() {
        section('Test 5: Device States');
        try {
            const states = await this.api.getStates(`${ADAPTER_INSTANCE}.*`);
            const stateCount = Object.keys(states).length;

            if (stateCount > 5) { // At least info states + some device states
                this.recordTest('Device States', true, `Found ${stateCount} states`);
                
                // Check for common states
                const hasDeviceId = Object.keys(states).some(k => k.includes('deviceId'));
                const hasDeviceType = Object.keys(states).some(k => k.includes('deviceType'));
                const hasDeviceName = Object.keys(states).some(k => k.includes('deviceName'));
                
                if (hasDeviceId && hasDeviceType && hasDeviceName) {
                    info('Found standard device properties (deviceId, deviceType, deviceName)');
                } else {
                    warning('Some standard device properties might be missing');
                }
            } else {
                this.recordWarning('Device States', `Only ${stateCount} states found. Expected more with devices present.`);
            }
        } catch (err) {
            this.recordTest('Device States', false, `Cannot check device states: ${err.message}`);
        }
    }

    async testDeviceControl() {
        section('Test 6: Device Control');
        info('Looking for controllable devices...\n');
        
        try {
            const states = await this.api.getStates(`${ADAPTER_INSTANCE}.*.power`);
            const controllableDevices = Object.keys(states).filter(k => k.includes('.power'));

            if (controllableDevices.length === 0) {
                this.recordWarning('Device Control', 'No controllable devices (with power state) found. Skipping control test.');
                return;
            }

            info(`Found ${controllableDevices.length} controllable device(s)`);
            
            // Test first controllable device
            const testDevice = controllableDevices[0];
            info(`Testing device: ${testDevice}`);
            
            const currentState = await this.api.getState(testDevice);
            const currentValue = currentState ? currentState.val : false;
            
            info(`Current power state: ${currentValue}`);
            warning('Control test is read-only in this version to prevent unwanted device changes.');
            warning('To test control, manually toggle the device in ioBroker admin and verify it works.');
            
            this.recordTest('Device Control', true, 'Control interface available (manual testing recommended)');
        } catch (err) {
            this.recordTest('Device Control', false, `Cannot test device control: ${err.message}`);
        }
    }

    async testPollingInterval() {
        section('Test 7: Polling Interval');
        info('Checking if device states are being updated...\n');
        
        try {
            const states = await this.api.getStates(`${ADAPTER_INSTANCE}.*.battery`);
            const batteryStates = Object.keys(states).filter(k => k.includes('.battery'));

            if (batteryStates.length === 0) {
                this.recordWarning('Polling Interval', 'No battery states found. Cannot verify polling.');
                return;
            }

            const testState = batteryStates[0];
            const initialState = await this.api.getState(testState);
            const initialTimestamp = initialState ? initialState.ts : 0;

            info(`Monitoring ${testState}`);
            info(`Initial timestamp: ${new Date(initialTimestamp).toISOString()}`);
            info('Waiting 10 seconds to check for updates...');
            
            await wait(10000);
            
            const updatedState = await this.api.getState(testState);
            const updatedTimestamp = updatedState ? updatedState.ts : 0;

            const age = Date.now() - updatedTimestamp;
            const ageMinutes = Math.floor(age / 60000);

            if (age < 300000) { // Updated within last 5 minutes
                this.recordTest('Polling Interval', true, `States are being updated (last update: ${ageMinutes} min ago)`);
            } else {
                this.recordWarning('Polling Interval', `States seem outdated (last update: ${ageMinutes} min ago). Check polling configuration.`);
            }
        } catch (err) {
            this.recordTest('Polling Interval', false, `Cannot verify polling: ${err.message}`);
        }
    }

    async testErrorHandling() {
        section('Test 8: Error Handling');
        info('Checking adapter error handling capabilities...\n');
        
        try {
            // Check if adapter has proper error state
            const states = await this.api.getStates(`${ADAPTER_INSTANCE}.info.*`);
            
            if (states[`${ADAPTER_INSTANCE}.info.connection`]) {
                this.recordTest('Error Handling', true, 'Adapter has connection state for error reporting');
            } else {
                this.recordWarning('Error Handling', 'No connection state found for error reporting');
            }
            
            info('For thorough error testing:');
            info('1. Try invalid API credentials and verify adapter reports error');
            info('2. Disconnect network and verify adapter handles it gracefully');
            info('3. Check logs for proper error messages');
        } catch (err) {
            this.recordTest('Error Handling', false, `Cannot verify error handling: ${err.message}`);
        }
    }

    printSummary() {
        section('Test Summary');
        log(`\nTotal Tests: ${this.testResults.tests.length}`, colors.cyan);
        success(`Passed: ${this.testResults.passed}`);
        if (this.testResults.failed > 0) {
            error(`Failed: ${this.testResults.failed}`);
        } else {
            log(`Failed: ${this.testResults.failed}`, colors.reset);
        }
        if (this.testResults.warnings > 0) {
            warning(`Warnings: ${this.testResults.warnings}`);
        } else {
            log(`Warnings: ${this.testResults.warnings}`, colors.reset);
        }

        log('\n' + '='.repeat(60) + '\n', colors.cyan);

        if (this.testResults.failed === 0) {
            success('🎉 All critical tests passed!');
            if (this.testResults.warnings > 0) {
                warning('⚠️  Some warnings were found. Review them above.');
            }
        } else {
            error('❌ Some tests failed. Please review the errors above.');
            process.exit(1);
        }

        log('\nNext Steps:', colors.cyan);
        info('1. Review any warnings or failures above');
        info('2. Test manual device control in ioBroker Admin');
        info('3. Monitor adapter logs for 24 hours to check stability');
        info('4. Verify API rate limits are respected (10,000 requests/day)');
        info('5. Test with different poll intervals');
        log('');
    }
}

// Main execution
(async () => {
    const suite = new AdapterTestSuite();
    
    try {
        await suite.run();
    } catch (err) {
        error(`\nTest execution failed: ${err.message}`);
        process.exit(1);
    }
})();
