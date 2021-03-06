import React from "react";
import ColorScale from "./ColorScale";
import {useSelector,useDispatch}  from 'react-redux';
import ColorPicker from "./ColorPicker"

function Legend() {
  const setval=useSelector(state=>state.setval);
  const setplace=useSelector(state=>state.setplace);
  const currentLayer=useSelector(state=>state.CurrentLayer)
  const currentLayerDesc=useSelector(state=>state.LayerDescription)
  return (
    <div className="legend-section">
      <div className="container">
        <div
          className="row"
          style={{
            textAlign: "left",
            fontWeight: "bold",
          }}
        >
          <div className="col" style={{ fontSize: "24px", color: "#fff" }}>
            {setval}
          </div>
          <div className="w-100"></div>
          <div className="col" style={{ color: "rgba(215 215 215)" }}>
          {currentLayer} | {currentLayerDesc.last_updated.slice(0,10)}
          </div>
          <div className="w-100"></div>
          <div className="col" style={{ color: "rgba(215 215 215)" }}>
            {setplace}
          </div>
          <div className="w-100"></div>
          <div className="col">
            <ColorPicker />
            {/* <ColorScale /> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legend;
