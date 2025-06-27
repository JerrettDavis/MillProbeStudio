# Custom 3D Model Visualization Feature

## Overview

The Mill Probe Studio now supports uploading custom 3D models (STL or OBJ files) to replace the default stock visualization in the 3D viewer. This feature allows you to see exactly how your probing operations will interact with your actual workpiece. **Files under 10MB are automatically saved and will be restored when you reload the page.**

## Features

- **File Format Support**: STL and OBJ files
- **Automatic Scaling**: Models are automatically scaled to fit your defined stock dimensions
- **Auto-Centering**: Models are centered within the stock bounds
- **Drag & Drop**: Simple drag-and-drop file upload interface
- **Fallback**: If no model is uploaded, the default box geometry is used
- **Persistence**: Files under 10MB are automatically saved to browser storage and restored on page reload
- **Visual Feedback**: Shows upload progress and storage status

## How to Use

1. **Navigate to the 3D Visualization**: Open the probe sequence visualization tab
2. **Open Stock Controls**: Click the "Stock" button in the floating controls at the bottom of the 3D view
3. **Upload Your Model**: 
   - Click "Click to upload or drag and drop" in the Custom 3D Model section
   - Select an STL or OBJ file from your computer
   - Or drag and drop the file directly onto the upload area
4. **View Your Model**: The uploaded model will automatically replace the default stock visualization
5. **Adjust Stock Dimensions**: If needed, modify the stock size to better fit your model

## File Requirements

- **Supported Formats**: `.stl`, `.obj`
- **File Size**: 
  - No hard limit for display, but smaller files will load faster
  - Files under 10MB will be automatically saved and restored across sessions
  - Files over 10MB will work but won't persist between page reloads
- **Geometry**: Models should represent your actual workpiece geometry

## Technical Details

- Models are loaded using Three.js STL and OBJ loaders
- Automatic scaling preserves the model's proportions while fitting within stock dimensions
- Models are centered at the origin before scaling
- The stock position and size controls still apply to the uploaded model
- Files are stored in browser localStorage using base64 encoding
- File restoration happens automatically when the app loads

## Removing a Model

To remove an uploaded model and return to the default visualization:
1. Open Stock Controls
2. Click the "X" button next to the uploaded file name
3. The visualization will revert to the default box geometry

## Benefits

- **Accurate Visualization**: See exactly how probe operations will interact with your workpiece
- **Better Planning**: Identify potential issues before running the actual probe sequence
- **Professional Presentation**: Create more realistic visualizations for documentation or client presentations
- **Persistent Workflow**: Your models are saved automatically and restored when you return

## File Storage

- **Automatic Persistence**: Files under 10MB are automatically saved to browser localStorage
- **Cross-Session Restore**: Saved models are automatically restored when you reload the page
- **Storage Indicator**: The UI shows whether a file will persist across sessions
- **Manual Management**: You can remove saved files by removing the uploaded model
