// Helper function to generate a valid captcha token for e2e tests
export async function generateCaptchaToken(siteKey) {
  const CAP_API = process.env.PUBLIC_CAPTCHA_ENDPOINT ?? 'http://localhost:3001';

  try {
    // For Cap, we need to make a request to generate a valid token
    // This simulates what the frontend captcha widget would do
    const response = await fetch(`${CAP_API}/${siteKey}/challenge`, {
      body: JSON.stringify({
        // Add any required challenge parameters
        action: 'submit',
        data: 'e2e-test'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    if (!response.ok) {
      console.warn('Failed to generate captcha token, falling back to test token');
      return 'test-token';
    }

    const data = await response.json();
    return data.token || data.response || 'test-token';
  } catch (error) {
    console.warn('Error generating captcha token:', error);
    return 'test-token';
  }
}

// Load the captcha configuration from the generated env file
export async function loadCaptchaConfig() {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const envFile = path.join(process.cwd(), '.env.e2e');
    const envContent = await fs.readFile(envFile, 'utf8');

    const config = {};
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        config[key.trim()] = value.replace(/"/g, '').trim();
      }
    });

    return config;
  } catch (error) {
    console.warn('Failed to load captcha config:', error);
    return {};
  }
}
