import React, { useState } from 'react';
import axios from 'axios';

function VerticalDisplacement() {
    const [lidarResponse, setLidarResponse] = useState(null);
    const [unetResponse, setUnetResponse] = useState(null);
    const [resultResponse, setResultResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    async function submitLidar(e) {
        setLoading(true);
        const file = e.target.files[0];
        if (!file) return;
        
        /* Sends in json format 
        {
        "lidar": file,
        "sidewalk_name: file.name.replace('.las', '') "
        } 
        */
        const formData = new FormData();
        let sidewalk_name = file.name.replace('.las', '');
        formData.append('lidar', file); // 'lidar' matches Django's expected field name
        formData.append('sidewalk_name', sidewalk_name); // optional name


        try {
            const res = await axios.post('https://boe-backend-462517418748.us-west2.run.app/api/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            });
            setLoading(false);
            setLidarResponse(res.data);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
        setLoading(true);
        let sidewalkNameJSON = {
            "sidewalk_name": sidewalk_name
        }
        try {
            const res = await axios.post('https://boe-backend-462517418748.us-west2.run.app/api/unet/', sidewalkNameJSON, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true
            });
            setLoading(false);
            setUnetResponse(res.data);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
        setLoading(true);
        try {
            const res = await axios.post('https://boe-backend-462517418748.us-west2.run.app/api/result/', sidewalkNameJSON, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true
            });
            setLoading(false);
            setResultResponse(res.data);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    }
    const processing = (<><h2>Processing</h2></>);
    return (
        <>
            <h2>Upload .las file</h2>
            <input type="file" accept=".las" onChange={submitLidar} />
            {loading === true?processing: ''}
            {lidarResponse && (
                <div style={{ marginTop: '1rem' }}>
                    <p><strong>Sidewalk:</strong> {lidarResponse.sidewalk_name}</p>
                    <img src={lidarResponse.rgb_image} alt="RGB Image" width={256} />
                    <img src={lidarResponse.dem_image} alt="DEM Image" width={256} />
                </div>
            )}
            <br />
            {unetResponse && (
                <div>
                    <h2>Unet Completed! Performing vertical displacement calculation</h2>
                </div>
            )}
            <br />
            {resultResponse && (
                <div>
                    <img src={resultResponse.result} alt="Result Image" width={256} />
                </div>
            )}
        </>
    );
}

export default VerticalDisplacement;
