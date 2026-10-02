'use client';

import type { SpringOptions } from 'motion/react';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useTheme, type ThemeMode } from './ThemeContext';
import './TiltedCard.css';

export const TILTED_CARD_IMAGES: Record<ThemeMode, string> = {
  morning: 'https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789182433/8531d01b-d1d2-4254-87dc-7100fb42e972.png',
  sunset: 'https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789823446/ee00e7da-b4df-4caf-a90d-b906c68e7d11_lawhn2.jpg',
  night: 'https://res.cloudinary.com/dxnb2ozgw/image/upload/v1771993652/typeventure/profile%20pictures/i6j8wnaxlkqalibzpddx.jpg',
};

interface TiltedCardProps {
  imageSrc?: React.ComponentProps<'img'>['src'];
  altText?: string;
  captionText?: string;
  containerHeight?: React.CSSProperties['height'];
  containerWidth?: React.CSSProperties['width'];
  imageHeight?: React.CSSProperties['height'];
  imageWidth?: React.CSSProperties['width'];
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
}

const springValues: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

export default function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  imageHeight = '300px',
  imageWidth = '300px',
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null);

  const { resolvedTheme } = useTheme();
  const src = imageSrc ?? (TILTED_CARD_IMAGES[resolvedTheme] || TILTED_CARD_IMAGES.morning);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1
  });

  const lastY = useRef(0);
  const inside = useRef(false);

  // The tilt listens on the WINDOW and checks the card's live rectangle, instead of relying on the
  // figure receiving mouse events. That way nothing layered above the card (pinned stages, overlays,
  // pointer-events:none parents) can stop it from tilting.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const leave = () => {
      if (!inside.current) return;
      inside.current = false;
      opacity.set(0);
      scale.set(1);
      rotateX.set(0);
      rotateY.set(0);
      rotateFigcaption.set(0);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      const hit =
        rect.width > 0 &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!hit) {
        leave();
        return;
      }

      if (!inside.current) {
        inside.current = true;
        scale.set(scaleOnHover);
        opacity.set(1);
      }

      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;
      rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
      rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
      rotateFigcaption.set(-(offsetY - lastY.current) * 0.6);
      lastY.current = offsetY;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [rotateAmplitude, scaleOnHover, rotateX, rotateY, scale, opacity, rotateFigcaption, x, y]);

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{
        height: containerHeight,
        width: containerWidth
      }}
    >
      {showMobileWarning && (
        <div className="tilted-card-mobile-alert">This effect is not optimized for mobile. Check on desktop.</div>
      )}

      <motion.div
        className="tilted-card-inner"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale
        }}
      >
        <motion.img
          src={src}
          alt={altText}
          className="tilted-card-img"
          style={{
            width: imageWidth,
            height: imageHeight
          }}
        />

        {displayOverlayContent && overlayContent && (
          <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}