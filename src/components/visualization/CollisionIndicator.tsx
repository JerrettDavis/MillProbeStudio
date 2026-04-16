// src/components/visualization/CollisionIndicator.tsx

import React from 'react';
import type { Position3D } from '@/utils/machine/VirtualMill';

export interface CollisionIndicatorProps {
  contactPoints: Position3D[];
  showContactPoints?: boolean;
  contactPointSize?: number;
  contactPointColor?: string;
}

/**
 * Component to visualize collision/contact points in the 3D scene
 */
export const CollisionIndicator: React.FC<CollisionIndicatorProps> = ({
  contactPoints,
  showContactPoints = true,
  contactPointSize = 0.5,
  contactPointColor = '#ff4444'
}) => {
  if (!showContactPoints || contactPoints.length === 0) {
    return null;
  }

  return (
    <group name="collision-indicators">
      {contactPoints.map((point, index) => (
        <group key={`contact-${index}`} position={[point.X, point.Y, point.Z]}>
          {/* Contact point sphere */}
          <mesh>
            <sphereGeometry args={[contactPointSize, 8, 6]} />
            <meshStandardMaterial 
              color={contactPointColor} 
              emissive={contactPointColor}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Glow effect */}
          <mesh>
            <sphereGeometry args={[contactPointSize * 1.5, 8, 6]} />
            <meshStandardMaterial 
              color={contactPointColor}
              transparent
              opacity={0.2}
            />
          </mesh>
          
          {/* Cross indicator for better visibility */}
          <group>
            {/* X axis line */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, contactPointSize * 3]} />
              <meshStandardMaterial 
                color={contactPointColor}
                emissive={contactPointColor}
                emissiveIntensity={0.5}
              />
            </mesh>
            
            {/* Y axis line */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, contactPointSize * 3]} />
              <meshStandardMaterial 
                color={contactPointColor}
                emissive={contactPointColor}
                emissiveIntensity={0.5}
              />
            </mesh>
            
            {/* Z axis line */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, contactPointSize * 3]} />
              <meshStandardMaterial 
                color={contactPointColor}
                emissive={contactPointColor}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};
