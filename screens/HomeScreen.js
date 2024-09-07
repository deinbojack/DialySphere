import React, { useRef, useState, useEffect } from "react";
import { Image, View, Text, StyleSheet, Dimensions } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import { GOOGLE_API_KEY } from "../environments";
import Data from '../DFC_Facility.json';
import * as Location from 'expo-location';
import HomeMarker from '../assets/HomeMarker.png';

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {
  latitude: 37.8348,
  longitude: -121.9501,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const HomeScreen = () => {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const addressArray = [];

  Location.setGoogleApiKey(GOOGLE_API_KEY);

  const readJSON = async () => {
    console.log(selectedLocation);

    Data.forEach(facility => {
      if (facility["ZIP Code"] == selectedLocation?.zip_code) {
        console.log("found");
        const addressLine1 = facility["Address Line 1"];
        const addressLine2 = facility["Address Line 2"] ? `${facility["Address Line 2"]}, ` : '';
        const city = facility["City/Town"];
        const state = facility["State"];
        const zip = facility["ZIP Code"];
        const fullAddress = `${addressLine1}, ${addressLine2}${city}, ${state} ${zip}`;

        console.log("Address:", fullAddress);
        addressArray.push(fullAddress);
      }
    });

    console.log(addressArray);
    geocode();
  };

  const geocode = async () => {
    const geocodedResults = [];
    const addressResults = [];
    for (let i = 0; i < addressArray.length; i++) {
      const result = await Location.geocodeAsync(addressArray[i]);
      if (result.length > 0) {
        geocodedResults.push(result[0]);
        addressResults.push(addressArray[i]);
      }
    }
    console.log(geocodedResults);
    setGeocodedLocations(geocodedResults);
    setAddresses(addressResults);
  };

  useEffect(() => {
    if (selectedLocation) {
      readJSON();
    }
  }, [selectedLocation]);

  const moveto = async (position) => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      camera.center = position;
      mapRef.current?.animateCamera(camera, { duration: 1000 });
    }
  };

  return (
    <View style={styles.container}>
      <Text>DialySphere</Text>
      <MapView 
        style={styles.map} 
        initialRegion={INITIAL_POSITION} 
        ref={mapRef}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} >
             <Image source={require('../assets/HomeMarker.png')} style={{height: 35, width: 35 }} />
          </Marker>
        )}
        {geocodedLocations.map((location, index) => (
          <Marker 
            key={index}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
          >
            <Callout>
              <View style={styles.callout}>
                <Text>{addresses[index]}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search"
          onPress={(data, details = null) => {
            const position = {
              latitude: details?.geometry.location.lat || 0,
              longitude: details?.geometry.location.lng || 0,
              zip_code: details?.address_components.find(component => component.types.includes("postal_code"))?.short_name || "",
            };
            setSelectedLocation(position);
            moveto(position);
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: "en",
          }}
          fetchDetails
          styles={{
            textInput: styles.input,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: "center",
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height + 20,
  },
  searchContainer: {
    position: "absolute",
    width: "90%",
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    padding: 8,
    borderRadius: 8,
    top: Constants.statusBarHeight,
  },
  input: {
    borderColor: "#888",
    borderWidth: 1,
  },
  callout: {
    width: 200,
    padding: 5,
  },
});

export default HomeScreen;
