# Riderz Mobile Client

React Native app for riders to join and participate in group rides.

## Features

- **PIN-based Joining**: Enter 6-digit codes to join rides
- **Real-time Location**: Share GPS location with group
- **Interactive Maps**: View route and other participants
- **Live Updates**: Socket.io real-time communication
- **Permission Handling**: Native location permissions
- **Cross-platform**: iOS and Android support

## Tech Stack

- React Native with TypeScript
- React Native Maps for mapping
- Geolocation services for GPS
- Socket.io for real-time features
- React Navigation for routing
- Native styling with StyleSheet

## Setup

### Prerequisites
- Node.js 18+
- React Native development environment
- Running Riderz server

### iOS Development
- Xcode 14+
- iOS Simulator or device
- CocoaPods

### Android Development
- Android Studio
- Android SDK
- Android Emulator or device

### Installation
```bash
npm install
```

### iOS Setup
```bash
cd ios && pod install && cd ..
```

### Development

#### Start Metro
```bash
npm start
```

#### Run iOS
```bash
npm run ios
```

#### Run Android
```bash
npm run android
```

## Usage

### Joining a Ride
1. Open the app
2. Enter PIN code from organizer
3. Allow location permissions
4. View route and participants

### During the Ride
- See your location on the map
- View route waypoints
- See other participants' locations
- Monitor connection status

### Leaving a Ride
- Tap "Leave" button
- Confirm exit
- Return to PIN entry screen

## Project Structure

```
src/
├── screens/
│   ├── PinEntry.tsx         # PIN code entry
│   └── ActiveRide.tsx       # Live ride participation
├── hooks/
│   ├── useSocket.ts         # Real-time communication
│   └── useGeolocation.ts    # Location services
└── utils/
    └── api.ts               # HTTP client
```

## Key Components

### PinEntry Screen
- PIN code input with validation
- Join ride API integration
- Error handling and feedback
- Navigation to active ride

### ActiveRide Screen
- React Native Maps integration
- Real-time location sharing
- Participant list and status
- Route visualization

### useGeolocation Hook
- Native location permissions
- Continuous GPS tracking
- Error handling
- Platform-specific implementations

### useSocket Hook
- Socket.io connection management
- Real-time event handling
- Location broadcasting
- User presence tracking

## Location Services

### Permissions
```typescript
// iOS: NSLocationWhenInUseUsageDescription
// Android: ACCESS_FINE_LOCATION
```

### Geolocation Options
- High accuracy enabled
- Distance filter: 10 meters
- Update interval: 5 seconds
- Timeout: 15 seconds

## Socket Events

### Emitted
- `join-ride`: Connect to ride room
- `location-update`: Send GPS coordinates

### Received
- `user-snapshot`: Initial participant list
- `location-broadcast`: Other participants' locations
- `user-joined/left`: Presence changes
- `ride-ended`: Ride termination

## API Integration

### Ride Joining
```typescript
ridesAPI.join(pinCode)  // Returns ride data + user ID
ridesAPI.getById(id)    // Get ride details
```

## Platform Configuration

### iOS (ios/RiderzMobile/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to share your position with other riders.</string>
```

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## Maps Integration

### iOS
- Uses Apple Maps by default
- Requires Google Maps SDK for Google Maps

### Android
- Uses Google Maps by default
- Requires Google Play Services

### Configuration
```javascript
// For Google Maps
import { PROVIDER_GOOGLE } from 'react-native-maps';

<MapView provider={PROVIDER_GOOGLE} />
```

## Build & Deployment

### Development Build
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

### Release Build

#### iOS
1. Open `ios/RiderzMobile.xcworkspace` in Xcode
2. Select "Any iOS Device" or your device
3. Product → Archive
4. Upload to App Store Connect

#### Android
```bash
cd android
./gradlew assembleRelease
```

## Environment Configuration

### Server Connection
Configure API base URL in `shared/constants.ts`:
```typescript
export const API_BASE_URL = 'http://your-server:3001';
```

### Development
- Uses `http://localhost:3001` by default
- Enable network security for HTTP on Android

## Permissions & Security

### Location Permissions
- Request permissions on app startup
- Handle permission denial gracefully
- Provide clear permission rationale

### Network Security
- HTTPS recommended for production
- Handle network errors gracefully
- Validate server responses

## Troubleshooting

### Common Issues

#### Location Not Working
- Check device location services enabled
- Verify app location permissions
- Test on physical device (not simulator)

#### Maps Not Loading
- Verify Google Maps API key (if using)
- Check network connectivity
- Ensure Google Play Services installed (Android)

#### Socket Connection Issues
- Verify server is running
- Check network connectivity
- Review server CORS configuration

### Development Tips
- Use physical device for location testing
- Enable developer mode for debugging
- Monitor Metro logs for errors
- Test on both iOS and Android

## Platform-specific Notes

### iOS
- Location permissions must be requested before use
- Background location requires additional configuration
- App Store review requires location usage description

### Android
- Runtime permissions required (API 23+)
- Location services can be disabled by user
- Play Store requires location permission justification