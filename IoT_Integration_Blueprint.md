# Integration of Real-Time IoT Telemetry and Sensor Networks in a 3D Smart Campus Digital Twin Platform

**Abstract**—*Modern spatial management systems are undergoing a paradigm shift towards reactive, closed-loop digital twins. While high-fidelity 3D modeling packages provide static visualizations of physical infrastructures, they lack live synchronization with moving entities, environmental fluctuations, and logistical flows. This paper details a comprehensive system architecture and strategic point-of-view (POV) for integrating real-time Internet of Things (IoT) telemetry and sensor networks into a WebGL-based 3D digital twin campus navigation platform. By decoupling physical sensor hardware from the client-side presentation layer via an event-driven Publish-Subscribe (Pub/Sub) messaging pipeline, the platform supports real-time coordinates streaming of smart vehicles and indoor pedestrians. Additionally, we describe how integrating heterogenous sensor grids—including Wi-Fi probe sniffers, smart cameras, environmental monitors, and magnetometers—unlocks high-value capabilities. These include dynamic congestion-based pathfinding recalculation, 3D micro-climate heatmaps, emergency hazard responsive HUD systems, smart parking guidance, and predictive transit scheduling, presenting a complete blueprint for intelligent, responsive institutional digital twins.*

**Index Terms**—*3D Digital Twin, IoT Telemetry, WebSockets, MQTT Broker, Pedestrian Tracking, Wi-Fi Triangulation, BLE access points, Dynamic Rerouting, Smart Campus.*

---

## I. Introduction

Traditional geospatial portals represent institutional facilities as static blueprints. Although these structures are mathematically precise, they remain fundamentally decoupled from the dynamic activities that occur within their borders. University campuses are characterized by continuous movement: hundreds of students traverse hallways, campus shuttles transport passengers, and climate conditions fluctuate across rooms.

To capture these dynamics, we propose a strategic integration framework that links physical IoT sensor networks directly with the GPU-accelerated **MapLibre GL** and **Deck.gl** rendering pipelines of the 3D Smart Campus Digital Twin. By transforming raw sensor telemetry into live coordinate matrices, environmental grids, and adaptive pathfinding weights, the application evolves from a passive navigation utility into a fully cognitive, real-time spatial operating system.

---

## II. Publish-Subscribe Architecture & Telemetry Stream Pipeline

A primary challenge in digital twin engineering is transmitting high-frequency coordinate data from thousands of edge sensors to client browsers without exhausting CPU resources or triggering network bottlenecks. To address this, we define a decoupled **Publish-Subscribe (Pub/Sub)** message brokerage pipeline.

```
+--------------------+
| Physical Sensors   |  ---> [GPS GNSS]  [BLE Beacons]  [Wi-Fi Access Points]
+---------+----------+
          | (Payloads: JSON coordinates and ID vectors)
          v
+---------+----------+
| Edge Gateway       |  ---> Standardizes telemetry packets into unified schemas
+---------+----------+
          | (MQTT / WebSockets protocol)
          v
+---------+----------+
| Message Broker     |  ---> [Mosquitto MQTT] / [FastAPI WebSocket Broker]
+---------+----------+
          | (Low-latency push channels: campus/telemetry/coords)
          v
+---------+----------+
| React Client Core  |  ---> [useIoTStream] React hook parses messages in real-time
+---------+----------+
          | (Direct binding to GPU layer)
          v
+---------+----------+
| WebGL Render Layer |  ---> [Deck.gl Scenegraph/IconLayer] with Lerp smoothing
+--------------------+
```

### A. Broker and Protocol Selection
* **MQTT (Message Queuing Telemetry Transport):** Utilized for hardware-constrained edge devices (e.g., vehicle trackers) due to its minimal packet overhead and high efficiency under low-bandwidth conditions.
* **WebSockets:** Provides a persistent, bidirectional communication bridge between the server and the React browser client. Telemetry packets are delivered to the browser with sub-10ms transmission latency.

### B. Client-Side Rendering with Linear Interpolation (Lerp)
To draw moving vehicles or individuals on the map, standard React state updates would trigger full-component re-renders, causing significant lag. The platform utilizes Deck.gl's **`ScenegraphLayer`** (which renders 3D GLTF models) and offloads coordinate updates to the GPU.

Furthermore, GPS updates typically arrive once per second. To prevent avatars from "teleporting" across the map, we implement a client-side **Linear Interpolation (Lerp)** function tied to the browser's render loop:

$$\vec{P}_{\text{render}}(t) = \text{lerp}\big(\vec{P}_{\text{prev}},\ \vec{P}_{\text{target}},\ t\big)$$

where $t \in [0, 1]$ represents the frame delta. This ensures that vehicles and pedestrians glide smoothly along campus walkways, matching physical speeds perfectly.

---

## III. Indoor-Outdoor Tracking Methodologies

To deliver complete tracking, the system bifurcates positioning into distinct indoor and outdoor methodologies.

| Tracking Space | Primary Sensor Hardware | Method & Algorithm | Accuracy |
| :--- | :--- | :--- | :--- |
| Outdoor (Vehicles, Shuttles) | GNSS / GPS Tracking Modules | Satellite Triangulation over cellular/Wi-Fi gateways | 1m - 3m |
| Indoor (Pedestrians, Assets) | Bluetooth Low Energy (BLE) Access Points & Wi-Fi routers | RSSI Tri-lateration and fingerprinting algorithms | 0.5m - 1.5m |

### A. Geodesic coordinate projection
Outdoor devices transmit geographical coordinates (Latitude, Longitude). The system maps these directly onto the baseline map coordinate system, scaling the z-axis relative to the vehicle's elevation or the ground coordinate surface.

### B. Room-level Indoor Positioning
Indoor devices transmit local beacon IDs and relative signal strengths. Fingerprinting algorithms convert these values into relative $(u, v)$ offsets within single rooms, allowing the digital twin to dynamically locate a person on a specific floor slice.

---

## IV. Revolutionary IoT Features

Connecting active physical sensors to the 3D Digital Twin unlocks six high-value features that enhance campus navigation, safety, and operational efficiency:

### A. Dynamic Route Congestion & Smart Rerouting
* **Sensor Grid:** Wi-Fi probe sniffers detecting personal device signals, combined with smart security cameras running local edge crowd counting algorithms.
* **Mechanism:** Hallways and intersections in the topological network are assigned dynamic cost multipliers. When pedestrian density spikes (e.g., during class transitions), the weight of affected walkway edges increases.
* **Impact:** The pathfinding engine automatically recalculates routes, guiding users through less crowded paths.

### B. Emergency Evacuation HUD Mode
* **Sensor Grid:** Connected building smoke detectors, sprinkler triggers, and smart electronic door locks.
* **Mechanism:** Upon an emergency trigger, the UI transitions to a high-contrast **"Emergency HUD Mode"** (glowing red theme). The hazard origin is mapped in red, and access control states (locked/unlocked) update instantly.
* **Impact:** The navigation engine removes blocked or unsafe pathways from the graph. It calculates safe evacuation routes and visualizes the movement of occupant groups to guide emergency responders directly to trapped individuals.

### C. Real-Time 3D Micro-Climate Heatmaps
* **Sensor Grid:** Ambient temperature, humidity, and Carbon Dioxide ($CO_2$) sensors in classrooms and research laboratories.
* **Mechanism:** Gathers ambient data and projects a continuous, semi-transparent 3D volume heatmap overlay over floor slices using Deck.gl's **`HeatmapLayer`**.
* **Impact:** Facility managers can monitor HVAC efficiency in real time, and students can view room occupancy and air quality before class begins.

### D. Intelligent Parking Guidance
* **Sensor Grid:** Ground magnetometer sensors under parking spaces, or overhead smart camera feeds covering parking lots.
* **Mechanism:** Coordinates of all parking spaces are monitored and mapped to binary states: green (available) or red (occupied).
* **Impact:** Eliminates searching for parking. Drivers entering the campus are guided directly to the closest available spot near their destination building.

### E. Transit Telemetry & Smart Shuttle Schedule
* **Sensor Grid:** GPS trackers, battery management systems (BMS), and passenger weight sensor pads on autonomous electric campus shuttles.
* **Mechanism:** Broadcasts active telemetry parameters (current occupancy, battery charge level, speed, and exact GPS coordinates).
* **Impact:** Users tapping a shuttle stop on the 3D map can view the shuttle's exact location, occupancy, and remaining range, ensuring efficient transit scheduling.

### F. High-Value Asset Tracking and Security
* **Sensor Grid:** Active RFID tags or BLE asset stickers placed on expensive institutional hardware (e.g., laboratory equipment, projection kits).
* **Mechanism:** Active trackers ping nearby indoor access points, maintaining live room-level locations in the database.
* **Impact:** Tapping an asset in the inventory search bar flies the camera inside the specific building and highlights the exact room and storage cupboard containing the item.

---

## V. Conclusion and Strategic Vision

Integrating real-time IoT sensor networks with a 3D WebGL Digital Twin is a crucial step towards creating responsive, cognitive spaces. By establishing a low-latency publish-subscribe telemetry pipeline, the platform bridges the physical and virtual worlds. The addition of dynamic path rerouting, climate heatmaps, evacuation safety nets, and asset intelligence turns a simple 3D map into a comprehensive operational tool. Implementing these systems maximizes safety, streamlines operations, and optimizes spatial efficiency, offering a robust blueprint for smart institutions of the future.
