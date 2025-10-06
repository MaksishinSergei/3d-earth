import React, { useRef, useEffect, useState } from "react";
import * as THREE from 'three';
import Lottie from 'lottie-react';
import earthmap from '../../assets/texture/earthmap.jpeg';
import earthbump from '../../assets/texture/earthbump.jpeg';
import earthcloud from '../../assets/texture/earthCloud.png';
import galaxy from '../../assets/texture/galaxy.png';
import loader from './loading.json';
import comet from './comet.json';
import './style.css';

export default function Earth() {
    const mountRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let targetZoom = 3;
        let targetPosition = new THREE.Vector3(0, 0, 3);
        let isZooming = false;
        let zoomAnimationId = null;

        const mountElement = mountRef.current;
        if (!mountElement) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = targetZoom;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000);

        let loadedTextures = 0;
        const totalTextures = 4;

        const updateProgressSmoothly = () => {
            loadedTextures++;
            const targetProgress = Math.round((loadedTextures / totalTextures) * 100);
            
            const animateProgress = (current) => {
                if (current < targetProgress) {
                    setProgress(current + 1);
                    requestAnimationFrame(() => animateProgress(current + 1));
                } else if (loadedTextures === totalTextures) {
                    setTimeout(() => setLoading(false), 1000);
                }
            };
            
            animateProgress(progress);
        };


        mountElement.appendChild(renderer.domElement);

        let targetRotationX = 0;
        let targetRotationY = 0;
        let mouseX = 0, mouseXOnMouseDown = 0, mouseY = 0, mouseYOnMouseDown = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        const slowingFactor = 0.98; 
        const dragFactor = 0.0002;  

        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load(earthmap, updateProgressSmoothly),
            bumpMap: new THREE.TextureLoader().load(earthbump, updateProgressSmoothly),
            bumpScale: 0.05,
            specular: new THREE.Color(0x333333),
            shininess: 5
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);

        const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load(earthcloud, updateProgressSmoothly),
            transparent: true
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(cloud);

        const starGeometry = new THREE.SphereGeometry(10, 128, 128);
        const starMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(galaxy, updateProgressSmoothly),
            side: THREE.BackSide
        });
        const starMesh = new THREE.Mesh(starGeometry, starMaterial);
        scene.add(starMesh);

        const ambientlight = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambientlight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        const onDocumentMouseDown = (event) => {
            event.preventDefault();
            document.addEventListener('mousemove', onDocumentMouseMove, false);
            document.addEventListener('mouseup', onDocumentMouseUp, false);
            mouseXOnMouseDown = event.clientX - windowHalfX;
            mouseYOnMouseDown = event.clientY - windowHalfY;
        };

        const onDocumentMouseMove = (event) => {
            mouseX = event.clientX - windowHalfX;
            targetRotationX = (mouseX - mouseXOnMouseDown) * dragFactor;
            mouseY = event.clientY - windowHalfY;
            targetRotationY = (mouseY - mouseYOnMouseDown) * dragFactor;
        };

        const onDocumentMousewheelZoom = (event) => {
            event.preventDefault();
            
            if (isZooming) {
                cancelAnimationFrame(zoomAnimationId);
            }
            
            const zoomSpeed = 0.001;
            const minZoom = 1.5;
            const maxZoom = 10;
            const smoothFactor = 0.1;
            
            // Вычисляем целевой zoom
            targetZoom = THREE.MathUtils.clamp(
                targetZoom + event.deltaY * zoomSpeed,
                minZoom,
                maxZoom
            );
            
            // Получаем позицию курсора
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                - (event.clientY / window.innerHeight) * 2 + 1
            );
            const zoomIntensity = event.deltaY * zoomSpeed;
            const offsetX = mouse.x * zoomIntensity * 0.5;
            const offsetY = mouse.y * zoomIntensity * 0.5;
            targetPosition.set(
                camera.position.x + offsetX,
                camera.position.y + offsetY,
                targetZoom
            );
            isZooming = true;
            const animateZoom = () => {
                camera.position.lerp(targetPosition, smoothFactor);
                camera.lookAt(scene.position);
                const distance = camera.position.distanceTo(targetPosition);
                if (distance > 0.01) {
                    zoomAnimationId = requestAnimationFrame(animateZoom);
                } else {
                    isZooming = false;
                }
            };
            
            animateZoom();
        };

        const onDocumentMouseUp = (event) => {
            document.removeEventListener('mousemove', onDocumentMouseMove, false);
            document.removeEventListener('mouseup', onDocumentMouseUp, false);
        };

        const render = () => {
            earth.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), targetRotationX);
            earth.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), targetRotationY);
            cloud.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), targetRotationX);
            cloud.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), targetRotationY);
            
            targetRotationY *= slowingFactor;
            targetRotationX *= slowingFactor;
            
            renderer.render(scene, camera);
        };

        const animate = () => {
            requestAnimationFrame(animate);
            earth.rotation.y += 0.0005;
            cloud.rotation.y += 0.0005;
            earth.rotation.reorder("XYZ");
            cloud.rotation.reorder("XYZ");
            render();
        };

        animate();

        document.addEventListener('mousedown', onDocumentMouseDown, false);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener("wheel", onDocumentMousewheelZoom, false)

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', onDocumentMouseDown, false);
            document.removeEventListener('mousemove', onDocumentMouseMove, false);
            document.removeEventListener('mouseup', onDocumentMouseUp, false);
            document.removeEventListener('wheel', onDocumentMousewheelZoom, false)
            
            if (mountElement && mountElement.contains(renderer.domElement)) {
                mountElement.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <>
            {loading && (
                <div className="loading">
                    <div className="container">
                        <div className="loading__content">
                            <Lottie
                            animationData={loader}
                            loop={true}
                            className="loading__content-loader"
                            />
                            <p className="loading__content-progress">
                                {progress}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div ref={mountRef} id="map"></div>
        </>
        
    );
}