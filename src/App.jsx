import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useDropzone } from 'react-dropzone';
import { clamp } from 'lodash';
import { RemoveScroll } from 'react-remove-scroll';

export default function App() {
  const [imageOne, setImageOne] = useState(null);
  const [imageTwo, setImageTwo] = useState(null);
  const [imageOneInfo, setImageOneInfo] = useState(null);
  const [imageTwoInfo, setImageTwoInfo] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [sliderEnabled, setSliderEnabled] = useState(true);
  const containerRef = useRef(null);
  const windowRef = useRef(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const updateWindowSize = () => {
    if (windowRef.current) {
      const { top } = windowRef.current.getBoundingClientRect();
      setWindowSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight - top - 20
      });
    }
  };

  useEffect(() => {
    if (imageOne && imageTwo) {
      updateWindowSize();
    }
  }, [imageOne, imageTwo]);

  useEffect(() => {
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const formatFileSize = (size) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
  };

  const onDrop = (acceptedFiles, setImage, setImageInfo) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImageInfo({ name: file.name, size: formatFileSize(file.size) });
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps: getRootPropsOne, getInputProps: getInputPropsOne } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, setImageOne, setImageOneInfo),
    accept: 'image/jpeg, image/png, image/gif, image/webp',
    multiple: false,
  });

  const { getRootProps: getRootPropsTwo, getInputProps: getInputPropsTwo } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, setImageTwo, setImageTwoInfo),
    accept: 'image/jpeg, image/png, image/gif, image/webp',
    multiple: false,
  });

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const container = containerRef.current;
    if (container) {
      const newScale = clamp(scale + event.deltaY * -0.01, 1, 30);
      setScale(newScale);
    }
  }, [scale]);

  const handleMouseDown = useCallback((event) => {
    if (event.button === 0 && isDragging) {
      const container = containerRef.current;
      if (container) {
        const startX = event.clientX - position.x;
        const startY = event.clientY - position.y;

        const handleMouseMove = (moveEvent) => {
          const newX = moveEvent.clientX - startX;
          const newY = moveEvent.clientY - startY;
          setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          setSliderEnabled(true);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }
  }, [position, isDragging]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Shift' || event.key === ' ') {
      setIsDragging(true);
      setSliderEnabled(false);
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    if (event.key === 'Shift' || event.key === ' ') {
      setIsDragging(false);
      setSliderEnabled(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div {...getRootPropsOne()} style={{ width: '48%', height: '30px', border: '2px dashed #ccc', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <input {...getInputPropsOne()} />
          {imageOneInfo ? (
            <p>{imageOneInfo.name} ({imageOneInfo.size})</p>
          ) : (
            <p>Drag & drop Image One here, or click to select</p>
          )}
        </div>
        <div {...getRootPropsTwo()} style={{ width: '48%', height: '30px', border: '2px dashed #ccc', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <input {...getInputPropsTwo()} />
          {imageTwoInfo ? (
            <p>{imageTwoInfo.name} ({imageTwoInfo.size})</p>
          ) : (
            <p>Drag & drop Image Two here, or click to select</p>
          )}
        </div>
      </div>

      {imageOne && imageTwo && (
        <div 
          ref={windowRef}
          style={{ 
            width: windowSize.width,
            height: windowSize.height,
            margin: '0 auto',
            border: '1px solid #ccc',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <RemoveScroll>
            <div 
              ref={containerRef} 
              onWheel={handleWheel} 
              onMouseDown={handleMouseDown} 
              
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'absolute',
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={imageOne} alt="Image one" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />}
                itemTwo={<ReactCompareSliderImage  src={imageTwo} alt="Image two" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />}
                onPointerDown={(ev) => {
                  if (sliderEnabled) {
                    ev.preventDefault();
                  }
                }}
        
                style={{ width: '100%', height: '100%', pointerEvents: sliderEnabled ? 'auto' : 'none' }}
              />
            </div>
          </RemoveScroll>
        </div>
      )}
    </div>
  );
}
