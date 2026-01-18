# Multi-stage build for Flutter
FROM ubuntu:22.04 AS build-env

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Flutter
ENV FLUTTER_VERSION=3.13.0
RUN git clone --depth 1 --branch stable https://github.com/flutter/flutter.git /opt/flutter
ENV PATH="${PATH}:/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin"

# Download Android SDK
ENV ANDROID_SDK_VERSION=9123335
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools"

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_SDK_VERSION}_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools && \
    rm cmdline-tools.zip && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Build stage
FROM build-env AS build

WORKDIR /app
COPY . .

# Install Flutter dependencies
RUN flutter pub get
RUN flutter pub run build_runner build --delete-conflicting-outputs

# Build APK
RUN flutter build apk --release

# Production image
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built APK from build stage
COPY --from=build /app/build/app/outputs/flutter-apk/ ./app/

# Expose port for development
EXPOSE 8000

# Set entrypoint
CMD ["/bin/bash"]
