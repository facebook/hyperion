# Hyperion React Native Test App

## Prerequisites

- Node >= 18
- Ruby >= 3.2 (install via [rbenv](https://github.com/rbenv/rbenv))
- Xcode (install from Managed Software Center)

### Ruby Setup

```sh
brew install rbenv ruby-build
rbenv install 3.3.11
```

Add to your `~/.zshrc`:

```sh
eval "$(rbenv init -)"
```

## Setup

```sh
npm install
npm run build:ios
```

## iOS

```sh
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
bundle config set path 'vendor/bundle'
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```
