# Release Guide for ioBroker SwitchBot Adapter

This guide explains the complete process for versioning, building, and releasing the SwitchBot adapter to NPM and the ioBroker repository.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Versioning Strategy](#versioning-strategy)
3. [Pre-Release Checklist](#pre-release-checklist)
4. [Release Process](#release-process)
5. [Post-Release Steps](#post-release-steps)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)

---

## 🔑 Prerequisites

### Required Accounts & Tokens

Before you can release the adapter, ensure you have:

#### 1. NPM Account Setup

- **NPM Account:** Register at https://www.npmjs.com
- **NPM Access Token:**
  1. Log in to NPM
  2. Go to: Avatar → Access Tokens
  3. Generate New Token → Classic Token
  4. Select **"Automation"** as token type
  5. Copy the token (starts with `npm_`)

#### 2. GitHub Repository Setup

- **Repository Access:** Write/Admin access to the repository
- **GitHub Secrets:** Configure in repository settings
  - `NPM_TOKEN`: Your NPM automation token
  - `GITHUB_TOKEN`: Automatically provided by GitHub

**To add NPM_TOKEN secret:**
1. Go to: Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Your NPM token
5. Click "Add secret"

#### 3. Development Environment

- **Node.js:** >= 18.x installed
- **Git:** Configured with your credentials
- **npm:** Latest version recommended

```bash
# Verify your setup
node --version    # Should be >= 18
npm --version     # Should be >= 9
git --version     # Any recent version

# Verify git configuration
git config user.name
git config user.email
```

---

## 📊 Versioning Strategy

The adapter follows [Semantic Versioning](https://semver.org/) (SemVer):

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

### Examples

| Change | Current | New | Command |
|--------|---------|-----|---------|
| Bug fix | 0.9.0 | 0.9.1 | `npm run release-patch` |
| New feature | 0.9.0 | 0.10.0 | `npm run release-minor` |
| Breaking change | 0.9.0 | 1.0.0 | `npm run release-major` |

### Pre-Release Versions

For testing before official release:

```bash
# Create beta version: 0.9.0-beta.1
npm run release -- --prerelease beta

# Create release candidate: 0.9.0-rc.1
npm run release -- --prerelease rc
```

### Version Synchronization

The adapter uses `@alcalzone/release-script` which automatically synchronizes versions across:

- ✅ `package.json` → `version`
- ✅ `io-package.json` → `common.version`
- ✅ `io-package.json` → `common.news`
- ✅ `README.md` → changelog entries
- ✅ `CHANGELOG.md` → version headers

**Never manually edit version numbers!** Always use the release script.

---

## ✅ Pre-Release Checklist

Before creating a release, complete this checklist:

### 1. Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Verify no linting errors remain
npm run lint
```

### 2. Testing

```bash
# Run complete test suite
npm test

# Individual test runs
npm run test:package      # Package validation
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
```

**All tests must pass before releasing!**

### 3. Update Documentation

#### Update CHANGELOG.md

Add changes under `## **WORK IN PROGRESS**` section:

```markdown
## **WORK IN PROGRESS**

- (yourname) **NEW**: Added support for new device type XYZ
- (yourname) **FIXED**: Corrected polling interval issue (fixes #123)
- (yourname) **ENHANCED**: Improved error messages for API failures
```

**Change Types:**
- `**NEW**`: New features
- `**FIXED**`: Bug fixes
- `**ENHANCED**`: Improvements
- `**BREAKING**`: Breaking changes

**Important:** 
- Reference GitHub issues: `(fixes #123)` or `(closes #456)`
- Use user-friendly language
- Focus on impact, not implementation details

#### Update README.md

If needed, update:
- Feature list
- Supported devices
- Configuration examples
- Prerequisites

### 4. Version Verification

Check current version:

```bash
# View current version
npm version

# Or check package.json
grep '"version"' package.json
```

### 5. Branch Status

```bash
# Ensure you're on develop branch
git branch --show-current

# Pull latest changes
git pull origin develop

# Check for uncommitted changes
git status

# Commit any pending changes
git add .
git commit -m "chore: prepare release"
```

### 6. Dependency Check

```bash
# Check for outdated dependencies
npm outdated

# Update if needed (in separate PR)
npm update
npm audit fix
```

---

## 🚀 Release Process

### Step 1: Prepare Development Branch

```bash
# Ensure you're on develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Verify all changes are committed
git status
```

### Step 2: Run Release Script

The release script will:
1. Prompt you for the new version
2. Update all version numbers
3. Convert `## **WORK IN PROGRESS**` to actual version
4. Update `io-package.json` news section
5. Create git commit
6. Create git tag
7. Push to GitHub

#### Interactive Release (Recommended)

```bash
# Run release script interactively
npm run release
```

The script will ask:
1. **Version type:** Select patch/minor/major or enter custom version
2. **Confirmation:** Review changes and confirm

#### Automated Release

```bash
# Patch release (0.9.0 → 0.9.1)
npm run release-patch

# Minor release (0.9.0 → 0.10.0)
npm run release-minor

# Major release (0.9.0 → 1.0.0)
npm run release-major
```

### Step 3: Merge to Main Branch

After successful release on develop:

```bash
# Switch to main branch
git checkout main

# Pull latest
git pull origin main

# Merge develop into main
git merge develop

# Push to GitHub (this triggers deployment)
git push origin main

# Push tags
git push origin --tags
```

### Step 4: Monitor GitHub Actions

1. Go to: https://github.com/kaschtn/ioBroker.switchbot-cloud/actions
2. Watch the "Test and Release" workflow
3. Verify all jobs complete successfully:
   - ✅ check-and-lint
   - ✅ adapter-tests (9 combinations: 3 Node versions × 3 OS)
   - ✅ deploy (publishes to NPM)

**Expected duration:** 10-20 minutes

### Step 5: Verify NPM Publication

```bash
# Check NPM package
npm view iobroker.switchbot-cloud

# Check specific version
npm view iobroker.switchbot-cloud@0.9.0

# Visit NPM website
# https://www.npmjs.com/package/iobroker.switchbot-cloud
```

### Step 6: Verify GitHub Release

1. Go to: https://github.com/kaschtn/ioBroker.switchbot-cloud/releases
2. Verify release was created with:
   - Correct version tag (e.g., `v0.9.0`)
   - Release notes from CHANGELOG
   - Attached assets (if any)

---

## 📝 Post-Release Steps

### 1. Add to ioBroker Repository

For the adapter to appear in ioBroker's official adapter list:

#### Create Pull Request to ioBroker.repositories

1. **Fork the repositories repository:**
   - Go to: https://github.com/ioBroker/ioBroker.repositories
   - Click "Fork"

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ioBroker.repositories.git
   cd ioBroker.repositories
   ```

3. **Add adapter to latest repository:**
   
   Edit `sources-dist.json` (for latest/beta) or `sources-dist-stable.json` (for stable):
   
   ```json
   {
     "switchbot": {
       "meta": "https://raw.githubusercontent.com/kaschtn/ioBroker.switchbot-cloud/main/io-package.json",
       "icon": "https://raw.githubusercontent.com/kaschtn/ioBroker.switchbot-cloud/main/admin/switchbot.png",
       "type": "hardware"
     }
   }
   ```

4. **Commit and push:**
   ```bash
   git add sources-dist.json
   git commit -m "Add ioBroker.switchbot-cloud adapter"
   git push origin main
   ```

5. **Create Pull Request:**
   - Go to your fork on GitHub
   - Click "Contribute" → "Open pull request"
   - Title: `Add switchbot adapter`
   - Description: Link to your adapter repository and NPM package
   - Submit PR

6. **Wait for review:**
   - ioBroker team will review your PR
   - Address any feedback
   - Once merged, adapter will appear in ioBroker admin

**First Release:** Add to `sources-dist.json` (latest repository)
**Stable Release:** After community testing, add to `sources-dist-stable.json`

### 2. Announce Release

Consider announcing the release:

- **ioBroker Forum:** https://forum.iobroker.net/
- **GitHub Discussions:** In your repository
- **Discord/Telegram:** ioBroker community channels

### 3. Monitor Issues

After release:
- Watch for new GitHub issues
- Monitor NPM downloads
- Check ioBroker forum for feedback
- Be prepared for hotfixes

### 4. Update Development Branch

```bash
# Switch back to develop
git checkout develop

# Ensure develop is in sync with main
git merge main
git push origin develop
```

---

## 🐛 Troubleshooting

### Common Release Issues

#### Issue: Release script fails with "Working directory not clean"

**Solution:**
```bash
# Check what's uncommitted
git status

# Commit or stash changes
git add .
git commit -m "chore: prepare release"

# Or stash changes
git stash
```

#### Issue: NPM publish fails - "401 Unauthorized"

**Solution:**
```bash
# Verify NPM token is set correctly in GitHub secrets
# Go to: Repository → Settings → Secrets → NPM_TOKEN

# Test locally (not recommended for production)
npm login
npm publish
```

#### Issue: GitHub Actions workflow doesn't trigger

**Possible causes:**
1. **Commit message contains `[skip ci]`** - Remove it
2. **Tag not pushed:** 
   ```bash
   git push origin --tags
   ```
3. **Workflow file has syntax errors:**
   ```bash
   # Validate YAML syntax
   yamllint .github/workflows/test-and-release.yml
   ```

#### Issue: Tests fail in CI but pass locally

**Solution:**
```bash
# Test with clean environment
rm -rf node_modules package-lock.json
npm install
npm test

# Test with different Node versions
nvm use 18
npm test
nvm use 20
npm test
```

#### Issue: Version already exists on NPM

**Solution:**
```bash
# Increment version again
npm run release-patch

# Or manually specify next version
npm run release -- 0.9.2
```

#### Issue: Merge conflicts when merging to main

**Solution:**
```bash
# On main branch
git merge develop

# Resolve conflicts manually
# Edit conflicted files
git add .
git commit -m "chore: merge develop to main"
```

---

## 🔄 Rollback Procedure

If a release has critical issues:

### 1. Deprecate NPM Version (Preferred)

```bash
# Deprecate the bad version
npm deprecate iobroker.switchbot-cloud@0.9.1 "Critical bug, please use 0.9.2"

# Release fixed version
npm run release-patch
```

### 2. Unpublish from NPM (Within 72 hours)

**Warning:** Only possible within 72 hours of publishing!

```bash
# Unpublish specific version
npm unpublish iobroker.switchbot-cloud@0.9.1

# NEVER unpublish all versions
# npm unpublish iobroker.switchbot-cloud --force  # DON'T DO THIS
```

### 3. Revert Git Tag

```bash
# Delete local tag
git tag -d v0.9.1

# Delete remote tag
git push origin :refs/tags/v0.9.1

# Delete GitHub release via web interface
# Go to: Releases → Edit → Delete release
```

### 4. Revert Commits

```bash
# If commits need to be reverted
git revert HEAD
git push origin main

# Or reset (dangerous, only if not public yet)
git reset --hard HEAD~1
git push origin main --force
```

---

## 📊 Release Checklist Summary

Print this checklist for each release:

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] CHANGELOG.md updated under `## **WORK IN PROGRESS**`
- [ ] README.md updated (if needed)
- [ ] All changes committed
- [ ] On develop branch
- [ ] Pulled latest changes
- [ ] Run `npm run release` (or release-patch/minor/major)
- [ ] Review and confirm version
- [ ] Switch to main: `git checkout main`
- [ ] Merge develop: `git merge develop`
- [ ] Push main: `git push origin main`
- [ ] Push tags: `git push origin --tags`
- [ ] Monitor GitHub Actions workflow
- [ ] Verify NPM publication
- [ ] Verify GitHub release created
- [ ] Create PR to ioBroker.repositories (first release)
- [ ] Announce release (optional)
- [ ] Monitor for issues

---

## 🛠️ Configuration Files

### .releaseconfig.json

```json
{
  "plugins": ["iobroker"],
  "all": true,
  "github": {
    "enabled": true,
    "draft": false,
    "prerelease": false
  },
  "numChangelogEntries": 5,
  "numNews": 7,
  "addPlaceholder": true
}
```

**Settings explained:**
- `plugins`: Uses ioBroker-specific plugin
- `all`: Updates all version references
- `github.enabled`: Creates GitHub releases
- `numChangelogEntries`: Number of changes in README
- `numNews`: Number of entries in io-package.json news
- `addPlaceholder`: Re-adds `## **WORK IN PROGRESS**` after release

### package.json Scripts

```json
{
  "scripts": {
    "release": "release-script",
    "release-patch": "release-script patch --yes",
    "release-minor": "release-script minor --yes",
    "release-major": "release-script major --yes"
  }
}
```

---

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [AlCalzone Release Script](https://github.com/AlCalzone/release-script)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [ioBroker Adapter Development](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterdev.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 💡 Best Practices

1. **Always test before releasing** - Run full test suite
2. **Use semantic versioning** - Follow SemVer strictly
3. **Keep changelog updated** - Add entries for every change
4. **Release often** - Small, frequent releases are better
5. **Monitor after release** - Watch for issues in first 24 hours
6. **Communicate breaking changes** - Clearly document in changelog
7. **Use pre-releases** - For testing major changes
8. **Never force push tags** - Once public, tags are permanent
9. **Document everything** - Update README and docs
10. **Backup before major releases** - Tag stable versions

---

*Last Updated: November 2025*
