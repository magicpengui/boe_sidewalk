import React, { useState } from "react";
import axios from "axios";


import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const stepLabels = [
  { key: "upload", label: "Upload LiDAR File" },
  { key: "split", label: "Split Tiles" },
  { key: "unet", label: "Runn U-Net Prediction" },
  { key: "binarymask", label: "Generate Binary Mask" },
  { key: "displacement", label: "Calculate Displacement" },
  { key: "overlay", label: "Overlay Displacement" },
  { key: "result", label: "Fetch Final Result" },
];

function VerticalDisplacement() {
  const [stepsCompleted, setStepsCompleted] = useState({});
  const [lidarResponse, setLidarResponse] = useState(null);
  const [resultResponse, setResultResponse] = useState(null);
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
          "https://boe-backend-462517418748.us-west2.run.app" + step.url,
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

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Vertical Displacement Analyzer
      </h2>

      {/* Upload Input */}
      <AnimatePresence>
        {!lidarResponse && (
          <motion.label
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <input
              type="file"
              accept=".las"
              onChange={submitLidar}
              className="hidden"
            />
            {uploading ? "Uploading..." : "Choose a .las file"}
          </motion.label>
        )}
      </AnimatePresence>

      {/* Step Status */}
      <div className="mt-8 text-left space-y-2">
        {stepLabels.map((step) => (
          <motion.div
            key={step.key}
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: stepsCompleted[step.key] ? 1 : 0.4 }}
            transition={{ delay: 0.05 }}
          >
            <div className="w-5 h-5">
              {stepsCompleted[step.key] ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full animate-pulse" />
              )}
            </div>
            <span
              className={`text-sm ${
                stepsCompleted[step.key]
                  ? "text-green-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Images */}
      <AnimatePresence>
        {lidarResponse && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="font-semibold mb-4">
              Processing: {lidarResponse.sidewalk_name}
            </p>
            <div className="flex justify-center gap-6">
              <img
                src={lidarResponse.rgb_image}
                alt="RGB"
                className="rounded-md w-60 shadow"
              />
              <img
                src={lidarResponse.dem_image}
                alt="DEM"
                className="rounded-md w-60 shadow"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Result */}
      <AnimatePresence>
        {resultResponse && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Final Result
            </h3>
            <img
              src={resultResponse.result}
              alt="Final Output"
              className="w-72 mx-auto rounded-xl shadow-lg border"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VerticalDisplacement;
