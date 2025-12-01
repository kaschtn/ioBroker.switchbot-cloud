# ioBroker Test Environment Setup Guide

This guide explains how to set up a complete ioBroker test environment on Ubuntu 22.04 LTS (WSL) for testing the switchbot-cloud adapter before release.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Preparation](#system-preparation)
3. [Install Node.js](#install-nodejs)
4. [Install ioBroker](#install-iobroker)
5. [Install Adapter for Testing](#install-adapter-for-testing)
6. [Testing Workflow](#testing-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS:** Ubuntu 22.04 LTS (WSL2)
- **RAM:** Minimum 1GB available
- **Disk Space:** Minimum 2GB free
- **User:** Non-root user with sudo privileges

### Check WSL Version

```bash
# In Windows PowerShell
wsl --version

# Should show WSL version 2
# If not, upgrade:
wsl --set-version Ubuntu-22.04 2
```

---

## System Preparation

### 1. Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl git libavahi-compat-libdnssd-dev
```

### 2. Install Required Dependencies

```bash
# Install additional dependencies for ioBroker
sudo apt install -y \
    libavahi-compat-libdnssd-dev \
    python3 \
    python3-dev \
    acl

# Verify installations
which curl git python3
```

---

## Install Node.js

ioBroker requires Node.js 18.x or 20.x (LTS versions).

### Option 1: Install Node.js 20.x (Recommended)

```bash
# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

### Option 2: Install via nvm (More Flexible)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

---

## Install ioBroker

### Automated Installation (Recommended)

```bash
# Create ioBroker installation directory
sudo mkdir -p /opt/iobroker
sudo chown -R $USER:$USER /opt/iobroker

# Navigate to installation directory
cd /opt/iobroker

# Download and run installer
curl -sLf https://iobroker.net/install.sh | bash -

# Wait for installation to complete (5-10 minutes)
# The installer will:
# - Install ioBroker core
# - Install js-controller
# - Install admin adapter
# - Set up systemd service (if available)
```

### Alternative: Manual Installation

```bash
# Create directory and set permissions
sudo mkdir -p /opt/iobroker
sudo chown -R $USER:$USER /opt/iobroker
cd /opt/iobroker

# Install ioBroker
npm install iobroker --unsafe-perm

# Initialize ioBroker
cd /opt/iobroker
npm install --production --unsafe-perm
node node_modules/iobroker.js-controller/controller.js setup first
```

### Verify Installation

```bash
# Check ioBroker installation
cd /opt/iobroker
iobroker status

# Should show:
# - js-controller: running
# - Objects type: file
# - States type: file
```

### Start ioBroker

```bash
# Start ioBroker
iobroker start

# Check status
iobroker status

# View logs
iobroker logs --watch
```

### Access Admin Interface

Since you're running in WSL, you need to find the IP address:

```bash
# Get WSL IP address
ip addr show eth0 | grep inet

# Or use hostname
hostname -I
```

Open browser and navigate to:
- `http://<WSL-IP>:8081` (e.g., `http://172.20.10.2:8081`)
- Or from Windows: `http://localhost:8081` (if port forwarding is configured)

**Note:** WSL2 uses a virtual network adapter. You may need to configure port forwarding in Windows:

```powershell
# In Windows PowerShell (as Administrator)
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=<WSL-IP>
```

---

## Install Adapter for Testing

### Method 1: Install from Local Directory (Recommended for Development)

This is the best method for testing during development:

```bash
# Navigate to your adapter directory
cd ~/git/ioBroker.switchbot-cloud

# Install dependencies
npm install

# Link adapter to ioBroker
cd /opt/iobroker
npm install ~/git/ioBroker.switchbot-cloud

# Upload adapter to ioBroker
iobroker upload switchbot-cloud

# Add adapter instance
iobroker add switchbot-cloud

# Alternative: Add with auto-start disabled for manual testing
iobroker add switchbot-cloud 0 --enabled false
```

### Method 2: Install from GitHub

```bash
# Install directly from your GitHub repository
cd /opt/iobroker
npm install kaschtn/ioBroker.switchbot-cloud

# Upload and add
iobroker upload switchbot-cloud
iobroker add switchbot-cloud
```

### Method 3: Use npm link (Best for Active Development)

```bash
# In your adapter directory
cd ~/git/ioBroker.switchbot-cloud
npm install
npm link

# In ioBroker directory
cd /opt/iobroker
npm link iobroker.switchbot-cloud

# Upload and add
iobroker upload switchbot-cloud
iobroker add switchbot-cloud
```

**After code changes with npm link:**
```bash
# Just re-upload, no need to reinstall
iobroker upload switchbot-cloud
iobroker restart switchbot-cloud
```

### Configure Adapter

1. Open Admin interface: `http://localhost:8081`
2. Navigate to "Instances" tab
3. Find "switchbot-cloud" adapter
4. Click configuration (wrench icon)
5. Enter your SwitchBot credentials:
   - Open Token
   - Secret Key
   - Poll Interval (default: 60000ms)
6. Click "Test Connection"
7. Save and start the instance

---

## Testing Workflow

### Complete Testing Cycle

```bash
# 1. Make code changes in your adapter
cd ~/git/ioBroker.switchbot-cloud
# ... edit files ...

# 2. Run automated tests
npm test

# 3. Run linting
npm run lint

# 4. Upload changes to ioBroker
iobroker upload switchbot-cloud

# 5. Restart adapter
iobroker restart switchbot-cloud

# 6. Monitor logs
iobroker logs switchbot-cloud --watch

# 7. Check adapter status
iobroker status switchbot-cloud

# 8. View created objects
iobroker object list switchbot-cloud.0.*

# 9. Check specific state
iobroker state get switchbot-cloud.0.info.connection
```

### Manual Integration Testing

```bash
# Run the manual integration test script
cd ~/git/ioBroker.switchbot-cloud
node test/manual-integration.js

# Or with custom host (if needed)
IOBROKER_HOST=localhost IOBROKER_PORT=8081 node test/manual-integration.js
```

### Debugging

Enable debug logging for detailed output:

```bash
# Via command line
iobroker set switchbot-cloud.0 --logLevel debug
iobroker restart switchbot-cloud

# View debug logs
iobroker logs switchbot-cloud --watch

# Or via Admin interface:
# Instances → switchbot-cloud → Config → Log Level → debug
```

### Testing Scenarios

1. **Initial Setup Test**
   ```bash
   # Test connection
   # Verify device discovery
   # Check state creation
   iobroker object list switchbot-cloud.0.*
   ```

2. **Device Control Test**
   ```bash
   # Set a state to control a device
   iobroker state set switchbot-cloud.0.DEVICEID.power true
   
   # Verify command was sent
   iobroker logs switchbot-cloud | grep "Command.*sent"
   ```

3. **Polling Test**
   ```bash
   # Monitor state updates
   watch -n 2 'iobroker state get switchbot-cloud.0.DEVICEID.temperature'
   ```

4. **Error Handling Test**
   ```bash
   # Test with invalid credentials
   # Test with network issues
   # Verify graceful error handling
   ```

5. **Resource Cleanup Test**
   ```bash
   # Stop and verify clean shutdown
   iobroker stop switchbot-cloud
   
   # Check for memory leaks
   ps aux | grep switchbot-cloud
   ```

---

## Troubleshooting

### ioBroker Won't Start

```bash
# Check for port conflicts
sudo netstat -tlnp | grep 8081

# Check logs
tail -f /opt/iobroker/log/iobroker.*.log

# Restart ioBroker
iobroker restart
```

### Adapter Not Found

```bash
# Verify adapter is installed
ls -la /opt/iobroker/node_modules/ | grep switchbot-cloud

# Re-upload adapter
iobroker upload switchbot-cloud

# Check adapter list
iobroker list adapters | grep switchbot-cloud
```

### Can't Access Admin Interface

```bash
# Check if admin is running
iobroker status

# Restart admin
iobroker restart admin

# Check WSL IP
hostname -I

# Try accessing from Windows
# http://<WSL-IP>:8081

# Configure Windows port forwarding if needed (PowerShell as Admin)
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$(wsl hostname -I | awk '{print $1}')
```

### Adapter Crashes or Won't Start

```bash
# Check adapter logs
iobroker logs switchbot-cloud

# Enable debug logging
iobroker set switchbot-cloud.0 --logLevel debug
iobroker restart switchbot-cloud

# Check for errors in main log
tail -f /opt/iobroker/log/iobroker.*.log

# Verify dependencies
cd /opt/iobroker/node_modules/iobroker.switchbot-cloud
npm install
```

### Changes Not Reflected

```bash
# Full reinstall cycle
iobroker stop switchbot-cloud
rm -rf /opt/iobroker/node_modules/iobroker.switchbot-cloud
cd /opt/iobroker
npm install ~/git/ioBroker.switchbot-cloud
iobroker upload switchbot-cloud
iobroker start switchbot-cloud
```

### WSL Network Issues
exi
```bash
# Check WSL network connectivity
ping google.com

# Check DNS
cat /etc/resolv.conf

# Restart WSL network (in Windows PowerShell as Admin)
wsl --shutdown
# Then restart WSL
```

### Permission Issues

```bash
# Fix ioBroker directory permissions
sudo chown -R $USER:$USER /opt/iobroker

# Fix npm cache permissions
sudo chown -R $USER:$USER ~/.npm
```

---

## Quick Reference Commands

### Common ioBroker Commands

```bash
# Start/Stop/Restart
iobroker start
iobroker stop
iobroker restart

# Status
iobroker status
iobroker status switchbot-cloud

# Logs
iobroker logs
iobroker logs switchbot-cloud --watch

# Adapter Management
iobroker upload switchbot-cloud
iobroker add switchbot-cloud
iobroker del switchbot-cloud

# Object/State Management
iobroker object list switchbot-cloud.0.*
iobroker state get switchbot-cloud.0.info.connection
iobroker state set switchbot-cloud.0.DEVICE.power true

# Configuration
iobroker set switchbot-cloud.0 --logLevel debug
iobroker get switchbot-cloud.0
```

### Development Workflow

```bash
# 1. Edit code
cd ~/git/ioBroker.switchbot-cloud

# 2. Test locally
npm test
npm run lint

# 3. Update in ioBroker
iobroker upload switchbot-cloud
iobroker restart switchbot-cloud

# 4. Monitor
iobroker logs switchbot-cloud --watch
```

---

## Pre-Release Testing Checklist

Before releasing your adapter, complete this testing checklist:

- [ ] **Installation Test**
  - [ ] Fresh install works
  - [ ] Adapter appears in admin interface
  - [ ] Configuration page loads correctly

- [ ] **Functionality Test**
  - [ ] API connection successful
  - [ ] Device discovery works
  - [ ] All device types recognized
  - [ ] States created correctly
  - [ ] Device control commands work
  - [ ] Polling updates states

- [ ] **Error Handling Test**
  - [ ] Invalid credentials handled gracefully
  - [ ] Network errors don't crash adapter
  - [ ] Rate limiting works
  - [ ] Timeout handling works

- [ ] **Performance Test**
  - [ ] No memory leaks after 24h
  - [ ] API rate limits respected
  - [ ] CPU usage acceptable
  - [ ] Polling interval respected

- [ ] **Cleanup Test**
  - [ ] Adapter stops cleanly
  - [ ] No zombie processes
  - [ ] Resources released properly

- [ ] **Automated Tests**
  - [ ] `npm test` passes
  - [ ] `npm run lint` passes
  - [ ] Manual integration test passes

- [ ] **Documentation Test**
  - [ ] README accurate
  - [ ] Configuration instructions clear
  - [ ] All features documented

---

## Uninstalling ioBroker

If you want to completely remove ioBroker and restore your system to its previous state:

### Complete Removal

```bash
# 1. Stop ioBroker
cd /opt/iobroker
iobroker stop

# 2. Remove ioBroker directory
sudo rm -rf /opt/iobroker

# 3. Remove ioBroker systemd service (if it was created)
sudo systemctl stop iobroker
sudo systemctl disable iobroker
sudo rm -f /etc/systemd/system/iobroker.service
sudo systemctl daemon-reload

# 4. Remove ioBroker user and group (if they were created)
sudo userdel iobroker 2>/dev/null
sudo groupdel iobroker 2>/dev/null

# 5. Clean up npm cache
npm cache clean --force

# 6. Remove global npm packages (if ioBroker installed any)
npm ls -g --depth=0 | grep iobroker
# Manually remove any found with: npm uninstall -g <package-name>

# 7. Remove log files and temporary data
sudo rm -rf /var/log/iobroker
sudo rm -rf /tmp/iobroker*

# 8. Remove any remaining configuration
rm -rf ~/.iobroker
```

### Optional: Remove Node.js (if installed only for ioBroker)

```bash
# If you installed Node.js via apt (NodeSource)
sudo apt remove -y nodejs
sudo apt autoremove -y
sudo rm -rf /etc/apt/sources.list.d/nodesource.list
sudo apt update

# If you installed Node.js via nvm
nvm deactivate
nvm uninstall 20
rm -rf ~/.nvm
# Also remove nvm lines from ~/.bashrc

# Clean up build tools (if installed only for ioBroker)
sudo apt remove -y build-essential python3-dev libavahi-compat-libdnssd-dev
sudo apt autoremove -y
```

### Verify Clean System

```bash
# Check if ioBroker directory is gone
ls /opt/iobroker
# Should show: ls: cannot access '/opt/iobroker': No such file or directory

# Check for running ioBroker processes
ps aux | grep iobroker
# Should show only the grep command itself

# Check for systemd service
systemctl status iobroker
# Should show: Unit iobroker.service could not be found

# Check global npm packages
npm ls -g --depth=0 | grep iobroker
# Should show nothing

# Check disk space freed
df -h /opt
```

### Partial Removal (Keep Node.js and Build Tools)

If you want to keep Node.js and build tools for other projects:

```bash
# Stop and remove only ioBroker
cd /opt/iobroker
iobroker stop
sudo rm -rf /opt/iobroker
sudo rm -f /etc/systemd/system/iobroker.service
sudo systemctl daemon-reload

# Clean npm cache
npm cache clean --force

# That's it! Node.js and build tools remain installed
```

### Quick Clean Reinstall

If you want to start fresh with a new ioBroker installation:

```bash
# Remove current installation
cd /opt/iobroker
iobroker stop
sudo rm -rf /opt/iobroker

# Reinstall
sudo mkdir -p /opt/iobroker
sudo chown -R $USER:$USER /opt/iobroker
cd /opt/iobroker
curl -sLf https://iobroker.net/install.sh | bash -
```

---

## Additional Resources

- [ioBroker Documentation](https://www.iobroker.net/#en/documentation)
- [ioBroker Adapter Development](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterdev.md)
- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [SwitchBot API Documentation](https://github.com/OpenWonderLabs/SwitchBotAPI)

---

*Last Updated: November 2025*
