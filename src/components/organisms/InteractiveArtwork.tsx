import { useEffect, useRef, useState } from 'react';
import { useArtworkStore } from '../../stores/artworkStore';

interface InteractiveArtworkProps {
  imageUrl: string;
}

// Helper to get default URL by removing quality suffix (!HD.jpg or !Large.jpg)
const getDefaultUrl = (url: string): string => {
  // Remove !HD.jpg or !Large.jpg suffix, keep just .jpg
  return url.replace(/!(HD|Large)\.jpg$/, '.jpg');
};

export const InteractiveArtwork = ({ imageUrl }: InteractiveArtworkProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const effectRef = useRef<Effect | null>(null);
  const { currentArtwork } = useArtworkStore();
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  // Fallback level: 0 = HD, 1 = Large, 2 = Default (no suffix)
  const [fallbackLevel, setFallbackLevel] = useState(0);

  useEffect(() => {
    const init = () => {
      setCurrentImageUrl(imageUrl);
      setFallbackLevel(0);
    }

    init();
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Wait for image to load before creating effect
    const handleImageLoad = () => {
      // Cleanup previous effect
      effectRef.current?.destroy();
      // Create new effect (handles its own animation internally)
      effectRef.current = new Effect(canvas, image);
    };

    // Handle image loading errors (404, etc.) with 3-level fallback
    // HD → Large → Default (no suffix)
    const handleImageError = () => {
      if (fallbackLevel === 0 && currentArtwork?.imageUrlSmall) {
        // Try Large version
        console.warn(`Failed to load HD image, trying Large: ${currentImageUrl}`);
        setCurrentImageUrl(currentArtwork.imageUrlSmall);
        setFallbackLevel(1);
      } else if (fallbackLevel === 1) {
        // Try default URL (remove !Large.jpg suffix)
        const defaultUrl = getDefaultUrl(currentImageUrl);
        console.warn(`Failed to load Large image, trying default: ${defaultUrl}`);
        setCurrentImageUrl(defaultUrl);
        setFallbackLevel(2);
      } else {
        console.error(`Failed to load image after all fallbacks: ${currentImageUrl}`);
      }
    };

    if (image.complete && image.naturalHeight !== 0) {
      handleImageLoad();
    } else {
      image.addEventListener('load', handleImageLoad);
      image.addEventListener('error', handleImageError);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        effectRef.current?.resize(window.innerWidth, window.innerHeight);
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      effectRef.current?.destroy();
      image.removeEventListener('load', handleImageLoad);
      image.removeEventListener('error', handleImageError);
    };
  }, [currentImageUrl, fallbackLevel, currentArtwork]);

  return (
    <>
      {/* Blurred background layer - cover mode */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: 0,
          backgroundImage: `url(${currentImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px)',
          transform: 'scale(1.1)', // Hide blur edges
        }}
      />
      {/* Frosted glass overlay */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
      {/* Canvas with dissolving effect - contain mode */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 2 }}
      />
      <img
        ref={imageRef}
        src={currentImageUrl}
        alt=""
        className="hidden"
        crossOrigin="anonymous"
      />
    </>
  );
};

class Cell {
  effect: Effect;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  slideX: number;
  slideY: number;
  vx: number;
  vy: number;
  ease: number;
  friction: number;
  col: number;
  row: number;
  movement: number;

  constructor(effect: Effect, x: number, y: number, col: number, row: number) {
    this.effect = effect;
    this.x = x;
    this.y = y;
    this.width = this.effect.cellWidth;
    this.height = this.effect.cellHeight;
    this.image = this.effect.image;
    this.slideX = 0;
    this.slideY = 0;
    this.vx = 0;
    this.vy = 0;
    this.ease = 0.3;
    this.friction = 0.7;
    this.col = col;
    this.row = row;
    this.movement = 0;
  }

  draw(context: CanvasRenderingContext2D) {
    // Source coordinates in the original image
    const srcX = this.col * this.effect.spriteWidth;
    const srcY = this.row * this.effect.spriteHeight;

    context.drawImage(
      this.image,
      srcX + this.slideX,
      srcY + this.slideY,
      this.effect.spriteWidth,
      this.effect.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height,
    );
  }

  update() {
    const dx = this.effect.mouse.x - this.x;
    const dy = this.effect.mouse.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < this.effect.mouse.radius) {
      const angle = Math.atan2(dy, dx);
      const force =
        (this.effect.mouse.radius - distance) / this.effect.mouse.radius;
      this.vx += force * Math.cos(angle) * 8;
      this.vy += force * Math.sin(angle) * 8;
    }
    this.slideX += (this.vx *= this.friction) - this.slideX * this.ease;
    this.slideY += (this.vy *= this.friction) - this.slideY * this.ease;
    this.movement = Math.hypot(this.vx, this.vy);
  }
}

// Effect class - renders image in contain mode with dissolving effect
class Effect {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  image: HTMLImageElement;
  gridSize: number;
  cellWidth: number;
  cellHeight: number;
  spriteWidth: number;
  spriteHeight: number;
  // Contain mode: where the image is positioned on the canvas
  imageX: number;
  imageY: number;
  imageDisplayWidth: number;
  imageDisplayHeight: number;
  imageGrid: Cell[];
  mouse: {
    x: number;
    y: number;
    radius: number;
  };
  // Performance: track if animation is needed
  isAnimating: boolean;
  animationId: number | null;
  ctx: CanvasRenderingContext2D | null;
  idleFrames: number;
  // Bound event handlers for cleanup
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;

  constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.image = image;
    this.ctx = canvas.getContext('2d');

    // Reduced grid size for better performance (40x40 = 1,600 cells vs 100x100 = 10,000)
    this.gridSize = 40;

    // Initialize contain mode properties
    this.imageX = 0;
    this.imageY = 0;
    this.imageDisplayWidth = 0;
    this.imageDisplayHeight = 0;
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.spriteWidth = 0;
    this.spriteHeight = 0;

    this.imageGrid = [];

    this.mouse = {
      x: 0,
      y: 0,
      radius: 100,
    };

    // Performance tracking
    this.isAnimating = false;
    this.animationId = null;
    this.idleFrames = 0;

    this.init();

    // Draw initial static frame
    this.drawStatic();

    // Bind event handlers so they can be removed later
    this.handleMouseMove = (e: MouseEvent) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      this.startAnimation();
    };

    this.handleMouseEnter = () => {
      this.startAnimation();
    };

    this.handleMouseLeave = () => {
      this.mouse.x = 0;
      this.mouse.y = 0;
      // Keep animating briefly to let cells settle
    };

    // Add event listeners
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  init() {
    // Calculate contain mode dimensions
    const canvasRatio = this.width / this.height;
    const imageRatio = this.image.width / this.image.height;

    // Contain mode: scale image to fit entirely within canvas
    if (canvasRatio > imageRatio) {
      // Canvas is wider than image - fit by height
      this.imageDisplayHeight = this.height;
      this.imageDisplayWidth = this.height * imageRatio;
    } else {
      // Canvas is taller than image - fit by width
      this.imageDisplayWidth = this.width;
      this.imageDisplayHeight = this.width / imageRatio;
    }

    // Center the image on the canvas
    this.imageX = (this.width - this.imageDisplayWidth) / 2;
    this.imageY = (this.height - this.imageDisplayHeight) / 2;

    // Grid cells only cover the displayed image area
    this.cellWidth = this.imageDisplayWidth / this.gridSize;
    this.cellHeight = this.imageDisplayHeight / this.gridSize;

    // Map grid cells to source image pixels
    this.spriteWidth = this.image.width / this.gridSize;
    this.spriteHeight = this.image.height / this.gridSize;

    this.imageGrid = [];
    this.createGrid();
  }

  createGrid() {
    // Create cells only within the displayed image bounds
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const x = this.imageX + col * this.cellWidth;
        const y = this.imageY + row * this.cellHeight;
        this.imageGrid.push(new Cell(this, x, y, col, row));
      }
    }
  }

  // Draw static image without animation (used when idle)
  drawStatic() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.imageGrid.forEach((cell) => cell.draw(this.ctx!));
  }

  startAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.idleFrames = 0;
    this.animate();
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Draw final static frame
    this.drawStatic();
  }

  animate = () => {
    if (!this.isAnimating || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    let totalMovement = 0;
    this.imageGrid.forEach((cell) => {
      cell.update();
      cell.draw(this.ctx!);
      totalMovement += cell.movement;
    });

    // Check if we can stop animating (all cells settled)
    if (totalMovement < 0.01 && this.mouse.x === 0 && this.mouse.y === 0) {
      this.idleFrames++;
      // Wait a few frames to ensure cells are truly settled
      if (this.idleFrames > 30) {
        this.stopAnimation();
        return;
      }
    } else {
      this.idleFrames = 0;
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  render(context: CanvasRenderingContext2D) {
    this.imageGrid.forEach((cell) => {
      cell.update();
      cell.draw(context);
    });
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.init();
    this.drawStatic();
  }

  // Cleanup method to remove event listeners
  destroy() {
    this.stopAnimation();
    // Remove event listeners to prevent memory leaks
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseenter', this.handleMouseEnter);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }
}
