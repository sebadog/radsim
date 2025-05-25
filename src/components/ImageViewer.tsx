import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { Maximize, Minimize, ZoomIn, ZoomOut, RotateCw, RotateCcw, Contrast, Ruler, Pencil, SplitSquareVertical, Eraser, Layers, ChevronUp, ChevronDown, Move, Undo, Redo, Save, Download, Eclipse as Flip, FlipHorizontal, FlipVertical, Crosshair, Scan, PanelLeft } from 'lucide-react';
import { fetchCaseById } from '../services/caseService';

interface ImageViewerProps {
  caseId: string;
}

interface Annotation {
  id: string;
  type: 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'freehand';
  points: { x: number; y: number }[];
  color: string;
  text?: string;
  width: number;
}

interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area';
  points: { x: number; y: number }[];
  value: number;
  unit: string;
  label: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ caseId }) => {
  // Basic state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [panMode, setPanMode] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  
  // Window/level controls
  const [windowWidth, setWindowWidth] = useState(255);
  const [windowCenter, setWindowCenter] = useState(127);
  const [isWindowLevelMode, setIsWindowLevelMode] = useState(false);
  const [windowLevelStart, setWindowLevelStart] = useState({ x: 0, y: 0 });
  
  // Measurement tools
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [annotationWidth, setAnnotationWidth] = useState(2);
  
  // Layout controls
  const [layout, setLayout] = useState<'single' | 'sideBySide'>('single');
  const [secondaryImageIndex, setSecondaryImageIndex] = useState(0);
  const [showTools, setShowTools] = useState(true);
  
  // History for undo/redo
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Standard X-ray placeholder image
  const placeholderImage = "https://medlineplus.gov/images/Xray_share.jpg";
  
  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        // Try to get images from the case
        const caseData = await fetchCaseById(caseId!);
        
        if (caseData && caseData.images && caseData.images.length > 0) {
          setImages(caseData.images);
        } else {
          // If no images in the case, use the placeholder
          setImages([placeholderImage]);
        }
      } catch (error) {
        console.error('Error loading images:', error);
        // Fallback to placeholder on error
        setImages([placeholderImage]);
      } finally {
        setLoading(false);
      }
    };
    
    loadImages();
    
    // Reset state when case changes
    setCurrentImageIndex(0);
    setSecondaryImageIndex(0);
    setZoom(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setWindowWidth(255);
    setWindowCenter(127);
    setMeasurements([]);
    setAnnotations([]);
    setHistory([]);
    setHistoryIndex(-1);
    setFlipHorizontal(false);
    setFlipVertical(false);
  }, [caseId]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      // Reset zoom when entering/exiting fullscreen
      if (!isInFullscreen) {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Rotation controls
  const handleRotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  // Flip controls
  const handleFlipHorizontal = () => {
    setFlipHorizontal(prev => !prev);
  };

  const handleFlipVertical = () => {
    setFlipVertical(prev => !prev);
  };

  // Pan mode
  const togglePanMode = () => {
    setPanMode(prev => !prev);
    if (activeTool) setActiveTool(null);
  };

  // Mouse handlers for panning
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (panMode || isWindowLevelMode) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - panOffset.x, 
        y: e.clientY - panOffset.y 
      });
      
      if (isWindowLevelMode) {
        setWindowLevelStart({ x: e.clientX, y: e.clientY });
      }
    } else if (activeTool && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      if (activeTool === 'distance' || activeTool === 'angle') {
        if (currentPoints.length === 0) {
          setCurrentPoints([{ x, y }]);
        } else if (currentPoints.length === 1) {
          const newPoints = [...currentPoints, { x, y }];
          
          // Calculate measurement
          let value = 0;
          let unit = 'px';
          let label = '';
          
          if (activeTool === 'distance') {
            const dx = newPoints[1].x - newPoints[0].x;
            const dy = newPoints[1].y - newPoints[0].y;
            value = Math.sqrt(dx * dx + dy * dy);
            label = `${value.toFixed(1)} ${unit}`;
          }
          
          const newMeasurement: Measurement = {
            id: Date.now().toString(),
            type: activeTool as 'distance' | 'angle',
            points: newPoints,
            value,
            unit,
            label
          };
          
          setMeasurements(prev => [...prev, newMeasurement]);
          setCurrentPoints([]);
        }
      } else if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'arrow') {
        if (currentPoints.length === 0) {
          setCurrentPoints([{ x, y }]);
        } else if (currentPoints.length === 1) {
          const newPoints = [...currentPoints, { x, y }];
          
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: activeTool as 'rectangle' | 'ellipse' | 'arrow',
            points: newPoints,
            color: annotationColor,
            width: annotationWidth
          };
          
          // Save to history for undo/redo
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push([...annotations]);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          
          setAnnotations(prev => [...prev, newAnnotation]);
          setCurrentPoints([]);
        }
      } else if (activeTool === 'freehand') {
        setCurrentPoints([{ x, y }]);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      if (panMode) {
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (isWindowLevelMode) {
        // Adjust window width/level based on mouse movement
        const deltaX = e.clientX - windowLevelStart.x;
        const deltaY = e.clientY - windowLevelStart.y;
        
        setWindowWidth(prev => Math.max(1, prev + deltaX));
        setWindowCenter(prev => Math.max(1, prev - deltaY));
        
        setWindowLevelStart({ x: e.clientX, y: e.clientY });
      }
    } else if (activeTool === 'freehand' && currentPoints.length > 0 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      setCurrentPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if (activeTool === 'freehand' && currentPoints.length > 1) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'freehand',
          points: currentPoints,
          color: annotationColor,
          width: annotationWidth
        };
        
        // Save to history for undo/redo
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...annotations]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setAnnotations(prev => [...prev, newAnnotation]);
        setCurrentPoints([]);
      }
    }
  };

  // Window/level controls
  const toggleWindowLevelMode = () => {
    setIsWindowLevelMode(prev => !prev);
    setPanMode(false);
    setActiveTool(null);
  };

  const resetWindowLevel = () => {
    setWindowWidth(255);
    setWindowCenter(127);
  };

  // Tool selection
  const handleToolSelect = (tool: string) => {
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);
      setPanMode(false);
      setIsWindowLevelMode(false);
    }
  };

  // Clear all annotations
  const clearAnnotations = () => {
    // Save to history for undo/redo
    if (annotations.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...annotations]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    setAnnotations([]);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex >= 0) {
      const newAnnotations = historyIndex > 0 ? history[historyIndex - 1] : [];
      setAnnotations(newAnnotations);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newAnnotations = history[historyIndex + 1];
      setAnnotations(newAnnotations);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Layout controls
  const toggleLayout = () => {
    setLayout(prev => prev === 'single' ? 'sideBySide' : 'single');
  };

  // Toggle tools panel
  const toggleTools = () => {
    setShowTools(prev => !prev);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="bg-black rounded-lg overflow-hidden h-[400px] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mb-4"></div>
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-auto'}`} 
      ref={viewerRef}
    >
      {/* Top toolbar */}
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <div className="text-white text-sm flex items-center">
          <span className="mr-4">Image {currentImageIndex + 1} of {images.length}</span>
          
          {/* Series navigation */}
          <div className="flex items-center mr-4">
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
              className={`p-1 rounded ${currentImageIndex === 0 ? 'text-gray-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              title="Previous Image"
            >
              <ChevronUp size={18} />
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1))}
              disabled={currentImageIndex === images.length - 1}
              className={`p-1 rounded ${currentImageIndex === images.length - 1 ? 'text-gray-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              title="Next Image"
            >
              <ChevronDown size={18} />
            </button>
          </div>
          
          {/* Window/Level display */}
          <div className="text-xs bg-gray-700 px-2 py-1 rounded">
            W: {windowWidth} / L: {windowCenter}
          </div>
        </div>
        
        {/* Right side controls */}
        <div className="flex space-x-2">
          <button 
            onClick={toggleTools}
            className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
            title={showTools ? "Hide Tools" : "Show Tools"}
          >
            <PanelLeft size={18} />
          </button>
          <button 
            onClick={toggleLayout}
            className={`p-1 rounded ${layout === 'sideBySide' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
            title={layout === 'single' ? "Side by Side View" : "Single View"}
          >
            <SplitSquareVertical size={18} />
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
      
      <div className="flex">
        {/* Tools panel */}
        {showTools && (
          <div className="bg-gray-800 p-2 flex flex-col items-center space-y-2 border-r border-gray-700">
            {/* Zoom tools */}
            <button 
              onClick={handleZoomIn} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={handleZoomOut} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            
            {/* Pan tool */}
            <button 
              onClick={togglePanMode} 
              className={`p-1 rounded ${panMode ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Pan"
            >
              <Move size={18} />
            </button>
            
            {/* Rotation tools */}
            <button 
              onClick={handleRotateClockwise} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Rotate Clockwise"
            >
              <RotateCw size={18} />
            </button>
            <button 
              onClick={handleRotateCounterClockwise} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Rotate Counter-clockwise"
            >
              <RotateCcw size={18} />
            </button>
            
            {/* Flip tools */}
            <button 
              onClick={handleFlipHorizontal} 
              className={`p-1 rounded ${flipHorizontal ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={18} />
            </button>
            <button 
              onClick={handleFlipVertical} 
              className={`p-1 rounded ${flipVertical ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Flip Vertical"
            >
              <FlipVertical size={18} />
            </button>
            
            {/* Window/Level tool */}
            <button 
              onClick={toggleWindowLevelMode} 
              className={`p-1 rounded ${isWindowLevelMode ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Window/Level"
            >
              <Contrast size={18} />
            </button>
            <button 
              onClick={resetWindowLevel} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Reset Window/Level"
            >
              <Scan size={18} />
            </button>
            
            <div className="border-t border-gray-700 w-full my-1"></div>
            
            {/* Measurement tools */}
            <button 
              onClick={() => handleToolSelect('distance')} 
              className={`p-1 rounded ${activeTool === 'distance' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Distance Measurement"
            >
              <Ruler size={18} />
            </button>
            
            {/* Annotation tools */}
            <button 
              onClick={() => handleToolSelect('rectangle')} 
              className={`p-1 rounded ${activeTool === 'rectangle' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Rectangle"
            >
              <div className="w-4 h-4 border border-white"></div>
            </button>
            <button 
              onClick={() => handleToolSelect('ellipse')} 
              className={`p-1 rounded ${activeTool === 'ellipse' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Ellipse"
            >
              <div className="w-4 h-4 rounded-full border border-white"></div>
            </button>
            <button 
              onClick={() => handleToolSelect('arrow')} 
              className={`p-1 rounded ${activeTool === 'arrow' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Arrow"
            >
              <div className="transform rotate-45">➜</div>
            </button>
            <button 
              onClick={() => handleToolSelect('freehand')} 
              className={`p-1 rounded ${activeTool === 'freehand' ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600`}
              title="Freehand"
            >
              <Pencil size={18} />
            </button>
            
            {/* Annotation color picker */}
            {(activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'arrow' || activeTool === 'freehand') && (
              <div className="flex flex-col items-center space-y-1">
                <input 
                  type="color" 
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="w-6 h-6 cursor-pointer"
                  title="Annotation Color"
                />
                <select 
                  value={annotationWidth}
                  onChange={(e) => setAnnotationWidth(Number(e.target.value))}
                  className="bg-gray-700 text-white text-xs p-1 rounded"
                  title="Line Width"
                >
                  <option value="1">1px</option>
                  <option value="2">2px</option>
                  <option value="3">3px</option>
                  <option value="5">5px</option>
                </select>
              </div>
            )}
            
            {/* Clear annotations */}
            <button 
              onClick={clearAnnotations} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Clear Annotations"
              disabled={annotations.length === 0}
            >
              <Eraser size={18} />
            </button>
            
            <div className="border-t border-gray-700 w-full my-1"></div>
            
            {/* Undo/Redo */}
            <button 
              onClick={handleUndo} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Undo"
              disabled={historyIndex < 0}
            >
              <Undo size={18} />
            </button>
            <button 
              onClick={handleRedo} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Redo"
              disabled={historyIndex >= history.length - 1}
            >
              <Redo size={18} />
            </button>
            
            {/* Download */}
            <button 
              onClick={() => {
                // Create a download link for the current image
                const link = document.createElement('a');
                link.href = images[currentImageIndex];
                link.download = `image-${currentImageIndex + 1}.jpg`;
                link.click();
              }} 
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
              title="Download Image"
            >
              <Download size={18} />
            </button>
          </div>
        )}
        
        {/* Main content area */}
        <div className={`flex flex-col items-center justify-center p-4 flex-grow ${isFullscreen ? 'h-[calc(100%-80px)]' : ''}`}>
          <div className="flex w-full h-full gap-2">
            {/* Primary image */}
            <div 
              ref={imageContainerRef}
              className={`relative flex items-center justify-center overflow-hidden ${
                isFullscreen ? 'h-full' : 'w-full h-[350px]'
              } ${layout === 'sideBySide' ? 'w-1/2' : 'w-full'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: panMode ? 'move' : isWindowLevelMode ? 'crosshair' : activeTool ? 'crosshair' : 'default' }}
            >
              {images.length > 0 ? (
                <>
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`Case image ${currentImageIndex + 1}`}
                    className={`transition-transform ${isFullscreen ? 'max-h-full max-w-full object-contain' : 'max-h-full object-contain'}`}
                    style={{ 
                      transform: `
                        translate(${panOffset.x}px, ${panOffset.y}px) 
                        scale(${zoom}) 
                        rotate(${rotation}deg)
                        ${flipHorizontal ? 'scaleX(-1)' : ''}
                        ${flipVertical ? 'scaleY(-1)' : ''}
                      `,
                      filter: `contrast(${windowWidth / 255}) brightness(${windowCenter / 127})`,
                    }}
                  />
                  <canvas 
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                </>
              ) : (
                <div className="text-white text-center">
                  <p>No images available for this case</p>
                </div>
              )}
              
              {/* Crosshair for window/level mode */}
              {isWindowLevelMode && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500 opacity-50"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500 opacity-50"></div>
                </div>
              )}
            </div>
            
            {/* Secondary image for side-by-side view */}
            {layout === 'sideBySide' && images.length > 0 && (
              <div className="relative flex items-center justify-center overflow-hidden w-1/2 h-full">
                <img 
                  src={images[secondaryImageIndex]} 
                  alt={`Comparison image ${secondaryImageIndex + 1}`}
                  className="max-h-full object-contain"
                  style={{ 
                    transform: `
                      scale(${zoom}) 
                      rotate(${rotation}deg)
                      ${flipHorizontal ? 'scaleX(-1)' : ''}
                      ${flipVertical ? 'scaleY(-1)' : ''}
                    `,
                    filter: `contrast(${windowWidth / 255}) brightness(${windowCenter / 127})`,
                  }}
                />
                <canvas 
                  ref={secondaryCanvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* Secondary image controls */}
                <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-80 rounded p-1 flex">
                  <button 
                    onClick={() => setSecondaryImageIndex(prev => Math.max(0, prev - 1))}
                    disabled={secondaryImageIndex === 0}
                    className={`p-1 rounded ${secondaryImageIndex === 0 ? 'text-gray-500' : 'text-white hover:bg-gray-700'}`}
                    title="Previous Image"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <span className="text-white text-xs mx-1 flex items-center">
                    {secondaryImageIndex + 1}/{images.length}
                  </span>
                  <button 
                    onClick={() => setSecondaryImageIndex(prev => Math.min(images.length - 1, prev + 1))}
                    disabled={secondaryImageIndex === images.length - 1}
                    className={`p-1 rounded ${secondaryImageIndex === images.length - 1 ? 'text-gray-500' : 'text-white hover:bg-gray-700'}`}
                    title="Next Image"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && !isFullscreen && (
            <div className="mt-4 grid grid-cols-8 gap-2 w-full">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className={`h-16 rounded cursor-pointer overflow-hidden border-2 ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Thumbnails for fullscreen mode - positioned at bottom */}
          {images.length > 1 && isFullscreen && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="flex gap-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg overflow-x-auto max-w-full">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`h-16 w-16 flex-shrink-0 rounded cursor-pointer overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;