import { useEffect, useRef, useState } from 'react';
import { SkinViewer, WalkingAnimation } from 'skinview3d';

interface SkinViewer3DProps {
    username: string;
    className?: string;
    refreshToken?: number;
}

export default function SkinViewer3D({ username, className, refreshToken = 0 }: SkinViewer3DProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<SkinViewer | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const safeUsername = username?.trim() || 'Steve';
        const namemcTheta = (14 * Math.PI) / 180;
        const namemcPhi = (13 * Math.PI) / 180;
        const viewer = new SkinViewer({
            canvas,
            width: container.clientWidth,
            height: Math.max(container.clientHeight, 260),
            enableControls: true,
            animation: new WalkingAnimation(),
            zoom: 0.9,
            fov: 45
        });

        viewer.controls.enableRotate = true;
        viewer.controls.enablePan = true;
        viewer.controls.enableZoom = true;
        viewer.controls.enableDamping = true;
        viewer.controls.dampingFactor = 0.09;
        viewer.controls.rotateSpeed = 0.9;
        viewer.controls.panSpeed = 0.9;
        viewer.controls.zoomSpeed = 0.9;
        viewer.controls.minDistance = 15;
        viewer.controls.maxDistance = 70;
        const targetPolar = (Math.PI / 2) - namemcPhi;
        const controlsAny = viewer.controls as any;
        const thetaDelta = namemcTheta - viewer.controls.getAzimuthalAngle();
        const phiDelta = targetPolar - viewer.controls.getPolarAngle();
        if (typeof controlsAny.rotateLeft === 'function') {
            controlsAny.rotateLeft(-thetaDelta);
        }
        if (typeof controlsAny.rotateUp === 'function') {
            controlsAny.rotateUp(-phiDelta);
        }
        viewer.controls.update();

        viewer.animation!.speed = 1.45;
        viewer.autoRotate = false;
        viewer.globalLight.intensity = 1.2;
        viewer.cameraLight.intensity = 1.2;
        const rendererAny = viewer.renderer as any;
        if (typeof rendererAny.toneMappingExposure === 'number') {
            rendererAny.toneMappingExposure = 1.35;
        }
        viewer.playerObject.rotation.y = Math.PI;
        viewerRef.current = viewer;
        setHasError(false);

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            viewer.setSize(Math.max(width, 220), Math.max(height, 260));
        });

        observer.observe(container);

        const cacheBust = `${Date.now()}-${refreshToken}`;
        viewer.loadSkin(`https://mc-heads.net/skin/${encodeURIComponent(safeUsername)}?t=${encodeURIComponent(cacheBust)}`).catch(() => {
            setHasError(true);
            viewer.loadSkin(`https://mc-heads.net/skin/Steve?t=${encodeURIComponent(cacheBust)}`).catch(() => {
                setHasError(true);
            });
        });

        return () => {
            observer.disconnect();
            viewer.dispose();
            viewerRef.current = null;
        };
    }, [username, refreshToken]);

    return (
        <div ref={containerRef} className={`relative ${className || ''}`}>
            <canvas ref={canvasRef} className="w-full h-full rounded-xl cursor-grab active:cursor-grabbing" />
            {hasError ? (
                <div className="absolute inset-x-3 bottom-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    Skin load failed, fallback applied.
                </div>
            ) : null}
        </div>
    );
}
