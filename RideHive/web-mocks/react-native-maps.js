// Web-compatible react-native-maps implementation using Leaflet
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

// Dynamically load Leaflet for web
let L = null;

const loadLeaflet = async () => {
  if (typeof window !== 'undefined' && !L) {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        L = window.L;
        resolve(L);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return L;
};

// Mock MapView component with Leaflet integration
const MapView = ({ children, style, region, onRegionChangeComplete, showsUserLocation, showsMyLocationButton, mapType, ...props }) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('🗺️ Initializing Leaflet map...');
        await loadLeaflet();
        console.log('🗺️ Leaflet loaded:', !!L);
        
        if (mapRef.current && L && !leafletMapRef.current) {
          console.log('🗺️ Creating map instance...');
          // Initialize Leaflet map
          leafletMapRef.current = L.map(mapRef.current, {
            center: region ? [region.latitude, region.longitude] : [44.4268, 26.1025],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
          });

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(leafletMapRef.current);

          console.log('🗺️ Map initialized successfully');
          setMapReady(true);
        } else {
          console.log('🗺️ Cannot initialize map:', {
            hasMapRef: !!mapRef.current,
            hasL: !!L,
            alreadyExists: !!leafletMapRef.current
          });
        }
      } catch (error) {
        console.error('❌ Failed to load Leaflet:', error);
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map center when region changes
  useEffect(() => {
    if (leafletMapRef.current && region && mapReady) {
      leafletMapRef.current.setView([region.latitude, region.longitude], 13);
    }
  }, [region, mapReady]);

  // Clear existing markers and polylines, then add new ones
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) {
      console.log('🗺️ Skipping marker update:', { hasMap: !!leafletMapRef.current, mapReady });
      return;
    }

    console.log('🗺️ Processing children for markers...');

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => {
      leafletMapRef.current.removeLayer(polyline);
    });
    polylinesRef.current = [];

    // Count children
    const childCount = React.Children.count(children);
    console.log('🗺️ Processing', childCount, 'children');

    // Process children to add markers and polylines
    React.Children.forEach(children, (child) => {
      if (!child) return;
      
      if (child.type === Marker) {
        const { coordinate, title, description, pinColor } = child.props;
        console.log('🎯 Creating marker:', { coordinate, title, description, pinColor });
        
        if (coordinate && L && leafletMapRef.current) {
          // Determine marker style based on title and pinColor
          let color = '#3388ff'; // Default blue
          let size = 8; // Default size
          
          if (title === 'You') {
            color = '#10b981'; // Green for current user
            size = 10;
          } else if (title === 'Organizer') {
            color = '#dc2626'; // Red for organizer
            size = 10;
          } else if (title && title.includes('Rider')) {
            color = '#2563eb'; // Blue for other riders
            size = 8;
          } else if (pinColor === '#10b981') {
            color = '#10b981'; // Green for waypoints
            size = 6;
          }
          
          // Handle USER_COLORS values
          if (pinColor === '#dc2626') { // USER_COLORS.ORGANIZER
            color = '#dc2626'; // Red for organizer
            size = 10;
          } else if (pinColor === '#2563eb') { // USER_COLORS.RIDER
            color = '#2563eb'; // Blue for rider
            size = 8;
          }
          
          console.log('🎯 Marker style:', { color, size, lat: coordinate.latitude, lng: coordinate.longitude });
          
          try {
            // Create circle marker instead of default pin
            const marker = L.circleMarker([coordinate.latitude, coordinate.longitude], {
              radius: size,
              fillColor: color,
              color: 'white',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            });
            
            if (title || description) {
              let popupContent = '';
              if (title) popupContent += `<strong>${title}</strong>`;
              if (description) popupContent += `<br/>${description}`;
              marker.bindPopup(popupContent);
            }
            
            marker.addTo(leafletMapRef.current);
            markersRef.current.push(marker);
            console.log('✅ Marker added successfully');
          } catch (error) {
            console.error('❌ Error creating marker:', error);
            
            // Fallback to regular marker
            try {
              const fallbackMarker = L.marker([coordinate.latitude, coordinate.longitude]);
              if (title || description) {
                let popupContent = '';
                if (title) popupContent += `<strong>${title}</strong>`;
                if (description) popupContent += `<br/>${description}`;
                fallbackMarker.bindPopup(popupContent);
              }
              fallbackMarker.addTo(leafletMapRef.current);
              markersRef.current.push(fallbackMarker);
              console.log('✅ Fallback marker added');
            } catch (fallbackError) {
              console.error('❌ Fallback marker failed:', fallbackError);
            }
          }
        } else {
          console.log('❌ Cannot create marker - missing dependencies:', {
            hasCoordinate: !!coordinate,
            hasL: !!L,
            hasMap: !!leafletMapRef.current
          });
        }
      } else if (child.type === Polyline) {
        const { coordinates, strokeColor, strokeWidth } = child.props;
        if (coordinates && coordinates.length > 1 && L) {
          const latlngs = coordinates.map(coord => [coord.latitude, coord.longitude]);
          const polyline = L.polyline(latlngs, {
            color: strokeColor || '#3388ff',
            weight: strokeWidth || 3
          });
          
          polyline.addTo(leafletMapRef.current);
          polylinesRef.current.push(polyline);
        }
      }
    });
  }, [children, mapReady]);

  return (
    <View style={style}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '300px',
          backgroundColor: '#f3f4f6'
        }} 
      />
      {!mapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '14px'
        }}>
          Loading map...
        </div>
      )}
    </View>
  );
};

// Mock Marker component
const Marker = ({ coordinate, title, description, pinColor, ...props }) => {
  // This component doesn't render directly, it's processed by MapView
  return null;
};

// Mock Polyline component
const Polyline = ({ coordinates, strokeColor, strokeWidth, ...props }) => {
  // This component doesn't render directly, it's processed by MapView
  return null;
};

// Export components
export default MapView;
export { Marker, Polyline };