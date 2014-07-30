error() {
  echo " !     $*" >&2
  exit 1
}

status() {
  echo "-----> $*"
}
