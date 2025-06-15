import React, { useEffect, useRef, useState,  } from "react";
import {Navigate, useNavigate} from "react-router-dom";
import config from "../../config";
import "./MainPage.css";
import Cookies from 'js-cookie';
import VideoPanel from "../components/VideoPanel";
import LogsPanel from "../components/LogsPanel";
import CamsPanel from "../components/CamsPanel";

function MainPage() {
	const wsRef = useRef(null);
	const pingRef = useRef(null);
	const reconnectRef = useRef(null);
	const captureCanvasRef = useRef(document.createElement("canvas"));
	const [stream, setStream] = useState(null);
	const [ipUrl, setIpUrl] = useState(null);
	const [boxes, setBoxes] = useState([]);
	const navigate = useNavigate();

	const connectWS = () => {
		const ws = new WebSocket(config.videoWS);
		ws.binaryType = "arraybuffer";
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WS open 👍");
			pingRef.current = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
			}, 30000);
		};

		ws.onmessage = ({ data }) => {
			try {
				const msg = JSON.parse(data);
				if (msg.type === "pong") return;
				setBoxes(msg);
			} catch {
			}
		};

		ws.onerror = (e) => console.error("WS err:", e);

		ws.onclose = () => {
			console.log("WS closed, ребутимся 🚀");
			clearInterval(pingRef.current);
			reconnectRef.current = setTimeout(connectWS, 1000);
		};
	};

	useEffect(() => {
		fetch(`${config.apiBaseURL}/${config.loginEndpoint}`,{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: Cookies.get("email"), password: Cookies.get("password"),
			}),
		}).catch(error => {
			console.log(error);
			navigate("/login/403");
		});

		}, []);
	useEffect(() => {
		connectWS();
		return () => {
			clearInterval(pingRef.current);
			clearTimeout(reconnectRef.current);
			wsRef.current?.close();
		};
	}, []);

	useEffect(() => {
		if (!stream) return;

		const videoTrack = stream.getVideoTracks()[0];
		const { width, height } = videoTrack.getSettings();

		const captureCanvas = captureCanvasRef.current;
		captureCanvas.width = width;
		captureCanvas.height = height;
		const ctx = captureCanvas.getContext("2d");

		const captureAndSend = () => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				const videoEl = document.querySelector(".video-element");
				if (!videoEl) return;
				ctx.drawImage(videoEl, 0, 0, width, height);
				captureCanvas.toBlob(
					(blob) => {
						const reader = new FileReader();
						reader.onload = () => {
							const base64data = reader.result.split(',')[1];
							wsRef.current.send(JSON.stringify({
								image: base64data
							}));
						};
						reader.readAsDataURL(blob);
					},
					"image/jpeg",
					1
				);
			}
		};
		const intervalId = setInterval(captureAndSend, 100);
		return () => clearInterval(intervalId);
	}, [stream]);

	const handleCameraSelection = (cam) => {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			setStream(null);
		}
		setIpUrl(null);
		if (cam.type === "usb") {
			navigator.mediaDevices
				.getUserMedia({ video: { deviceId: { exact: cam.deviceId } } })
				.then((usbStream) => {
					setStream(usbStream);
				})
				.catch((err) => {
					console.error("Не удалось получить USB‑камеру:", err);
					setStream(null);
				});
		} else if (cam.type === "ip") {
			setIpUrl(cam.url);
		}
	};

	return (
		<div className="MainPage">
			<div className="top-section">
				<CamsPanel onSelectCamera={handleCameraSelection} />
				<div></div>
				<VideoPanel stream={stream} ipUrl={ipUrl} boxes={boxes} />
			</div>
			<LogsPanel objects={boxes} />
		</div>
	);
}

export default MainPage;
