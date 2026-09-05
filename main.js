/**
 * ioBroker SwitchBot Adapter
 *
 * Controls SwitchBot devices via SwitchBot API v1.1
 */

'use strict';

const utils = require('@iobroker/adapter-core');
const SwitchBotAPI = require('./lib/switchbot-api');
const DeviceManager = require('./lib/device-manager');
const ErrorHandler = require('./lib/error-handler');

class SwitchBot extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'switchbot-cloud',
        });

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        // Initialize properties
        this.api = null;
        this.deviceManager = null;
        this.errorHandler = null;
        this.pollTimer = null;
        this.currentPollInterval = null;
        this.isConnected = false;
        this.isShuttingDown = false;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        try {
            this.log.info('Starting SwitchBot adapter...');

            // Reset shutdown flag
            this.isShuttingDown = false;

            const startupConfigSummary = this.getConfigDebugSummary(this.config);
            this.log.info(`Loaded config: pollIntervalRaw=${startupConfigSummary.pollIntervalRaw}, pollIntervalEffective=${startupConfigSummary.pollIntervalEffective}ms, enableCloudService=${startupConfigSummary.enableCloudService}, tokenConfigured=${startupConfigSummary.tokenConfigured}, secretConfigured=${startupConfigSummary.secretConfigured}`);

            // Watch own instance object so poll interval changes in Admin are applied immediately
            this.subscribeForeignObjects(`system.adapter.${this.namespace}`);

            // Initialize error handler first
            this.errorHandler = new ErrorHandler(this);
            this.log.debug('Error handler initialized');

            // Validate configuration
            try {
                this.errorHandler.validateConfig(this.config);
                this.log.debug('Configuration validated successfully');
            } catch (configError) {
                this.log.error(`Configuration validation failed: ${configError.message}`);
                this.log.error('Please check your adapter settings (token, secret, poll interval)');
                await this.setStateAsync('info.connection', false, true);
                return; // Stop initialization if config is invalid
            }

            // Initialize API client
            try {
                this.api = new SwitchBotAPI({
                    token: this.config.token,
                    secret: this.config.secret,
                    log: this.log,
                    adapter: this
                });
                this.log.debug('API client initialized');
            } catch (apiError) {
                this.log.error(`Failed to initialize API client: ${apiError.message}`);
                await this.setStateAsync('info.connection', false, true);
                return;
            }

            // Initialize device manager
            try {
                this.deviceManager = new DeviceManager(this, this.api, this.errorHandler);
                this.log.debug('Device manager initialized');
            } catch (dmError) {
                this.log.error(`Failed to initialize device manager: ${dmError.message}`);
                await this.setStateAsync('info.connection', false, true);
                return;
            }

            // Test API connection with retry logic
            this.log.info('Testing connection to SwitchBot API...');
            await this.errorHandler.handleWithRetry('startup_connection', async () => {
                await this.testConnection();
            });

            if (this.isConnected) {
                this.log.info('Connection successful, discovering devices...');

                // Discover devices with retry logic
                try {
                    await this.errorHandler.handleWithRetry('device_discovery', async () => {
                        await this.deviceManager.discoverDevices();
                    });
                    this.log.debug('Device discovery completed');
                } catch (discoveryError) {
                    this.log.error(`Device discovery failed: ${discoveryError.message}`);
                    this.log.warn('Adapter will continue but no devices will be available');
                }

                // Start polling for device updates
                try {
                    this.startPolling();
                    this.log.debug('Polling started');
                } catch (pollError) {
                    this.log.error(`Failed to start polling: ${pollError.message}`);
                    this.log.warn('Device states will not update automatically');
                }

                this.log.info('✅ SwitchBot adapter started successfully');
            } else {
                this.log.error('❌ Failed to connect to SwitchBot API. Adapter will not function.');
                this.log.error('Please check your token and secret, or verify SwitchBot API is accessible.');
            }

        } catch (error) {
            // Catch any unexpected errors during startup
            this.log.error(`❌ Unexpected error during adapter startup: ${error.message}`);

            if (this.errorHandler) {
                this.errorHandler.logError(error, 'adapter startup');
            }

            // Ensure connection state is set to false
            try {
                await this.setStateAsync('info.connection', false, true);
            } catch (stateError) {
                this.log.error(`Failed to set connection state: ${stateError.message}`);
            }

            // Log critical error indicator
            if (this.errorHandler && this.errorHandler.isCriticalError(error)) {
                this.log.error('⚠️ Critical error detected - adapter cannot function properly');
                this.log.error('Please check adapter logs and configuration');
            }
        }
    }

    /**
     * Test API connection
     * @returns {Promise<void>}
     * @throws {Error} If connection fails
     */
    async testConnection() {
        try {
            this.log.debug('Testing connection to SwitchBot API...');
            const devices = await this.api.getDevices();

            if (!devices || !devices.deviceList || !devices.infraredRemoteList) {
                throw new Error('Invalid response from SwitchBot API - missing device data');
            }

            this.isConnected = true;
            await this.setStateAsync('info.connection', true, true);
            this.log.info(`Connected to SwitchBot API. Found ${devices.deviceList.length} physical devices and ${devices.infraredRemoteList.length} IR devices.`);

        } catch (error) {
            this.isConnected = false;
            await this.setStateAsync('info.connection', false, true);

            // Provide user-friendly error messages
            let errorMessage = error.message;
            if (error.message.includes('Authentication failed')) {
                errorMessage = 'Authentication failed. Please check your API token and secret in adapter configuration.';
            } else if (error.message.includes('Network error')) {
                errorMessage = 'Unable to connect to SwitchBot API. Please check your internet connection.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Connection to SwitchBot API timed out. Please try again later.';
            }

            this.log.error(`Failed to connect to SwitchBot API: ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }

    /**
     * Start polling for device status updates
     * Starts an interval timer to periodically poll all devices
     * @returns {void}
     */
    startPolling() {
        const interval = this.getPollIntervalFromConfig();

        if (this.pollTimer) {
            this.clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        this.currentPollInterval = interval;

        this.pollTimer = this.setInterval(() => {
            this.pollDevices();
        }, interval);

        this.log.info(`Started polling with interval: ${interval}ms`);
    }

    /**
     * Get validated poll interval from configuration
     * @param {Record<string, any>} [config=this.config] - Configuration source
     * @returns {number}
     */
    getPollIntervalFromConfig(config = this.config) {
        const rawValue = config && config.pollInterval;
        const parsedInterval = Number(rawValue);

        if (Number.isInteger(parsedInterval) && parsedInterval >= 10000) {
            return parsedInterval;
        }

        return 60000;
    }

    /**
     * Create a safe summary of adapter configuration for troubleshooting
     * @param {Record<string, any>} [config=this.config] - Configuration source
     * @returns {{pollIntervalRaw: any, pollIntervalEffective: number, enableCloudService: boolean, tokenConfigured: boolean, secretConfigured: boolean}}
     */
    getConfigDebugSummary(config = this.config) {
        return {
            pollIntervalRaw: config ? config.pollInterval : undefined,
            pollIntervalEffective: this.getPollIntervalFromConfig(config),
            enableCloudService: !!(config && config.enableCloudService),
            tokenConfigured: !!(config && typeof config.token === 'string' && config.token.trim().length > 0),
            secretConfigured: !!(config && typeof config.secret === 'string' && config.secret.trim().length > 0)
        };
    }

    /**
     * Poll all devices for status updates
     * Retrieves current status from all discovered devices
     * @returns {Promise<void>}
     */
    async pollDevices() {
        // Skip if adapter is shutting down
        if (this.isShuttingDown) {
            this.log.debug('Skipping poll - adapter is shutting down');
            return;
        }

        if (!this.isConnected) {
            this.log.warn('Skipping poll - not connected to API');
            return;
        }

        await this.errorHandler.safeExecute(async () => {
            await this.errorHandler.handleWithRetry('device_polling', async () => {
                await this.deviceManager.updateAllDeviceStates();
            });
        }, 'device polling', null);
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id - The state ID
     * @param {ioBroker.State | null | undefined} state - The state object
     */
    async onStateChange(id, state) {
        // Ignore acknowledged state changes or if adapter is shutting down
        if (!state || state.ack || this.isShuttingDown) {
            return;
        }

        try {
            if (!this.isConnected) {
                this.log.warn(`Cannot process state change for ${id} - not connected to API`);
                return;
            }

            if (!this.deviceManager) {
                this.log.error(`Cannot process state change for ${id} - device manager not initialized`);
                return;
            }

            this.log.debug(`Processing state change for ${id}: ${state.val}`);
            await this.deviceManager.handleStateChange(id, state);

        } catch (error) {
            this.log.error(`Failed to handle state change for ${id}: ${error.message}`);

            // Provide user-friendly error message
            if (error.message.includes('Rate limit')) {
                this.log.warn('API rate limit reached. Please reduce command frequency or increase poll interval.');
            } else if (error.message.includes('Invalid')) {
                this.log.error(`Invalid command or device configuration for ${id}. Please check device settings.`);
            }
        }
    }

    /**
     * Handle object changes (including instance config updates)
     * @param {string} id - Object ID
     * @param {ioBroker.Object | null | undefined} obj - Object definition
     */
    async onObjectChange(id, obj) {
        if (this.isShuttingDown) {
            return;
        }

        const ownInstanceObjectId = `system.adapter.${this.namespace}`;
        if (id !== ownInstanceObjectId || !obj || !obj.native) {
            return;
        }

        const newInterval = this.getPollIntervalFromConfig(obj.native);
        const configSummary = this.getConfigDebugSummary(obj.native);

        this.log.info(`Config update detected: pollIntervalRaw=${configSummary.pollIntervalRaw}, pollIntervalEffective=${configSummary.pollIntervalEffective}ms, enableCloudService=${configSummary.enableCloudService}, tokenConfigured=${configSummary.tokenConfigured}, secretConfigured=${configSummary.secretConfigured}`);

        if (newInterval === this.currentPollInterval) {
            return;
        }

        this.config.pollInterval = newInterval;
        this.log.info(`Polling interval changed via config update: ${newInterval}ms`);

        if (this.isConnected) {
            this.startPolling();
            this.log.info('Polling timer restarted with updated interval');
        }
    }

    /**
     * Is called when a message is sent to the instance
     * @param {ioBroker.Message} obj - The message object
     */
    async onMessage(obj) {
        if (typeof obj === 'object' && obj.message) {
            if (obj.command === 'testConnection') {
                try {
                    const { token, secret } = obj.message;

                    // Validate input
                    if (!token || !secret) {
                        this.sendTo(obj.from, obj.command, {
                            success: false,
                            error: 'Token and secret are required for connection test'
                        }, obj.callback);
                        return;
                    }

                    if (typeof token !== 'string' || typeof secret !== 'string') {
                        this.sendTo(obj.from, obj.command, {
                            success: false,
                            error: 'Token and secret must be strings'
                        }, obj.callback);
                        return;
                    }

                    this.log.debug('Testing connection with provided credentials...');

                    // Create temporary API instance for testing
                    const testAPI = new SwitchBotAPI({
                        token: token.trim(),
                        secret: secret.trim(),
                        log: this.log,
                        adapter: this
                    });

                    const devices = await testAPI.getDevices();

                    if (!devices || !devices.deviceList || !devices.infraredRemoteList) {
                        throw new Error('Invalid response from API - missing device data');
                    }

                    const deviceCount = devices.deviceList.length + devices.infraredRemoteList.length;

                    this.sendTo(obj.from, obj.command, {
                        success: true,
                        deviceCount: deviceCount,
                        message: `Successfully connected! Found ${deviceCount} devices.`
                    }, obj.callback);

                } catch (error) {
                    // Provide user-friendly error messages
                    let errorMessage = error.message;

                    if (error.message.includes('Authentication failed')) {
                        errorMessage = 'Authentication failed. Please verify your token and secret are correct.';
                    } else if (error.message.includes('Network error')) {
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                    } else if (error.message.includes('timeout')) {
                        errorMessage = 'Connection timeout. SwitchBot API is not responding.';
                    } else if (error.message.includes('Rate limit')) {
                        errorMessage = 'Rate limit exceeded. Please wait a moment before testing again.';
                    }

                    this.log.warn(`Connection test failed: ${errorMessage}`);

                    this.sendTo(obj.from, obj.command, {
                        success: false,
                        error: errorMessage
                    }, obj.callback);
                }
            } else {
                this.log.warn(`Unknown message command: ${obj.command}`);
            }
        }
    }

    /**
     * Is called when adapter shuts down - callback must be called under all circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info('Stopping SwitchBot adapter...');

            // Set shutdown flag to prevent new operations
            this.isShuttingDown = true;

            // Clear polling timer
            if (this.pollTimer) {
                this.log.debug('Clearing poll timer...');
                this.clearInterval(this.pollTimer);
                this.pollTimer = null;
            }

            this.currentPollInterval = null;

            // Clean up error handler
            if (this.errorHandler) {
                this.log.debug('Cleaning up error handler...');
                this.errorHandler.cleanup();
                this.errorHandler = null;
            }

            // Clean up device manager
            if (this.deviceManager) {
                this.log.debug('Cleaning up device manager...');
                this.deviceManager = null;
            }

            // Clean up API client
            if (this.api) {
                this.log.debug('Cleaning up API client...');
                this.api = null;
            }

            // Set connection state to false
            this.setState('info.connection', { val: false, ack: true }, () => {
                this.log.info('SwitchBot adapter stopped successfully');
                callback();
            });

        } catch (error) {
            // Always call callback even if there's an error
            this.log.error(`Error during unload: ${error.message}`);
            callback();
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new SwitchBot(options);
} else {
    // otherwise start the instance directly
    new SwitchBot();
}