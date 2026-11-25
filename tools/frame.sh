#!/bin/sh
# Re-export geometry and render one Blender still: tools/frame.sh <out.png> <frame> <spp> <percent> [noexport]
set -e
[ "$5" = noexport ] || { rm -rf out/raw/mesh; mkdir -p out/raw/mesh; node tools/shot.mjs exportmesh out/raw/mesh 2>&1 | grep -E "rror|saved|\[err" || true; }
${BLENDER:-/e/Blender/blender-4.5.17-windows-x64/blender.exe} -b --factory-startup -P src/blender_scene.py -- out/raw/mesh "$1" "$2" "$3" "$4" 2>&1 | grep -E "DONE|Traceback|Error:|File \"" || true
