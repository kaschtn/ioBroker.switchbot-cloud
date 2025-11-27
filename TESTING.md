# Testing Guide for ioBroker SwitchBot Adapter

This guide covers all testing methods for the SwitchBot adapter, from automated unit tests to manual integration testing in a real ioBroker environment.

---

## 📋 Table of Contents

1. [Automated Tests](#automated-tests)
2. [Manual Integration Testing](#manual-integration-testing)
3. [Testing in Production Environment](#testing-in-production-environment)
4. [Continuous Integration](#continuous-integration)
5. [Troubleshooting](#troubleshooting)

---

## 🤖 Automated Tests

### Overview

The adapter includes three types of automated tests:

| Test Type | File | Purpose | Duration |
|-----------|------|---------|----------|
| **Package Tests** | `test/testPackageFiles.js` | Validates package.json and io-package.json structure | ~1s |
| **Unit Tests** | `test/unit.js` | Tests adapter initialization and basic functionality | ~5s |
| **Integration Tests** | `test/integration.js` | Tests complete adapter lifecycle in test environment | ~15s |

### Running All Tests

```bash
# Run complete test suite
npm test

# Expected output:
# ✓ Package files validation
# ✓ Unit tests (adapter startup, object creation)
# ✓ Integration tests (full lifecycle)
```

### Running Individual Tests

```bash
# Package validation only
npm run test:package

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Linting
npm run lint

# Linting with auto-fix
npm run lint:fix
```

### Test Requirements

- **Node.js:** >= 18.x
- **Dependencies:** Install with `npm ci` or `npm install`
- **No API credentials needed** for automated tests
- **No real devices required** for automated tests

### What Gets Tested

#### 1. Package Tests (`test:package`)

✅ Validates `package.json`:
- Required properties (name, version, description, author, license)
- Repository configuration
- Main file reference
- No forbidden dependencies (npm, iobroker.js-controller)

✅ Validates `io-package.json`:
- Common properties (name, version, news, description)
- Multi-language support
- Icon and extIcon paths
- Type and authors

#### 2. Unit Tests (`test:unit`)

✅ Adapter startup:
- Adapter starts without errors
- Info channel is created
- Connection state is created
- States have correct types

✅ Object structure:
- Info objects exist
- States have proper roles and types

#### 3. Integration Tests (`test:integration`)

✅ Complete lifecycle:
- Adapter installation
- Adapter startup
- Graceful shutdown
- Resource cleanup

---

## 🧪 Manual Integration Testing

For testing with real SwitchBot devices and API credentials.

### Test Script

The repository includes a comprehensive manual test script that validates the adapter in a real ioBroker environment.

```bash
# Run manual integration tests
node test/manual-integration.js

# With custom ioBroker host
IOBROKER_HOST=192.168.1.100 node test/manual-integration.js

# With custom host and port
IOBROKER_HOST=192.168.1.100 IOBROKER_PORT=8081 node test/manual-integration.js
```

### Prerequisites

- ✅ Running ioBroker instance
- ✅ Adapter installed in ioBroker
- ✅ Valid SwitchBot API credentials configured
- ✅ At least one SwitchBot device in your account
- ✅ ioBroker Web API accessible (default: port 8081)

### What Gets Tested

The manual test script performs these checks:

1. **API Connection Test**
   - Verifies connection to ioBroker Web API
   - Tests REST API accessibility

2. **Adapter Alive Status**
   - Checks if adapter instance is running
   - Validates `switchbot.0.info.alive` state

3. **SwitchBot API Connection**
   - Verifies adapter successfully connected to SwitchBot Cloud
   - Checks `switchbot.0.info.connection` state

4. **Device Discovery**
   - Counts discovered devices
   - Lists all device IDs
   - Validates device structure

5. **Device States**
   - Verifies state creation
   - Checks for standard properties (deviceId, deviceType, deviceName)
   - Validates state counts

6. **Device Control**
   - Identifies controllable devices
   - Checks control interface availability
   - Non-destructive testing (read-only)

7. **Polling Interval**
   - Monitors state updates
   - Validates polling functionality
   - Checks timestamp freshness

8. **Error Handling**
   - Verifies error state presence
   - Validates connection error reporting

### Expected Output

```
============================================================
  SwitchBot Adapter Integration Test Suite
============================================================
ℹ️  Testing adapter instance: switchbot.0
ℹ️  ioBroker host: localhost:8081

============================================================
  Test 1: API Connection
============================================================
✅ API Connection: Successfully connected to ioBroker API

============================================================
  Test 2: Adapter Alive Status
============================================================
✅ Adapter Alive: Adapter is running

============================================================
  Test 3: API Connection Status
============================================================
✅ API Connection: Adapter successfully connected to SwitchBot API

============================================================
  Test 4: Device Discovery
============================================================
✅ Device Discovery: Found 3 device(s): DEVICE001, DEVICE002, DEVICE003

============================================================
  Test Summary
============================================================

Total Tests: 8
✅ Passed: 8
Failed: 0
Warnings: 0

🎉 All critical tests passed!
```

---

## 🏭 Testing in Production Environment

### Installation Methods

#### Method 1: Install from GitHub (Recommended)

**Via ioBroker Admin Interface:**
1. Open ioBroker Admin
2. Navigate to "Adapter" tab
3. Click GitHub icon (Octocat)
4. Enter: `kaschtn/ioBroker.switchbot`
5. Click Install

**Via Command Line:**
```bash
cd /opt/iobroker
npm install kaschtn/ioBroker.switchbot
iobroker upload switchbot
iobroker add switchbot
```

#### Method 2: Install from NPM (After Publication)

```bash
cd /opt/iobroker
iobroker add switchbot
```

#### Method 3: Local Development with npm link

**On Development Machine:**
```bash
cd /path/to/iobroker-switchbot
npm install
npm link
```

**On ioBroker Server:**
```bash
cd /opt/iobroker
sudo npm link iobroker.switchbot
iobroker upload switchbot
iobroker add switchbot
```

**Update after changes:**
```bash
iobroker upload switchbot
iobroker restart switchbot
```

#### Method 4: Manual Package Installation

**Create Package:**
```bash
cd /path/to/iobroker-switchbot
npm pack
# Creates: iobroker.switchbot-0.9.0.tgz
```

**Install on Server:**
```bash
# Copy to server
scp iobroker.switchbot-0.9.0.tgz user@iobroker:/tmp/

# Install
ssh user@iobroker
cd /opt/iobroker
sudo npm install /tmp/iobroker.switchbot-0.9.0.tgz
iobroker upload switchbot
iobroker add switchbot
```

### Configuration Testing

After installation, test the configuration:

1. **Configure API Credentials:**
   - Open adapter instance configuration
   - Enter SwitchBot Open Token
   - Enter SwitchBot Secret Key
   - Set Poll Interval (default: 60000ms)
   - Enable Cloud Service

2. **Test Connection:**
   - Click "Test Connection" button
   - Verify success message

3. **Start Adapter:**
   - Save configuration
   - Start adapter instance

4. **Verify Device Discovery:**
   ```bash
   # List all created objects
   iobroker object list switchbot.0.*
   
   # Check specific device
   iobroker state get switchbot.0.DEVICE001.deviceName
   ```

### Live Monitoring

```bash
# Watch all logs in real-time
iobroker logs --watch

# Watch only SwitchBot adapter logs
iobroker logs switchbot --watch

# Check adapter status
iobroker status switchbot

# List all instances
iobroker list instances
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

1. **Via Admin Interface:**
   - Go to: Instances → switchbot → Configuration
   - Set Log Level: `debug`
   - Save and restart

2. **Via Command Line:**
   ```bash
   iobroker set switchbot.0 --logLevel debug
   iobroker restart switchbot
   ```

---

## 🔄 Continuous Integration

### GitHub Actions Workflows

The adapter uses GitHub Actions for automated testing:

#### 1. Test and Release Workflow

**File:** `.github/workflows/test-and-release.yml`

**Triggers:**
- Push to `main` branch
- Version tags (`v*.*.*`)
- Pull requests

**Jobs:**
- **check-and-lint:** Quick validation and linting
- **adapter-tests:** Full test suite on multiple Node.js versions and OS
- **deploy:** Automatic NPM publishing on tagged releases

**Tested Configurations:**
- Node.js: 18.x, 20.x, 22.x
- OS: Ubuntu 22.04, Windows, macOS

**Skipping CI:**
Add `[skip ci]` to commit message to skip CI runs.

#### 2. Pull Request Checks

**File:** `.github/workflows/pr-checks.yml`

Validates pull requests before merging:
- Code linting
- Package validation
- Unit tests
- Integration tests

### Running Tests Locally Before Push

```bash
# Complete pre-push checklist
npm run lint          # Check code style
npm test             # Run all tests
npm run test:package # Validate package files
npm run test:unit    # Unit tests
npm run test:integration # Integration tests
```

### Required Secrets for CI/CD

For automated deployment, configure these GitHub secrets:

- `NPM_TOKEN`: NPM access token for publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub

---

## 🧰 Troubleshooting

### Common Issues

#### Test Failures

**Problem:** Tests fail during npm install
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Integration tests timeout
```bash
# Solution: Increase timeout
npm run test:integration -- --timeout 60000
```

#### Manual Test Script Issues

**Problem:** Cannot connect to ioBroker API
```bash
# Check if ioBroker is running
systemctl status iobroker

# Check if Web API is accessible
curl http://localhost:8081/getStates

# Try with explicit host
IOBROKER_HOST=localhost IOBROKER_PORT=8081 node test/manual-integration.js
```

**Problem:** Adapter not found
```bash
# Re-upload adapter
iobroker upload switchbot

# Force add adapter
iobroker add switchbot --force

# Check adapter list
iobroker list adapters | grep switchbot
```

#### Production Environment Issues

**Problem:** Changes not reflected
```bash
# Clear adapter cache
iobroker stop switchbot
rm -rf /opt/iobroker/node_modules/iobroker.switchbot
# Reinstall
```

**Problem:** Adapter won't start
```bash
# Check logs for errors
iobroker logs switchbot

# Check adapter configuration
iobroker get switchbot.0

# Validate credentials
# Go to Admin → Instances → switchbot → Config → Test Connection
```

**Problem:** Devices not discovered
```bash
# Enable debug logging
iobroker set switchbot.0 --logLevel debug
iobroker restart switchbot

# Check API connection
iobroker state get switchbot.0.info.connection

# Verify Cloud Service is enabled in SwitchBot app
```

**Problem:** States not updating
```bash
# Check polling interval
iobroker get switchbot.0 --native pollInterval

# Verify adapter is alive
iobroker state get switchbot.0.info.alive

# Check for API errors in logs
iobroker logs switchbot | grep -i error
```

### Memory Leak Testing

For long-term stability testing:

```bash
# Monitor memory usage
watch -n 5 'ps aux | grep iobroker.switchbot'

# Or use ioBroker built-in monitoring
# Admin → Instances → show details → Memory usage
```

### Performance Benchmarking

```bash
# Check API rate limiting
# Monitor over 24 hours to ensure < 10,000 requests/day
iobroker logs switchbot | grep "API request"

# Calculate requests per day
iobroker logs switchbot --since "24 hours ago" | grep "API request" | wc -l
```

---

## ✅ Pre-Release Testing Checklist

Before publishing a new version:

- [ ] All automated tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual integration test successful
- [ ] Tested with real SwitchBot devices
- [ ] Tested all device types (Bot, Curtain, Lock, etc.)
- [ ] Tested with multiple polling intervals
- [ ] Verified error handling (invalid credentials, network errors)
- [ ] Tested adapter start/stop cycles
- [ ] No memory leaks after 24h+ operation
- [ ] Verified API rate limits respected
- [ ] All log levels work correctly (error, warn, info, debug)
- [ ] Admin interface works on different browsers
- [ ] README and documentation are up to date
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json and io-package.json

---

## 📚 Additional Resources

- [ioBroker Testing Documentation](https://github.com/ioBroker/testing)
- [Mocha Testing Framework](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [SwitchBot API Documentation](https://github.com/OpenWonderLabs/SwitchBotAPI)
- [ioBroker Adapter Development](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterdev.md)

---

## 💡 Tips

- **Always run tests** before committing changes
- **Use debug logging** for troubleshooting production issues
- **Monitor API usage** to avoid rate limits
- **Test with real devices** before releases
- **Keep tests updated** when adding new features
- **Document test failures** in GitHub issues

---

*Last Updated: November 2025*
