import L from "leaflet";

export function createMarker(vehicle){

 const icon = L.icon({
  iconUrl: `/icons/${vehicle.type || 'car'}.png`,
  iconSize: [32,32]
 });

 const marker = L.marker(
  [vehicle.latitude, vehicle.longitude],
  {icon}
 );

 if (marker.setRotationAngle) {
    marker.setRotationAngle(vehicle.heading || 0);
 }

 return marker;
}
