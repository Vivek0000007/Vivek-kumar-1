import React, { Component } from "react";
import { connect } from "react-redux";
import { setvalue, setplacename } from "../actions";
import { centroid, multiPolygon, polygon } from "@turf/turf";
import { getGeocode, getLatLng } from "use-places-autocomplete";
import ColorPicker from "../Common/ColorPicker";
import Legend from "../Common/legend";
import { Switch } from "antd";
import { scaleQuantize } from "d3-scale";
import MANDALBOUNDS from "../Shapes/TS_mandal_boundary.json";
import chroma from "chroma-js";
import {
  Map,
  TileLayer,
  ZoomControl,
  Marker,
  GeoJSON,
  FeatureGroup,
  Circle,
  Tooltip,
  LayersControl,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GeoRaster from "./RGBGeoRaster";
import DrawerModal from "../Common/Drawer";
import Header from "../Common/Header";
import Sidebar from "../Common/Sidebar";
import { BiSearch, BiX, BiHomeAlt } from "react-icons/bi";
import { Button, Form, FormGroup, Label, Input, FormText } from "reactstrap";
import Circlemarker from "../img/circlemarker.png";
import ToggleButton from "../Common/Toggle";
import ColorScale from "../Common/ColorScale";
import { Radio, Select, message } from "antd";
import axios from "axios";
import loader from "../img/loader.gif";
import locIcon from "../img/locationICON.png";
import mandalRegions from "./Regions/mandalRegions";
import districtRegions from "./Regions/districtRegions";
import axiosConfig from "../Common/axios_Config";
import { GoogleComponent } from "react-google-location";
import { EditControl } from "react-leaflet-draw";
import { pointer } from "d3-selection";
import AutoSearch from "react-leaflet-google-places-searchbox";
import SearchPlace from "./searchPlaces";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import { GoogleLayer } from "react-leaflet-google";
const removeLayer = (layer) => {
  map.removeLayer(layer);
  window.tiff = 0;
};
const { BaseLayer } = LayersControl;
// const key = 'AIzaSyD_QaXrN1Qi27IQK1df0nGoqCGX_3vYXd4';
const sat = "SATELLITE";
const road = "ROAD";

const MAP_STYLES = {
  position: "relative",
  width: "100%",
  height: "100vh",
};
const geojsonArea = require("@mapbox/geojson-area");
const options = [
  { label: "Raster", value: "Raster" },
  { label: "Vector", value: "Vector" },
];
const ruaStyle = {
  color: "#d65522",
  weight: 0.5,
  fillOpacity: 0,
};
const LoaderIcon = new L.Icon({
  iconUrl: loader,
  iconSize: [150, 150],
});
const LocIcon = new L.Icon({
  iconUrl: locIcon,
  iconSize: [50, 50],
  // iconAnchor: [17, 46], //[left/right, top/bottom]
});
const MarkerIcon = new L.Icon({
  iconUrl: Circlemarker,
  iconSize: [10, 10],
});
let ltype = "Raster";

const mapStateToProps = (ReduxProps) => {
  return {
    place: ReduxProps.setplace,
    parametervalue: ReduxProps.setval,
    vectorLoader: ReduxProps.VectorLoader,
    rasterLoader: ReduxProps.RasterLoader,
    CurrentLayer: ReduxProps.CurrentLayer,
    CurrentRegion: ReduxProps.CurrentRegion,
    CurrentVector: ReduxProps.CurrentVector,
    MapKey: ReduxProps.MapKey,
    LayerDescription: ReduxProps.LayerDescription,
    vectorColor: ReduxProps.SetColor,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setVectorColor: (col) => dispatch({ type: "SETCOLOR_SCALE", payload: col }),
    setvalue: (val) => dispatch({ type: "SETVALUE", payload: val }),
    setplace: (plc) => dispatch({ type: "SETPLACE", payload: plc }),
    VectorLoader: () => dispatch({ type: "ENABLEVECTOR" }),
    SetBoundary: (geojson) =>
      dispatch({ type: "SETCURRENTVECTOR", payload: geojson }),
    setRegion: (region) =>
      dispatch({ type: "SETCURRENTREGION", payload: region }),
    setMapKey: () => dispatch({ type: "CHANGEKEYMAP" }),
    showRaster: () => dispatch({ type: "SHOWRASTER" }),
    hideRaster: () => dispatch({ type: "HIDERASTER" }),
  };
};
class map extends Component {
  constructor(props) {
    super(props);
    this.child = React.createRef();
    this.rasterChild = React.createRef();
    this.vectorChild = React.createRef();
    this.state = {
      RGBViewPort: {
        center: [18.1124, 79.0193],
        // zoom: 8,
      },
      boundary: [],
      activeSearch: true,
      active: true,
      searchPlace: "",
      area: 0.0,
      pointData: false,
      selected_shape: [],
      keyMAP: 1,
      pointVector: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [55.6761, 12.5683],
            },
            properties: {
              brightness: 330.5,
              scan: 1.16,
              track: 1.07,
              acq_date: "2021-11-02",
              acq_time: 801,
              satellite: "Aqua",
              instrument: "MODIS",
              confidence: 83,
              version: "6.1NRT",
              bright_t31: 296.07,
              frp: 25.58,
              daynight: "D",
              latitude: 12.5683,
              longitude: 55.6761,
            },
          },
        ],
      },
      currentBoundaryPattern: "DISTRICT",
      layerType: "Raster",
      buttonclick: true,
      areaValue: 0.0,
      minVal: 0.0,
      maxVal: 0.0,
      layertransparency: 0.1,
      loaderlatvector: 17.754639747121828,
      loaderlngvector: 79.05833831966801,
      loaderlatraster: 17.754639747121828,
      loaderlngraster: 79.05833831966801,
      locpointerltlng: [60.732421875, 80.67555881973475],
      selectedRegion: "",
      regionList: districtRegions(),
      latnew: 18.1124,
      longnew: 79.0193,
      mapZoom: 7.5,
      layerUID: "",
      showlayertype: true,
      midpoint: [],
      editableFG: [],
      baseMap:
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      showCustomDraw: false,
      customStatus: false,
      checked: false,
      baseMapselected: "Dark",
      customShape: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [],
            },
          },
        ],
      },
    };
    this.openDrawer = this.openDrawer.bind(this);
    this.toggleClass = this.toggleClass.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.onchangeshape = this.onchangeshape.bind(this);
    this.onChangeLayertype = this.onChangeLayertype.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.searchRegion = this.searchRegion.bind(this);
    this.style = this.style.bind(this);
    this.resetmapzoom = this.resetmapzoom.bind(this);
    this.Customlayer = this.Customlayer.bind(this);
    this.openCustomDrawer = this.openCustomDrawer.bind(this);
    this.getlayer = this.getlayer.bind(this);
    this.changeRasterLoader = this.changeRasterLoader.bind(this);
    this.getcustomlocation = this.getcustomlocation.bind(this);
    this.toggleLayer = this.toggleLayer.bind(this);
    this.ChangeBasemap = this.ChangeBasemap.bind(this);
  }
  onEachrua = (rua, layer) => {
    const ruaname = rua.properties.Dist_Name;
    layer.bindPopup(ruaname);
  };
  changeVectorLoader = (lat, lng) => {
    // 60.732421875,80.67555881973475
    this.setState({
      loaderlatvector: lat,
      loaderlngvector: lng,
    });
  };
  changeRasterLoader = (lat, lng) => {
    // 60.732421875,80.67555881973475
    this.setState({
      loaderlatraster: lat,
      loaderlngraster: lng,
    });
  };
  formatgeojson(json) {
    var new_json = {
      type: "FeatureCollection",
      name: "Telangana_Distrcit",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
      },
      features: [json],
    };
    console.log("NEW json", new_json);
    this.setState({
      selected_shape: new_json,
    });
  }
  // async getweatherData(geojson){
  //   var bodyParams = {
  //     geojson: geojson.sourceTarget.feature.geometry,
  //     startdate: "2021-01-01",
  //     enddate: "2022-01-20",
  //   };
  //   try {
  //     const res = await axiosConfig.post(`/getpoints`, bodyParams);
  //     console.log("RESPONSE COUNT", res.data[1].count);
  //     this.setState({
  //       areaValue: res.data[1].count,
  //       selectedRegion: geojson.sourceTarget.feature.properties.Dist_Name,
  //     });
  //     var area = geojsonArea.geometry(geojson.sourceTarget.feature.geometry);
  //     area = area / 1000000;
  //     this.setState({
  //       area: parseFloat(area).toFixed(2),
  //     });
  //     this.child.current.showDrawer();
  //     this.child.current.setPointsChart();
  //   } catch (err) {
  //     message.error("Failed to connect to server");
  //   }
  // }
  async getCountEvents(geojson) {
    var bodyParams = {
      geojson: geojson.sourceTarget.feature.geometry,
      startdate: "2021-01-01",
      enddate: "2022-01-20",
    };
    try {
      const res = await axiosConfig.post(`/getpoints`, bodyParams);
      console.log("RESPONSE COUNT", res.data[1].count);
      this.setState({
        areaValue: res.data[1].count,
        selectedRegion: geojson.sourceTarget.feature.properties.Dist_Name,
      });
      var area = geojsonArea.geometry(geojson.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });
      this.child.current.showDrawer();
      this.child.current.setPointsChart();
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  openDrawer(e) {
    console.log("DRAWER PROPS", e);
    var selected_district = this.formatgeojson(e.sourceTarget.feature);
    if (this.props.CurrentLayer == "FIREEV") {
      this.getCountEvents(e);
    }
    if (this.props.CurrentLayer == "WEATHER") {
      console.log("WEATHER DATA");
    
      var area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });
      this.setState(
        {
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.showDrawer();
          this.child.current.getWeathertrend();
        }
      );
    } else {
      this.setState(
        {
          areaValue: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.mean
          ).toFixed(2),
          minVal: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.min
          ).toFixed(2),
          maxVal: parseFloat(
            e.sourceTarget.feature.properties.zonalstat.max
          ).toFixed(2),
          selectedRegion: e.sourceTarget.feature.properties.Dist_Name,
        },
        () => {
          this.child.current.settimerange("6months");
        }
      );

      var area = geojsonArea.geometry(e.sourceTarget.feature.geometry);
      area = area / 1000000;
      this.setState({
        area: parseFloat(area).toFixed(2),
      });

      this.child.current.showDrawer();
    }
  }
  async getCustomPointDetails(geojson) {
    var bodyParams = {
      geojson: geojson.features[0].geometry,
      startdate: "2021-01-01",
      enddate: "2022-01-20",
    };
    try {
      const res = await axiosConfig.post(`/getpoints`, bodyParams);
      console.log("CUSTOM LAYER GEOMETRY", geojson.features[0].geometry);
      var area = geojsonArea.geometry(geojson.features[0].geometry);
      area = area / 1000000;
      this.setState(
        {
          areaValue: res.data[1].count,
          selectedRegion: "Custom",
          area: parseFloat(area).toFixed(2),
        },
        () => {
          this.child.current.setPointsChart();
          this.child.current.showDrawer();
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  async getCustomlayerDetails(geojson) {
    var last_updated_date = new Date(this.props.LayerDescription.last_updated);
    var from_dd = String(last_updated_date.getDate()).padStart(2, "0");
    var from_mm = String(last_updated_date.getMonth() + 1).padStart(2, "0"); //January is 0!
    var from_yyyy = last_updated_date.getFullYear();
    var from_date = from_yyyy + "-" + from_mm + "-" + from_dd;
    var bodyParams = {
      geojson: geojson.features[0].geometry,
      date: from_date,
      parameter: this.props.CurrentLayer,
    };
    try {
      const res = await axiosConfig.post(`/getzstat?`, bodyParams);
      console.log("CUSTOM LAYER GEOMETRY", geojson.features[0].geometry);
      var area = geojsonArea.geometry(geojson.features[0].geometry);
      area = area / 1000000;
      this.setState(
        {
          areaValue: parseFloat(res.data.stat.mean).toFixed(2),
          minVal: parseFloat(res.data.stat.min).toFixed(2),
          maxVal: parseFloat(res.data.stat.max).toFixed(2),
          selectedRegion: "Custom",
          area: parseFloat(area).toFixed(2),
        },
        () => {
          this.child.current.gettrendchart();
          this.child.current.showDrawer();
        }
      );
    } catch (err) {
      message.error("Failed to connect to server");
    }
  }
  openCustomDrawer(geojson) {
    this.setState({
      selected_shape: geojson,
    });
    if (this.props.CurrentLayer == "FIREEV") {
      this.getCustomPointDetails(geojson);
    } else {
      this.getCustomlayerDetails(geojson);
    }
  }
  style(feature) {
    if (ltype == "Vector") {
      if (this.state.layerUID == feature.properties.uid) {
        return {
          weight: 1,
          opacity: 1,
          color: "#2bf527",
          fillOpacity: 1,
          weight: 6,
        };
      } else {
        this.props.hideRaster();
        var scale;
        if (feature.properties.zonalstat.mean <= 1) {
          scale = chroma
            .scale(this.props.vectorColor)
            .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
        } else {
          scale = chroma
            .scale(this.props.vectorColor)
            .domain([0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]);
        }
        return {
          // fillColor: this.getColor(feature.properties.zonalstat.mean),
          fillColor: scale(feature.properties.zonalstat.mean),
          weight: 1,
          opacity: 1,
          color: "#d65522",
          fillOpacity: 1,
        };
      }
    } else {
      if (this.state.layerUID == feature.properties.uid) {
        return {
          weight: 1,
          opacity: 1,
          color: "#2bf527",
          fillOpacity: 0,
          weight: 6,
        };
      } else {
        this.props.showRaster();
        return {
          color: "#d65522",
          weight: 0.5,
          fillOpacity: 0,
        };
      }
    }
  }
  toggleClass() {
    const currentState = this.state.activeSearch;
    this.setState({ activeSearch: !currentState });
    this.resetmapzoom();
  }
  toggleDropdown() {
    const currentState = this.state.active;
    this.setState({ active: !currentState });
  }
  onchangeshape(e) {
    if (e.target.value == "district") {
      this.props.showRaster();
      this.props.setRegion("DISTRICT");
      console.log("LAYERS NUMBER", this.state.editableFG);
      this.map.removeLayer(this.state.editableFG);

      this.props.setMapKey();
      this.setState(
        {
          // currentBoundaryPattern: "DISTRICT",
          checked: false,
          regionList: districtRegions(),
          customStatus: false,
          showlayertype: true,
          locpointerltlng: [60.732421875, 80.67555881973475],
          baseMap:
            "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          baseMapselected: "Dark",
        },
        () => {
          this.getlayer();
        }
      );
    } else if (e.target.value == "mandal") {
      this.props.showRaster();
      this.map.removeLayer(this.state.editableFG);
      this.props.setRegion("MANDAL");
      this.props.setMapKey();
      this.setState(
        {
          // currentBoundaryPattern: "MANDAL",
          checked: false,
          regionList: mandalRegions(),
          locpointerltlng: [60.732421875, 80.67555881973475],
          customStatus: false,
          showlayertype: true,
          baseMap:
            "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          baseMapselected: "Dark",
        },
        () => {
          this.getlayer();
        }
      );
    } else if (e.target.value == "custom") {
      this.props.setMapKey();
      this.props.setRegion("CUSTOM");

      this.setState({
        baseMap: "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}",
        baseMapselected: "Satellite",
        // keyMAP: this.state.keyMAP + 1,
        checked: true,
        customStatus: true,
        showlayertype: false,
      });
      this.props.SetBoundary([]);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      this.props.hideRaster();
    }
  }
  onChangeLayertype(e) {
    this.setState(
      {
        layerType: e.target.value,
      },
      () => {
        ltype = e.target.value;
        // this.getlayer();
        this.props.setMapKey();
      }
    );
  }
  onMouseOut() {
    this.props.setvalue(0.0);
    this.props.setplace("");
  }
  async getlayer() {
    this.changeVectorLoader(17.754639747121828, 79.05833831966801);
    if (this.props.CurrentLayer == "FIREEV") {
      this.setState({
        pointData: true,
      });
      // this.props.SetBoundary({})
      // dispatch({ type: "SETCURRENTVECTOR", payload: {} })
      var bodyParams = {
        startdate: "2021-01-01",
        enddate: "2022-01-20",
      };
      try {
        const res = await axiosConfig.post(
          `/getpointsindaterange?`,
          bodyParams
        );
        // this.props.SetBoundary(res.data);
        this.setState({
          pointVector: res.data,
        });
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
        this.changeRasterLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    } else if (this.props.CurrentLayer == "WEATHER") {
      this.props.SetBoundary(MANDALBOUNDS);
      this.props.setMapKey();
      this.changeVectorLoader(60.732421875, 80.67555881973475);
      this.changeRasterLoader(60.732421875, 80.67555881973475);
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
    } else {
      this.setState({
        pointVector: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [55.6761, 12.5683],
              },
              properties: {
                brightness: 330.5,
                scan: 1.16,
                track: 1.07,
                acq_date: "2021-11-02",
                acq_time: 801,
                satellite: "Aqua",
                instrument: "MODIS",
                confidence: 83,
                version: "6.1NRT",
                bright_t31: 296.07,
                frp: 25.58,
                daynight: "D",
                latitude: 12.5683,
                longitude: 55.6761,
              },
            },
          ],
        },
      });
      try {
        const res = await axiosConfig.get(
          `/currentvector?parameter=` +
            this.props.CurrentLayer +
            `&admbound=` +
            this.props.CurrentRegion
        );
        this.props.SetBoundary(res.data.data);
        this.props.setMapKey();
        this.changeVectorLoader(60.732421875, 80.67555881973475);
      } catch (err) {
        message.error("Failed to connect to server");
      }
    }
    // this.props.VectorLoader();
    // this.checkLoaderstatus();
  }
  // checkLoaderstatus() {
  //   if (this.props.rasterLoader == true) {
  //     console.log("RASTER IS LOADED");

  //   }else{
  //     console.log("RASTER IS LOADING");
  //   }
  // }

  onMouseOver(e) {
    if (isNaN(e.layer.feature.properties.zonalstat.mean) == true) {
      this.props.setvalue("N/A");
    } else {
      this.props.setvalue(
        parseFloat(e.layer.feature.properties.zonalstat.mean).toFixed(2)
      );
    }

    if (this.props.CurrentRegion == "MANDAL") {
      var mandal_name = e.layer.feature.properties.Mandal_Nam;
      if (typeof mandal_name !== "undefined") {
        this.props.setplace(mandal_name);
      } else {
        this.props.setplace("");
      }
    } else if (this.props.CurrentRegion == "DISTRICT") {
      var district_name = e.layer.feature.properties.Dist_Name;
      if (typeof district_name !== "undefined") {
        this.props.setplace(district_name);
      } else {
        this.props.setplace("");
      }
    }
  }
  searchRegion(e) {
    console.log("UID,CENTROID,REGION", e);
    var selected_region = this.state.regionList[e];
    var current_reg = this.props.CurrentVector.features[e];
    console.log("SEARCH REGION", this.props.CurrentVector);
    console.log("SELECTED REGION", selected_region);
    this.setState(
      {
        latnew: selected_region.centerPoint[1],
        longnew: selected_region.centerPoint[0],
        mapZoom: 9,
        layerUID: selected_region.uid,
      },
      () => {
        if (this.props.CurrentRegion == "MANDAL") {
          var mandal_name = current_reg.properties.Mandal_Nam;
          if (typeof mandal_name !== "undefined") {
            this.props.setplace(mandal_name);
            this.props.setvalue(
              parseFloat(current_reg.properties.zonalstat.mean).toFixed(2)
            );
          } else {
            this.props.setplace("");
            this.props.setvalue(0);
          }
        } else if (this.props.CurrentRegion == "DISTRICT") {
          var district_name = current_reg.properties.Dist_Name;
          if (typeof district_name !== "undefined") {
            this.props.setplace(current_reg.properties.Dist_Name);
            this.props.setvalue(
              parseFloat(current_reg.properties.zonalstat.mean).toFixed(2)
            );
          } else {
            this.props.setplace("");
            this.props.setvalue(0);
          }
        }
      }
    );
  }

  componentDidMount() {
    this.props.setvalue(0.74);
    this.props.setplace("Siddipet");
    this.changeVectorLoader(17.754639747121828, 79.05833831966801);
    this.changeRasterLoader(17.754639747121828, 79.05833831966801);
    // const leafletMap = this.leafletMap.leafletElement;
    this.getlayer();
    this.map = this.mapInstance.leafletElement;
  }
  resetmapzoom() {
    console.log(this.map);
    this.map.flyTo([18.1124, 79.0193], 7.5);
  }
  ChangeBasemap(e) {
    if (e.target.value == "Dark") {
      this.setState({
        baseMap:
          "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        baseMapselected: "Dark",
      });
    }
    if (e.target.value == "Satellite") {
      this.setState({
        baseMap: "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}",
        baseMapselected: "Satellite",
      });
    }
  }
  Customlayer(e) {
    e.layer.on("click", () => {
      // editRef.current.leafletElement._toolbars.edit._modes.edit.handler.enable()
      this.child.current.showDrawer();
      console.log("ON CLICK WORKING");
    });
    console.log("CUStOM LAYER ", e.layer._leaflet_id);
    if (this.state.editableFG == []) {
      this.setState({
        editableFG: e.layer,
      });
    } else {
      this.map.removeLayer(this.state.editableFG);
      this.setState({
        editableFG: e.layer,
      });
    }
    const shapePoints = e.layer._latlngs;
    var newpoints = [];
    shapePoints[0].map(function (points, index) {
      newpoints.push([points.lng, points.lat]);
    });
    // console.log("COORDINATES", e.layer);
    newpoints.push([shapePoints[0][0].lng, shapePoints[0][0].lat]);
    var polygon_point = polygon([newpoints]);
    var polygon_centroid = centroid(polygon_point);
    this.setState(
      {
        customShape: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                centroid: polygon_centroid.geometry.coordinates,
              },
              geometry: {
                type: "Polygon",
                coordinates: [newpoints],
              },
            },
          ],
        },
      },
      () => {
        this.openCustomDrawer(this.state.customShape);
      }
    );
  }
  getcustomlocation(lat, lon) {
    if (lat != undefined && lon != undefined) {
      // this.setState({
      //   locpointerltlng: [e.coordinates.lat, e.coordinates.lng],
      // });
      if (lat != undefined && lon != undefined) {
        this.setState({
          locpointerltlng: [lat, lon],
          mapZoom: 9,
          latnew: lat,
          longnew: lon,
        });
      }
      console.log("COORDONTATES", lat, lon);
    }
  }
  toggleLayer(e) {
    console.log("TOGGLE LAYER", e);
    if (e.target.value == "show") {
      this.props.showRaster();
    } else {
      this.props.hideRaster();
    }
  }
  render() {
    return (
      <React.Fragment>
        <div className="header">
          <Header />
        </div>
        <Sidebar
          changeCurrentLayer={this.getlayer}
          resetZoom={this.resetmapzoom}
        />
        <div
          className="btn-home"
          style={{ zIndex: "999" }}
          onClick={this.resetmapzoom}
        >
          <BiHomeAlt />
        </div>
        {/* <div
          className="Layer-remove"
          style={this.state.customStatus == true ? {} : { display: "none" }}
        >
          <Switch size="small"  onChange={(e) => this.toggleLayer(e)}/>
        </div> */}

        <div
          className="btn-toggleBaseMap"
          // style={this.state.customStatus == true ? {} : { display: "none" }}
        >
          <FormGroup>
            <Input
              type="select"
              name="select"
              style={{
                backgroundColor: "#282929",
                color: "#fff",
                border: "none",
                height: "43px",
              }}
              onChange={this.ChangeBasemap}
            >
              <option
                selected={this.state.baseMapselected == "Dark" ? true : false}
                value="Dark"
              >
                Dark
              </option>
              <option
                selected={
                  this.state.baseMapselected == "Satellite" ? true : false
                }
                value="Satellite"
              >
                Satellite
              </option>
            </Input>
          </FormGroup>
        </div>
        <div
          className="btn-toggle"
          // style={this.state.showlayertype == true ? {} : { display: "none" }}
        >
          <Radio.Group
            options={options}
            onChange={this.onChangeLayertype}
            value={this.state.layerType}
            optionType="button"
            buttonStyle="solid"
            disabled={this.state.showlayertype ? false : true}
          />
        </div>
        <div
          className={
            this.state.activeSearch ? "selection" : "selection-collapsed"
          }
        >
          <FormGroup>
            <Input
              type="select"
              name="select"
              style={{
                backgroundColor: "#282929",
                color: "#fff",
                border: "none",
                height: "44px",
              }}
              onChange={(e) => this.onchangeshape(e)}
            >
              <option value="district">District</option>
              <option value="mandal">Mandal</option>
              <option value="custom">Custom</option>
              {/* <option value="opacity">opacity</option> */}
            </Input>
          </FormGroup>
        </div>

        <div
          className={
            this.state.activeSearch ? "search-card" : "search-card-collapsed"
          }
        >
          <div className="row" style={{ padding: "0px" }}>
            <div className="col search" style={{ paddingLeft: "0px" }}>
              <div
                style={
                  this.state.customStatus == true ? { display: "none" } : {}
                }
              >
                <Select
                  className="search-input"
                  showSearch
                  style={{ width: 230 }}
                  placeholder="Search Region"
                  optionFilterProp="children"
                  onChange={this.searchRegion}
                >
                  {this.state.regionList.length > 0 &&
                    this.state.regionList.map((item, index) => (
                      <option
                        className="search-list"
                        value={index}
                        // key={item.centerPoint}
                        // attr={item.uid}
                      >
                        {item.dname}
                      </option>
                    ))}
                </Select>
              </div>
              <div
                style={
                  this.state.customStatus == true ? {} : { display: "none" }
                }
              >
                <div style={{ marginLeft: "50px", marginTop: "7px" }}>
                  <SearchPlace searchArea={this.getcustomlocation} />
                </div>
              </div>
            </div>

            <div className="col" style={{ padding: "0px" }}>
              {this.state.activeSearch ? (
                <BiSearch className="search-icon" onClick={this.toggleClass} />
              ) : (
                <BiX className="search-close" onClick={this.toggleClass} />
              )}
            </div>
          </div>
        </div>
        <DrawerModal ref={this.child} district={this.state} />
        <Map
          ref={(e) => {
            this.mapInstance = e;
          }}
          className="map"
          style={MAP_STYLES}
          viewport={this.state.RGBViewPort}
          maxZoom={18}
          minZoom={6}
          zoomSnap={0.25}
          zoomDelta={0.25}
          zoom={this.state.mapZoom}
          center={[this.state.latnew, this.state.longnew]}
          zoomControl={false}
        >
          <Marker
            position={[this.state.loaderlatvector, this.state.loaderlngvector]}
            icon={LoaderIcon}
          ></Marker>
          <Marker position={this.state.locpointerltlng} icon={LocIcon} />
          <Marker
            position={[this.state.loaderlatraster, this.state.loaderlngraster]}
            icon={LoaderIcon}
          ></Marker>
          {/* <div style={this.state.pointData == true ? { display: "none" } : {}}> */}
          {/* {this.state.pointVector.features.map((point, key) => (
            <CircleMarker
              center={[point.properties.latitude, point.properties.longitude]}
              radius={4}
              fillOpacity={1}
              fillColor={"#d10a25"}
              stroke={false}
            >
              <Tooltip>hkh</Tooltip>
            </CircleMarker>
          ))} */}
          <GeoJSON
            style={this.style}
            data={this.props.CurrentVector.features}
            // onEachFeature={this.onEachrua}
            onMouseOver={
              this.props.CurrentLayer == "WEATHER"
                ? console.log("WEATHER")
                : this.onMouseOver
            }
            onMouseOut={
              this.props.CurrentLayer == "WEATHER"
                ? console.log("WEATHER")
                : this.onMouseOver
            }
            icon={"text"}
            onclick={this.openDrawer}
            key={this.props.MapKey}
            zIndex={999}
          />
          {/* </div> */}

          {this.state.pointVector.features.map((point, key) => (
            <Marker
              position={[point.properties.latitude, point.properties.longitude]}
              radius={4}
              fillOpacity={1}
              fillColor={"#d10a25"}
              stroke={false}
              icon={MarkerIcon}
              direction="top"
            >
              <Tooltip>
                <a>
                  FRP : {point.properties.frp}
                  <br />
                  Date : {point.properties.acq_date}
                </a>
              </Tooltip>
            </Marker>
          ))}

          {/* <div name="georaster" className="georaster-layer"> */}
          <GeoRaster
            onRef={(ref) => (this.rasterChild = ref)}
            changeLoader={this.changeRasterLoader}
          />
          {/* </div> */}

          <ZoomControl position="topright" className="btn-zoomcontrol" />
          <TileLayer url={this.state.baseMap} />
          <LayersControl position="topright">
            {/* <BaseLayer checked name='Basemap'> */}
            {/* <TileLayer url={this.state.baseMap}/> */}
            {/* <GoogleLayer 
            googlekey={key}
             maptype={sat} />
          </BaseLayer> */}
            {/* <BaseLayer checked name="Google Maps Satellite">
            <GoogleLayer 
            googlekey={key}
             maptype={sat} />
          </BaseLayer> */}
          </LayersControl>
          <div style={{ zIndex: -999 }}>
            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={this.Customlayer}
                style={{ marginBottom: "179px" }}
                eventHandlers={{
                  onClick: () => {
                    console.log("ONCLICK CUSTOM");
                  },
                }}
                draw={{
                  rectangle: this.state.customStatus,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: this.state.customStatus,
                }}
                edit={{
                  edit: false,
                  remove: this.state.customStatus,
                }}
              />
            </FeatureGroup>
          </div>
          {/* </Map> */}
        </Map>
      </React.Fragment>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(map);
