#!/bin/sh
# Encode the rendered frames: master MP4, seekable clip for the web page, music, private side-by-side.
set -e
FR=${FRAMES:-E:/media/desert-gas/desert-gas-f2}
ffmpeg -v error -y -i out/raw/music.wav -af "loudnorm=I=-16:TP=-1.5" -ar 48000 -c:a libmp3lame -b:a 192k web/music.mp3
ffmpeg -v error -y -framerate 60 -i $FR/f%04d.png -i web/music.mp3 -map 0:v -map 1:a -vf "noise=alls=2:allf=t,format=yuv420p" -c:v libx264 -preset slow -crf 15 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -t 11 -movflags +faststart out/desert-gas.mp4
ffmpeg -v error -y -framerate 60 -i $FR/f%04d.png -vf "scale=810:1440:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 23 -g 10 -keyint_min 10 -bf 0 -an -movflags +faststart web/scrub.mp4
[ -f refs/right.mp4 ] && ffmpeg -v error -y -i refs/right.mp4 -i out/desert-gas.mp4 -filter_complex "[0:v]fps=60,scale=720:1280[a];[1:v]scale=720:1280[b];[a][b]hstack" -map 1:a -c:v libx264 -crf 17 -t 11 refs/yonma-yon.mp4
for f in out/desert-gas.mp4 web/scrub.mp4; do ffprobe -v error -select_streams v -show_entries stream=width,height,r_frame_rate,nb_frames:format=duration,size -of csv=p=0 $f; done
