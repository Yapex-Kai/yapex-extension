# YAPEX Chrome Extension

A Chrome extension for YAPEX, the secondary marketplace for Kaito voting.

## Purpose

This extension:
- Monitors Kaito-related pages (https://yaps.kaito.ai/connect/*)
- Captures specific API requests/responses related to Kaito projects and votes
- Securely transmits this data to the YAPEX backend
- Enables YAPEX to provide a seamless secondary marketplace experience

## Installation

### For Development

1. Clone this repository
2. Open `config.js` and update the configuration values
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top right)
5. Click "Load unpacked" and select the directory containing this extension
6. The YAPEX extension should now be installed and active

### For Production Use

1. Download the extension from the Chrome Web Store (link to be added)
2. Click to install
3. The extension is now ready to use

## Configuration

Before using the extension, update the following values in `config.js`:

```javascript
// Replace these values with your actual configuration
const CONFIG = {
  YAPEX_BACKEND_URL: "https://api.yapex.io",  // Your actual backend URL
  ENCRYPT_KEY: "your-encryption-key-here",    // Your actual encryption key
  // Other configuration options...
};
```

## How It Works

1. The extension activates only on Kaito-related pages
2. It monitors requests to specific Kaito API endpoints
3. When a monitored request occurs, it:
   - Captures relevant request headers
   - Captures the response body
   - Encrypts the data
   - Sends the encrypted data to the YAPEX backend

## Extension Detection

Websites can detect if the YAPEX extension is installed by using either:

1. **DOM Detection**:
```javascript
const isInstalled = !!document.getElementById('yapex-extension-installed');
```

2. **Message Passing**:
```javascript
window.postMessage({ action: 'detectYapexExtension' }, '*');

window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'yapexExtensionResponse') {
    console.log('YAPEX_EXTENSION: YAPEX Extension is installed:', event.data.installed);
    console.log('YAPEX_EXTENSION: Version:', event.data.version);
  }
});
```

3. **Chrome API (for pages within your extension's permissions)**:
```javascript
chrome.runtime.sendMessage('EXTENSION_ID', { action: 'isExtensionInstalled' }, 
  function(response) {
    if (response && response.installed) {
      console.log('YAPEX_EXTENSION: YAPEX Extension is installed, version:', response.version);
    }
  }
);
```

## Security

- All data transmitted to the YAPEX backend is encrypted
- Only specific Kaito endpoints are monitored
- The extension only activates on specific Kaito-related pages
- No user data is stored locally beyond basic extension settings

## License

[MIT License](LICENSE)

---

For support, contact support@yapex.io 