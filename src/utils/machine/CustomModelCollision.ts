// src/utils/machine/CustomModelCollision.ts

import * as THREE from 'three';
import type { Position3D, BoundingBox, CollisionResult } from './VirtualMill';

/**
 * Custom model geometry information for collision detection
 */
export interface CustomModelInfo {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  boundingBox: THREE.Box3;
}

/**
 * Enhanced collision detection utilities for custom models
 */
export class CustomModelCollision {
  
  /**
   * Create a raycaster for collision detection
   */
  private static createRaycaster(
    startPos: Position3D, 
    axis: 'X' | 'Y' | 'Z', 
    direction: number
  ): THREE.Raycaster {
    const origin = new THREE.Vector3(startPos.X, startPos.Y, startPos.Z);
    const rayDirection = new THREE.Vector3(
      axis === 'X' ? direction : 0,
      axis === 'Y' ? direction : 0,
      axis === 'Z' ? direction : 0
    );
    
    return new THREE.Raycaster(origin, rayDirection);
  }
  
  /**
   * Create a mesh object for intersection testing
   */
  private static createMeshForIntersection(modelInfo: CustomModelInfo): THREE.Mesh {
    const geometry = modelInfo.geometry.clone();
    
    // Apply transformations to geometry
    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromEuler(new THREE.Euler(
      modelInfo.rotation[0],
      modelInfo.rotation[1], 
      modelInfo.rotation[2]
    ));
    matrix.scale(new THREE.Vector3(...modelInfo.scale));
    matrix.setPosition(...modelInfo.position);
    
    geometry.applyMatrix4(matrix);
    
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  }
  
  /**
   * Check collision between probe ray and custom model
   */
  static checkProbeCollision(
    startPos: Position3D,
    axis: 'X' | 'Y' | 'Z',
    direction: number,
    distance: number,
    modelInfo: CustomModelInfo,
    toolRadius: number = 0
  ): CollisionResult {
    try {
      // Create raycaster for probe direction
      const raycaster = this.createRaycaster(startPos, axis, direction);
      raycaster.far = distance;
      
      // Create mesh for intersection testing
      const mesh = this.createMeshForIntersection(modelInfo);
      
      // Account for tool radius by expanding the geometry or checking multiple rays
      const intersections = this.checkMultipleRays(raycaster, mesh, toolRadius, axis);
      
      mesh.geometry.dispose();
      
      if (intersections.length > 0) {
        // Get closest intersection
        const closest = intersections[0];
        
        return {
          collision: true,
          contactPoint: {
            X: closest.point.x,
            Y: closest.point.y,
            Z: closest.point.z
          },
          penetrationDepth: closest.distance
        };
      }
      
      return { collision: false };
      
    } catch (error) {
      console.error('Error in custom model collision detection:', error);
      return { collision: false };
    }
  }
  
  /**
   * Check multiple rays to account for tool radius
   */
  private static checkMultipleRays(
    centerRaycaster: THREE.Raycaster,
    mesh: THREE.Mesh,
    toolRadius: number,
    axis: 'X' | 'Y' | 'Z'
  ): THREE.Intersection[] {
    const allIntersections: THREE.Intersection[] = [];
    
    // Check center ray
    const centerIntersections = centerRaycaster.intersectObject(mesh);
    allIntersections.push(...centerIntersections);
    
    if (toolRadius > 0) {
      // Create additional rays around the tool perimeter
      const numRays = 8; // Octagon approximation
      const angleStep = (2 * Math.PI) / numRays;
      
      for (let i = 0; i < numRays; i++) {
        const angle = i * angleStep;
        const offset = this.getRadialOffset(axis, angle, toolRadius);
        
        const offsetOrigin = centerRaycaster.ray.origin.clone().add(offset);
        const offsetRaycaster = new THREE.Raycaster(offsetOrigin, centerRaycaster.ray.direction);
        offsetRaycaster.far = centerRaycaster.far;
        
        const offsetIntersections = offsetRaycaster.intersectObject(mesh);
        allIntersections.push(...offsetIntersections);
      }
    }
    
    // Sort by distance and return all intersections
    return allIntersections.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * Get radial offset for tool radius compensation
   */
  private static getRadialOffset(
    axis: 'X' | 'Y' | 'Z',
    angle: number,
    radius: number
  ): THREE.Vector3 {
    const cos = Math.cos(angle) * radius;
    const sin = Math.sin(angle) * radius;
    
    switch (axis) {
      case 'X':
        return new THREE.Vector3(0, cos, sin);
      case 'Y':
        return new THREE.Vector3(cos, 0, sin);
      case 'Z':
        return new THREE.Vector3(cos, sin, 0);
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }
  
  /**
   * Get bounding box of custom model in world coordinates
   */
  static getModelBoundingBox(modelInfo: CustomModelInfo): BoundingBox {
    const bbox = modelInfo.boundingBox.clone();
    
    // Apply transformations
    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromEuler(new THREE.Euler(
      modelInfo.rotation[0],
      modelInfo.rotation[1], 
      modelInfo.rotation[2]
    ));
    matrix.scale(new THREE.Vector3(...modelInfo.scale));
    matrix.setPosition(...modelInfo.position);
    
    bbox.applyMatrix4(matrix);
    
    return {
      min: {
        X: bbox.min.x,
        Y: bbox.min.y,
        Z: bbox.min.z
      },
      max: {
        X: bbox.max.x,
        Y: bbox.max.y,
        Z: bbox.max.z
      }
    };
  }
  
  /**
   * Check if a point is inside the custom model
   */
  static isPointInside(
    point: Position3D,
    modelInfo: CustomModelInfo
  ): boolean {
    // Create a ray from the point in any direction
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(point.X, point.Y, point.Z),
      new THREE.Vector3(1, 0, 0) // Ray in +X direction
    );
    
    const mesh = this.createMeshForIntersection(modelInfo);
    const intersections = raycaster.intersectObject(mesh);
    mesh.geometry.dispose();
    
    // If odd number of intersections, point is inside
    return intersections.length % 2 === 1;
  }
}
