# Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ## **WORK IN PROGRESS**
-->

## **WORK IN PROGRESS**

- (kaschtn) **FIXED**: Removed unsupported `required` properties from admin jsonConfig fields to resolve invalid jsonConfig warnings in admin logs.
- (kaschtn) **FIXED**: Poll interval changes from Admin are now applied at runtime and the polling timer is restarted with the updated value.
- (kaschtn) **ENHANCED**: Added safe startup/config-update diagnostics for effective poll interval without exposing credentials.

## 0.1.3 (2026-09-04)

### Fixed
- Corrected the release versioning and ensured the project metadata matches the intended release tag.
- Kept the runtime polling interval fix and admin config validation aligned with the current release state.

### Enhanced
- Preserved the develop-first dependency workflow and updated release governance.
- Refreshed the patch dependency set and lockfile consistency.

## 0.1.1 (2026-09-04)

### Fixed
- Fixed runtime handling of the polling interval so changes made in the Admin UI are applied without restarting the adapter.
- Resolved invalid JSON config warnings caused by unsupported schema properties.
- Improved configuration diagnostics to log effective values without exposing secrets.

### Enhanced
- Added a clearer develop-focused dependency update workflow and bot PR policy.
- Updated the CI workflow to better separate develop validation from release checks.
- Refreshed patch-level dependency versions and lockfile consistency.

## 0.1.0 (2025-12-01)

### Features
- Initial release of SwitchBot adapter for ioBroker
- Full support for SwitchBot API v1.1 with improved authentication
- Support for physical devices:
  - Bot (press, turn on/off)
  - Curtain/Curtain 3 (open/close, position control)
  - Lock/Lock Pro/Lock Ultra (lock/unlock)
  - Meter/Meter Plus/Outdoor Meter (temperature, humidity monitoring)
  - Plug/Plug Mini (power control, energy monitoring)
  - Color Bulb (power, brightness, color, color temperature)
  - Strip Light (power, brightness, color)
  - Humidifier (power, mode control)
  - Motion Sensor (motion detection, brightness)
  - Contact Sensor (door/window state, motion)
- Support for infrared remote devices (TV, AC, Light, Fan, etc.)
- Comprehensive error handling with automatic retry logic
- Rate limiting to respect API quotas (10,000 requests/day)
- Configurable polling interval (minimum 10 seconds)
- Multi-language admin interface (English, German)
- Connection testing functionality
- Real-time device status updates
- Proper ioBroker object structure with roles and units

### Technical Details
- HMAC-SHA256 authentication with nonce and timestamp
- Exponential backoff retry mechanism
- Safe JSON parsing and async operation handling
- Memory-efficient device state management
- Proper cleanup on adapter shutdown
- Debug logging for troubleshooting

### Requirements
- Node.js >= 18
- ioBroker >= 3.3.22
- SwitchBot app version 6.14 or later
- Valid SwitchBot API credentials (token and secret)
- Cloud Service enabled for BLE devices