// YAPEX Extension - Popup Script
// Self-contained functionality for the popup

document.addEventListener('DOMContentLoaded', function () {
  console.debug('YAPEX_EXTENSION: Popup loaded');

  // Make sure we can access the chrome API
  if (!chrome || !chrome.runtime) {
    showError('Extension API not available');
    return;
  }

  try {
    // Display extension version
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.querySelector('.footer p');
    if (versionElement) {
      versionElement.textContent = `YAPEX Extension v${manifest.version}`;
    }

    // Get current status
    chrome.storage.local.get(['lastSync'], function (result) {
      const statusDiv = document.querySelector('.status');

      if (result.lastSync) {
        const lastSyncDate = new Date(result.lastSync);
        const formattedDate = lastSyncDate.toLocaleString();

        // Create a new status message
        const syncStatus = document.createElement('div');
        syncStatus.textContent = `Last data sync: ${formattedDate}`;
        syncStatus.style.marginTop = '5px';
        syncStatus.style.fontSize = '12px';

        // Add it to the status div
        statusDiv.appendChild(syncStatus);
      }
    });

    // Add click listener for the yapex.xyz link
    const yapexLink = document.querySelector('a[href="https://yapex.xyz"]');
    if (yapexLink) {
      yapexLink.addEventListener('click', function (e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://yapex.xyz' });
      });
    }

    // Get tab elements
    const tabProduction = document.getElementById('tab-production');
    const tabLocal = document.getElementById('tab-local');
    const currentEnvText = document.getElementById('current-env');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const statusEndpoint = document.getElementById('status-endpoint');

    // Define the backend URLs
    const BACKEND_URLS = {
      production: 'https://yapex-backend.kwek.dev',
      local: 'http://localhost:3651'
    };

    // Load saved preference from chrome.storage
    chrome.storage.local.get(['yapexUseLocalBackend', 'yapexBackendUrl'], function (result) {
      const isLocalEnv = result.yapexUseLocalBackend === true;

      // Set active tab based on saved preference
      if (isLocalEnv) {
        setActiveTab('local');
      } else {
        setActiveTab('production');
      }

      // Set the active backend URL in chrome.storage if not already set
      const currentBackendUrl = result.yapexBackendUrl ||
        (isLocalEnv ? BACKEND_URLS.local : BACKEND_URLS.production);

      if (!result.yapexBackendUrl) {
        chrome.storage.local.set({ yapexBackendUrl: currentBackendUrl });
      }

      // Check endpoint status on load
      checkEndpointStatus(currentBackendUrl);
    });

    // Add event listeners for tab clicks
    tabProduction.addEventListener('click', function () {
      setActiveTab('production');

      // Save preference to chrome.storage
      chrome.storage.local.set({
        yapexUseLocalBackend: false,
        yapexBackendUrl: BACKEND_URLS.production
      });

      // Check the new endpoint status
      checkEndpointStatus(BACKEND_URLS.production);
    });

    tabLocal.addEventListener('click', function () {
      setActiveTab('local');

      // Save preference to chrome.storage
      chrome.storage.local.set({
        yapexUseLocalBackend: true,
        yapexBackendUrl: BACKEND_URLS.local
      });

      // Check the new endpoint status
      checkEndpointStatus(BACKEND_URLS.local);
    });

    // Function to set the active tab
    function setActiveTab(tabName) {
      // Update tab UI
      if (tabName === 'local') {
        tabLocal.classList.add('active');
        tabProduction.classList.remove('active');
        updateEnvDisplay(true);
      } else {
        tabProduction.classList.add('active');
        tabLocal.classList.remove('active');
        updateEnvDisplay(false);
      }
    }

    // Function to update the environment display
    function updateEnvDisplay(isLocal) {
      if (isLocal) {
        currentEnvText.textContent = 'Local (localhost:3651)';
        currentEnvText.className = 'env-details local';
      } else {
        currentEnvText.textContent = 'Production (yapex-backend.kwek.dev)';
        currentEnvText.className = 'env-details production';
      }
    }

    // Function to check if the endpoint is active
    async function checkEndpointStatus(url) {
      statusText.textContent = 'Checking...';
      statusEndpoint.textContent = url;

      try {
        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          statusIndicator.classList.remove('inactive');
          statusText.textContent = 'Active';
          statusText.style.color = '#32ffdc';
        } else {
          setInactiveStatus('Inactive (Error ' + response.status + ')');
        }
      } catch (error) {
        console.error('Error checking endpoint:', error);
        if (error.name === 'AbortError') {
          setInactiveStatus('Inactive (Timeout)');
        } else {
          setInactiveStatus('Inactive (Connection Failed)');
        }
      }
    }

    // Helper function to set inactive status
    function setInactiveStatus(message) {
      statusIndicator.classList.add('inactive');
      statusText.textContent = message;
      statusText.style.color = '#ff4d4d';
      statusIndicator.style.animation = 'redglow 2s infinite alternate';
    }
  } catch (error) {
    console.error('YAPEX_EXTENSION: Error in popup:', error);
    showError('Failed to initialize popup: ' + error.message);
  }

  // Helper function to show errors in the popup
  function showError(message) {
    const statusDiv = document.querySelector('.status');
    if (statusDiv) {
      // Clear existing status
      statusDiv.innerHTML = '';

      // Add error message
      const errorDiv = document.createElement('div');
      errorDiv.style.color = '#e74c3c';
      errorDiv.textContent = 'Error: ' + message;
      statusDiv.appendChild(errorDiv);

      // Change indicator to red
      const indicator = document.createElement('span');
      indicator.className = 'status-indicator';
      indicator.style.backgroundColor = '#e74c3c';
      errorDiv.prepend(indicator);
    }
  }
}); 