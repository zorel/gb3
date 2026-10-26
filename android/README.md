# gb3 for Android

A native Android client for the [gb3](https://codeberg.org/devnewton/gb3) `gb2c` server. It is written in
Kotlin with Jetpack Compose and talks directly to the same HTTP/SSE API as
`gb3tui` and `gc2`. There is no WebView for the tribune itself; a small WebView
is only used to complete the LinuxFR OAuth flow.

## Features

The client covers the feature set of `gb3tui` and `gc2`, adapted to touch:

- live posts from `/gb2c/poll` over server-sent events, with automatic
  reconnection and foreground-only streaming;
- posting to any tribune through `/gb2c/post`, including LinuxFR (`dlfp`)
  OAuth login, token refresh and restoration of the message while authorizing;
- tribune switching with chips, horizontal swipes and unread/reply/bigorno
  badges;
- clock references (norloges): tap one to jump to the referenced post, tap a
  post clock to quote it in the composer, and see reverse references
  highlighted while a post is selected;
- conversation grouping with a stable color rail and `┏ ┣ ┗` markers, plus the
  same conversation filter as `gc2`:
  - hide a login/user-agent and every direct or indirect reply,
  - either hide those posts or show them grayed with their message masked;
- server-side blocked identities from `/gb2c/config` merged with local
  settings;
- bigorno, "this is a reply to me" and "mine" indicators;
- message formatting: `<b>`, `<i>`, `<u>`, `<s>`, `<tt>`, `<code>`, tappable
  spoilers, links, `[:totoz]`, `nick<` bigornos and normal bouchot whitespace;
- totoz search with image grid and preview, emoji search, attachment upload
  (4 MiB server limit) and the ALT formatting shortcuts;
- plop-list message replacement;
- light/dark Material 3 theme following the system, with the gc2 palette;
- the alarm clock that counts seconds during the last minute of each hour.

## Requirements

- JDK 17
- Android SDK 35 (`compileSdk = 35`)
- Android Studio Ladybug or newer, or the Gradle wrapper

The project includes a Gradle wrapper. Build from this directory:

```bash
export ANDROID_HOME=/path/to/android-sdk
./gradlew :app:assembleDebug
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

For an installable release APK:

```bash
./gradlew :app:assembleRelease
```

The APK is written to `app/build/outputs/apk/release/app-release.apk`.

Android refuses to install unsigned APKs. For local testing, the release build
falls back to the locally generated Android debug key, so it is installable but
must not be published. Provide a real release key through the environment for
distribution:

```bash
export GB3_RELEASE_KEYSTORE=/path/to/release.jks
export GB3_RELEASE_KEYSTORE_PASSWORD=...
export GB3_RELEASE_KEY_ALIAS=...
export GB3_RELEASE_KEY_PASSWORD=...
./gradlew :app:assembleRelease
```

Run the unit tests with:

```bash
./gradlew :app:testDebugUnitTest
```

The test suite includes an SSE burst regression test (gb2c replays its whole
history in one burst when a client connects; the client applies backpressure
instead of silently dropping events) and parser/conversation tests.

## First run

The app asks for the base URL of a `gb2c` server, for example
`https://gb3.example.com` or `http://192.168.1.10:16666`. Plain HTTP is allowed
because gb3 is commonly self-hosted on a LAN. The nickname is sent as the post
`info`; if it is left empty, a gc2-style random nickname is generated.

On an Android emulator, `localhost` is the emulator itself: use
`http://10.0.2.2:16666` to reach a gb2c process running on the host machine.

## Touch gestures

- tap a tribune chip, or swipe the post list left/right, to change tribune;
- tap a post to select it and highlight every clock reference pointing to it;
- tap its clock to quote it, or tap its author to add `author<` to the message;
- tap a clock reference inside a message to jump to the referenced post;
- long-press a post to reply, call the author, copy the message or show its
  metadata;
- tap a spoiler to reveal or hide it, and tap a totoz to preview it;
- use the `+` button in the composer, or the top-right menu, for attachments,
  totoz, emoji, formatting shortcuts and settings.

Settings are stored locally in `SharedPreferences`:

- server URL and nickname;
- selected tribunes;
- local blocked identities and hide/gray mode;
- plop list;
- last posted message and per-tribune last-read marker;
- LinuxFR access/refresh tokens.

## API endpoints used

| Endpoint | Usage |
| --- | --- |
| `/gb2c/list` | tribune list |
| `/gb2c/config` | server-side blocked identities |
| `/gb2c/poll?filter=...` | SSE live posts |
| `/gb2c/post` | post a message |
| `/gb2c/totoz/search` | totoz search |
| `/gb2c/emoji/search` | emoji search |
| `/gb2c/attachment/` | multipart attachment upload |
| `/gb2c/linuxfr/authorize` | OAuth authorization page |
| `/gb2c/linuxfr/refresh` | refresh a LinuxFR token |

The LinuxFR redirect configured on the gb2c server must be reachable from the
device. gb2c currently builds that redirect with `https://`, so a gb2c instance
using plain HTTP on a LAN may not be able to complete OAuth; the rest of the app
works normally.

## Project layout

```
app/src/main/java/fr/devnewton/gb3/
  MainActivity.kt              single-activity Compose host
  data/                        models, preferences, HTTP/SSE client
  domain/MessageParser.kt      native port of the gc2 message scanner
  domain/Conversation.kt       norloge index, reply graph, filtering
  ui/Gb3ViewModel.kt           state, stream lifecycle, posting, settings
  ui/Gb3App.kt                 navigation, main screen, sheets, dialogs
  ui/components/               post list, rows, composer, search sheets
  ui/screens/                  setup, settings, LinuxFR OAuth
  ui/theme/                    Material 3 color schemes and palette
app/src/test/                  parser and conversation unit tests
```

## Notes and limitations

- The stream runs while the app is in the foreground. There are no OS push
  notifications; unread/reply/bigorno indicators are in-app badges.
- The client is read-only for server configuration. Blocked identities configured
  with `GB2C_BLOCKED_IDENTITIES` are displayed in Settings but can only be changed
  on the server. Local blocked identities are editable in the app.
- Attachments are inserted as their public URL in the composer, like gc2.
- Totoz images are loaded from `nsfw.totoz.eu`.
- LinuxFR is only needed to post to the `dlfp` tribune. OAuth uses a dedicated
  WebView so the token stays in the app and passwords are only entered on
  linuxfr.org.
