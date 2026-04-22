# Drone Prototype Test

This repository contains the prototype code for the drone video feed, shape detection, and the accompanying web interface.

## Project Structure

* **`shape_detector_basic.py`**: A basic script for detecting shapes (targets) in video feeds using OpenCV. It processes raw feeds, applies edge detection, and identifies potential targets.
* **`uv_drone_prototype.py`**: The main prototype script for handling live drone video feeds.
* **`server.py`**: The backend server (likely handling requests from the UI or managing the drone data).
* **`test_route.py`**: Testing utilities for the server routes.
* **`nightfall-ui/`**: The frontend web interface built with React and Vite. It serves as the dashboard for the drone feed.

## Getting Started

### Prerequisites
Make sure you have Python installed along with the required dependencies (like OpenCV and Flask/FastAPI depending on the server framework).
Node.js is required for running the web interface.

### Running the Frontend
1. Navigate to the UI directory: `cd nightfall-ui`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Running the Backend/Scripts
You can run the individual python scripts via:
```bash
python shape_detector_basic.py
# or
python server.py
```
