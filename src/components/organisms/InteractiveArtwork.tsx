import { useEffect, useRef, useState } from 'react';
import { useArtworkStore } from '../../stores/artworkStore';
import { generateSmallImageUrl } from '@utils/imageUtils';

interface InteractiveArtworkProps {
  imageUrl: string;
}

// Helper to get default/original URL by removing quality/size parameters
const getDefaultUrl = (url: string): string => {
  // WikiArt: Handle two formats due to API inconsistency
  // Format 1: .../painting.jpg!HD.jpg → .../painting.jpg
  // Format 2: .../painting!HD.jpg → .../painting.jpg
  if (url.includes('wikiart.org')) {
    if (/\.jpg![A-Za-z]+\.jpg$/i.test(url)) {
      // Base already has .jpg extension - just remove format suffix
      return url.replace(/![A-Za-z]+\.jpg$/i, '');
    } else {
      // Base doesn't have .jpg - replace format suffix with .jpg
      return url.replace(/![A-Za-z]+\.jpg$/i, '.jpg');
    }
  }

  // Art Institute (IIIF): Use 'full' for original size
  // Example: .../full/843,/0/default.jpg → .../full/full/0/default.jpg
  if (url.includes('artic.edu')) {
    return url.replace(/\/full\/\d+,\//, '/full/full/');
  }

  // For other formats, return as-is
  return url;
};

export const InteractiveArtwork = ({ imageUrl }: InteractiveArtworkProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const effectRef = useRef<Effect | null>(null);
  const { currentArtwork } = useArtworkStore();
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  // Fallback level: 0 = HD, 1 = Large, 2 = Default (no suffix)
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [isUpgradingToHD, setIsUpgradingToHD] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Progressive loading: Start with small image, upgrade to HD
  useEffect(() => {
    const init = () => {
      // Fade out before switching to new artwork
      setIsTransitioning(true);

      // Short delay for fade-out effect
      setTimeout(() => {
        // Generate small image URL from HD URL (works for all museums)
        const smallImageUrl = generateSmallImageUrl(imageUrl);

        // Only use progressive loading if we successfully generated a different small URL
        if (smallImageUrl !== imageUrl) {
          console.group('🖼️ Progressive Image Loading');
          console.log('Small URL:', smallImageUrl);
          console.log('HD URL:', imageUrl);
          console.log('Default URL:', getDefaultUrl(imageUrl));
          console.groupEnd();

          setCurrentImageUrl(smallImageUrl);
          setFallbackLevel(1); // Start at "small" level
          setIsUpgradingToHD(false);

        // Preload HD image in background
        const hdImage = new Image();
        hdImage.crossOrigin = 'anonymous';

        hdImage.onload = () => {
          console.log('✨ Progressive load: HD image loaded successfully');
          setIsUpgradingToHD(true);
          // Small delay to ensure smooth transition
          setTimeout(() => {
            setCurrentImageUrl(imageUrl);
            setFallbackLevel(0);
            setIsUpgradingToHD(false);
            setIsTransitioning(false); // Fade in
          }, 100);
        };

        hdImage.onerror = (e) => {
          console.warn('⚠️ Progressive load: HD failed to load');
          console.warn('  Failed URL:', imageUrl);
          console.warn('  Error:', e);
          setIsUpgradingToHD(false);

          // Try to load base image (no size suffix) instead of staying with tiny image
          const defaultUrl = getDefaultUrl(imageUrl);
          console.log('  Attempting fallback to base URL:', defaultUrl);

          if (defaultUrl !== imageUrl && defaultUrl !== smallImageUrl) {
            // Preload the default URL before switching
            const defaultImage = new Image();
            defaultImage.crossOrigin = 'anonymous';

            defaultImage.onload = () => {
              console.log('✅ Fallback to base image successful');
              setCurrentImageUrl(defaultUrl);
              setFallbackLevel(2);
              setIsTransitioning(false); // Fade in
            };

            defaultImage.onerror = () => {
              console.error('❌ Base image also failed, staying with small image');
              setIsTransitioning(false); // Fade in even with small image
            };

            defaultImage.src = defaultUrl;
          } else {
            console.warn('  No fallback available, staying with small image');
          }
        };

        hdImage.src = imageUrl;
        } else {
          // Couldn't generate small version, load HD directly
          console.log('🖼️ Loading HD image directly (no size transformation available)');
          setCurrentImageUrl(imageUrl);
          setFallbackLevel(0);
          setIsUpgradingToHD(false);
          // Fade in after a brief moment
          setTimeout(() => setIsTransitioning(false), 100);
        }
      }, 300); // 300ms fade-out duration
    };

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
    // HD → Small → Default (no suffix)
    const handleImageError = () => {
      if (fallbackLevel === 0) {
        // Try small version (generated from HD URL)
        const smallUrl = generateSmallImageUrl(imageUrl);
        if (smallUrl !== imageUrl) {
          console.warn(`Failed to load HD image, trying small: ${smallUrl}`);
          setCurrentImageUrl(smallUrl);
          setFallbackLevel(1);
        } else {
          // Can't generate small version, try default
          const defaultUrl = getDefaultUrl(currentImageUrl);
          console.warn(`Failed to load HD image, trying default: ${defaultUrl}`);
          setCurrentImageUrl(defaultUrl);
          setFallbackLevel(2);
        }
      } else if (fallbackLevel === 1) {
        // Try default URL (remove size suffixes)
        const defaultUrl = getDefaultUrl(currentImageUrl);
        console.warn(`Failed to load small image, trying default: ${defaultUrl}`);
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
        className="fixed inset-0 w-full h-full transition-opacity duration-500"
        style={{
          zIndex: 0,
          backgroundImage: `url(${currentImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px)',
          transform: 'scale(1.1)', // Hide blur edges
          opacity: isTransitioning ? 0 : isUpgradingToHD ? 0.7 : 1,
        }}
      />
      {/* Frosted glass overlay */}
      <div
        className="fixed inset-0 w-full h-full transition-opacity duration-500"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isTransitioning ? 0 : 1,
        }}
      />
      {/* Canvas with dissolving effect - contain mode */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full transition-opacity duration-500"
        style={{
          zIndex: 2,
          opacity: isTransitioning ? 0 : isUpgradingToHD ? 0.9 : 1,
        }}
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
    this.ease = 0.08; // Lower = slower recovery to original position
    this.friction = 0.92; // Higher = less velocity decay, longer effect
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
      // Calculate mouse speed (magnitude of velocity vector)
      const mouseSpeed = Math.hypot(this.effect.mouse.vx, this.effect.mouse.vy);

      // Distance-based falloff: cells closer to mouse are affected more
      const distanceFactor = 1 - distance / this.effect.mouse.radius;

      // Force based on mouse speed and distance
      // Higher speed = stronger force, closer distance = stronger effect
      const forceMagnitude = mouseSpeed * distanceFactor * 2.5; // 5.0 is sensitivity

      // Apply force in the direction the mouse is moving (drag effect)
      // Normalize mouse velocity and apply force
      if (mouseSpeed > 0) {
        const normalizedVx = this.effect.mouse.vx / mouseSpeed;
        const normalizedVy = this.effect.mouse.vy / mouseSpeed;
        this.vx += normalizedVx * forceMagnitude;
        this.vy += normalizedVy * forceMagnitude;
      }
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
    prevX: number;
    prevY: number;
    vx: number;
    vy: number;
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
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      radius: 75,
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
      // Store previous position
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;

      // Update current position
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;

      // Calculate mouse velocity
      this.mouse.vx = this.mouse.x - this.mouse.prevX;
      this.mouse.vy = this.mouse.y - this.mouse.prevY;

      this.startAnimation();
    };

    this.handleMouseEnter = () => {
      this.startAnimation();
    };

    this.handleMouseLeave = () => {
      this.mouse.x = 0;
      this.mouse.y = 0;
      this.mouse.vx = 0;
      this.mouse.vy = 0;
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

    // Apply velocity decay for smoother effect when mouse slows/stops
    this.mouse.vx *= 0.95;
    this.mouse.vy *= 0.95;

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
