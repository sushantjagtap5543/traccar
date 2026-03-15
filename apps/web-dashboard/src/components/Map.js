import React from "react";
import Map from "ol/Map";
import View from "ol/View";

export default function DeviceMap(){

  const map = new Map({
    target:"map",
    view:new View({
      center:[0,0],
      zoom:2
    })
  });

  return <div id="map" style={{height:"500px"}}></div>;

}
