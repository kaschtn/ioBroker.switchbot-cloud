# Development Container Setup for ioBroker Adapter

This guide describes the optimal setup for developing and testing the switchbot-cloud adapter using WSL, Ubuntu, VS Code, and Dev Containers.

---

## 📋 Table of Contents

1. [Benefits of Dev Container Setup](#benefits-of-dev-container-setup)
2. [Prerequisites](#prerequisites)
3. [Dev Container Configuration](#dev-container-configuration)
4. [Docker Compose Setup](#docker-compose-setup)
5. [VS Code Configuration](#vs-code-configuration)
6. [Development Workflow](#development-workflow)
7. [Debugging Setup](#debugging-setup)
8. [Testing Workflow](#testing-workflow)
9. [Tips & Tricks](#tips--tricks)

---

## Benefits of Dev Container Setup

### ✅ Why Dev Container?

- **Isolated Environment**: Each project has its own container environment
- **Reproducibility**: All developers work in identical environment
- **Fast Setup**: New developers ready in minutes
- **No System Pollution**: Host system stays clean
- **Integrated ioBroker**: ioBroker runs directly in container
- **Live Testing**: Code changes instantly testable in ioBroker
- **Git in Container**: Version control directly in dev container

---

## Prerequisites

### 1. Windows System

- **Windows 10/11** with WSL2
- **Docker Desktop** for Windows
- **VS Code** installed

### 2. WSL2 Setup

```powershell
# In PowerShell (Administrator)
wsl --install
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu-22.04
```

### 3. Docker Desktop

Download and installation from: https://www.docker.com/products/docker-desktop

**Important Docker Desktop Settings:**
- ✅ Enable "Use the WSL 2 based engine"
- ✅ "Resources" → "WSL Integration" → Enable Ubuntu-22.04

### 4. VS Code Extensions

Install the following extensions:

```bash
# In VS Code
# 1. Remote - Containers (ms-vscode-remote.remote-containers)
# 2. Remote - WSL (ms-vscode-remote.remote-wsl)
# 3. Docker (ms-azuretools.vscode-docker)
# 4. ESLint (dbaeumer.vscode-eslint)
# 5. GitLens (eamodio.gitlens)
```

---

## Dev Container Configuration

### File Structure

```
.devcontainer/
├── devcontainer.json       # Dev Container configuration
├── docker-compose.yml      # Multi-container setup
├── Dockerfile.dev          # Development container
└── init-iobroker.sh        # ioBroker initialization
```

### 1. `.devcontainer/devcontainer.json`

```json
{
  "name": "ioBroker SwitchBot Cloud Adapter Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "adapter-dev",
  "workspaceFolder": "/workspace",
  
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true
        },
        "eslint.validate": [
          "javascript"
        ],
        "files.eol": "\n",
        "files.trimTrailingWhitespace": true
      },
      
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "eamodio.gitlens",
        "ms-azuretools.vscode-docker",
        "github.copilot"
      ]
    }
  },
  
  "features": {
    "ghcr.io/devcontainers/features/git:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {
      "version": "latest"
    }
  },
  
  "forwardPorts": [
    8081,  // ioBroker Admin
    8082   // ioBroker Web (optional)
  ],
  
  "postCreateCommand": "npm install",
  
  "remoteUser": "node",
  
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/node/.ssh,readonly,type=bind",
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.gitconfig,target=/home/node/.gitconfig,readonly,type=bind"
  ]
}
```

### 2. `.devcontainer/docker-compose.yml`

```yaml
version: '3.8'

services:
  adapter-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      # Mount entire project
      - ..:/workspace:cached
      # Separate node_modules for better performance
      - node_modules:/workspace/node_modules
      # ioBroker data persistent
      - iobroker-data:/opt/iobroker
      # SSH keys for Git
      - ~/.ssh:/home/node/.ssh:ro
    environment:
      - NODE_ENV=development
      - DEBUG=*
    ports:
      - "8081:8081"  # Admin interface
      - "8082:8082"  # Web interface
      - "9229:9229"  # Node.js debugger
    networks:
      - iobroker-network
    command: sleep infinity
    
  # Optional: Separate ioBroker container for production tests
  iobroker-test:
    image: buanet/iobroker:latest
    container_name: iobroker-test
    hostname: iobroker-test
    restart: unless-stopped
    ports:
      - "8091:8081"  # Admin on different port
    volumes:
      - iobroker-test-data:/opt/iobroker
      - ..:/adapter:ro  # Adapter as read-only
    networks:
      - iobroker-network
    profiles:
      - testing  # Only start with: docker-compose --profile testing up

volumes:
  node_modules:
  iobroker-data:
  iobroker-test-data:

networks:
  iobroker-network:
    driver: bridge
```

### 3. `.devcontainer/Dockerfile.dev`

```dockerfile
FROM node:20-bullseye

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-dev \
    libavahi-compat-libdnssd-dev \
    git \
    curl \
    vim \
    nano \
    acl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Node user setup
RUN usermod -aG sudo node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ioBroker installation
RUN mkdir -p /opt/iobroker && \
    chown -R node:node /opt/iobroker

USER node
WORKDIR /opt/iobroker

# Install ioBroker
RUN npm install iobroker --unsafe-perm && \
    cd /opt/iobroker && \
    npm install --production --unsafe-perm

# Prepare workspace
WORKDIR /workspace

# Global npm packages for development
RUN npm install -g \
    eslint \
    prettier \
    mocha \
    nodemon

EXPOSE 8081 8082 9229

CMD ["bash"]
```

### 4. `.devcontainer/init-iobroker.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Initializing ioBroker..."

# ioBroker setup (if not already done)
if [ ! -f "/opt/iobroker/iobroker" ]; then
    cd /opt/iobroker
    npm install iobroker --unsafe-perm
    npm install --production --unsafe-perm
    node node_modules/iobroker.js-controller/controller.js setup first
fi

# Start ioBroker
echo "▶️  Starting ioBroker..."
cd /opt/iobroker
iobroker start

# Wait until ioBroker is running
echo "⏳ Waiting for ioBroker to start..."
sleep 10

# Link adapter from workspace
echo "🔗 Linking adapter from workspace..."
cd /opt/iobroker
npm link /workspace

# Upload adapter
echo "📤 Uploading adapter..."
iobroker upload switchbot-cloud

echo "✅ ioBroker initialized and adapter linked!"
echo ""
echo "📊 Access Admin Interface: http://localhost:8081"
echo "📝 Run: iobroker add switchbot-cloud (to create instance)"
echo ""
```

---

## VS Code Configuration

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript"
  ],
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/package-lock.json": true,
    "**/.devcontainer": false
  },
  "terminal.integrated.defaultProfile.linux": "bash"
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Adapter in ioBroker",
      "runtimeExecutable": "iobroker",
      "runtimeArgs": ["debug", "switchbot-cloud"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Tests",
      "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
      "args": [
        "--timeout",
        "30000",
        "test/**/*.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Manual Integration Test",
      "program": "${workspaceFolder}/test/manual-integration.js",
      "env": {
        "IOBROKER_HOST": "localhost",
        "IOBROKER_PORT": "8081"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Upload Adapter",
      "type": "shell",
      "command": "iobroker upload switchbot-cloud",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Restart Adapter",
      "type": "shell",
      "command": "iobroker restart switchbot-cloud",
      "problemMatcher": []
    },
    {
      "label": "Upload and Restart",
      "dependsOn": ["Upload Adapter", "Restart Adapter"],
      "problemMatcher": []
    },
    {
      "label": "Start ioBroker",
      "type": "shell",
      "command": "cd /opt/iobroker && iobroker start",
      "problemMatcher": []
    },
    {
      "label": "Watch Logs",
      "type": "shell",
      "command": "iobroker logs switchbot-cloud --watch",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm test",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "problemMatcher": []
    },
    {
      "label": "Lint",
      "type": "shell",
      "command": "npm run lint",
      "problemMatcher": ["$eslint-stylish"]
    }
  ]
}
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository in WSL
cd ~
git clone https://github.com/kaschtn/ioBroker.switchbot-cloud.git
cd ioBroker.switchbot-cloud

# 2. Open VS Code in WSL
code .

# 3. Open Dev Container
# VS Code: F1 → "Remote-Containers: Reopen in Container"
# Or: Click on green icon in bottom left → "Reopen in Container"
```

### After Container Start

```bash
# In container terminal:

# 1. Initialize ioBroker
cd /opt/iobroker
bash /workspace/.devcontainer/init-iobroker.sh

# 2. Create adapter instance
iobroker add switchbot-cloud

# 3. Open Admin interface
# Browser: http://localhost:8081

# 4. Configure adapter
# Admin → Instances → switchbot-cloud → Configuration
# Enter token and secret, save
```

### Daily Workflow

```bash
# 1. Edit code in VS Code
# Files are automatically synchronized in container

# 2. After changes: Upload to ioBroker
iobroker upload switchbot-cloud

# 3. Restart adapter
iobroker restart switchbot-cloud

# 4. Monitor logs
iobroker logs switchbot-cloud --watch

# Or: Use VS Code task (Ctrl+Shift+B)
# → "Upload and Restart"
```

### Quick Code-Test Iteration

```bash
# Terminal 1: Show logs live
iobroker logs switchbot-cloud --watch

# Terminal 2: Auto-upload on changes (with nodemon)
nodemon --watch /workspace --ext js,json \
  --exec "iobroker upload switchbot-cloud && iobroker restart switchbot-cloud"
```

---

## Debugging Setup

### Using VS Code Debugger

1. **Set breakpoints**: Set breakpoints in code in VS Code
2. **Start debug**: Press F5 or "Run and Debug" → "Debug Adapter in ioBroker"
3. **Inspect code**: Variables, call stack, etc. visible in VS Code

### Alternative: Chrome DevTools

```bash
# Start adapter in debug mode
iobroker debug switchbot-cloud

# Open Chrome: chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### Logs with Debug Level

```bash
# Enable debug logging
iobroker set switchbot-cloud.0 --logLevel debug
iobroker restart switchbot-cloud

# Show logs
iobroker logs switchbot-cloud --watch
```

---

## Testing Workflow

### Automated Tests in Container

```bash
# Run all tests
npm test

# Individual test suites
npm run test:package
npm run test:unit
npm run test:integration

# Linting
npm run lint
npm run lint:fix

# With VS Code tasks (Ctrl+Shift+P)
# → "Tasks: Run Test Task"
```

### Manual Integration Tests

```bash
# In container
node test/manual-integration.js

# With live ioBroker instance
IOBROKER_HOST=localhost IOBROKER_PORT=8081 \
  node test/manual-integration.js
```

### Testing with Separate ioBroker Container

```bash
# In new terminal (outside dev container)
cd /mnt/c/tmp/SB\ API/iobroker-switchbot

# Start test container
docker-compose --profile testing up -d iobroker-test

# Install adapter in test container
docker exec -it iobroker-test bash
cd /opt/iobroker
npm install /adapter
iobroker upload switchbot-cloud
iobroker add switchbot-cloud

# Open test admin: http://localhost:8091
```

---

## Tips & Tricks

### Performance Optimization

**1. node_modules as Volume:**
```yaml
# Already configured in docker-compose.yml
volumes:
  - node_modules:/workspace/node_modules
```

**2. Git Performance:**
```bash
# In container
git config --global core.fsmonitor true
git config --global core.untrackedCache true
```

**3. VS Code Settings Sync:**
```json
// In devcontainer.json
"mounts": [
  "source=${localEnv:HOME}/.vscode,target=/home/node/.vscode,type=bind"
]
```

### Useful Aliases

```bash
# In container: ~/.bashrc or ~/.bash_aliases

alias iob='iobroker'
alias iob-up='iobroker upload switchbot-cloud'
alias iob-restart='iobroker restart switchbot-cloud'
alias iob-logs='iobroker logs switchbot-cloud --watch'
alias iob-debug='iobroker set switchbot-cloud.0 --logLevel debug && iobroker restart switchbot-cloud'
alias iob-update='iobroker upload switchbot-cloud && iobroker restart switchbot-cloud'

# Quick test cycle
alias test-cycle='npm run lint && npm test && iob-update'
```

### Multi-Container Setup for Different Node Versions

```yaml
# In docker-compose.yml
services:
  adapter-dev-node18:
    build:
      context: .
      dockerfile: Dockerfile.dev
      args:
        NODE_VERSION: "18"
    # ... rest of config
    
  adapter-dev-node20:
    build:
      context: .
      dockerfile: Dockerfile.dev
      args:
        NODE_VERSION: "20"
    ports:
      - "8181:8081"  # Different port
```

### Git Workflow in Container

```bash
# Git is already configured in container
# SSH keys are mounted (read-only)

# Normal workflow
git status
git add .
git commit -m "feat: new feature"
git push

# Switch branch
git checkout -b feature/new-feature

# Use VS Code Source Control
# Ctrl+Shift+G
```

### Rebuild Container

```bash
# When Dockerfile changes
# In VS Code: F1 → "Remote-Containers: Rebuild Container"

# Or manually:
docker-compose -f .devcontainer/docker-compose.yml build --no-cache
```

### Test Multiple ioBroker Instances

```bash
# Test different adapter versions in parallel
docker-compose up -d adapter-dev iobroker-test

# Dev on port 8081
# Test on port 8091

# Both with their own data volume
```

### Backup & Restore

```bash
# Create ioBroker backup
iobroker backup

# Copy backup from container
docker cp devcontainer-adapter-dev-1:/opt/iobroker/backups ./backups/

# Restore
iobroker restore <backup-name>
```

---

## Common Issues

### Container Won't Start

```bash
# Check Docker logs
docker-compose -f .devcontainer/docker-compose.yml logs

# Rebuild container
docker-compose -f .devcontainer/docker-compose.yml build --no-cache
```

### Port Already in Use

```bash
# Check which process uses port 8081
sudo lsof -i :8081

# Change port in docker-compose.yml
# "8081:8081" → "8181:8081"
```

### Performance Issues

```bash
# Set WSL2 memory limit
# In Windows: %USERPROFILE%\.wslconfig

[wsl2]
memory=4GB
processors=2
```

### ioBroker Won't Start

```bash
# In container
cd /opt/iobroker
iobroker status
iobroker fix
iobroker start
```

---

## Recommended Workflow Summary

```
1. Open VS Code → Start Dev Container
   ↓
2. Edit code in VS Code
   ↓
3. Ctrl+Shift+B → "Upload and Restart"
   ↓
4. Watch logs (automatically in terminal)
   ↓
5. Test Admin Interface (http://localhost:8081)
   ↓
6. Run tests (npm test)
   ↓
7. Commit & Push (directly in container)
```

---

## Additional Resources

- [VS Code Dev Containers](https://code.visualstudio.com/docs/remote/containers)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ioBroker Development](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterdev.md)
- [WSL2 Best Practices](https://docs.microsoft.com/en-us/windows/wsl/compare-versions)

---

*Last Update: November 2025*
