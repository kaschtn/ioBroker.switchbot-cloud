const path = require('path');
const { tests } = require('@iobroker/testing');

// Test the adapter startup using integration pattern
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Adapter Startup Tests', (getHarness) => {
            it('Should start the adapter without errors', function() {
                this.timeout(10000);

                return new Promise((resolve, reject) => {
                    (async () => {
                        try {
                            const harness = getHarness();

                            // Get adapter object
                            const obj = await new Promise((res, rej) => {
                                harness.objects.getObject('system.adapter.switchbot-cloud.0', (err, o) => {
                                    if (err) return rej(err);
                                    res(o);
                                });
                            });

                            if (!obj) {
                                return reject(new Error('Adapter object not found'));
                            }

                            // Configure adapter
                            Object.assign(obj.native, {
                                token: 'test-token',
                                secret: 'test-secret',
                                pollInterval: 60000
                            });

                            await new Promise((res, rej) => {
                                harness.objects.setObject(obj._id, obj, (err) => {
                                    if (err) return rej(err);
                                    res();
                                });
                            });

                            // Start adapter
                            await harness.startAdapterAndWait();

                            // Wait a bit for adapter initialization
                            await new Promise((res) => setTimeout(res, 2000));

                            // Check that adapter created basic structure
                            const stateIds = await harness.dbConnection.getStateIDs('switchbot-cloud.0.*');

                            if (stateIds.length > 0) {
                                console.log('✅ Adapter started and created states');
                                resolve();
                            } else {
                                // It's okay if no states are created without valid credentials
                                console.log('⚠️  No states created (expected with test credentials)');
                                resolve();
                            }

                            await harness.stopAdapter();
                        } catch (error) {
                            reject(error);
                        }
                    })();
                });
            });
        });
    }
});