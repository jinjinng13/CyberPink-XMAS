import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

export const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setMode, setHandRotation, setIsHandDetected } = useStore();
  const [loading, setLoading] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoading(false);
        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setLoading(false);
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" }
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        } catch (err) {
          console.error("Webcam error:", err);
        }
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !canvasRef.current || !handLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks.length > 0) {
          setIsHandDetected(true);
          const landmarks = results.landmarks[0];
          
          // Draw landmarks - optional if canvas is hidden, but good for debug if enabled
          const drawingUtils = new DrawingUtils(ctx!);
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FF69B4", lineWidth: 2 });
          drawingUtils.drawLandmarks(landmarks, { color: "#FFFFFF", lineWidth: 1 });

          // 1. Cursor Tracking (Index Finger Tip - 8)
          const indexTip = landmarks[8];
          // Mirror x for UI
          setCursorPos({ 
            x: (1 - indexTip.x) * 100, // percentage
            y: indexTip.y * 100 
          });

          // 2. Pinch Detection (Thumb Tip 4 vs Index Tip 8)
          const thumbTip = landmarks[4];
          const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
          
          // Threshold for pinch (normalized coordinates)
          // Increased to 0.18 to make it much easier to detect/trigger
          const PINCH_THRESHOLD = 0.18;
          
          if (distance < PINCH_THRESHOLD) {
            // Fist/Pinch -> Tree
            setMode('tree');
          } else {
            // Open Hand -> Explode
            setMode('explode');
          }

          // 3. Rotation Control (Hand Centroid X)
          // 0.5 is center. < 0.5 left, > 0.5 right.
          // Inverted because of mirroring: Moving hand "right" in real life moves point "left" in mirrored video
          const centroidX = landmarks[0].x; // Wrist is a stable anchor
          const rotationForce = (0.5 - centroidX) * 1.5; // Multiplier for sensitivity
          setHandRotation(rotationForce);

        } else {
          setIsHandDetected(false);
          setHandRotation(0);
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      handLandmarker?.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [setMode, setHandRotation, setIsHandDetected]);

  return (
    <>
      {/* Hidden container for processing */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none opacity-0 invisible">
        <video 
          ref={videoRef} 
          className="w-48 h-36 object-cover transform -scale-x-100" 
          autoPlay 
          playsInline 
          muted
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-48 h-36 transform -scale-x-100" 
        />
      </div>
      
      {/* Custom Cursor Overlay (Global) - KEEP VISIBLE */}
      {!loading && (
        <div 
          className="fixed w-8 h-8 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-[60] mix-blend-screen transition-opacity duration-200"
          style={{ 
            left: `${cursorPos.x}%`, 
            top: `${cursorPos.y}%`,
            opacity: useStore.getState().isHandDetected ? 1 : 0
          }}
        >
          <div className="absolute inset-0 bg-[#FF69B4] rounded-full blur-sm animate-pulse" />
          <div className="absolute inset-2 bg-white rounded-full" />
        </div>
      )}
    </>
  );
};