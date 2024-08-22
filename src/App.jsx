import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
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
  const [isDragActiveOne, setIsDragActiveOne] = useState(false);
  const [isDragActiveTwo, setIsDragActiveTwo] = useState(false);

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

  const handleDrop = async (event, setImage, setImageInfo, setIsDragActive) => {
    event.preventDefault();
    setIsDragActive(false);

    const items = event.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setImage(e.target.result);
              setImageInfo({ name: file.name, size: formatFileSize(file.size) });
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    }
  };

  const handleDragOver = (event, setIsDragActive) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (setIsDragActive) => {
    setIsDragActive(false);
  };

  const handleClick = (setImage, setImageInfo) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImage(e.target.result);
          setImageInfo({ name: file.name, size: formatFileSize(file.size) });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };


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




  function resetPic() {
    setPosition({ x: 0, y: 0 });
    setScale(1)
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div
          onDrop={(e) => handleDrop(e, setImageOne, setImageOneInfo, setIsDragActiveOne)}
          onDragOver={(e) => handleDragOver(e, setIsDragActiveOne)}
          onDragLeave={() => handleDragLeave(setIsDragActiveOne)}
          onClick={() => handleClick(setImageOne, setImageOneInfo)}
          style={{
            width: '48%',
            height: '30px',
            border: '2px dashed #ccc',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDragActiveOne ? '#e6f7ff' : 'transparent',
            transition: 'background-color 0.3s',
            cursor: 'pointer',
            userSelect : "none"
          }}
        >
          {imageOneInfo ? (
            <p>{imageOneInfo.name} ({imageOneInfo.size})</p>
          ) : (
            <p>Drag & drop Image One here, or click to select</p>
          )}
        </div>
        <button onClick={resetPic}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '10px',
            backgroundColor: isDragActiveOne ? '#e6f7ff' : 'transparent',
            transition: 'background-color 0.3s',
            cursor: 'pointer', 
            userSelect : "none"
          }}

        >Reset</button>
        <div
          onDrop={(e) => handleDrop(e, setImageTwo, setImageTwoInfo, setIsDragActiveTwo)}
          onDragOver={(e) => handleDragOver(e, setIsDragActiveTwo)}
          onDragLeave={() => handleDragLeave(setIsDragActiveTwo)}
          onClick={() => handleClick(setImageTwo, setImageTwoInfo)}
          style={{
            width: '48%',
            height: '30px',
            border: '2px dashed #ccc',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDragActiveTwo ? '#e6f7ff' : 'transparent',
            transition: 'background-color 0.3s',
            cursor: 'pointer',
            userSelect : "none"
          }}
        >
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
                itemTwo={<ReactCompareSliderImage src={imageTwo} alt="Image two" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />}
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
