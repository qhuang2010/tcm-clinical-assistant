# Application Assets

This directory contains application assets.

## Directory Structure

```
assets/
├── images/          # Images used in the app
└── icons/           # App icons and other icons
```

## Required Assets

### App Icons

You need to add app icons for different platforms:

#### Android
- Place in `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Sizes: mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)

#### iOS
- Place in `ios/Runner/Assets.xcassets/AppIcon.appiconset/`
- Sizes: 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024

#### HarmonyOS
- Configure in `harmonyos/entry/src/main/resources/base/media`

### Screenshot Placeholders

When creating screenshots for app stores:
- Android: 5 screenshots (phone, 7" tablet, 10" tablet)
- iOS: 6.5" and 5.5" iPhone (3 screenshots each)
- HarmonyOS: 5 screenshots

## How to Generate App Icons

### Online Tools
- https://appicon.co/
- https://icon.kitchen/
- https://makeappicon.com/

### Command Line (ImageMagick)
```bash
convert icon.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert icon.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
# ... other sizes
```

### Flutter Tools
```bash
flutter pub run flutter_launcher_icons
```

Add to `pubspec.yaml`:
```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.1

flutter_launcher_icons:
  image_path: "assets/icons/app_icon.png"
  android: true
  ios: true
```

## Current Status

⚠️ **Icons need to be created**

Please add your app icon as `assets/icons/app_icon.png` and then run:
```bash
flutter pub run flutter_launcher_icons
```
