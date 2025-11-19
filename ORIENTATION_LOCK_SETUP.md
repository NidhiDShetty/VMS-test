# Screen Orientation Lock Setup

This document describes how screen orientation is locked to portrait mode in the Capacitor mobile app.

## Implementation

### 1. JavaScript Implementation (Already Done)
- Screen Orientation API lock in `src/app/layout.tsx`
- Meta tags added programmatically for orientation preferences
- Handles orientation change events to re-lock when needed

### 2. CSS Implementation (Already Done)
- Portrait-only styling in `src/app/globals.css`
- Prevents landscape display

### 3. Native Configuration (Required for APK)

For the orientation lock to work reliably in the native Android APK, you need to configure the native project files:

#### Android Configuration

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="portrait"
    ...>
```

Or add to the application tag:
```xml
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:screenOrientation="portrait"
    ...>
```

#### iOS Configuration

Edit `ios/App/App/Info.plist`:

Add or modify:
```xml
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>
```

## After Making Native Changes

1. Sync Capacitor: `npx cap sync`
2. Rebuild the native project
3. Build the APK/IPA

## Current Status

✅ JavaScript orientation lock implemented
✅ CSS portrait-only styling added
✅ Meta tags added programmatically
⚠️ Native configuration required for full APK support

