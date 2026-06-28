#!/usr/bin/env bash
# LasPoly launcher - one file to download. Fetches the game jar, Java 21, and OpenJFX if needed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$ROOT/$(basename "$0")"
JAR="$ROOT/LasPoly.jar"
ORIGIN="${LASPOLY_ORIGIN:-https://laspoly.brianwirth.de}"
AUTH_USER="${LASPOLY_AUTH_USER:-laspoly}"
AUTH_PASS="${LASPOLY_AUTH_PASS:-sbpp}"
JAR_URL="$ORIGIN/download/LasPoly.jar"
JAVA_VERSION="${LASPOLY_JAVA_VERSION:-21}"
JFX_VERSION="${JFX_VERSION:-21.0.2}"
JFX_ORACLE_GA="javafx21.0.2/0dc89a29ffa34addbe3057926acea09a/GPL"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/laspoly"
JRE_DIR="$CACHE/temurin-jre-$JAVA_VERSION"
JRE_BIN="$JRE_DIR/bin/java"
JFX_DIR="$CACHE/javafx-sdk-$JFX_VERSION"
JFX_LIB="$JFX_DIR/lib"
JFX_BIN="$JFX_DIR/bin"
JFX_MODULES="javafx.controls,javafx.fxml,javafx.graphics,javafx.media,javafx.web"
JAVA=""

fail() {
  echo "" >&2
  echo "FAILED: $*" >&2
  echo "Always start LasPoly with run.sh (not the .jar file)." >&2
  exit 1
}

step() {
  echo "" >&2
  echo "$1" >&2
}

download_file() {
  local label="$1"
  local url="$2"
  local dest="$3"
  step "$label"
  if [[ "$url" == "$ORIGIN"* ]]; then
    if ! curl -fL --progress-bar -u "$AUTH_USER:$AUTH_PASS" -o "$dest" "$url"; then
      fail "Download failed: $url"
    fi
  elif ! curl -fL --progress-bar -o "$dest" "$url"; then
    fail "Download failed: $url"
  fi
  echo "  done." >&2
}

update_jar() {
  step "[1/3] LasPoly game"
  if [[ -f "$JAR" ]]; then
    if curl -fL --progress-bar -u "$AUTH_USER:$AUTH_PASS" -z "$JAR" -o "$JAR" "$JAR_URL"; then
      echo "  up to date." >&2
      return 0
    fi
    fail "Could not update LasPoly.jar from $JAR_URL"
  fi
  download_file "[1/3] LasPoly game (~80 MB)" "$JAR_URL" "$JAR"
}

update_launcher() {
  [[ "${LASPOLY_NO_UPDATE:-}" == "1" ]] && return 0
  local updated
  updated="$(mktemp)"
  if curl -fsSL -u "$AUTH_USER:$AUTH_PASS" -o "$updated" "$ORIGIN/download/run.sh"; then
    if ! cmp -s "$updated" "$SCRIPT_PATH"; then
      chmod +x "$updated"
      mv "$updated" "$SCRIPT_PATH"
      echo "Updated launcher from $ORIGIN" >&2
      exec bash "$SCRIPT_PATH" "$@"
    fi
  fi
  rm -f "$updated"
}

javafx_archive_urls() {
  case "$JFX_SLUG" in
    osx-aarch64)
      echo "https://download2.gluonhq.com/openjfx/$JFX_VERSION/openjfx-${JFX_VERSION}_osx-aarch64_bin-sdk.zip"
      echo "https://download.java.net/java/GA/${JFX_ORACLE_GA}/openjfx-${JFX_VERSION}_macos-aarch64_bin-sdk.tar.gz"
      ;;
    osx-x64)
      echo "https://download2.gluonhq.com/openjfx/$JFX_VERSION/openjfx-${JFX_VERSION}_osx-x64_bin-sdk.zip"
      echo "https://download.java.net/java/GA/${JFX_ORACLE_GA}/openjfx-${JFX_VERSION}_macos-x64_bin-sdk.tar.gz"
      ;;
    linux-x64)
      echo "https://download2.gluonhq.com/openjfx/$JFX_VERSION/openjfx-${JFX_VERSION}_linux-x64_bin-sdk.zip"
      echo "https://download.java.net/java/GA/${JFX_ORACLE_GA}/openjfx-${JFX_VERSION}_linux-x64_bin-sdk.tar.gz"
      ;;
    linux-aarch64)
      echo "https://download.java.net/java/GA/${JFX_ORACLE_GA}/openjfx-${JFX_VERSION}_linux-x64_bin-sdk.tar.gz"
      ;;
  esac
}

javafx_maven_classifier() {
  case "$JFX_SLUG" in
    linux-x64) echo linux ;;
    osx-x64) echo mac ;;
    osx-aarch64) echo mac-aarch64 ;;
    linux-aarch64) echo linux ;;
  esac
}

try_download_javafx_archive() {
  local dest="$1"
  local url
  step "[3/3] JavaFX graphics (~85 MB, one-time)"
  while IFS= read -r url; do
    [[ -n "$url" ]] || continue
    echo "  source: $url" >&2
    if curl -fL --progress-bar -o "$dest" "$url"; then
      echo "  done." >&2
      return 0
    fi
    echo "  mirror failed, trying next source ..." >&2
  done < <(javafx_archive_urls)
  return 1
}

ensure_javafx_maven() {
  local classifier mod url dest
  classifier="$(javafx_maven_classifier)"
  mkdir -p "$JFX_LIB"
  step "[3/3] JavaFX graphics (Maven Central, one-time)"
  for mod in javafx-base javafx-graphics javafx-controls javafx-fxml javafx-media javafx-web; do
    url="https://repo1.maven.org/maven2/org/openjfx/${mod}/${JFX_VERSION}/${mod}-${JFX_VERSION}-${classifier}.jar"
    dest="$JFX_LIB/${mod}-${JFX_VERSION}-${classifier}.jar"
    echo "  $mod" >&2
    if ! curl -fL --progress-bar -o "$dest" "$url"; then
      fail "Maven download failed: $url"
    fi
  done
  echo "  done." >&2
}

find_child_dir() {
  local parent="$1"
  shift
  local pattern found
  for pattern in "$@"; do
    found="$(find "$parent" -maxdepth 1 -type d -name "$pattern" 2>/dev/null | head -1)"
    if [[ -n "$found" ]]; then
      echo "$found"
      return 0
    fi
  done
  return 1
}

java_bin_for_tree() {
  local root="$1"
  if [[ -x "$root/bin/java" ]]; then
    echo "$root/bin/java"
    return 0
  fi
  if [[ -x "$root/Contents/Home/bin/java" ]]; then
    echo "$root/Contents/Home/bin/java"
    return 0
  fi
  return 1
}

cached_java_bin() {
  java_bin_for_tree "$JRE_DIR" 2>/dev/null || true
}

extract_archive() {
  local archive="$1"
  local dest="$2"
  local kind sig
  echo "  extracting ..." >&2
  mkdir -p "$dest"
  sig="$(LC_ALL=C head -c 2 "$archive" | od -An -tx1 | tr -d ' \n')"
  if [[ "$sig" == "1f8b" ]]; then
    kind=tar.gz
  elif [[ "$sig" == "504b" ]]; then
    kind=zip
  elif file -b "$archive" 2>/dev/null | grep -qiE 'gzip|tar'; then
    kind=tar.gz
  elif file -b "$archive" 2>/dev/null | grep -qi zip; then
    kind=zip
  else
    fail "Unknown archive format ($(file -b "$archive" 2>/dev/null || echo binary))"
  fi
  case "$kind" in
    tar.gz)
      tar -xzf "$archive" -C "$dest" || fail "Could not extract Java runtime archive"
      ;;
    zip)
      if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$archive" -d "$dest" || fail "Could not extract zip archive"
      else
        tar -xf "$archive" -C "$dest" || fail "Could not extract zip archive"
      fi
      ;;
  esac
}

java_major() {
  local bin="$1"
  local line
  line="$("$bin" -version 2>&1 | head -1 || true)"
  [[ "$line" =~ version\ \"?([0-9]+) ]] || return 1
  echo "${BASH_REMATCH[1]}"
}

test_java_candidate() {
  local candidate="$1"
  local major
  if [[ "$candidate" == "java" ]]; then
    command -v java >/dev/null 2>&1 || return 1
  elif [[ ! -x "$candidate" ]]; then
    return 1
  fi
  major="$(java_major "$candidate" || true)"
  [[ -n "$major" && "$major" -ge "$JAVA_VERSION" ]]
}

platform_ids() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "$os-$arch" in
    Linux-x86_64|Linux-amd64)
      ADOPT_OS=linux
      ADOPT_ARCH=x64
      JFX_SLUG=linux-x64
      ;;
    Linux-aarch64|Linux-arm64)
      ADOPT_OS=linux
      ADOPT_ARCH=aarch64
      JFX_SLUG=linux-aarch64
      ;;
    Darwin-x86_64)
      ADOPT_OS=mac
      ADOPT_ARCH=x64
      JFX_SLUG=osx-x64
      ;;
    Darwin-arm64|Darwin-arm64e)
      ADOPT_OS=mac
      ADOPT_ARCH=aarch64
      JFX_SLUG=osx-aarch64
      ;;
    *)
      fail "Unsupported OS/arch: $os $arch"
      ;;
  esac
}

ensure_javafx() {
  [[ -d "$JFX_LIB" ]] && return 0

  platform_ids
  mkdir -p "$CACHE"
  local archive extract_root extracted
  archive="$(mktemp)"
  extract_root="$(mktemp -d)"
  if try_download_javafx_archive "$archive"; then
    rm -rf "$JFX_DIR"
    extract_archive "$archive" "$extract_root"
    rm -f "$archive"
    extracted="$(find_child_dir "$extract_root" "javafx-sdk-$JFX_VERSION" 'javafx-sdk-*' || true)"
    [[ -n "$extracted" ]] || fail "JavaFX archive extracted but sdk folder was not found."
    mv "$extracted" "$JFX_DIR"
    rm -rf "$extract_root"
    [[ -d "$JFX_LIB" ]] || fail "JavaFX lib folder missing after setup ($JFX_LIB)."
  else
    rm -f "$archive"
    rm -rf "$extract_root"
    rm -rf "$JFX_DIR"
    ensure_javafx_maven
  fi
}

ensure_java() {
  local candidate cached
  cached="$(cached_java_bin)"
  for candidate in java ${cached:+"$cached"}; do
    if test_java_candidate "$candidate"; then
      JAVA="$candidate"
      return 0
    fi
  done

  platform_ids
  mkdir -p "$CACHE"
  local archive extract_root extracted
  archive="$(mktemp)"
  extract_root="$(mktemp -d)"
  download_file \
    "[2/3] Java $JAVA_VERSION runtime (~50 MB, one-time)" \
    "https://api.adoptium.net/v3/binary/latest/${JAVA_VERSION}/ga/${ADOPT_OS}/${ADOPT_ARCH}/jre/hotspot/normal/eclipse?project=jdk" \
    "$archive"
  rm -rf "$JRE_DIR"
  extract_archive "$archive" "$extract_root"
  rm -f "$archive"
  extracted="$(find_child_dir "$extract_root" 'jdk-*' 'jre-*' || true)"
  if [[ -z "$extracted" ]]; then
    local java_path
    java_path="$(find "$extract_root" -type f -path '*/bin/java' 2>/dev/null | head -1 || true)"
    if [[ -n "$java_path" ]]; then
      extracted="$(dirname "$(dirname "$java_path")")"
      if [[ "$(basename "$extracted")" == "Home" ]]; then
        extracted="$(dirname "$(dirname "$extracted")")"
      fi
    fi
  fi
  [[ -n "$extracted" && -d "$extracted" ]] || fail "Java archive extracted but runtime folder was not found."
  mv "$extracted" "$JRE_DIR"
  rm -rf "$extract_root"
  JAVA="$(java_bin_for_tree "$JRE_DIR" || true)"
  [[ -n "$JAVA" ]] || fail "java missing after Java setup ($JRE_DIR)."
}

needs_java_setup() {
  local cached
  cached="$(cached_java_bin)"
  test_java_candidate java && return 1
  [[ -n "$cached" ]] && test_java_candidate "$cached" && return 1
  return 0
}

main() {
  update_launcher "$@"
  platform_ids

  local needs_java_flag=0 needs_jfx=0
  needs_java_setup && needs_java_flag=1
  [[ -d "$JFX_LIB" ]] || needs_jfx=1

  if [[ ! -f "$JAR" || "$needs_java_flag" -eq 1 || "$needs_jfx" -eq 1 ]]; then
    echo "LasPoly first-time setup" >&2
    echo "  Downloads once, then cached locally. Typical total ~200 MB." >&2
    echo "  Always start the game with run.sh (not the .jar file)." >&2
    [[ -f "$JAR" ]] && echo "  LasPoly.jar - already present" >&2
    [[ "$needs_java_flag" -eq 0 ]] && echo "  Java $JAVA_VERSION - already present" >&2
    [[ "$needs_jfx" -eq 0 ]] && echo "  JavaFX - already present" >&2
  fi

  update_jar
  [[ -f "$JAR" ]] || fail "LasPoly.jar not found in $ROOT"

  ensure_java
  ensure_javafx
  export PATH="$JFX_BIN:$PATH"

  step "Starting LasPoly ..."
  echo "  Game window should open in a few seconds." >&2
  echo "  Close this terminal only after you quit the game." >&2

  set +e
  "$JAVA" \
    --module-path "$JFX_LIB" \
    --add-modules "$JFX_MODULES" \
    -cp "$JAR" \
    de.hhn.seb.labsw.laspoly.main.Main
  local exit_code=$?
  set -e

  [[ "$exit_code" -eq 0 ]] || fail "LasPoly exited with error code $exit_code."
}

main "$@"
