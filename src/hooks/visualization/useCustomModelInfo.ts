// src/hooks/visualization/useCustomModelInfo.ts

import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import type { CustomModelInfo } from '@/utils/machine/CustomModelCollision';

/**
 * Hook to extract CustomModelInfo from uploaded model files
 * This bridges the visualization model loading with VirtualMill collision detection
 */
export function useCustomModelInfo(
  modelFile: File | null,
  stockSize: [number, number, number],
  stockPosition: [number, number, number],
  stockRotation: [number, number, number] = [0, 0, 0]
): {
  customModelInfo: CustomModelInfo | null;
  isLoading: boolean;
  error: string | null;
} {
  const [customModelInfo, setCustomModelInfo] = useState<CustomModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModelGeometry = useCallback(async (file: File): Promise<THREE.BufferGeometry> => {
    const url = URL.createObjectURL(file);
    
    try {
      const isSTL = file.name.toLowerCase().endsWith('.stl');
      let geometry: THREE.BufferGeometry;
      
      if (isSTL) {
        const loader = new STLLoader();
        geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      } else {
        // Assume OBJ
        const loader = new OBJLoader();
        const object = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        
        const mesh = object.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh;
        if (!mesh || !mesh.geometry) {
          throw new Error('No valid mesh found in OBJ file');
        }
        geometry = mesh.geometry;
      }
      
      return geometry;
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const processGeometry = useCallback((
    geometry: THREE.BufferGeometry,
    size: [number, number, number],
    position: [number, number, number],
    rotation: [number, number, number]
  ): CustomModelInfo => {
    // Clone the geometry to avoid modifying the original
    const processedGeometry = geometry.clone();
    
    // Center the geometry
    processedGeometry.computeBoundingBox();
    const boundingBox = processedGeometry.boundingBox!;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    processedGeometry.translate(-center.x, -center.y, -center.z);

    // Calculate scale to fit within the specified size
    const geometrySize = new THREE.Vector3();
    boundingBox.getSize(geometrySize);
    const scaleX = size[0] / geometrySize.x;
    const scaleY = size[1] / geometrySize.y;
    const scaleZ = size[2] / geometrySize.z;
    const uniformScale = Math.min(scaleX, scaleY, scaleZ);

    // Apply scale
    processedGeometry.scale(uniformScale, uniformScale, uniformScale);

    // Recompute bounding box after transformations
    processedGeometry.computeBoundingBox();
    
    // Ensure minX is at -size[0]/2 (flush with stage for horizontal mills)
    const bbox2 = processedGeometry.boundingBox!;
    const minX = bbox2.min.x;
    processedGeometry.translate(-minX - size[0]/2, 0, 0);

    // Final bounding box
    processedGeometry.computeBoundingBox();
    const finalBbox = processedGeometry.boundingBox!;

    return {
      geometry: processedGeometry,
      position,
      rotation,
      scale: [uniformScale, uniformScale, uniformScale],
      boundingBox: finalBbox
    };
  }, []);

  useEffect(() => {
    if (!modelFile) {
      setCustomModelInfo(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const geometry = await loadModelGeometry(modelFile);
        
        if (cancelled) {
          geometry.dispose();
          return;
        }

        const modelInfo = processGeometry(geometry, stockSize, stockPosition, stockRotation);
        
        if (!cancelled) {
          setCustomModelInfo(modelInfo);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error loading model';
          setError(errorMessage);
          setCustomModelInfo(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [modelFile, stockSize, stockPosition, stockRotation, loadModelGeometry, processGeometry]);

  return {
    customModelInfo,
    isLoading,
    error
  };
}
