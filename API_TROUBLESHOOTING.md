# API Troubleshooting Guide for Mobile App

## Issue: API not working on mobile but works on web

### Problem
Mobile apps (React Native/Expo) don't send an `Origin` header like web browsers do. Your server's CORS configuration might be blocking requests from mobile apps.

### Solutions

#### Option 1: Update Server CORS Configuration (Recommended)

Your server needs to allow requests that don't have an `Origin` header (mobile apps). Update your CORS configuration to:

```javascript
// Example for Express.js
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://rental.equipter.com',
      'https://www.rental.equipter.com',
      'http://localhost:8080',
      'http://10.0.2.2',
      'https://localhost'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow mobile apps (no origin)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-request-signature-id',
    'X-Client-Type',
    'X-Platform',
    'User-Agent'
  ]
};
```

#### Option 2: Check Network Configuration

1. **Verify API URL is accessible from mobile device:**
   - Make sure your mobile device can reach `https://rental.equipter.com`
   - Test with a browser on the same network

2. **Check SSL Certificate:**
   - Mobile apps are stricter about SSL certificates
   - Ensure your certificate is valid and not self-signed

3. **Network Permissions:**
   - iOS: Check Info.plist for network permissions
   - Android: Check AndroidManifest.xml for INTERNET permission

#### Option 3: Debug Steps

1. **Check Network Logs:**
   ```javascript
   // The axios interceptor now logs errors
   // Check your console/Logcat for detailed error messages
   ```

2. **Test API Directly:**
   - Use a tool like Postman or curl to test your API
   - Try without Origin header to simulate mobile app

3. **Verify Environment Variables:**
   - Make sure `EXPO_PUBLIC_API_BASE` is set correctly
   - Restart Expo after changing environment variables

### Current Configuration

The mobile app now sends these headers:
- `X-Client-Type: mobile-app` - Identifies the request as coming from mobile
- `X-Platform: ios` or `X-Platform: android` - Platform identifier
- `User-Agent: EquipterRentalApp/ios` or `EquipterRentalApp/android`
- `x-request-signature-id: [generated-id]` - Request signature

### Testing

1. **On Web (Expo Web):**
   ```bash
   npm start
   # Press 'w' to open in web browser
   ```

2. **On Mobile Device:**
   ```bash
   npm start
   # Scan QR code with Expo Go app
   # Or build and install on device
   ```

3. **Check Console Logs:**
   - Web: Browser DevTools Console
   - iOS: Xcode Console or React Native Debugger
   - Android: Logcat or React Native Debugger

### Common Issues

1. **CORS Error:** Server blocking requests without Origin header
   - **Fix:** Update server CORS to allow requests with no origin

2. **Network Timeout:** Slow mobile network
   - **Fix:** Already increased timeout to 30 seconds

3. **SSL Certificate Error:** Invalid or self-signed certificate
   - **Fix:** Use valid SSL certificate or configure certificate pinning

4. **Environment Variable Not Loaded:**
   - **Fix:** Restart Expo dev server after changing `.env` file

### Next Steps

1. Update your server's CORS configuration to allow mobile app requests
2. Test the API with the updated headers
3. Check console logs for any error messages
4. Verify network connectivity on the mobile device

