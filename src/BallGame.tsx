import React, { useRef, useEffect, useState } from "react";

const BallGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const setupCanvas = () => {
      const scale = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    setupCanvas();
    window.addEventListener("resize", setupCanvas);

    const scale = window.devicePixelRatio || 1;
    const getCanvasCenter = () => ({
      x: canvas.width / (2 * scale),
      y: canvas.height / (2 * scale),
    });

    let center = getCanvasCenter();

    const commonGapStart = -Math.PI / 2;
    const particleCount = 100;
    const gravity = 0.15;

    const ringColors = [
      "#dfb220",
      "#ea2636",
      "#6dc993",
      "#fc2936",
      "#eeb421",
      "#6dc993",
    ];

    let angle = Math.random() * 2 * Math.PI;
    let speed = 1.5 + Math.random() * 1.5;

    let ball = {
      x: center.x,
      y: center.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
    };

    let rings = Array.from({ length: 6 }, (_, i) => {
      const r = 80 + i * 35;
      return {
        r,
        gapStart: commonGapStart,
        gapSize: Math.PI / 4,
        rotation: 0,
        rotationSpeed: 0.02,
        destroyed: false,
        particles: [] as any[],
        color: ringColors[i % ringColors.length],
      };
    });

    const createParticles = (cx: number, cy: number, ringRadius: number) => {
      return Array.from({ length: particleCount }, () => {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1 + Math.random() * 2;
        return {
          x: cx + ringRadius * Math.cos(angle),
          y: cy + ringRadius * Math.sin(angle),
          vx: speed * Math.cos(angle),
          vy: speed * Math.sin(angle),
          alpha: 1,
        };
      });
    };

    const animate = () => {
      center = getCanvasCenter();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      rings.forEach((ring) => {
        if (ring.destroyed) {
          ring.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.01;
            ctx.fillStyle = `rgba(0, 0, 0, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
          });
          ring.particles = ring.particles.filter((p) => p.alpha > 0);
          return;
        }

        ring.rotation += ring.rotationSpeed;
        const { r, gapStart, gapSize, rotation, color } = ring;
        const rotatedGapStart = (gapStart + rotation) % (2 * Math.PI);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(
          center.x,
          center.y,
          r,
          rotatedGapStart + gapSize,
          rotatedGapStart + 2 * Math.PI
        );
        ctx.stroke();
        ctx.restore();
      });

      if (ball.y < center.y) {
        ball.vy += gravity * 1.2;
      } else {
        ball.vy += gravity * 0.8;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      ctx.save();
      ctx.fillStyle = "#FF0000";
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      rings.forEach((ring) => {
        if (ring.destroyed) return;

        const dx = ball.x - center.x;
        const dy = ball.y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
        const rotatedGapStart = (ring.gapStart + ring.rotation) % (2 * Math.PI);
        const gapEnd = (rotatedGapStart + ring.gapSize) % (2 * Math.PI);

        const insideRing =
          dist + ball.radius >= ring.r && dist - ball.radius <= ring.r + 2;

        if (insideRing) {
          const inGap =
            gapEnd > rotatedGapStart
              ? normalizedAngle >= rotatedGapStart && normalizedAngle <= gapEnd
              : normalizedAngle >= rotatedGapStart || normalizedAngle <= gapEnd;

          if (inGap) {
            ring.destroyed = true;
            ring.particles = createParticles(center.x, center.y, ring.r);
          } else {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2.5 * dot * nx;
            ball.vy -= 2.5 * dot * ny;
          }
        }
      });

      const logicalWidth = canvas.width / scale;
      const logicalHeight = canvas.height / scale;

      if (ball.x - ball.radius < 0 || ball.x + ball.radius > logicalWidth) {
        ball.vx *= -0.9;
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > logicalHeight) {
        ball.vy *= -0.8;
        ball.y = Math.max(
          ball.radius,
          Math.min(logicalHeight - ball.radius, ball.y)
        );
      }
      const maxComponentSpeed = 6;
      ball.vx = Math.max(
        -maxComponentSpeed,
        Math.min(maxComponentSpeed, ball.vx)
      );
      ball.vy = Math.max(
        -maxComponentSpeed,
        Math.min(maxComponentSpeed, ball.vy)
      );

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", setupCanvas);
    };
  }, [resetKey]);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {/* <button
        onClick={() => {
          setResetKey((k) => k + 1);
        }}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "10px 20px",
          fontSize: "16px",
        }}
      >
        Сброс
      </button> */}
    </div>
  );
};

export default BallGame;
