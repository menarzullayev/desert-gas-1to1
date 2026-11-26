#!/bin/sh
# 4K master, 1080p page video, 4K WebP stills every 15 frames, poster. FRAMES=<4K frame dir>
set -e
FR=${FRAMES:-E:/desert-gas-4k-v3}
ffmpeg -v error -y -i out/raw/music.wav -af "loudnorm=I=-16:TP=-1.5" -ar 48000 -c:a libmp3lame -b:a 192k web/music.mp3
ffmpeg -v error -y -framerate 60 -i $FR/f%04d.png -i web/music.mp3 -map 0:v -map 1:a -vf "noise=alls=2:allf=t,format=yuv420p" -c:v libx264 -preset slow -crf 16 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -t 11 -movflags +faststart out/desert-gas-4k.mp4
ffmpeg -v error -y -framerate 60 -i $FR/f%04d.png -i web/music.mp3 -map 0:v -map 1:a -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 15 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -t 11 -movflags +faststart out/desert-gas.mp4
ffmpeg -v error -y -framerate 60 -i $FR/f%04d.png -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf ${CRF:-24} -g 10 -keyint_min 10 -bf 0 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an -movflags +faststart web/scrub.mp4
mkdir -p web/k; for i in $(seq 0 15 659); do n=$(printf %04d $i); ffmpeg -v error -y -i $FR/f$n.png -c:v libwebp -quality ${WQ:-90} -compression_level 6 web/k/f$n.webp; done
ffmpeg -v error -y -i $FR/f0300.png -vf "scale=1080:1920:flags=lanczos" -q:v 3 web/poster.jpg
[ -f refs/right.mp4 ] && ffmpeg -v error -y -i refs/right.mp4 -i out/desert-gas.mp4 -filter_complex "[0:v]fps=60,scale=720:1280[a];[1:v]scale=720:1280[b];[a][b]hstack" -map 1:a -c:v libx264 -crf 17 -t 11 refs/yonma-yon.mp4
du -ch web/k/*.webp | tail -1; ls -la web out/*.mp4
