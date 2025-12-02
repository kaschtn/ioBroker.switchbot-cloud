# Pre-Publication Checklist for ioBroker.switchbot-cloud

**Adapter Version:** 0.1.0  
**Last Updated:** December 2, 2025  
**Status:** Pre-release preparation

---

## Critical Path (Must Complete Before Publishing)

### 🔴 **Blocking Issues - Fix Immediately**

1. **Fix Chai ES Module compatibility**
   - **Issue:** Chai 6.x is ES Module only, incompatible with CommonJS `require()`
   - **Solution Option 1:** Downgrade to Chai 4.x: `npm install --save-dev chai@^4.5.0`
   - **Solution Option 2:** Convert test/unit.js to ES modules (.mjs with import statements)
   - **Priority:** HIGH - Blocks test execution
   - **Files:** test/unit.js, package.json

2. **Fix all linting errors**
   - **Command:** `npm run lint`
   - **Status:** Currently failing (exit code 1)
   - **Action:** Review and fix all ESLint errors
   - **Priority:** HIGH - Must pass before release

3. **Ensure all tests pass**
   - **Command:** `npm run test`
   - **Expected:** Exit code 0
   - **Blocked by:** Chai compatibility issue
   - **Priority:** HIGH

### 🟡 **Pre-Release Requirements**

4. **Configure NPM Trusted Publishing**
   - **Action:** Configure on npmjs.com before first release
   - **Repository:** kaschtn/ioBroker.switchbot-cloud
   - **Workflow:** test-and-release.yml
   - **Documentation:** docs/RELEASING.md
   - **Priority:** HIGH

5. **Test adapter with real SwitchBot devices**
   - **Action:** Validate with actual hardware if available
   - **Focus areas:** Device discovery, state updates, control commands
   - **Alternative:** Use demo API credentials if available
   - **Priority:** MEDIUM-HIGH

6. **Create GitHub release tag**
   - **Tag:** v0.1.0
   - **Action:** Create release on GitHub with changelog
   - **Trigger:** Will trigger NPM publish via GitHub Actions
   - **Priority:** MEDIUM

---

## Code & Structure

### ✅ **Completed**
- [x] Package structure complete (admin/, lib/, main.js, io-package.json, package.json)
- [x] Naming convention followed (lowercase "switchbot-cloud")
- [x] Icon exists as SVG (admin/switchbot.svg)

### ⏳ **In Progress**
- [ ] Fix Chai ES Module compatibility
- [ ] Fix linting errors

---

## Configuration Files

### ✅ **Completed**
- [x] io-package.json valid with all mandatory fields
- [x] package.json valid with correct metadata
- [x] Credentials encrypted (protectedNative and encryptedNative)
- [x] License information correct (MIT with type "free")
- [x] Dependencies properly declared
- [x] Node.js version requirement (>=18)

---

## Documentation

### ✅ **Completed**
- [x] README.md complete with installation and configuration
- [x] CHANGELOG.md with AlCalzone release-script format
- [x] CONTRIBUTING.md with contribution guidelines
- [x] LICENSE file (MIT)
- [x] docs/TESTING.md
- [x] docs/RELEASING.md
- [x] docs/IOBROKER-SETUP.md

### ⚠️ **Recommended Enhancements**
- [ ] Create SUPPORTED_DEVICES.md - Detailed device compatibility matrix
- [ ] Add multilingual READMEs (README_de.md, README_ru.md)
- [ ] Create FAQ section in README
- [ ] Add troubleshooting guide for common issues

---

## Testing

### ⏳ **In Progress**
- [ ] Fix Chai compatibility (blocking)
- [ ] Ensure test suite passes completely

### ⚠️ **Needs Validation**
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] Test on multiple Node.js versions (18.x, 20.x, 22.x)
- [ ] Memory leak testing (24+ hour run)
- [ ] Connection recovery testing (network interruptions)

### ✅ **Completed**
- [x] Package validation passing (`npm run test:package`)
- [x] Unit test structure in place

---

## GitHub & CI/CD

### ✅ **Completed**
- [x] GitHub repository exists (kaschtn/ioBroker.switchbot-cloud)
- [x] GitHub Actions configured (test-and-release.yml, test-develop.yml)
- [x] Dependency update workflow (dependency-updates.yml)

### ⏳ **Needs Configuration**
- [ ] NPM Trusted Publishing setup on npmjs.com
- [ ] Test GitHub Actions workflows successfully

### ❌ **Post-Fix Actions**
- [ ] Verify workflows run after fixing tests
- [ ] Create GitHub release/tag v0.1.0

---

## API & Rate Limiting

### ⚠️ **Needs Testing**
- [ ] Test rate limiting (10,000 requests/day limit respected)
- [ ] Test error recovery and retry logic
- [ ] Validate with real SwitchBot devices
- [ ] Test API authentication with demo credentials
- [ ] Verify Cloud Service integration

---

## Code Quality

### ✅ **Completed**
- [x] Error handler implemented (lib/error-handler.js)
- [x] Device manager modular (lib/device-manager.js)
- [x] SwitchBot API abstraction (lib/switchbot-api.js)

### ⏳ **In Progress**
- [ ] Fix linting errors (currently failing)

### ⚠️ **Needs Review**
- [ ] Code review of main.js for production readiness
- [ ] Review lib/device-manager.js for edge cases
- [ ] Review lib/switchbot-api.js for error handling
- [ ] Verify all API calls have proper try/catch
- [ ] Remove debug code and console.log statements
- [ ] Verify timer cleanup in unload() method

---

## Performance & Stability

### ⚠️ **Needs Testing**
- [ ] Memory leak testing (run 24+ hours, monitor memory usage)
- [ ] Connection recovery (test network interruptions)
- [ ] Timer cleanup verification (all intervals/timeouts cleared in unload())
- [ ] Poll interval validation (minimum 10 seconds enforced)
- [ ] Concurrent device update handling

---

## ioBroker Repository Submission

### ❌ **Sequential Steps - Do NOT start until critical issues resolved**

1. **Publish to NPM**
   - [ ] Fix all blocking issues first
   - [ ] Configure NPM Trusted Publishing
   - [ ] Create GitHub tag v0.1.0
   - [ ] Verify GitHub Actions publish workflow succeeds
   - [ ] Confirm package appears on npmjs.com

2. **Test NPM Installation**
   - [ ] Verify `npm install iobroker.switchbot-cloud` works
   - [ ] Test installation in clean ioBroker instance
   - [ ] Verify adapter shows in Admin interface

3. **Submit to Latest Repository**
   - [ ] Fork [ioBroker/ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories)
   - [ ] Add adapter to `sources-dist-latest.json`
   - [ ] Create Pull Request with adapter information
   - [ ] Wait for PR review and merge

4. **Community Testing Phase**
   - [ ] Collect user feedback (minimum 2-4 weeks recommended)
   - [ ] Fix reported issues
   - [ ] Release bug fix versions as needed
   - [ ] Monitor GitHub issues and forum threads

5. **Submit to Stable Repository**
   - [ ] After adapter proven stable with community usage
   - [ ] Submit PR to add to `sources-dist.json`
   - [ ] Provide evidence of stability (user reports, issue resolution)
   - [ ] Follow [stable repository requirements](https://github.com/ioBroker/ioBroker.repositories#add-a-new-adapter-to-the-stable-repository)

---

## Legal & Compliance

### ✅ **Completed**
- [x] MIT License file present
- [x] No hardcoded credentials in code

### ⚠️ **Verify**
- [ ] All dependencies compatible with MIT license
- [ ] No user data collected without consent
- [ ] Privacy policy considerations (API credentials handling)

---

## User Experience

### ⚠️ **Needs Testing**
- [ ] Configuration UI tested in Admin interface
- [ ] Error messages are user-friendly and actionable
- [ ] "Test Connection" button works in config
- [ ] Device states display correctly in Objects tab
- [ ] Control commands work as expected
- [ ] Log messages are clear and helpful

### ⚠️ **Documentation Enhancements**
- [ ] Add FAQ section with common issues:
  - How to get API credentials
  - Cloud Service requirement for BLE devices
  - Rate limiting explanations
  - Device not appearing troubleshooting
- [ ] Add screenshots of configuration UI
- [ ] Add device state examples

---

## Immediate Action Items (Priority Order)

### **This Week**
1. ✅ **Review checklist** (you are here)
2. 🔴 **Fix Chai compatibility** - Choose and implement solution
3. 🔴 **Fix linting errors** - Run `npm run lint` and resolve
4. 🔴 **Verify tests pass** - Run `npm run test`
5. 🟡 **Configure NPM Trusted Publishing** - On npmjs.com

### **Before First Release**
6. 🟡 **Test with real devices** - If hardware available
7. 🟡 **Memory leak test** - 24+ hour stability run
8. 🟡 **Code review** - Review main.js and lib/ files
9. 🟡 **Create FAQ section** - Add to README.md
10. 🟡 **Create GitHub tag v0.1.0** - Trigger release

### **Post-Release**
11. ⚪ **Monitor NPM publish** - Verify successful
12. ⚪ **Test NPM installation** - Clean install test
13. ⚪ **Submit to latest repository** - Create PR
14. ⚪ **Community engagement** - Monitor issues/forum

---

## Known Issues

### **Active Issues**
- **W173/W174 warnings:** protectedNative/encryptedNative warnings are informational false positives - configuration is correct
- **E999 error:** repo.iobroker.live infrastructure issue - not adapter problem
- **Lint failures:** Current exit code 1 - needs resolution

### **Resolved Issues**
- ✅ Build script requirement removed (pure JavaScript adapter)
- ✅ Icon format corrected (PNG → SVG)
- ✅ Ukrainian translations added
- ✅ License information format fixed
- ✅ NPM Trusted Publishing configured in workflow

---

## Success Criteria for v0.1.0 Release

- [ ] All tests passing (exit code 0)
- [ ] Linting passing (exit code 0)
- [ ] NPM Trusted Publishing configured
- [ ] Package validation clean
- [ ] Real device testing completed (or demo credentials validated)
- [ ] GitHub tag v0.1.0 created
- [ ] NPM package published successfully
- [ ] Installation from NPM verified
- [ ] Admin UI configuration tested

---

## Resources

- **ioBroker Docs:** https://github.com/ioBroker/ioBroker.docs
- **Repository Guide:** https://github.com/ioBroker/ioBroker.repositories
- **Adapter Dev Guide:** https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterdev.md
- **Adapter Reference:** https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterref.md
- **Release Script:** https://github.com/AlCalzone/release-script
- **Project Repository:** https://github.com/kaschtn/ioBroker.switchbot-cloud

---

## Notes

- **Version Status:** 0.1.0 (pre-release)
- **Target Audience:** ioBroker users with SwitchBot devices
- **Tier:** 3 (community adapter)
- **Support:** GitHub Issues and ioBroker Forum
- **Minimum ioBroker Version:** js-controller >=5.0.19, admin >=5.1.13
- **Node.js Requirement:** >=18

---

**Legend:**
- ✅ Completed
- ⏳ In Progress  
- ⚠️ Needs Attention
- ❌ Not Started
- 🔴 HIGH Priority (Blocking)
- 🟡 MEDIUM Priority (Important)
- ⚪ LOW Priority (Nice to have)

---

*This checklist should be updated as tasks are completed. Remove this file after successful publication to stable repository.*
