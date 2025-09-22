import { useState, useEffect } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1`
        );
        const data = await response.json();
        const address = data.results?.[0]?.formatted || 'Unknown location';
        
        const locationData = { latitude, longitude, address };
        setLocation(locationData);
        setLoading(false);
        return locationData;
      } catch (geocodeError) {
        // If geocoding fails, still return coordinates
        const locationData = { latitude, longitude };
        setLocation(locationData);
        setLoading(false);
        return locationData;
      }
    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      if (error.code === 1) {
        errorMessage = 'Location access denied';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout';
      }
      
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation
  };
};