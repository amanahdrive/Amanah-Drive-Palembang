import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

type Props = { size?: number; color?: string };

export function InstagramIcon({ size = 20, color = "#E1306C" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={2} />
      <Circle cx="17.5" cy="6.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function TikTokIcon({ size = 20, color = "#111111" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 3h2.2c.3 1.8 1.4 3.3 3.1 4v2.3c-1.3-.1-2.5-.5-3.6-1.2v6.4a5.3 5.3 0 1 1-5.3-5.3c.3 0 .5 0 .8.1v2.4a2.9 2.9 0 1 0 2.1 2.8V3Z"
        fill={color}
      />
    </Svg>
  );
}

export function FacebookIcon({ size = 20, color = "#1877F2" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M22 12a10 10 0 1 0-11.56 9.88v-7h-2.5V12h2.5V9.8c0-2.47 1.47-3.84 3.72-3.84 1.08 0 2.2.2 2.2.2v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.73l-.44 2.88h-2.3v7A10 10 0 0 0 22 12Z" />
    </Svg>
  );
}
