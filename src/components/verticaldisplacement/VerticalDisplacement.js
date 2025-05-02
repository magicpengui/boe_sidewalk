import React, { useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const stepLabels = [
  { key: "upload", label: "Upload LiDAR File" },
  { key: "split", label: "Split Tiles" },
  { key: "unet", label: "Run U-Net Prediction" },
  { key: "binarymask", label: "Generate Binary Mask" },
  { key: "displacement", label: "Calculate Displacement" },
  { key: "overlay", label: "Overlay Displacement" },
  { key: "result", label: "Fetch Final Result" },
];

function VerticalDisplacement() {
  const [stepsCompleted, setStepsCompleted] = useState({});
  const [lidarResponse, setLidarResponse] = useState(null);
  const [resultResponse, setResultResponse] = useState(null);
  const [labelResponse, setLabelResponse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidewalkName, setSidewalkName] = useState("");

  const updateStep = (stepKey) => {
    setStepsCompleted((prev) => ({ ...prev, [stepKey]: true }));
  };

  const submitLidar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    const sidewalk_name = file.name.replace(".las", "");
    setSidewalkName(sidewalk_name);
    formData.append("lidar", file);
    formData.append("sidewalk_name", sidewalk_name);
    const payload = { sidewalk_name };

    const stepRequests = [
      {
        key: "upload",
        url: "/api/upload/",
        data: formData,
        form: true,
        onSuccess: (res) => setLidarResponse(res.data),
      },
      { key: "split", url: "/api/split/", data: payload },
      { key: "unet", url: "/api/unet/", data: payload },
      { key: "assembleLabel", url: "/api/reassemblelabel/", data: formData, form: true, onSuccess: (res) => setLabelResponse(res.data)},
      { key: "binarymask", url: "/api/binarymask/", data: payload },
      { key: "displacement", url: "/api/displacement/", data: payload },
      { key: "overlay", url: "/api/overlay/", data: payload },
      {
        key: "result",
        url: "/api/result/",
        data: payload,
        onSuccess: (res) => setResultResponse(res.data),
      },
    ];

    setUploading(true);

    for (const step of stepRequests) {
      try {
        const res = await axios.post(
        //   "https://boe-backend-462517418748.us-west2.run.app" + step.url,
        "http://127.0.0.1:8000" + step.url,
          step.data,
          {
            headers: {
              "Content-Type": step.form
                ? "multipart/form-data"
                : "application/json",
            },
            withCredentials: true,
          }
        );
        if (step.onSuccess) step.onSuccess(res);
        updateStep(step.key);
      } catch (err) {
        console.error("Failed at step:", step.key, err);
        alert(`Upload failed at step: ${step.key}`);
        return;
      }
    }

    setUploading(false);
  };


  // html  
  return (
    <div className="container py-4">
    <div className="row">
      {/* Sticky Progress (Left Column on Desktop / Top on Mobile) */}
      <div className="col-12 col-md-4 mb-4 mb-md-0">
        <div className="position-sticky" style={{ top: "1rem" }}>
          <div className="card p-3 shadow-sm">
            <h5 className="mb-3">Progress</h5>
            {stepLabels.map((step) => (
              <motion.div
                key={step.key}
                className="d-flex align-items-center mb-2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity:
                    stepsCompleted[step.key] || uploading ? 1 : 0.4,
                }}
              >
                <div className="me-2">
                  {stepsCompleted[step.key] ? (
                    <CheckCircle size={20} className="text-success" />
                  ) : uploading ? (
                    <div
                      className="spinner-border spinner-border-sm text-secondary"
                      role="status"
                    />
                  ) : (
                    <div className="border border-secondary rounded-circle" style={{ width: 14, height: 14 }}></div>
                  )}
                </div>
                <span
                  className={`small ${
                    stepsCompleted[step.key]
                      ? "text-success fw-medium"
                      : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <div className="col-12 col-md-8 text-center">
        <h2 className="h4 fw-semibold mb-4 text-dark">
          Vertical Displacement Lite
        </h2>
        <p>
          Upload .las files here! Upload straight from your Mobile Device or any
          desktop computer!
        </p>
        <p className="mb-4">
          The web version of the vertical displacement module has some
          limitations. If the LiDAR (.las) file is greater than 32MB, please use
          the local version.
        </p>
  
        {/* Upload Input */}
        <AnimatePresence>
          {!lidarResponse && (
            <motion.label
              className="btn btn-primary shadow-lg mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <input
                type="file"
                accept=".las"
                onChange={submitLidar}
                className="d-none"
              />
              {uploading ? "Uploading..." : "Choose a .las file"}
            </motion.label>
          )}
        </AnimatePresence>
  
        {/* Images */}
        <AnimatePresence>
          {lidarResponse && (
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="fw-semibold mb-3">
                Processing: {lidarResponse.sidewalk_name}
              </p>
              <div className="row g-4 justify-content-center">
                <div className="col-12 col-lg-6">
                  <img
                    src={lidarResponse.rgb_image}
                    alt="RGB"
                    className="rounded img-fluid shadow"
                    style={{ maxHeight: "500px", objectFit: "contain" }}
                  />
                </div>
                <div className="col-12 col-lg-6">
                  <img
                    src={lidarResponse.dem_image}
                    alt="DEM"
                    className="rounded img-fluid shadow"
                    style={{ maxHeight: "500px", objectFit: "contain" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        

        {/* Labeled Prediction image */}
        <AnimatePresence>
          {labelResponse && (
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="h6 fw-semibold mb-3 text-dark">Predicted Sidewalk Segments</h3>
              <img
                src={labelResponse.result}
                alt="Final Output"
                className="rounded img-fluid shadow-lg border"
                style={{ maxWidth: "100%", maxHeight: "600px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Result */}
        <AnimatePresence>
          {resultResponse && (
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="h6 fw-semibold mb-3 text-dark">Final Result</h3>
              <img
                src={resultResponse.result}
                alt="Final Output"
                className="rounded img-fluid shadow-lg border"
                style={{ maxWidth: "100%", maxHeight: "600px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );  
}

export default VerticalDisplacement;