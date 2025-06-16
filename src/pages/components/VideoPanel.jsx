import React, { useRef, useEffect } from "react";
import "./VideoPanel.css";

function VideoPanel({ stream, ipUrl, boxes }) {
	const videoRef = useRef(null);
	const imgRef = useRef(null);
	const canvasRef = useRef(null);

	// 1. Привязываем MediaStream (USB) или IP‑URL (<img>) к нужному элементу
	useEffect(() => {
		const videoEl = videoRef.current;
		const imgEl = imgRef.current;

		if (stream && videoEl) {
			// Если USB‑камера: назначаем MediaStream в <video>
			// Скрываем <img>, показываем <video>
			imgEl.style.display = "none";
			videoEl.style.display = "block";
			videoEl.srcObject = stream;
			videoEl.muted = true;
			videoEl.play().catch(() => {});
		} else if (ipUrl && imgEl) {
			// Если IP‑камера: назначаем src в <img>
			// Скрываем <video>, показываем <img>
			if (videoEl) {
				videoEl.pause();
				videoEl.removeAttribute("src");
				videoEl.srcObject = null;
				videoEl.style.display = "none";
			}
			imgEl.style.display = "block";
			imgEl.src = ipUrl;
		} else {
			// Ни стрима, ни IP‑URL — ничего не показываем
			if (videoEl) {
				videoEl.pause();
				videoEl.removeAttribute("src");
				videoEl.srcObject = null;
				videoEl.style.display = "none";
			}
			if (imgEl) {
				imgEl.src = "";
				imgEl.style.display = "none";
			}
		}
	}, [stream, ipUrl]);

	// 2. Рисуем рамки поверх видео или <img>
	useEffect(() => {
		const videoEl = videoRef.current;
		const imgEl = imgRef.current;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");

		const drawBoxes = () => {
			// Ждём готовности либо <video>, либо <img>
			const width = videoEl && videoEl.style.display === "block"
				? videoEl.videoWidth
				: imgEl && imgEl.style.display === "block"
					? imgEl.naturalWidth
					: 0;
			const height = videoEl && videoEl.style.display === "block"
				? videoEl.videoHeight
				: imgEl && imgEl.style.display === "block"
					? imgEl.naturalHeight
					: 0;

			if (width === 0 || height === 0) return;

			canvas.width = width;
			canvas.height = height;
			ctx.clearRect(0, 0, width, height);

			boxes.forEach((b) => {
				let hash = 0;
				const str = b.name;
				for (let i = 0; i < str.length; i++) {
					hash = str.charCodeAt(i) + ((hash << 5) - hash);
				}
				let color = '#';
				for (let i = 0; i < 3; i++) {
					const value = (hash >> (i * 8)) & 0xFF;
					color += ('00' + value.toString(16)).substr(-2);
				}

				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);
				if (b.name) {
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "14px Arial";
					ctx.fillText(b.name, b.x1 + 5, b.y1 - 5);
				}
			});
		};

		// В зависимости от того, показывается <video> или <img>, ждём соответствующее событие
		if (videoEl) {
			videoEl.addEventListener("loadedmetadata", drawBoxes);
			videoEl.addEventListener("loadeddata", drawBoxes);
		}
		if (imgEl) {
			imgEl.addEventListener("load", drawBoxes);
		}

		// Если уже готов (например, стрим уже идёт или <img> уже загрузилось), рисуем сразу
		if (videoEl && videoEl.readyState >= 2) {
			drawBoxes();
		} else if (imgEl && imgEl.complete && imgEl.naturalWidth !== 0) {
			drawBoxes();
		}

		return () => {
			if (videoEl) {
				videoEl.removeEventListener("loadedmetadata", drawBoxes);
				videoEl.removeEventListener("loadeddata", drawBoxes);
			}
			if (imgEl) {
				imgEl.removeEventListener("load", drawBoxes);
			}
		};
	}, [boxes, stream, ipUrl]);

	return (
		<div className="VideoPanel">
			{/* Если USB-камера — используем <video>; для IP — <img> */}
			<video
				className="video-element"
				ref={videoRef}
				style={{display: "none", width: "640px", height: "480px"}}
				autoPlay
				muted
				playsInline
			/>
			<img
				className="video-element"
				ref={imgRef}
				style={{display: "none", width: "640px", height: "480px"}}
				alt="IP Camera"
			/>
			<canvas className="VideoCanvas" ref={canvasRef}/>
		</div>
	);
}

export default VideoPanel;
