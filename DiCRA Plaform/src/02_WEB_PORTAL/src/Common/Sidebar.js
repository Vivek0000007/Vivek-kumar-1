import React, { useState, useEffect } from "react";
import {
  BiLayer,
  BiDownload,
  BiFolder,
  BiErrorCircle,
  BiHelpCircle,
  BiX,
  BiHide,
  BiShow,
  BiBarChartAlt
} from "react-icons/bi";
import { AiFillGithub } from "react-icons/ai";
import { Sidebar, Tab } from "./Sidetabs";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormText,
  Row,
  Col,
} from "reactstrap";
import { useHistory, Link, Route } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import LayerDetails from "./Download/LayerDetails";
import PersonalDetails from "./Download/PersonalDetails";
import Multistep from "react-multistep";
import axiosConfig from "../Common/axios_Config";
import { setlayerlist, setcurrentlayer, setdownloadlayer } from "../actions";
import { Collapse, message } from "antd";
import { Layer } from "leaflet";

const steps = [
  { name: "StepOne", component: <LayerDetails /> },
  { name: "StepTwo", component: <PersonalDetails /> },
];
const { Panel } = Collapse;
const SidebarComponent = (props) => {
  const selectedLayer = useSelector((state) => state.CurrentLayer);
  const selectedRegion = useSelector((state) => state.CurrentRegion);
  const selectedDowndate = useSelector((state) => state.DownloadLayerDate);
  const LayerToggle = useSelector((state) => state.RasterOpacity);
  const DownLayerDesc = useSelector((state) => state.DownloadLayerDesc);
  const DownLayer = useSelector((state) => state.DownloadLayer);
  const Keymap = useSelector((state) => state.MapKey);
  const history = useHistory();
  const [openTab, setOpenTab] = useState("layer");
  const [isActive, setlegend] = useState(true);
  const [Layers, layerList] = useState([]);
  const [isActivebutton, setActivebutton] = useState(false);
  const [Layercount, setLayercount] = useState(0);
  const [Categorylist, setCategorylist] = useState([]);
  const dispatch = useDispatch();
  const handleClick = () => {
    window.open("https://github.com/UNDP-India/Data4Policy/");
  };
  const onClose = () => {
    setOpenTab(false);
    setlegend(!isActive);
  };

  const onOpen = (id) => {
    setOpenTab(id);
    setlegend(!isActive);
  };

  const onOpenDownloads = (layer,desc) => {
    console.log("DATA DOWNLOAD");
    
    dispatch({ type: "SETDOWNLOADLAYER", payload: layer });
    dispatch({ type: "DOWNCHANGELAYERDESC", payload: desc });
    // dispatch(setdownloadlayer(layer));
    setOpenTab("downloads");
  };
  const prevStyle = {
    background: "rgb(3, 53, 100)",
    "border-radius": "3px",
    border: "none",
    float: "left",
    transform: "translateY(30%)",
  };
  const nextStyle = {
    background: "rgb(3, 53, 100)",
    "border-radius": "3px",
    border: "none",
    float: "right",
    transform: "translateY(30%)",
  };
  const nextDisabled = {
    background:"#6c757d",
    "border-radius": "3px",
    border: "none",
    float: "right",
    transform: "translateY(30%)",
    "pointer-events": "none"
  };
  const getLayers = async () => {
    try {
      const layers = await axiosConfig.get(`/getlayerconfig?`);
      // layerList(layers.data);
      dispatch(setlayerlist(layers.data));
      let result;
      result = layers.data.reduce(function (r, a) {
        r[a.category] = r[a.category] || [];
        r[a.category].push(a);
        return r;
      }, Object.create(null));
      layerList([result]);

      console.log("CATEGORY RESULT TYPE", [result]);
      setCategorylist(Object.keys([result][0]));
      setLayercount(1);
    } catch (err) {
      message.error("Failed to connect to server");
    }
  };

  function getVector(layer, desc) {
    dispatch(setcurrentlayer(layer));
    dispatch({ type: "HIDEDRAWER" });
    dispatch({ type: "CHANGELAYERDESC", payload: desc });
    props.resetZoom();
    if (selectedRegion != "CUSTOM") {
      setTimeout(function () {
        props.changeCurrentLayer();
      }, 3000);
    }
  }
  function callback(key) {
    console.log(key);
  }
  useEffect(() => {
    getLayers();  
    if(DownLayerDesc.multiple_files==true){      
      if (selectedDowndate != "") {
        setActivebutton(true);
      } else {
        setActivebutton(false);
      }
    }else{      
      setActivebutton(true);
    }
  }, [Layercount, selectedDowndate, isActivebutton,DownLayer]);


  function toggleLayer() {
    if (LayerToggle == true) {
      dispatch({ type: "HIDERASTER" });
    } else {
      dispatch({ type: "SHOWRASTER" });
    }
  }
  return (
    <React.Fragment> 
      <div className="Sidebar">
        <Sidebar
          position="left"
          collapsed={!openTab}
          selected={openTab}
          closeIcon={<BiX />}
          onClose={onClose}
          onOpen={onOpen}
        >
          <Tab
            id="layer"
            header="Layers"
            icon={
              <BiLayer className="tab-icon icons" data-tip data-for="layer" />
            }
            active
          >
            <hr style={{ marginTop: "30px" }} />

            <Collapse
              accordion
              bordered={false}
              defaultActiveKey={["0"]}
              onChange={callback}
              classname="collapse"
            >
              {Categorylist.map((layers, index) => {
                return (
                  <Panel header={layers} key={index}>
                    {Layers[0][layers].map((items) => {             
                      return (
                        
                        <FormGroup tag="fieldset" className="btn-radio">
                          <Row>
                            <Col md={8} style={{ paddingBottom: "0px" }}>
                              <Label>
                                <Input
                                  type="radio"
                                  name="radio1"
                                  onChange={(e) =>
                                    getVector(items.layer_name, items)
                                  }
                                  defaultChecked={selectedLayer === items.layer_name}
                                />{" "}
                                {items.display_name}
                              </Label>
                            </Col>
                            <Col>
                              <div
                                className="tool-tip"
                              >
                                <div  style={
                                  selectedLayer == items.layer_name
                                    ? {}
                                    : { display: "none" }
                                }><BiShow
                                  data-tip
                                  data-for="show-btn"
                                  onClick={(e) => toggleLayer()}
                                  style={LayerToggle ? {} : { display: "none" }}
                                />
                                <BiHide
                                  data-tip
                                  data-for="show-btn"
                                  onClick={(e) => toggleLayer()}
                                  style={LayerToggle ? { display: "none" } : {}}
                                /></div>
                                <ReactTooltip
                                  id="show-btn"
                                  place="top"
                                  effect="solid"
                                  multiline={true}
                                >
                                  Show/Hide Layer
                                </ReactTooltip>
                                &nbsp;&nbsp;
                                <div  style={
                                  selectedLayer == items.layer_name
                                    ? {}
                                    : { display: "none" }
                                }><BiDownload
                                  data-tip
                                  data-for="download-btn"
                                  onClick={(e) =>
                                    onOpenDownloads(items.layer_name,items)
                                  }
                                /></div>
                                <ReactTooltip
                                  id="download-btn"
                                  place="top"
                                  effect="solid"
                                  multiline={true}
                                >
                                  Downloads
                                </ReactTooltip>
                                &nbsp;&nbsp;
                                <div><BiErrorCircle
                                  data-tip
                                  data-for={items.layer_name}
                                /></div>
                                <ReactTooltip
                                  id={items.layer_name}
                                  place="top"
                                  effect="solid"
                                  multiline={true}
                                >
                                  {items.short_description}
                                </ReactTooltip>
                              </div>
                            </Col>
                          </Row>
                        </FormGroup>
                      );
                    })}
                  </Panel>
                );
              })}
            </Collapse>
          </Tab>
          <Tab
            id="downloads"
            header="Downloads"
            icon={
              <BiDownload
                className="tab-icon icons"
                data-tip
                data-for="downloads"
              />
            }
          >
            <Multistep
              activeStep={0}
              showNavigation={true}
              steps={steps}
              prevStyle={prevStyle}
              nextStyle={isActivebutton ? nextStyle : nextDisabled}
            />
          </Tab>
          <Tab
            // onClick={(e) => history.push("/use-cases")}
            icon={
              <Link to="/use-cases">
                <BiFolder
                  className="tab-icon icons"
                  data-tip
                  data-for="use-cases"
                />
              </Link>
            }
          ></Tab>
          <Tab
            icon={
              <Link to="/about-project">
                <BiErrorCircle
                  className="tab-icon icons"
                  data-tip
                  data-for="about-project"
                />
              </Link>
            }
            anchor="bottom"
          ></Tab>
          <Tab
            icon={
              // <Link to="https://dev.misteo.co/dicrahelp">
              <BiHelpCircle
                className="tab-icon icons"
                data-tip
                data-for="help"
                onClick={(e) => {
                  {
                    window
                      .open("https://dev.misteo.co/dicrahelp/", "_blank")
                      .focus();
                  }
                }}
              />
              // </Link>
            }
            anchor="bottom"
          ></Tab>
          <Tab
            icon={
              <Link to="/analytics">
              <BiBarChartAlt
                className="tab-icon icons"
                data-tip
                data-for="analytics"
              />
              </Link>
            }
            anchor="bottom"
          ></Tab>
          <Tab
            icon={
              <AiFillGithub
                className="tab-icon icons"
                data-tip
                data-for="github"
                onClick={handleClick}
              />
            }
            anchor="bottom"
          ></Tab>
        </Sidebar>
      </div>
      <ReactTooltip
        className="react-tooltip"
        id="layer"
        place="right"
        effect="solid"
        multiline={true}
      >
        Layers
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="downloads"
        place="right"
        effect="solid"
        multiline={true}
      >
        Download
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="use-cases"
        place="right"
        effect="solid"
        multiline={true}
      >
        Use Cases
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="about-project"
        place="right"
        effect="solid"
        multiline={true}
      >
        About Project
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="help"
        place="right"
        effect="solid"
        multiline={true}
      >
        Help
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="analytics"
        place="right"
        effect="solid"
        multiline={true}
      >
        Google Analytics
      </ReactTooltip>
      <ReactTooltip
        className="react-tooltip"
        id="github"
        place="right"
        effect="solid"
        multiline={true}
      >
        Github
      </ReactTooltip>
    </React.Fragment>
  );
};

export default SidebarComponent;
