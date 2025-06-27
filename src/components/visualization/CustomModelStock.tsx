import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';

export interface CustomModelStockProps {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  modelFile?: File | null;
  modelUrl?: string | null;
  onHover?: (position: [number, number, number] | null) => void;
  onModelLoad?: (boundingBox: THREE.Box3) => void;
  onModelError?: (error: string) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

/**
 * Custom 3D model stock component that can load STL or OBJ files
 */
export const CustomModelStock: React.FC<CustomModelStockProps> = ({
  position,
  size,
  rotation = [0, 0, 0],
  modelFile,
  modelUrl,
  onHover,
  onModelLoad,
  onModelError,
  onSelect,
  isSelected = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  // Memoize object URL creation - only create new URL when file actually changes
  const objectUrl = useMemo(() => {
    if (modelFile && modelFile instanceof File) {
      try {
        const url = URL.createObjectURL(modelFile);
        return url;
      } catch (error) {
        console.error('Error creating object URL:', error);
        if (onModelError) {
          onModelError('Failed to create object URL for the uploaded file');
        }
        return null;
      }
    }
    return null;
  }, [modelFile, onModelError]);

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Load the 3D model - only when URL actually changes
  useEffect(() => {
    const url = objectUrl || modelUrl;
    if (!url) {
      setGeometry(null);
      return;
    }

    let cancelled = false;

    const loadModel = async () => {
      try {
        let loader: STLLoader | OBJLoader;
        let loadedGeometry: THREE.BufferGeometry;

        // Determine file type and use appropriate loader
        const isSTL = url.toLowerCase().includes('.stl') || 
                     (modelFile && modelFile instanceof File && modelFile.name.toLowerCase().endsWith('.stl'));
        
        if (isSTL) {
          loader = new STLLoader();
          loadedGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
            (loader as STLLoader).load(url, 
              (geometry) => resolve(geometry), 
              undefined, 
              (error) => reject(error)
            );
          });
        } else {
          // Assume OBJ format
          loader = new OBJLoader();
          const object = await new Promise<THREE.Group>((resolve, reject) => {
            (loader as OBJLoader).load(url, 
              (group) => resolve(group), 
              undefined, 
              (error) => reject(error)
            );
          });
          
          // Extract geometry from the first mesh in the object
          const mesh = object.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh;
          if (!mesh || !mesh.geometry) {
            throw new Error('No valid mesh found in OBJ file');
          }
          loadedGeometry = mesh.geometry;
        }

        // Check if the effect was cancelled
        if (cancelled) {
          loadedGeometry.dispose();
          return;
        }

        // Center the geometry
        loadedGeometry.computeBoundingBox();
        const boundingBox = loadedGeometry.boundingBox!;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        loadedGeometry.translate(-center.x, -center.y, -center.z);

        // Scale to fit within the specified size
        const geometrySize = new THREE.Vector3();
        boundingBox.getSize(geometrySize);
        
        const scaleX = size[0] / geometrySize.x;
        const scaleY = size[1] / geometrySize.y;
        const scaleZ = size[2] / geometrySize.z;
        const uniformScale = Math.min(scaleX, scaleY, scaleZ);
        
        loadedGeometry.scale(uniformScale, uniformScale, uniformScale);

        // Recompute bounding box after transformations
        loadedGeometry.computeBoundingBox();
        
        // Check if the effect was cancelled before setting geometry
        if (cancelled) {
          loadedGeometry.dispose();
          return;
        }

        setGeometry(loadedGeometry);
        
        if (onModelLoad) {
          onModelLoad(loadedGeometry.boundingBox!);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading 3D model:', error);
          if (onModelError) {
            onModelError(error instanceof Error ? error.message : 'Unknown error loading model');
          }
          setGeometry(null);
        }
      }
    };

    loadModel();

    // Cleanup function to cancel loading if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [objectUrl, modelUrl, size, modelFile]); // Removed onModelLoad and onModelError from deps

  // Cleanup geometry when component unmounts
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((event: { point: { x: number; y: number; z: number } }) => {
    if (onHover && isHovered) {
      const point = event.point;
      onHover([point.x, point.y, point.z]);
    }
  }, [onHover, isHovered]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  const handlePointerDown = useCallback((event: any) => {
    event?.stopPropagation?.();
    if (onSelect) {
      onSelect();
    }
  }, [onSelect]);

  const getStockColor = () => {
    const colors = DEFAULT_VISUALIZATION_CONFIG.colors.stock;
    if (isSelected) return '#4CAF50'; // Green for selected
    if (isHovered) return colors.hovered;
    return colors.default;
  };

  // If no model is loaded, render default box geometry
  if (!geometry || !modelFile) {
    return (
      <mesh 
        ref={meshRef}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={getStockColor()} 
          transparent 
          opacity={DEFAULT_VISUALIZATION_CONFIG.stockOpacity} 
        />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh 
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        geometry={geometry}
      >
        <meshStandardMaterial 
          color={getStockColor()} 
          transparent 
          opacity={DEFAULT_VISUALIZATION_CONFIG.stockOpacity} 
        />
      </mesh>
    </group>
  );
};
