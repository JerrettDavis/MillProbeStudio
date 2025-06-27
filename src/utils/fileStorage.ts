// src/utils/fileStorage.ts
// Utilities for persisting File objects in browser storage

export interface SerializedFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: string; // base64 encoded file data
}

/**
 * Convert a File object to a serializable format for storage
 */
export const serializeFile = async (file: File): Promise<SerializedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 using chunks to avoid stack overflow
      let binaryString = '';
      const chunkSize = 8192; // Process in 8KB chunks
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64String = btoa(binaryString);
      
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: base64String
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for serialization'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Convert serialized file data back to a File object
 */
export const deserializeFile = (serializedFile: SerializedFile): File => {
  // Convert base64 back to binary data
  const binaryString = atob(serializedFile.data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create a new File object
  return new File([bytes], serializedFile.name, {
    type: serializedFile.type,
    lastModified: serializedFile.lastModified
  });
};

/**
 * Check if a file is small enough to store (limit to 10MB to avoid localStorage issues)
 */
export const isFileSizeStorable = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};

/**
 * Estimate the storage size of a serialized file (base64 adds ~33% overhead)
 */
export const estimateStorageSize = (file: File): number => {
  return Math.ceil(file.size * 1.33);
};
